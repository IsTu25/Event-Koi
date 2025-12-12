import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
    try {
        const { user_id, event_id, ticket_type_id } = await request.json();

        if (!user_id || !event_id || !ticket_type_id) {
            return NextResponse.json({ message: 'Missing booking details' }, { status: 400 });
        }

        const unique_code = uuidv4();

        // Transaction handling (basic)
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Insert Ticket
            const [result] = await connection.execute(
                'INSERT INTO Bookings (user_id, event_id, ticket_type_id, unique_code) VALUES (?, ?, ?, ?)',
                [user_id, event_id, ticket_type_id, unique_code]
            );

            // 2. Decrease Stock (Optional logic using Quantity in TicketTypes)
            await connection.execute(
                'UPDATE TicketTypes SET quantity = quantity - 1 WHERE ticket_type_id = ? AND quantity > 0',
                [ticket_type_id]
            );

            await connection.commit();
            return NextResponse.json({ message: 'Booking successful', ticketId: (result as any).insertId, unique_code });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Booking error', error);
        return NextResponse.json({ message: 'Booking failed' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) return NextResponse.json({ message: 'User ID required' }, { status: 400 });

    try {
        const query = `
            SELECT 
                b.booking_id AS ticket_id, b.unique_code, b.status, b.created_at AS purchase_date,
                e.title AS event_title, e.start_time, e.venue_id,
                v.name AS venue_name, v.city AS venue_city,
                tt.name AS ticket_name, tt.price
            FROM Bookings b
            JOIN Events e ON b.event_id = e.event_id
            JOIN TicketTypes tt ON b.ticket_type_id = tt.ticket_type_id
            LEFT JOIN Venues v ON e.venue_id = v.venue_id
            WHERE b.user_id = ?
            ORDER BY b.created_at DESC
        `;
        const [rows] = await pool.query(query, [user_id]);
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Fetch tickets error', error);
        return NextResponse.json({ message: 'Failed to fetch tickets' }, { status: 500 });
    }
}
