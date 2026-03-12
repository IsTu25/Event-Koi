import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/organizer/sponsorships?organizer_id=...
// Fetch sponsorship-related data for an organizer's events
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const organizerId = searchParams.get('organizer_id');
    if (!organizerId) return NextResponse.json({ error: 'Organizer ID required' }, { status: 400 });

    try {
        // 1. Sponsorship packages for their events
        const [packages] = await pool.query(`
            SELECT sp.*, e.title as event_title
            FROM SponsorshipPackages sp
            JOIN Events e ON sp.event_id = e.event_id
            WHERE e.organizer_id = ?
            ORDER BY sp.created_at DESC
        `, [organizerId]);

        // 2. Active sponsorships on their events
        const [sponsorships] = await pool.query(`
            SELECT es.*, s.name as sponsor_name, sp.name as package_name, e.title as event_title
            FROM EventSponsorships es
            JOIN Sponsors s ON es.sponsor_id = s.sponsor_id
            JOIN Events e ON es.event_id = e.event_id
            LEFT JOIN SponsorshipPackages sp ON es.package_id = sp.package_id
            WHERE e.organizer_id = ?
            ORDER BY es.created_at DESC
        `, [organizerId]);

        // 3. Pending Sponsor applications (directly on events)
        const [pendingSponsors] = await pool.query(`
            SELECT s.*, e.title as event_title
            FROM Sponsors s
            JOIN Events e ON s.event_id = e.event_id
            WHERE e.organizer_id = ? AND s.status = 'PENDING'
            ORDER BY s.created_at DESC
        `, [organizerId]);

        return NextResponse.json({ packages, sponsorships, pendingSponsors });
    } catch (error) {
        console.error('Organizer Sponsorship GET error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

// POST /api/organizer/sponsorships - Create a new sponsorship tier/package
export async function POST(request: Request) {
    try {
        const { event_id, name, description, price, total_slots, benefits } = await request.json();
        if (!event_id || !name || !price) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

        const [result] = await pool.execute(`
            INSERT INTO SponsorshipPackages (event_id, name, description, price, total_slots, benefits)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [event_id, name, description || null, price, total_slots || 1, JSON.stringify(benefits || [])]);

        return NextResponse.json({
            message: 'Sponsorship package created',
            package_id: (result as any).insertId
        }, { status: 201 });
    } catch (error) {
        console.error('Organizer Sponsorship POST error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
