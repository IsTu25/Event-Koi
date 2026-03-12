import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/admin/intelligence — analytics about search and discovery
export async function GET() {
    try {
        // 1. Trending Search Queries (Volume and Recency)
        const [queries] = await pool.query(`
            SELECT search_query AS query, COUNT(*) AS count, MAX(searched_at) AS last_searched
            FROM SearchHistory
            GROUP BY search_query
            ORDER BY count DESC
            LIMIT 10
        `);

        // 2. Top Platform Spenders (Total Ticket spending)
        const [topSpenders] = await pool.query(`
            SELECT u.name, u.email, SUM(p.amount) AS total_spent, COUNT(b.booking_id) AS total_tickets
            FROM Payments p
            JOIN Bookings b ON p.booking_id = b.booking_id
            JOIN Users u ON b.user_id = u.id
            WHERE p.payment_status = 'COMPLETED' AND p.payment_type = 'TICKET'
            GROUP BY u.id
            ORDER BY total_spent DESC
            LIMIT 10
        `);

        // 3. Most Socially Active Users (Combined Messages Sent and Friends)
        const [sociallyActive] = await pool.query(`
            SELECT u.name, u.email, 
                   (SELECT COUNT(*) FROM Messages WHERE sender_id = u.id) AS messages_sent,
                   (SELECT COUNT(*) FROM Friendships WHERE (user_id = u.id OR friend_id = u.id) AND status = 'ACCEPTED') AS friend_count
            FROM Users u
            ORDER BY (messages_sent + friend_count) DESC
            LIMIT 10
        `);

        // 4. Daily analytics snapshot for charts
        const [dailyMetrics] = await pool.query(`
            SELECT metric_date, new_users, new_events, total_bookings, total_revenue AS net_revenue, active_users
            FROM DailyMetrics
            ORDER BY metric_date DESC
            LIMIT 14
        `);

        // 5. KPIs (DAU, MAU, Retention) from SystemLogs
        const [dauRes]: any = await pool.query(`SELECT COUNT(DISTINCT user_id) as count FROM SystemLogs WHERE created_at >= CURDATE()`);
        const [mauRes]: any = await pool.query(`SELECT COUNT(DISTINCT user_id) as count FROM SystemLogs WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`);
        const [retRes]: any = await pool.query(`
            SELECT 
                (SELECT COUNT(DISTINCT user_id) FROM SystemLogs 
                 WHERE created_at BETWEEN DATE_SUB(CURDATE(), INTERVAL 60 DAY) AND DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                 AND user_id IN (SELECT DISTINCT user_id FROM SystemLogs WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY))
                ) as retained,
                (SELECT COUNT(DISTINCT user_id) FROM SystemLogs 
                 WHERE created_at BETWEEN DATE_SUB(CURDATE(), INTERVAL 60 DAY) AND DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                ) as total_prev
        `);

        const kpis = {
            dau: dauRes[0]?.count || 0,
            mau: mauRes[0]?.count || 0,
            retention: retRes[0]?.total_prev > 0 ? ((retRes[0].retained / retRes[0].total_prev) * 100).toFixed(1) : "0.0"
        };

        return NextResponse.json({ queries, topSpenders, sociallyActive, dailyMetrics, kpis });
    } catch (error) {
        console.error('Admin Intelligence GET error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
