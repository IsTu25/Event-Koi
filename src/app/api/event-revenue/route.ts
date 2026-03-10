import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/event-revenue?event_id=X (or all for admin)
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');

    try {
        if (eventId) {
            const [rows] = await pool.query(`
                SELECT er.*, e.title, e.status, e.start_time,
                       u.name AS organizer_name,
                       (SELECT COUNT(*) FROM Bookings b WHERE b.event_id = er.event_id AND b.status != 'CANCELLED') AS total_bookings,
                       (SELECT COUNT(*) FROM Bookings b WHERE b.event_id = er.event_id AND b.status = 'CANCELLED') AS cancelled_bookings
                FROM EventRevenue er
                JOIN Events e ON er.event_id = e.event_id
                JOIN Users u ON e.organizer_id = u.id
                WHERE er.event_id = ?
            `, [eventId]);
            return NextResponse.json((rows as any[])[0] || { event_id: eventId, ticket_revenue: 0, net_revenue: 0 });
        }

        // Full list for admin
        const [rows] = await pool.query(`
            SELECT er.*, e.title, e.status, u.name AS organizer_name
            FROM EventRevenue er
            JOIN Events e ON er.event_id = e.event_id
            JOIN Users u ON e.organizer_id = u.id
            ORDER BY er.ticket_revenue DESC
            LIMIT 200
        `);
        return NextResponse.json(rows);
    } catch (error) {
        console.error('EventRevenue GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch revenue' }, { status: 500 });
    }
}

// POST /api/event-revenue — recalculate revenue for event
export async function POST(request: Request) {
    try {
        const { event_id } = await request.json();
        if (!event_id) return NextResponse.json({ error: 'event_id required' }, { status: 400 });

        // Recalculate from Bookings + Payments + Sponsors
        const [revenueData] = await pool.query(`
            SELECT
                COALESCE(SUM(CASE WHEN b.payment_status = 'COMPLETED' AND b.status != 'CANCELLED' THEN tt.price ELSE 0 END), 0) AS ticket_revenue,
                COALESCE(SUM(CASE WHEN b.status = 'CANCELLED' THEN b.refund_amount ELSE 0 END), 0) AS total_refunds
            FROM Bookings b
            JOIN TicketTypes tt ON b.ticket_type_id = tt.ticket_type_id
            WHERE b.event_id = ?
        `, [event_id]);

        const [sponsorData] = await pool.query(`
            SELECT COALESCE(SUM(contribution_amount), 0) AS sponsor_revenue
            FROM Sponsors WHERE event_id = ? AND status = 'APPROVED'
        `, [event_id]);

        const [eventData] = await pool.query(
            'SELECT listing_fee FROM Events WHERE event_id = ?', [event_id]
        );

        const ticket_revenue = (revenueData as any[])[0]?.ticket_revenue || 0;
        const total_refunds = (revenueData as any[])[0]?.total_refunds || 0;
        const sponsor_revenue = (sponsorData as any[])[0]?.sponsor_revenue || 0;
        const listing_fee_paid = (eventData as any[])[0]?.listing_fee || 0;
        const platform_fee = parseFloat(ticket_revenue) * 0.05; // 5% platform fee
        const net_revenue = parseFloat(ticket_revenue) + parseFloat(sponsor_revenue) - parseFloat(total_refunds) - platform_fee;

        await pool.execute(`
            INSERT INTO EventRevenue (event_id, ticket_revenue, sponsor_revenue, listing_fee_paid, total_refunds, platform_fee, net_revenue)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                ticket_revenue = VALUES(ticket_revenue),
                sponsor_revenue = VALUES(sponsor_revenue),
                listing_fee_paid = VALUES(listing_fee_paid),
                total_refunds = VALUES(total_refunds),
                platform_fee = VALUES(platform_fee),
                net_revenue = VALUES(net_revenue),
                last_calculated_at = CURRENT_TIMESTAMP
        `, [event_id, ticket_revenue, sponsor_revenue, listing_fee_paid, total_refunds, platform_fee, net_revenue]);

        return NextResponse.json({
            message: 'Revenue recalculated',
            ticket_revenue, sponsor_revenue, total_refunds, platform_fee, net_revenue,
        });
    } catch (error) {
        console.error('EventRevenue POST error:', error);
        return NextResponse.json({ error: 'Failed to calculate revenue' }, { status: 500 });
    }
}
