import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/refunds?user_id=X or ?booking_id=X
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const bookingId = searchParams.get('booking_id');

    try {
        let query = `
            SELECT r.*,
                   u.name  AS requester_name,
                   u.email AS requester_email,
                   e.title AS event_title,
                   NULL AS reviewed_by_name
            FROM Refunds r
            LEFT JOIN Users u   ON r.requested_by = u.id
            LEFT JOIN Bookings b ON r.booking_id = b.booking_id
            LEFT JOIN Events e   ON b.event_id   = e.event_id
            WHERE 1=1
        `;
        const params: any[] = [];
        if (userId) { query += ' AND r.requested_by = ?'; params.push(userId); }
        if (bookingId) { query += ' AND r.booking_id = ?'; params.push(bookingId); }
        query += ' ORDER BY r.requested_date DESC';

        const [rows] = await pool.query(query, params);
        return NextResponse.json(rows);
    } catch (error: any) {
        if (error?.code === 'ER_NO_SUCH_TABLE' || error?.errno === 1146) {
            return NextResponse.json([]);
        }
        console.error('Refunds GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch refunds' }, { status: 500 });
    }
}

// POST /api/refunds — request a refund
export async function POST(request: Request) {
    try {
        const { booking_id, user_id, amount, reason } = await request.json();
        if (!booking_id || !user_id || !amount) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const [result] = await pool.execute(`
            INSERT INTO Refunds (booking_id, amount, reason, status, requested_by)
            VALUES (?, ?, ?, 'Pending', ?)
        `, [booking_id, amount, reason || null, user_id]);

        // Update booking status
        await pool.execute(
            "UPDATE Bookings SET status = 'CANCELLED', cancelled_at = NOW(), refund_amount = ? WHERE booking_id = ?",
            [amount, booking_id]
        );

        // Notify user
        await pool.execute(
            'INSERT INTO Notifications (user_id, type, reference_id, content) VALUES (?, ?, ?, ?)',
            [user_id, 'EVENT_UPDATE', (result as any).insertId, `Your refund request of ${amount} BDT has been submitted and is under review.`]
        );

        return NextResponse.json({ message: 'Refund requested', refund_id: (result as any).insertId }, { status: 201 });
    } catch (error) {
        console.error('Refunds POST error:', error);
        return NextResponse.json({ error: 'Failed to request refund' }, { status: 500 });
    }
}

// PUT /api/refunds — admin processes refund
export async function PUT(request: Request) {
    try {
        const { refund_id, status, admin_id, rejection_reason } = await request.json();
        if (!refund_id || !status || !admin_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const processed_at = status === 'COMPLETED' ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;

        await pool.execute(`
            UPDATE Refunds
            SET status = ?, processed_at = NOW(),
                notes = ?
            WHERE refund_id = ?
        `, [status, rejection_reason || null, refund_id]);

        // Fetch to notify user
        const [refundRow] = await pool.query('SELECT requested_by as user_id, amount FROM Refunds WHERE refund_id = ?', [refund_id]);
        const refund = (refundRow as any[])[0];
        if (refund) {
            const msg = status === 'COMPLETED'
                ? `✅ Your refund of ${refund.amount} BDT has been processed!`
                : `❌ Your refund request was ${status.toLowerCase()}.${rejection_reason ? ' Reason: ' + rejection_reason : ''}`;
            await pool.execute(
                'INSERT INTO Notifications (user_id, type, reference_id, content) VALUES (?, ?, ?, ?)',
                [refund.user_id, 'BOOKING_CONFIRMATION', refund_id, msg]
            );
        }

        // Log admin action
        await pool.execute(
            'INSERT INTO AdminAuditLog (admin_user_id, action_type, entity_type, entity_id, description) VALUES (?, ?, ?, ?, ?)',
            [admin_id, `REFUND_${status}`, 'Refunds', refund_id, rejection_reason || null]
        );

        return NextResponse.json({ message: `Refund ${status.toLowerCase()}` });
    } catch (error) {
        console.error('Refunds PUT error:', error);
        return NextResponse.json({ error: 'Failed to process refund' }, { status: 500 });
    }
}
