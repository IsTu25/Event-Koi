import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/admin/sponsorships — list all sponsors and active sponsorships
export async function GET() {
    try {
        const [sponsors] = await pool.query(`
            SELECT s.*, u.name AS organizer_name, u.email AS organizer_email, e.title AS event_title
            FROM Sponsors s
            JOIN Events e ON s.event_id = e.event_id
            JOIN Users u ON e.organizer_id = u.id
            ORDER BY s.contribution_amount DESC
        `);
        const [sponsorships] = await pool.query(`
            SELECT es.*, s.name AS sponsor_name, s.tier, e.title AS event_title, sp.name AS package_name
            FROM EventSponsorships es
            JOIN Sponsors s ON es.sponsor_id = s.sponsor_id
            JOIN Events e ON es.event_id = e.event_id
            LEFT JOIN SponsorshipPackages sp ON es.package_id = sp.package_id
            ORDER BY es.created_at DESC
        `);
        const [packages] = await pool.query(`
            SELECT sp.*, e.title AS event_title
            FROM SponsorshipPackages sp
            JOIN Events e ON sp.event_id = e.event_id
            ORDER BY sp.created_at DESC
        `);
        return NextResponse.json({ sponsors, sponsorships, packages });
    } catch (error) {
        console.error('Admin Sponsorship GET error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

// POST /api/admin/sponsorships — update sponsorship status (approve/reject)
export async function POST(request: Request) {
    try {
        const { sponsorship_id, status, approved_by, notes } = await request.json();
        if (!sponsorship_id || !status || !approved_by) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

        await pool.execute(`
            UPDATE EventSponsorships 
            SET status = ?, approved_by = ?, approved_at = NOW(), notes = ?
            WHERE sponsorship_id = ?
        `, [status, approved_by, notes || null, sponsorship_id]);

        return NextResponse.json({ message: `Sponsorship ${status.toLowerCase()}` });
    } catch (error) {
        console.error('Admin Sponsorship POST error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
