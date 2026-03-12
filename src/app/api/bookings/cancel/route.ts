import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { calculateRefund, getNotificationTemplate } from '@/lib/config';

export async function POST(request: Request) {
    try {
        const { ticket_id, user_id } = await request.json();

        if (!ticket_id || !user_id) {
            return NextResponse.json({ message: 'Ticket ID and User ID required' }, { status: 400 });
        }

        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // 1. Fetch Ticket & Event Details
            const [rows]: any = await connection.execute(`
                SELECT t.ticket_id, t.booking_id, t.status, t.ticket_type_id, 
                       t.event_id, tt.price, e.start_time, e.title AS event_title
                FROM Tickets t
                JOIN Events e ON t.event_id = e.event_id
                JOIN TicketTypes tt ON t.ticket_type_id = tt.ticket_type_id
                WHERE t.ticket_id = ? AND t.user_id = ?
                FOR UPDATE
            `, [ticket_id, user_id]);

            if (rows.length === 0) {
                await connection.rollback();
                return NextResponse.json({ message: 'Ticket not found' }, { status: 404 });
            }

            const ticket = rows[0];

            if (ticket.status === 'CANCELLED') {
                await connection.rollback();
                return NextResponse.json({ message: 'Ticket already cancelled' }, { status: 400 });
            }

            // 2. Calculate Refund Policy FROM DATABASE
            const eventDate = new Date(ticket.start_time);
            const now = new Date();
            const diffMs = eventDate.getTime() - now.getTime();
            const diffDays = diffMs / (1000 * 60 * 60 * 24);

            if (diffDays <= 0) {
                await connection.rollback();
                return NextResponse.json({
                    message: 'Event has already started. Cannot cancel.',
                    allowed: false
                }, { status: 403 });
            }

            const refundResult = await calculateRefund(diffDays);

            if (refundResult.percentage === 0 && diffDays <= 2) {
                await connection.rollback();
                return NextResponse.json({
                    message: refundResult.description || 'Cancellation not allowed within 48 hours of the event.',
                    allowed: false
                }, { status: 403 });
            }

            const refundAmount = (Number(ticket.price) * refundResult.percentage) / 100;

            // 3. Update Ticket & Booking Status
            await connection.execute(
                'UPDATE Tickets SET status = "CANCELLED" WHERE ticket_id = ?',
                [ticket_id]
            );
            await connection.execute(
                'UPDATE Bookings SET status = "CANCELLED", refund_amount = ?, cancelled_at = NOW() WHERE booking_id = ?',
                [refundAmount, ticket.booking_id]
            );

            // 4. Handle Refund Record
            if (refundAmount > 0) {
                const [payRows]: any = await connection.execute(
                    'SELECT payment_id FROM Payments WHERE booking_id = ? LIMIT 1',
                    [ticket.booking_id]
                );
                const paymentId = payRows.length > 0 ? payRows[0].payment_id : 0;

                await connection.execute(
                    `INSERT INTO Refunds (booking_id, payment_id, amount, reason, status, requested_by)
                     VALUES (?, ?, ?, ?, 'Pending', ?)`,
                    [ticket.booking_id, paymentId, refundAmount, refundResult.description, user_id]
                );
            }

            // 5. Return Stock
            await connection.execute(
                'UPDATE TicketTypes SET quantity = quantity + 1 WHERE ticket_type_id = ?',
                [ticket.ticket_type_id]
            );

            // 6. Notify User — message from NotificationTemplate
            const notifMessage = await getNotificationTemplate('TICKET_CANCELLED', {
                event_title: ticket.event_title,
                refund_percent: String(refundResult.percentage),
                refund_amount: refundAmount.toFixed(2)
            });

            await connection.execute(
                `INSERT INTO Notifications (user_id, type, reference_id, content)
                 VALUES (?, 'EVENT_UPDATE', ?, ?)`,
                [user_id, ticket_id, notifMessage]
            );

            await connection.commit();

            return NextResponse.json({
                message: 'Ticket cancelled and refund requested successfully',
                refundAmount: refundAmount,
                refundPercentage: refundResult.percentage,
                policy: refundResult.description
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Cancellation error', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
