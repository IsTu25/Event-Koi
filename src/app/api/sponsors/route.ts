import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const event_id = formData.get('event_id');
        const name = formData.get('name');
        const contribution = formData.get('contribution_amount');
        const tier = formData.get('tier');
        const logo = formData.get('logo') as File | null;
        const user_id = formData.get('user_id'); // Who is adding this?
        const status = formData.get('status') || 'PENDING'; // Default pending if not specified

        if (!event_id || !name) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
        }

        let logoPath = null;
        if (logo) {
            const buffer = Buffer.from(await logo.arrayBuffer());
            const filename = `sponsor_${Date.now()}_${logo.name.replace(/\s/g, '_')}`;
            const uploadDir = path.join(process.cwd(), 'public/uploads');
            try {
                await mkdir(uploadDir, { recursive: true });
                await writeFile(path.join(uploadDir, filename), buffer);
                logoPath = `/uploads/${filename}`;
            } catch (e) {
                console.error('Upload failed', e);
            }
        }

        // Validate and parse contribution amount
        let contributionAmount = 0;
        if (contribution) {
            const parsed = parseFloat(contribution.toString());
            if (!isNaN(parsed) && parsed >= 0 && parsed <= 99999999.99) {
                contributionAmount = parsed;
            } else {
                return NextResponse.json({
                    message: 'Invalid contribution amount. Must be between 0 and 99,999,999.99'
                }, { status: 400 });
            }
        }

        const query = `INSERT INTO Sponsors (event_id, name, contribution_amount, tier, logo_url, status) VALUES (?, ?, ?, ?, ?, ?)`;
        const [result] = await pool.execute(query, [event_id, name, contributionAmount, tier || 'Partner', logoPath, status]);

        return NextResponse.json({ message: 'Sponsor added', sponsorId: (result as any).insertId });
    } catch (error) {
        console.error('Sponsor add error', error);
        return NextResponse.json({ message: 'Error adding sponsor' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const event_id = searchParams.get('event_id');
    const status = searchParams.get('status');

    if (!event_id) return NextResponse.json([], { status: 400 });

    try {
        let query = 'SELECT * FROM Sponsors WHERE event_id = ?';
        const params = [event_id];

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        query += ' ORDER BY contribution_amount DESC';
        const [rows] = await pool.query(query, params);
        return NextResponse.json(rows);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch sponsors' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const { sponsor_id, status } = await request.json();

        if (!sponsor_id || !status) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
        }

        await pool.execute('UPDATE Sponsors SET status = ? WHERE sponsor_id = ?', [status, sponsor_id]);
        return NextResponse.json({ message: 'Sponsor updated' });
    } catch (error) {
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}
