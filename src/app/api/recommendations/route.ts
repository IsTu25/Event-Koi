import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/recommendations?user_id=X&limit=10
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!userId) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

    try {
        // 1. Check for stored recommendations
        const [stored] = await pool.query(`
            SELECT ur.*, e.title, e.start_time, e.end_time, e.status, e.banner_image,
                   c.name AS category_name, v.name AS venue_name, v.city,
                   u.name AS organizer_name,
                   MIN(tt.price) AS min_price
            FROM UserRecommendations ur
            JOIN Events e ON ur.event_id = e.event_id
            LEFT JOIN Categories c ON e.category_id = c.category_id
            LEFT JOIN Venues v ON e.venue_id = v.venue_id
            LEFT JOIN Users u ON e.organizer_id = u.id
            LEFT JOIN TicketTypes tt ON e.event_id = tt.event_id
            WHERE ur.user_id = ?
              AND e.status = 'PUBLISHED'
              AND e.end_time > NOW()
            GROUP BY ur.recommendation_id
            ORDER BY ur.recommendation_score DESC
            LIMIT ?
        `, [userId, limit]);

        if ((stored as any[]).length > 0) {
            return NextResponse.json(stored);
        }

        // 2. Generate live recommendations based on user preferences + attendance
        // Get user's attended categories
        const [userHistory] = await pool.query(`
            SELECT DISTINCT e.category_id, COUNT(*) AS weight
            FROM Bookings b
            JOIN Events e ON b.event_id = e.event_id
            WHERE b.user_id = ? AND b.status != 'CANCELLED'
            GROUP BY e.category_id
            ORDER BY weight DESC
            LIMIT 5
        `, [userId]);

        const categoryIds = (userHistory as any[]).map(r => r.category_id).filter(Boolean);
        const bookedEvents = (await pool.query(
            'SELECT event_id FROM Bookings WHERE user_id = ?', [userId]
        ) as any[])[0].map((r: any) => r.event_id);

        let recQuery = `
            SELECT DISTINCT e.event_id, e.title, e.start_time, e.end_time, e.status, e.banner_image,
                   c.name AS category_name, v.name AS venue_name, v.city,
                   u.name AS organizer_name,
                   MIN(tt.price) AS min_price,
                   COUNT(DISTINCT b.booking_id) AS popularity,
                   'Category Match' AS reason,
                   80.0 AS recommendation_score
            FROM Events e
            LEFT JOIN Categories c ON e.category_id = c.category_id
            LEFT JOIN Venues v ON e.venue_id = v.venue_id
            LEFT JOIN Users u ON e.organizer_id = u.id
            LEFT JOIN TicketTypes tt ON e.event_id = tt.event_id
            LEFT JOIN Bookings b ON e.event_id = b.event_id
            WHERE e.status = 'PUBLISHED'
              AND e.end_time > NOW()
        `;
        const params: any[] = [];

        if (bookedEvents.length > 0) {
            recQuery += ` AND e.event_id NOT IN (${bookedEvents.map(() => '?').join(',')})`;
            params.push(...bookedEvents);
        }

        if (categoryIds.length > 0) {
            recQuery += ` AND e.category_id IN (${categoryIds.map(() => '?').join(',')})`;
            params.push(...categoryIds);
        }

        recQuery += ` GROUP BY e.event_id ORDER BY popularity DESC, e.start_time ASC LIMIT ?`;
        params.push(limit);

        const [recs] = await pool.query(recQuery, params);

        // Persist recommendations
        for (const rec of recs as any[]) {
            await pool.execute(`
                INSERT INTO UserRecommendations (user_id, event_id, recommendation_score, reason, algorithm_version)
                VALUES (?, ?, ?, ?, 'v1')
                ON DUPLICATE KEY UPDATE
                    recommendation_score = VALUES(recommendation_score),
                    reason = VALUES(reason),
                    created_at = CURRENT_TIMESTAMP
            `, [userId, rec.event_id, rec.recommendation_score, rec.reason]);
        }

        return NextResponse.json(recs);
    } catch (error) {
        console.error('Recommendations GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
    }
}

// PUT /api/recommendations — mark clicked
export async function PUT(request: Request) {
    try {
        const { user_id, event_id } = await request.json();
        if (!user_id || !event_id) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        await pool.execute(
            'UPDATE UserRecommendations SET clicked = TRUE, clicked_at = NOW() WHERE user_id = ? AND event_id = ?',
            [user_id, event_id]
        );
        return NextResponse.json({ message: 'Recommendation click recorded' });
    } catch (error) {
        console.error('Recommendations PUT error:', error);
        return NextResponse.json({ error: 'Failed to record click' }, { status: 500 });
    }
}
