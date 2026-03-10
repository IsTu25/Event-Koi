import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/admin/system-logs?level=ERROR&limit=100
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '100');

    try {
        let query = `SELECT sl.*, u.name AS user_name FROM SystemLogs sl LEFT JOIN Users u ON sl.user_id = u.id WHERE 1=1`;
        const params: any[] = [];
        if (level) { query += ' AND sl.level = ?'; params.push(level); }
        if (category) { query += ' AND sl.category = ?'; params.push(category); }
        query += ` ORDER BY sl.created_at DESC LIMIT ${Math.min(limit, 1000)}`;

        const [rows] = await pool.query(query, params);
        return NextResponse.json(rows);
    } catch (error) {
        console.error('SystemLogs GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }
}

// POST /api/admin/system-logs — internal use
export async function POST(request: Request) {
    try {
        const { level, category, message, context, user_id, ip_address, request_path, request_method, response_code, duration_ms } = await request.json();
        if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 });

        await pool.execute(`
            INSERT INTO SystemLogs (level, category, message, context, user_id, ip_address, request_path, request_method, response_code, duration_ms)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            level || 'INFO', category || null, message,
            context ? JSON.stringify(context) : null,
            user_id || null, ip_address || null,
            request_path || null, request_method || null,
            response_code || null, duration_ms || null,
        ]);

        return NextResponse.json({ message: 'Logged' }, { status: 201 });
    } catch (error) {
        console.error('SystemLogs POST error:', error);
        return NextResponse.json({ error: 'Failed to log' }, { status: 500 });
    }
}
