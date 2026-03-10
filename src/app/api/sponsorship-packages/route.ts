import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/sponsorship-packages?event_id=X
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');
    if (!eventId) return NextResponse.json({ error: 'event_id required' }, { status: 400 });

    try {
        const [rows] = await pool.query(`
            SELECT sp.*,
                   (sp.max_slots - sp.slots_taken) AS slots_available
            FROM SponsorshipPackages sp
            WHERE sp.event_id = ? AND sp.is_active = TRUE
            ORDER BY sp.price DESC
        `, [eventId]);
        return NextResponse.json(rows);
    } catch (error) {
        console.error('SponsorshipPackages GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
    }
}

// POST /api/sponsorship-packages — create a package (organizer)
export async function POST(request: Request) {
    try {
        const { event_id, name, tier, price, benefits, max_slots } = await request.json();
        if (!event_id || !name || !price) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

        const [result] = await pool.execute(`
            INSERT INTO SponsorshipPackages (event_id, name, tier, price, benefits, max_slots)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            event_id, name,
            tier || 'Partner', price,
            benefits ? JSON.stringify(benefits) : null,
            max_slots || 1,
        ]);

        return NextResponse.json({ message: 'Package created', package_id: (result as any).insertId }, { status: 201 });
    } catch (error) {
        console.error('SponsorshipPackages POST error:', error);
        return NextResponse.json({ error: 'Failed to create package' }, { status: 500 });
    }
}
