import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const query = `
      SELECT 
        e.*,
        c.name AS category_name,
        v.name AS venue_name,
        v.city AS venue_city,
        u.name AS organizer_name
      FROM Events e
      LEFT JOIN Categories c ON e.category_id = c.category_id
      LEFT JOIN Venues v ON e.venue_id = v.venue_id
      LEFT JOIN Users u ON e.organizer_id = u.id
      WHERE e.event_id = ?
    `;

        const [rows] = await pool.query(query, [id]);
        const events = rows as any[];

        if (events.length === 0) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // Increment Views in background
        pool.execute(`
            INSERT INTO EventAnalytics (event_id, total_views, captured_date)
            VALUES (?, 1, CURDATE())
            ON DUPLICATE KEY UPDATE total_views = total_views + 1
        `, [id]).catch(err => console.error("Error updating views:", err));

        return NextResponse.json(events[0]);
    } catch (error) {
        console.error('Error fetching event:', error);
        return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { title, description, start_time, end_time, venue_id, category_id, status } = body;

        // Verify ownership could be done here if we passed user_id, but for now we trust the frontend logic
        // or we could check if user_id matches the organizer_id of the event

        const query = `
            UPDATE Events 
            SET title = ?, description = ?, start_time = ?, end_time = ?, venue_id = ?, category_id = ?, status = ?
            WHERE event_id = ?
        `;

        await pool.execute(query, [
            title,
            description,
            start_time,
            end_time,
            venue_id || null,
            category_id || null,
            status || 'PUBLISHED',
            id
        ]);

        return NextResponse.json({ message: 'Event updated successfully' });
    } catch (error) {
        console.error("Error updating event:", error);
        return NextResponse.json({ message: 'Error updating event' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        // In a real app we'd verify the user_id from session/token matches organizer_id
        await pool.execute('DELETE FROM Events WHERE event_id = ?', [id]);
        return NextResponse.json({ message: 'Event deleted successfully' });
    } catch (error) {
        return NextResponse.json({ message: 'Error deleting event' }, { status: 500 });
    }
}
