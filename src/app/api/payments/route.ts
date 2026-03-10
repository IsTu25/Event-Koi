import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// GET /api/payments?user_id=X or ?event_id=X or ?payment_id=X
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const eventId = searchParams.get('event_id');
    const paymentId = searchParams.get('payment_id');

    try {
        if (paymentId) {
            const [rows] = await pool.query(`
                SELECT p.*, u.name AS payer_name, u.email AS payer_email,
                       e.title AS event_title, b.unique_code AS booking_code
                FROM Payments p
                JOIN Users u ON p.user_id = u.id
                LEFT JOIN Events e ON p.event_id = e.event_id
                LEFT JOIN Bookings b ON p.booking_id = b.booking_id
                WHERE p.payment_id = ?
            `, [paymentId]);
            return NextResponse.json((rows as any[])[0] || null);
        }

        let query = `
            SELECT p.*, u.name AS payer_name, e.title AS event_title
            FROM Payments p
            JOIN Users u ON p.user_id = u.id
            LEFT JOIN Events e ON p.event_id = e.event_id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (userId) { query += ' AND p.user_id = ?'; params.push(userId); }
        if (eventId) { query += ' AND p.event_id = ?'; params.push(eventId); }

        query += ' ORDER BY p.created_at DESC LIMIT 200';

        const [rows] = await pool.query(query, params);
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Payments GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }
}

// POST /api/payments — create a payment record
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { booking_id, user_id, event_id, amount, currency, payment_method, payment_type, gateway_response } = body;

        if (!user_id || !amount) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

        const transaction_id = `TXN-${uuidv4().split('-')[0].toUpperCase()}-${Date.now()}`;

        const [result] = await pool.execute(`
            INSERT INTO Payments
                (booking_id, user_id, event_id, amount, currency, payment_method,
                 payment_status, transaction_id, gateway_response, payment_type, paid_at)
            VALUES (?, ?, ?, ?, ?, ?, 'COMPLETED', ?, ?, ?, NOW())
        `, [
            booking_id || null, user_id, event_id || null,
            amount, currency || 'BDT', payment_method || 'CARD',
            transaction_id,
            gateway_response ? JSON.stringify(gateway_response) : null,
            payment_type || 'TICKET',
        ]);

        const paymentId = (result as any).insertId;

        // Update EventRevenue if event_id provided
        if (event_id && payment_type === 'TICKET') {
            await pool.execute(`
                INSERT INTO EventRevenue (event_id, ticket_revenue)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE
                    ticket_revenue = ticket_revenue + VALUES(ticket_revenue),
                    last_calculated_at = CURRENT_TIMESTAMP
            `, [event_id, amount]);
        }

        // Log to SystemLogs
        await pool.execute(
            'INSERT INTO SystemLogs (level, category, message, user_id) VALUES (?, ?, ?, ?)',
            ['INFO', 'PAYMENT', `Payment ${transaction_id} of ${amount} ${currency || 'BDT'} completed`, user_id]
        );

        return NextResponse.json({ message: 'Payment recorded', payment_id: paymentId, transaction_id }, { status: 201 });
    } catch (error) {
        console.error('Payments POST error:', error);
        return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
    }
}
