import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// GET /api/tickets?user_id=X  — fetch all tickets for a user
// GET /api/tickets?ticket_id=X — fetch single ticket
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const ticketId = searchParams.get('ticket_id');

    try {
        if (ticketId) {
            const [rows] = await pool.query(`
                SELECT t.*, e.title AS event_title, e.start_time, e.end_time,
                       v.name AS venue_name, v.address AS venue_address,
                       tt.name AS ticket_type_name, tt.price,
                       u.name AS holder_name, u.email AS holder_email
                FROM Tickets t
                JOIN Events e ON t.event_id = e.event_id
                JOIN TicketTypes tt ON t.ticket_type_id = tt.ticket_type_id
                JOIN Users u ON t.user_id = u.id
                LEFT JOIN Venues v ON e.venue_id = v.venue_id
                WHERE t.ticket_id = ?
            `, [ticketId]);
            return NextResponse.json((rows as any[])[0] || null);
        }

        if (!userId) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

        const [rows] = await pool.query(`
            SELECT t.*, e.title AS event_title, e.start_time, e.end_time, e.banner_image,
                   v.name AS venue_name, v.city AS venue_city,
                   tt.name AS ticket_type_name, tt.price
            FROM Tickets t
            JOIN Bookings b ON t.booking_id = b.booking_id
            JOIN Events e ON t.event_id = e.event_id
            JOIN TicketTypes tt ON t.ticket_type_id = tt.ticket_type_id
            LEFT JOIN Venues v ON e.venue_id = v.venue_id
            WHERE t.user_id = ?
            ORDER BY t.issued_at DESC
        `, [userId]);

        return NextResponse.json(rows);
    } catch (error) {
        console.error('Tickets GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
    }
}

// POST /api/tickets — issue a ticket from a booking
export async function POST(request: Request) {
    try {
        const { booking_id, event_id, user_id, ticket_type_id } = await request.json();
        if (!booking_id || !event_id || !user_id || !ticket_type_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const ticket_number = `TKT-${uuidv4().split('-')[0].toUpperCase()}-${Date.now()}`;
        const qr_code = `https://api.qrserver.com/v1/create-qr-code/?data=${ticket_number}&size=200x200`;

        const [result] = await pool.execute(`
            INSERT INTO Tickets (booking_id, event_id, user_id, ticket_type_id, ticket_number, qr_code, status)
            VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')
        `, [booking_id, event_id, user_id, ticket_type_id, ticket_number, qr_code]);

        // Log to SearchHistory for analytics
        await pool.execute(
            'INSERT INTO SystemLogs (level, category, message, user_id) VALUES (?, ?, ?, ?)',
            ['INFO', 'TICKET', `Ticket issued: ${ticket_number}`, user_id]
        );

        return NextResponse.json({
            message: 'Ticket issued',
            ticket_id: (result as any).insertId,
            ticket_number,
            qr_code,
        }, { status: 201 });
    } catch (error) {
        console.error('Ticket POST error:', error);
        return NextResponse.json({ error: 'Failed to issue ticket' }, { status: 500 });
    }
}

// PUT /api/tickets — check in / update status
export async function PUT(request: Request) {
    try {
        const { ticket_id, status } = await request.json();
        if (!ticket_id || !status) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

        const checked_in_at = status === 'USED' ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;

        await pool.execute(
            'UPDATE Tickets SET status = ?, checked_in_at = ? WHERE ticket_id = ?',
            [status, checked_in_at, ticket_id]
        );

        return NextResponse.json({ message: 'Ticket updated' });
    } catch (error) {
        console.error('Ticket PUT error:', error);
        return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
    }
}
