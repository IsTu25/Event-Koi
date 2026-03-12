import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getPaginationLimit } from '@/lib/config';

// GET /api/event-reviews?event_id=X or ?user_id=X
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');
    const userId = searchParams.get('user_id');

    try {
        const limit = await getPaginationLimit('reviews');

        let query = `
            SELECT er.*, u.name AS reviewer_name,
                   e.title AS event_title
            FROM EventReviews er
            JOIN Users u ON er.user_id = u.id
            JOIN Events e ON er.event_id = e.event_id
            WHERE 1=1
        `;
        const params: any[] = [];
        if (eventId) { query += ' AND er.event_id = ?'; params.push(eventId); }
        if (userId) { query += ' AND er.user_id = ?'; params.push(userId); }
        query += ` ORDER BY er.review_date DESC LIMIT ?`;
        params.push(limit);

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
        const { event_id, user_id, rating, title, content } = await request.json();
        if (!event_id || !user_id || !rating) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        if (rating < 1 || rating > 5) {
            return NextResponse.json({ error: 'Rating must be 1–5' }, { status: 400 });
        }

        // Check for duplicate review
        const [existingReview]: any = await pool.query(
            'SELECT review_id FROM EventReviews WHERE event_id = ? AND user_id = ? LIMIT 1',
            [event_id, user_id]
        );
        if ((existingReview as any[]).length > 0) {
            return NextResponse.json({ error: 'You have already reviewed this event' }, { status: 400 });
        }

        const [result] = await pool.execute(`
            INSERT INTO EventReviews (event_id, user_id, rating, title, content)
            VALUES (?, ?, ?, ?, ?)
        `, [event_id, user_id, rating, title || null, content || null]);

        return NextResponse.json({ message: 'Review submitted', review_id: (result as any).insertId }, { status: 201 });
    } catch (error) {
        console.error('EventReviews POST error:', error);
        return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
    }
}

// PUT /api/event-reviews — mark review as helpful
export async function PUT(request: Request) {
    try {
        const { review_id, helpful } = await request.json();
        if (!review_id) return NextResponse.json({ error: 'review_id required' }, { status: 400 });

        if (helpful) {
            await pool.execute(
                'UPDATE EventReviews SET helpful_count = helpful_count + 1 WHERE review_id = ?',
                [review_id]
            );
        }

        return NextResponse.json({ message: 'Review updated' });
    } catch (error) {
        console.error('EventReviews PUT error:', error);
        return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
    }
}
