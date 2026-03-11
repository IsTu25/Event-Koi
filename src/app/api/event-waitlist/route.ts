import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/event-waitlist?user_id=X&event_id=Y
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const eventId = searchParams.get('event_id');

    try {
        let query = 'SELECT * FROM EventWaitlist WHERE 1=1';
        const params: any[] = [];
        if (userId) { query += ' AND user_id = ?'; params.push(userId); }
        if (eventId) { query += ' AND event_id = ?'; params.push(eventId); }

        const [rows] = await pool.query(query, params);
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Waitlist GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch waitlist' }, { status: 500 });
    }
}

// POST /api/event-waitlist — Join the waitlist
export async function POST(request: Request) {
    try {
        const { user_id, event_id, ticket_type_id } = await request.json();
        if (!user_id || !event_id || !ticket_type_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if already on waitlist
        const [existing] = await pool.query(
            'SELECT * FROM EventWaitlist WHERE user_id = ? AND event_id = ? AND ticket_type_id = ?',
            [user_id, event_id, ticket_type_id]
        );
        if ((existing as any[]).length > 0) {
            return NextResponse.json({ error: 'Already on waitlist' }, { status: 409 });
        }

        // Get current max position
        const [maxPos]: any = await pool.query(
            'SELECT COALESCE(MAX(position_in_queue), 0) as max_pos FROM EventWaitlist WHERE event_id = ? AND ticket_type_id = ?',
            [event_id, ticket_type_id]
        );
        const nextPos = Number(maxPos[0]?.max_pos || 0) + 1;

        await pool.execute(`
            INSERT INTO EventWaitlist (user_id, event_id, ticket_type_id, position_in_queue)
            VALUES (?, ?, ?, ?)
        `, [user_id, event_id, ticket_type_id, nextPos]);

        return NextResponse.json({ message: 'Joined waitlist successfully', position: nextPos }, { status: 201 });
    } catch (error) {
        console.error('Waitlist POST error:', error);
        return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 });
    }
}
