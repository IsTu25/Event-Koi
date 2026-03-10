import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/event-tags?event_id=X or ?tag=football (global tag search)
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');
    const tag = searchParams.get('tag');

    try {
        if (eventId) {
            const [rows] = await pool.query(
                'SELECT * FROM EventTags WHERE event_id = ? ORDER BY tag_name',
                [eventId]
            );
            return NextResponse.json(rows);
        }
        if (tag) {
            const [rows] = await pool.query(
                `SELECT DISTINCT e.event_id, e.title, e.start_time, e.status,
                        c.name AS category_name, v.name AS venue_name
                 FROM EventTags et
                 JOIN Events e ON et.event_id = e.event_id
                 LEFT JOIN Categories c ON e.category_id = c.category_id
                 LEFT JOIN Venues v ON e.venue_id = v.venue_id
                 WHERE et.tag_name LIKE ? AND e.status = 'PUBLISHED'
                 ORDER BY e.start_time ASC LIMIT 50`,
                [`%${tag}%`]
            );
            return NextResponse.json(rows);
        }
        // Return popular tags
        const [rows] = await pool.query(
            `SELECT tag_name, COUNT(*) AS count
             FROM EventTags
             GROUP BY tag_name
             ORDER BY count DESC LIMIT 30`
        );
        return NextResponse.json(rows);
    } catch (error) {
        console.error('EventTags GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
    }
}

// POST /api/event-tags — add tags (organizer)
export async function POST(request: Request) {
    try {
        const { event_id, tags } = await request.json();
        if (!event_id || !tags || !Array.isArray(tags)) {
            return NextResponse.json({ error: 'event_id and tags[] required' }, { status: 400 });
        }
        for (const tag of tags) {
            const clean = String(tag).trim().toLowerCase().slice(0, 100);
            if (clean) {
                await pool.execute(
                    'INSERT IGNORE INTO EventTags (event_id, tag_name) VALUES (?, ?)',
                    [event_id, clean]
                );
            }
        }
        return NextResponse.json({ message: `${tags.length} tag(s) added` }, { status: 201 });
    } catch (error) {
        console.error('EventTags POST error:', error);
        return NextResponse.json({ error: 'Failed to add tags' }, { status: 500 });
    }
}

// DELETE /api/event-tags?tag_id=X
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get('tag_id');
    if (!tagId) return NextResponse.json({ error: 'tag_id required' }, { status: 400 });
    try {
        await pool.execute('DELETE FROM EventTags WHERE tag_id = ?', [tagId]);
        return NextResponse.json({ message: 'Tag removed' });
    } catch (error) {
        console.error('EventTags DELETE error:', error);
        return NextResponse.json({ error: 'Failed to remove tag' }, { status: 500 });
    }
}
