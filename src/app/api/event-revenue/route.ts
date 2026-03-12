import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getConfigNumber, getPaginationLimit } from '@/lib/config';

// GET /api/event-revenue?event_id=X (or all for admin)
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');

    try {
        if (eventId) {
            // Live calculation for single event to ensure absolute accuracy
            const [paymentData]: any = await pool.query(`
                SELECT COALESCE(SUM(p.amount), 0) AS ticket_revenue
                FROM Payments p
                JOIN Bookings b ON p.booking_id = b.booking_id
                WHERE b.event_id = ? AND p.payment_status = 'COMPLETED' AND p.payment_type = 'TICKET'
            `, [eventId]);

            const [sponsorData]: any = await pool.query(`
                SELECT 
                    (SELECT COALESCE(SUM(contribution_amount), 0) FROM Sponsors WHERE event_id = ? AND status = 'APPROVED') +
                    (SELECT COALESCE(SUM(amount_paid), 0) FROM EventSponsorships WHERE event_id = ? AND payment_status = 'Completed')
                as total_sponsor_revenue
            `, [eventId, eventId]);

            const [countData]: any = await pool.query(`
                SELECT 
                    (SELECT COUNT(*) FROM Bookings WHERE event_id = ? AND status != 'CANCELLED') AS total_bookings,
                    (SELECT COUNT(*) FROM Bookings WHERE event_id = ? AND status = 'CANCELLED') AS cancelled_bookings
            `, [eventId, eventId]);

            return NextResponse.json({
                event_id: eventId,
                ticket_revenue: parseFloat(paymentData[0]?.ticket_revenue || 0),
                sponsor_revenue: parseFloat(sponsorData[0]?.total_sponsor_revenue || 0),
                total_bookings: countData[0]?.total_bookings || 0,
                cancelled_bookings: countData[0]?.cancelled_bookings || 0
            });
        }

        // Full list for admin — limit from DB
        const limit = await getPaginationLimit('revenue_admin');
        const [rows] = await pool.query(`
            SELECT er.*, e.title, e.status, u.name AS organizer_name
            FROM EventRevenue er
            JOIN Events e ON er.event_id = e.event_id
            JOIN Users u ON e.organizer_id = u.id
            ORDER BY er.ticket_revenue DESC
            LIMIT ?
        `, [limit]);
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

        // Get platform fee from database config
        const platformFeePercent = await getConfigNumber('PLATFORM_FEE_PERCENT', 0.05);

        // 1. Calculate ticket revenue from Payments
        const [paymentData]: any = await pool.query(`
            SELECT COALESCE(SUM(p.amount), 0) AS ticket_revenue
            FROM Payments p
            JOIN Bookings b ON p.booking_id = b.booking_id
            WHERE b.event_id = ? AND p.payment_status = 'COMPLETED' AND p.payment_type = 'TICKET'
        `, [event_id]);

        // 2. Calculate refunds from Refunds table
        const [refundData]: any = await pool.query(`
            SELECT COALESCE(SUM(r.amount), 0) AS total_refunds
            FROM Refunds r
            JOIN Bookings b ON r.booking_id = b.booking_id
            WHERE b.event_id = ? AND r.status IN ('Approved', 'Processed')
        `, [event_id]);

        // 3. Sponsor revenue
        const [sponsorData]: any = await pool.query(`
            SELECT COALESCE(SUM(contribution_amount), 0) AS sponsor_revenue
            FROM Sponsors WHERE event_id = ? AND status = 'APPROVED'
        `, [event_id]);

        // 4. Listing fee
        const [eventData]: any = await pool.query(
            'SELECT listing_fee FROM Events WHERE event_id = ?', [event_id]
        );

        const ticket_revenue = parseFloat(paymentData[0]?.ticket_revenue || 0);
        const total_refunds = parseFloat(refundData[0]?.total_refunds || 0);
        const sponsor_revenue = parseFloat(sponsorData[0]?.sponsor_revenue || 0);
        const listing_fee_paid = parseFloat(eventData[0]?.listing_fee || 0);
        const platform_fee = ticket_revenue * platformFeePercent;
        const net_revenue = ticket_revenue + sponsor_revenue - total_refunds - platform_fee;

        // 5. Upsert into EventRevenue
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
            platform_fee_percent: `${(platformFeePercent * 100).toFixed(1)}%`,
            ticket_revenue, sponsor_revenue, total_refunds, platform_fee, net_revenue,
        });
    } catch (error) {
        console.error('EventRevenue POST error:', error);
        return NextResponse.json({ error: 'Failed to calculate revenue' }, { status: 500 });
    }
}
