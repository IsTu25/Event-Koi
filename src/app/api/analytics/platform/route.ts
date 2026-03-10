import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/analytics/platform?days=30
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    try {
        // ── Core summary ─────────────────────────────────────────────────────
        // Queries against core tables (always exist).
        // Extended-table sub-queries are wrapped so they gracefully return 0
        // when the table doesn't exist yet (MySQL will error per sub-query,
        // so we run them separately and merge in JS).
        const [summaryCore] = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM Users) AS total_users,
                (SELECT COUNT(*) FROM Users
                    WHERE created_at > DATE_SUB(NOW(), INTERVAL ? DAY)) AS new_users,
                (SELECT COUNT(*) FROM Events WHERE status = 'PUBLISHED') AS published_events,
                (SELECT COUNT(*) FROM Events
                    WHERE created_at > DATE_SUB(NOW(), INTERVAL ? DAY)) AS new_events,
                (SELECT COUNT(*) FROM Bookings WHERE status != 'CANCELLED') AS total_bookings,
                (SELECT COUNT(*) FROM Bookings
                    WHERE created_at > DATE_SUB(NOW(), INTERVAL ? DAY)
                      AND status != 'CANCELLED') AS recent_bookings
        `, [days, days, days]);

        // Extended-table counts — run individually so one missing table doesn't
        // kill the entire analytics endpoint.
        const safeCount = async (sql: string, params: any[] = []): Promise<number> => {
            try {
                const [rows]: any = await pool.query(sql, params);
                return Number(rows[0]?.val ?? 0);
            } catch { return 0; }
        };

        const [total_net_revenue, recent_revenue, pending_refunds,
            pending_role_requests, open_reports, active_moderations, total_platform_fees] = await Promise.all([
                safeCount('SELECT COALESCE(SUM(net_revenue),0) AS val FROM EventRevenue'),
                safeCount(
                    'SELECT COALESCE(SUM(net_revenue),0) AS val FROM EventRevenue WHERE last_calculated_at > DATE_SUB(NOW(), INTERVAL ? DAY)',
                    [days]
                ),
                safeCount("SELECT COUNT(*) AS val FROM Refunds WHERE status = 'REQUESTED'"),
                safeCount("SELECT COUNT(*) AS val FROM RoleRequests WHERE status = 'PENDING'"),
                safeCount("SELECT COUNT(*) AS val FROM ReportedContent WHERE status = 'PENDING'"),
                safeCount('SELECT COUNT(*) AS val FROM UserModeration WHERE is_active = TRUE'),
                safeCount('SELECT COALESCE(SUM(total_fees),0) AS val FROM PlatformFees'),
            ]);

        const coreSummary = (summaryCore as any[])[0];
        const summary = {
            ...coreSummary,
            total_net_revenue,
            recent_revenue,
            pending_refunds,
            pending_role_requests,
            open_reports,
            active_moderations,
            total_platform_fees,
        };

        // ── Daily user growth ─────────────────────────────────────────────────
        const [userGrowth] = await pool.query(`
            SELECT DATE(created_at) AS date, COUNT(*) AS count
            FROM Users
            WHERE created_at > DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `, [days]);

        // ── Daily bookings + revenue ──────────────────────────────────────────
        const [bookingTrend] = await pool.query(`
            SELECT DATE(b.created_at) AS date,
                   COUNT(*) AS bookings,
                   COALESCE(SUM(tt.price), 0) AS revenue
            FROM Bookings b
            JOIN TicketTypes tt ON b.ticket_type_id = tt.ticket_type_id
            WHERE b.created_at > DATE_SUB(NOW(), INTERVAL ? DAY)
              AND b.status != 'CANCELLED'
            GROUP BY DATE(b.created_at)
            ORDER BY date ASC
        `, [days]);

        // ── Top events ───────────────────────────────────────────────────────
        const [topEvents] = await pool.query(`
            SELECT e.event_id, e.title, e.start_time,
                   COUNT(b.booking_id) AS bookings,
                   COALESCE(SUM(tt.price), 0) AS revenue,
                   u.name AS organizer_name,
                   c.name AS category_name
            FROM Events e
            LEFT JOIN Bookings b     ON e.event_id = b.event_id AND b.status != 'CANCELLED'
            LEFT JOIN TicketTypes tt ON b.ticket_type_id = tt.ticket_type_id
            LEFT JOIN Users u        ON e.organizer_id = u.id
            LEFT JOIN Categories c   ON e.category_id = c.category_id
            WHERE e.created_at > DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY e.event_id
            ORDER BY bookings DESC
            LIMIT 10
        `, [days]);

        // ── User role distribution ────────────────────────────────────────────
        const [userRoles] = await pool.query(`
            SELECT role, COUNT(*) AS count FROM Users GROUP BY role
        `);

        // ── Category popularity ───────────────────────────────────────────────
        const [categoryStats] = await pool.query(`
            SELECT c.name,
                   COUNT(DISTINCT e.event_id)    AS events,
                   COUNT(DISTINCT b.booking_id)  AS bookings
            FROM Categories c
            LEFT JOIN Events e   ON c.category_id = e.category_id
            LEFT JOIN Bookings b ON e.event_id = b.event_id AND b.status != 'CANCELLED'
            GROUP BY c.category_id
            ORDER BY bookings DESC
        `);

        // ── Persist to DailyMetrics (safe — ignore if table missing) ─────────
        try {
            await pool.execute(`
                INSERT INTO DailyMetrics
                    (metric_date, new_users, new_events, total_bookings, total_revenue, active_users)
                VALUES (CURDATE(), ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    new_users = VALUES(new_users),
                    new_events = VALUES(new_events),
                    total_bookings = VALUES(total_bookings),
                    total_revenue  = VALUES(total_revenue),
                    active_users   = VALUES(active_users)
            `, [
                summary.new_users || 0,
                summary.new_events || 0,
                summary.recent_bookings || 0,
                recent_revenue,
                summary.total_users || 0,
            ]);
        } catch { /* DailyMetrics table not yet migrated — that's OK */ }

        return NextResponse.json({
            summary,
            userGrowth,
            bookingTrend,
            topEvents,
            userRoles,
            categoryStats,
            period_days: days,
        });
    } catch (error: any) {
        console.error('Platform analytics error:', error);
        return NextResponse.json({ error: 'Failed to fetch platform analytics' }, { status: 500 });
    }
}
