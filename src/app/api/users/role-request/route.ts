import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/users/role-request?user_id=...
// Check the status of a role request
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    try {
        const [rows] = await pool.query(`
            SELECT * FROM RoleRequests 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 1
        `, [userId]);

        return NextResponse.json((rows as any[])[0] || { status: 'NONE' });
    } catch (error) {
        console.error('Role Request GET error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

// POST /api/users/role-request
// Submit a new role request
export async function POST(request: Request) {
    try {
        const { user_id, requested_role } = await request.json();
        if (!user_id || !requested_role) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

        // Check if there is already a pending request
        const [existing] = await pool.query(`
            SELECT status FROM RoleRequests 
            WHERE user_id = ? AND status = 'PENDING'
        `, [user_id]);

        if ((existing as any[]).length > 0) {
            return NextResponse.json({ error: 'Request already pending' }, { status: 409 });
        }

        await pool.execute(`
            INSERT INTO RoleRequests (user_id, requested_role, status)
            VALUES (?, ?, 'PENDING')
        `, [user_id, requested_role]);

        return NextResponse.json({ message: 'Request submitted successfully' }, { status: 201 });
    } catch (error) {
        console.error('Role Request POST error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
