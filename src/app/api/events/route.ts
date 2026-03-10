import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const organizerId = searchParams.get('organizer_id');

        let query = `
      SELECT 
        e.event_id, 
        e.title, 
        e.description, 
        e.start_time, 
        e.end_time, 
        e.status,
        e.listing_fee,
        e.is_listing_paid,
        c.name AS category_name,
        v.name AS venue_name,
        v.city AS venue_city,
        u.name AS organizer_name
      FROM Events e
      LEFT JOIN Categories c ON e.category_id = c.category_id
      LEFT JOIN Venues v ON e.venue_id = v.venue_id
      LEFT JOIN Users u ON e.organizer_id = u.id
    `;

        const conditions = [];
        const params = [];

        if (organizerId) {
            conditions.push('e.organizer_id = ?');
            params.push(organizerId);
        }

        const search = searchParams.get('search');
        if (search) {
            conditions.push('(e.title LIKE ? OR u.name LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }

        const categoryId = searchParams.get('category_id');
        if (categoryId && categoryId !== 'all') {
            conditions.push('e.category_id = ?');
            params.push(categoryId);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY e.start_time ASC';

        const [rows] = await pool.query(query, params);
        return NextResponse.json(rows);
    } catch (error) {
        console.error("Error fetching events:", error);
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { organizer_id, venue_id, venue_name, category_id, title, description, start_time, end_time, status, listing_fee, payment_confirmed } = body;

        if (!organizer_id || !title || !start_time || !end_time) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        // Handle custom venue: if venue_name is provided but no venue_id, create a new venue
        let finalVenueId = venue_id || null;
        if (venue_name && !venue_id) {
            const [venueResult] = await pool.execute(
                'INSERT INTO Venues (name, address, city, capacity) VALUES (?, ?, ?, ?)',
                [venue_name, 'Custom Location', 'N/A', 100]
            );
            finalVenueId = (venueResult as any).insertId;
        }

        const query = `
      INSERT INTO Events (organizer_id, venue_id, category_id, title, description, start_time, end_time, status, listing_fee, is_listing_paid)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        const [result] = await pool.execute(query, [
            organizer_id,
            finalVenueId,
            category_id || null,
            title,
            description || '',
            start_time,
            end_time,
            status || 'DRAFT',
            listing_fee || 0.00,
            payment_confirmed ? 1 : 0
        ]);

        const eventId = (result as any).insertId;

        // Mass Notification if status is PUBLISHED (or Draft if we want organizers to see it? usually published)
        // Ignoring status check for simplicity or assuming created events are meant to be seen.
        // Let's check logic: if prompt says "if a new event is created", I'll just do it.

        // Get all users except organizer
        const [users] = await pool.query('SELECT id FROM Users WHERE id != ?', [organizer_id]);

        // Batch insert notifications (or loop if small scale)
        for (const u of (users as any[])) {
            await pool.execute(
                'INSERT INTO Notifications (user_id, type, reference_id, content) VALUES (?, "NEW_EVENT", ?, ?)',
                [u.id, eventId, `New Event: "${title}" has been created! Check it out.`]
            );
        }

        return NextResponse.json(
            { message: 'Event created successfully', eventId: (result as any).insertId },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating event:", error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
