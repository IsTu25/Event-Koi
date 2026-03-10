import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
    try {
        const { user_id, event_id, ticket_type_id, payment_method } = await request.json();

        if (!user_id || !event_id || !ticket_type_id) {
            return NextResponse.json({ message: 'Missing booking details' }, { status: 400 });
        }

        const unique_code = uuidv4();
        const ticket_number = `TKT-${uuidv4().split('-')[0].toUpperCase()}-${Date.now()}`;
        const transaction_id = `TXN-${uuidv4().split('-')[0].toUpperCase()}-${Date.now()}`;

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Fetch ticket price
            const [ttRows] = await connection.execute(
                'SELECT price, sold_count, quantity FROM TicketTypes WHERE ticket_type_id = ?',
                [ticket_type_id]
            );
            const tt = (ttRows as any[])[0];
            if (!tt) throw new Error('Ticket type not found');
            if (tt.sold_count >= tt.quantity) throw new Error('Sold out');

            const price: number = parseFloat(tt.price);

            // 2. Create Booking
            const [bookingResult] = await connection.execute(
                `INSERT INTO Bookings (user_id, event_id, ticket_type_id, unique_code, payment_status, payment_method)
                 VALUES (?, ?, ?, ?, 'COMPLETED', ?)`,
                [user_id, event_id, ticket_type_id, unique_code, payment_method || 'CARD']
            );
            const bookingId = (bookingResult as any).insertId;

            // 3. Issue Ticket record
            const qr_code = `https://api.qrserver.com/v1/create-qr-code/?data=${ticket_number}&size=200x200`;
            const [ticketResult] = await connection.execute(
                `INSERT INTO Tickets (booking_id, event_id, user_id, ticket_type_id, ticket_number, qr_code, status)
                 VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')`,
                [bookingId, event_id, user_id, ticket_type_id, ticket_number, qr_code]
            );

            // 4. Record Payment
            await connection.execute(
                `INSERT INTO Payments
                    (booking_id, user_id, event_id, amount, currency, payment_method,
                     payment_status, transaction_id, payment_type, paid_at)
                 VALUES (?, ?, ?, ?, 'BDT', ?, 'COMPLETED', ?, 'TICKET', NOW())`,
                [bookingId, user_id, event_id, price, payment_method || 'CARD', transaction_id]
            );

            // 5. Update TicketTypes sold_count
            await connection.execute(
                'UPDATE TicketTypes SET sold_count = sold_count + 1, quantity = quantity - 1 WHERE ticket_type_id = ? AND quantity > 0',
                [ticket_type_id]
            );

            // 6. Upsert EventRevenue
            const platform_fee = price * 0.05;
            await connection.execute(
                `INSERT INTO EventRevenue (event_id, ticket_revenue, platform_fee, net_revenue)
                 VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                     ticket_revenue = ticket_revenue + VALUES(ticket_revenue),
                     platform_fee   = platform_fee   + VALUES(platform_fee),
                     net_revenue    = net_revenue    + (VALUES(ticket_revenue) - VALUES(platform_fee)),
                     last_calculated_at = CURRENT_TIMESTAMP`,
                [event_id, price, platform_fee, price - platform_fee]
            );

            // 7. Upsert UserAnalytics
            await connection.execute(
                `INSERT INTO UserAnalytics (user_id, snapshot_date, events_booked, amount_spent)
                 VALUES (?, CURDATE(), 1, ?)
                 ON DUPLICATE KEY UPDATE
                     events_booked = events_booked + 1,
                     amount_spent  = amount_spent  + VALUES(amount_spent)`,
                [user_id, price]
            );

            // 8. Booking confirmation notification
            const [eventRow] = await connection.execute(
                'SELECT title FROM Events WHERE event_id = ?', [event_id]
            );
            const eventTitle = ((eventRow as any[])[0])?.title || 'the event';
            await connection.execute(
                `INSERT INTO Notifications (user_id, type, reference_id, content)
                 VALUES (?, 'BOOKING_CONFIRMATION', ?, ?)`,
                [user_id, bookingId, `🎟️ Booking confirmed for "${eventTitle}"! Ticket: ${ticket_number}`]
            );

            // 9. System log
            await connection.execute(
                `INSERT INTO SystemLogs (level, category, message, user_id)
                 VALUES ('INFO', 'BOOKING', ?, ?)`,
                [`Booking ${bookingId} created, Ticket ${ticket_number}, Payment ${transaction_id}`, user_id]
            );

            await connection.commit();

            return NextResponse.json({
                message: 'Booking successful',
                booking_id: bookingId,
                ticket_id: (ticketResult as any).insertId,
                ticket_number,
                qr_code,
                transaction_id,
                unique_code,
                amount: price,
            }, { status: 201 });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error: any) {
        console.error('Booking error', error);
        const msg = error?.message === 'Sold out' ? 'This ticket type is sold out' : 'Booking failed';
        return NextResponse.json({ message: msg }, { status: error?.message === 'Sold out' ? 409 : 500 });
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) return NextResponse.json({ message: 'User ID required' }, { status: 400 });

    try {
        const query = `
            SELECT
                b.booking_id, b.unique_code, b.status, b.created_at AS purchase_date,
                b.payment_status, b.payment_method,
                e.title AS event_title, e.start_time, e.end_time, e.banner_image,
                v.name AS venue_name, v.city AS venue_city,
                tt.name AS ticket_name, tt.price,
                t.ticket_number, t.qr_code, t.status AS ticket_status
            FROM Bookings b
            JOIN Events e ON b.event_id = e.event_id
            JOIN TicketTypes tt ON b.ticket_type_id = tt.ticket_type_id
            LEFT JOIN Venues v ON e.venue_id = v.venue_id
            LEFT JOIN Tickets t ON b.booking_id = t.booking_id
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
