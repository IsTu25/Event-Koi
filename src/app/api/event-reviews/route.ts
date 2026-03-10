import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/event-reviews?event_id=X or ?user_id=X
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');
    const userId = searchParams.get('user_id');

    try {
        let query = `
            SELECT er.*, u.name AS reviewer_name, u.profile_image AS reviewer_avatar,
                   e.title AS event_title
            FROM EventReviews er
            JOIN Users u ON er.user_id = u.id
            JOIN Events e ON er.event_id = e.event_id
            WHERE er.status = 'APPROVED'
        `;
        const params: any[] = [];
        if (eventId) { query += ' AND er.event_id = ?'; params.push(eventId); }
        if (userId) { query += ' AND er.user_id = ?'; params.push(userId); }
        query += ' ORDER BY er.created_at DESC LIMIT 100';

        const [rows] = await pool.query(query, params);
        return NextResponse.json(rows);
    } catch (error) {
        console.error('EventReviews GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }
}

// POST /api/event-reviews — submit a review
export async function POST(request: Request) {
    try {
        const { event_id, user_id, booking_id, rating, title, content, pros, cons } = await request.json();
        if (!event_id || !user_id || !rating) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        if (rating < 1 || rating > 5) {
            return NextResponse.json({ error: 'Rating must be 1–5' }, { status: 400 });
        }

        // Verify user attended the event (has a booking)
        const [bookingCheck] = await pool.query(
            "SELECT booking_id FROM Bookings WHERE event_id = ? AND user_id = ? AND status IN ('VALID','USED') LIMIT 1",
            [event_id, user_id]
        );
        const is_verified = (bookingCheck as any[]).length > 0;

        const [result] = await pool.execute(`
            INSERT INTO EventReviews (event_id, user_id, booking_id, rating, title, content, pros, cons, is_verified, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED')
            ON DUPLICATE KEY UPDATE
                rating = VALUES(rating), title = VALUES(title), content = VALUES(content),
                pros = VALUES(pros), cons = VALUES(cons), updated_at = CURRENT_TIMESTAMP
        `, [event_id, user_id, booking_id || null, rating, title || null, content || null, pros || null, cons || null, is_verified]);

        // Update EventAnalytics review count
        await pool.execute(`
            INSERT INTO EventAnalytics (event_id, snapshot_date, review_count, avg_rating)
            VALUES (?, CURDATE(), 1, ?)
            ON DUPLICATE KEY UPDATE
                review_count = review_count + 1,
                avg_rating = (avg_rating * (review_count - 1) + VALUES(avg_rating)) / review_count
        `, [event_id, rating]);

        return NextResponse.json({ message: 'Review submitted', review_id: (result as any).insertId }, { status: 201 });
    } catch (error) {
        console.error('EventReviews POST error:', error);
        return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
    }
}

// PUT /api/event-reviews — mark review as helpful or admin moderation
export async function PUT(request: Request) {
    try {
        const { review_id, helpful, status, admin_note } = await request.json();
        if (!review_id) return NextResponse.json({ error: 'review_id required' }, { status: 400 });

        if (helpful) {
            await pool.execute(
                'UPDATE EventReviews SET helpful_count = helpful_count + 1 WHERE review_id = ?',
                [review_id]
            );
        } else if (status) {
            await pool.execute(
                'UPDATE EventReviews SET status = ?, admin_note = ? WHERE review_id = ?',
                [status, admin_note || null, review_id]
            );
        }

        return NextResponse.json({ message: 'Review updated' });
    } catch (error) {
        console.error('EventReviews PUT error:', error);
        return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
    }
}
