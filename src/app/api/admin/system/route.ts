import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/admin/system — list all system categories and venues
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'categories' or 'venues'

    try {
        if (type === 'venues') {
            const [rows] = await pool.query('SELECT * FROM Venues ORDER BY name ASC');
            return NextResponse.json(rows);
        }
        if (type === 'categories') {
            const [rows] = await pool.query('SELECT * FROM Categories ORDER BY name ASC');
            return NextResponse.json(rows);
        }
        return NextResponse.json({ error: 'Type required' }, { status: 400 });
    } catch (error) {
        console.error('Admin System GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

// POST /api/admin/system — add new category or venue
export async function POST(request: Request) {
    try {
        const { type, name, description, address, city, capacity, latitude, longitude, icon } = await request.json();
        if (type === 'categories') {
            if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
            const [result] = await pool.execute('INSERT INTO Categories (name, description, icon) VALUES (?, ?, ?)', [name, description || null, icon || null]);
            return NextResponse.json({ message: 'Category added', id: (result as any).insertId }, { status: 201 });
        }
        if (type === 'venues') {
            if (!name || !city || !capacity) return NextResponse.json({ error: 'Name, city, and capacity required' }, { status: 400 });
            const [result] = await pool.execute(
                'INSERT INTO Venues (name, address, city, capacity, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)',
                [name, address || null, city, capacity, latitude || null, longitude || null]
            );
            return NextResponse.json({ message: 'Venue added', id: (result as any).insertId }, { status: 201 });
        }
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    } catch (error) {
        console.error('Admin System POST error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

// DELETE /api/admin/system?type=X&id=X
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    if (!type || !id) return NextResponse.json({ error: 'Type and id required' }, { status: 400 });

    try {
        if (type === 'categories') {
            await pool.execute('DELETE FROM Categories WHERE category_id = ?', [id]);
        } else if (type === 'venues') {
            await pool.execute('DELETE FROM Venues WHERE venue_id = ?', [id]);
        }
        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Admin System DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
