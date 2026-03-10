import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/event-schedule?event_id=X
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');
    if (!eventId) return NextResponse.json({ error: 'event_id required' }, { status: 400 });

    try {
        const [rows] = await pool.query(`
            SELECT * FROM EventSchedule
            WHERE event_id = ?
            ORDER BY order_index ASC, start_time ASC
        `, [eventId]);
        return NextResponse.json(rows);
    } catch (error) {
        console.error('EventSchedule GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
    }
}

// POST /api/event-schedule — add a session
export async function POST(request: Request) {
    try {
        const {
            event_id, title, description, speaker_name, speaker_bio,
            speaker_photo, start_time, end_time, location, session_type, order_index,
        } = await request.json();

        if (!event_id || !title || !start_time || !end_time) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const [result] = await pool.execute(`
            INSERT INTO EventSchedule
                (event_id, title, description, speaker_name, speaker_bio, speaker_photo,
                 start_time, end_time, location, session_type, order_index)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            event_id, title, description || null,
            speaker_name || null, speaker_bio || null, speaker_photo || null,
            start_time, end_time, location || null,
            session_type || 'TALK', order_index ?? 0,
        ]);

        return NextResponse.json({ message: 'Session added', schedule_id: (result as any).insertId }, { status: 201 });
    } catch (error) {
        console.error('EventSchedule POST error:', error);
        return NextResponse.json({ error: 'Failed to add session' }, { status: 500 });
    }
}

// PUT /api/event-schedule — update a session
export async function PUT(request: Request) {
    try {
        const { schedule_id, title, description, speaker_name, start_time, end_time, session_type, order_index } = await request.json();
        if (!schedule_id) return NextResponse.json({ error: 'schedule_id required' }, { status: 400 });

        await pool.execute(`
            UPDATE EventSchedule
            SET title = COALESCE(?, title), description = COALESCE(?, description),
                speaker_name = COALESCE(?, speaker_name), start_time = COALESCE(?, start_time),
                end_time = COALESCE(?, end_time), session_type = COALESCE(?, session_type),
                order_index = COALESCE(?, order_index), updated_at = CURRENT_TIMESTAMP
            WHERE schedule_id = ?
        `, [title, description, speaker_name, start_time, end_time, session_type, order_index, schedule_id]);

        return NextResponse.json({ message: 'Session updated' });
    } catch (error) {
        console.error('EventSchedule PUT error:', error);
        return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }
}

// DELETE /api/event-schedule?schedule_id=X
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('schedule_id');
    if (!scheduleId) return NextResponse.json({ error: 'schedule_id required' }, { status: 400 });

    try {
        await pool.execute('DELETE FROM EventSchedule WHERE schedule_id = ?', [scheduleId]);
        return NextResponse.json({ message: 'Session deleted' });
    } catch (error) {
        console.error('EventSchedule DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
    }
}
