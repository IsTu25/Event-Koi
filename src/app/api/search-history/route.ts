import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// POST /api/search-history — record a new search
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { user_id, search_query, search_type, results_count } = body;

        if (!search_query) return NextResponse.json({ error: 'search_query required' }, { status: 400 });

        await pool.execute(`
            INSERT INTO SearchHistory (user_id, search_query, search_type, results_count)
            VALUES (?, ?, ?, ?)
        `, [user_id || null, search_query, search_type || 'Event', results_count || 0]);

        return NextResponse.json({ message: 'Search recorded' });
    } catch (error) {
        console.error('SearchHistory POST error:', error);
        return NextResponse.json({ error: 'Failed to record search' }, { status: 500 });
    }
}

// GET /api/search-history?user_id=X
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    if (!userId) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

    try {
        const [rows] = await pool.query(`
            SELECT search_query as \`query\`, search_type as \`filters\`, results_count, searched_at as \`created_at\`
            FROM SearchHistory
            WHERE user_id = ?
            ORDER BY searched_at DESC
            LIMIT 30
        `, [userId]);
        return NextResponse.json(rows);
    } catch (error) {
        console.error('SearchHistory GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch search history' }, { status: 500 });
    }
}

// DELETE /api/search-history?user_id=X — clear history
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    if (!userId) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

    try {
        await pool.execute('DELETE FROM SearchHistory WHERE user_id = ?', [userId]);
        return NextResponse.json({ message: 'Search history cleared' });
    } catch (error) {
        console.error('SearchHistory DELETE error:', error);
        return NextResponse.json({ error: 'Failed to clear history' }, { status: 500 });
    }
}
