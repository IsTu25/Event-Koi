import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/search?q=QUERY&user_id=X&filters=...
// Searches Events, Users, Categories and logs to SearchHistory
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const userId = searchParams.get('user_id');
    const category = searchParams.get('category');
    const city = searchParams.get('city');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query.trim()) return NextResponse.json({ events: [], users: [] });

    try {
        // Search events
        let eventQuery = `
            SELECT e.event_id, e.title, e.description, e.start_time, e.end_time,
                   e.status, e.banner_image,
                   c.name AS category_name, v.name AS venue_name, v.city,
                   u.name AS organizer_name,
                   MIN(tt.price) AS min_price,
                   COUNT(DISTINCT b.booking_id) AS booking_count
            FROM Events e
            LEFT JOIN Categories c ON e.category_id = c.category_id
            LEFT JOIN Venues v ON e.venue_id = v.venue_id
            LEFT JOIN Users u ON e.organizer_id = u.id
            LEFT JOIN TicketTypes tt ON e.event_id = tt.event_id
            LEFT JOIN Bookings b ON e.event_id = b.event_id
            WHERE e.status = 'PUBLISHED'
              AND (e.title LIKE ? OR e.description LIKE ? OR c.name LIKE ?)
        `;
        const eventParams: any[] = [`%${query}%`, `%${query}%`, `%${query}%`];

        if (category) { eventQuery += ' AND c.name = ?'; eventParams.push(category); }
        if (city) { eventQuery += ' AND v.city LIKE ?'; eventParams.push(`%${city}%`); }

        eventQuery += ` GROUP BY e.event_id ORDER BY e.start_time ASC LIMIT ${limit}`;

        const [events] = await pool.query(eventQuery, eventParams);
        const resultsCount = (events as any[]).length;

        // Log search to SearchHistory
        await pool.execute(`
            INSERT INTO SearchHistory (user_id, query, filters, results_count, session_id)
            VALUES (?, ?, ?, ?, ?)
        `, [
            userId || null,
            query,
            JSON.stringify({ category, city }),
            resultsCount,
            `sess_${Date.now()}`,
        ]);

        // Also log to UserAnalytics if user is logged in
        if (userId) {
            await pool.execute(`
                INSERT INTO UserAnalytics (user_id, snapshot_date, search_count)
                VALUES (?, CURDATE(), 1)
                ON DUPLICATE KEY UPDATE search_count = search_count + 1
            `, [userId]);
        }

        return NextResponse.json({ events, total: resultsCount });
    } catch (error) {
        console.error('Search GET error:', error);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}

// GET /api/search/history?user_id=X
// (separate route would be /api/search-history)
