import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/admin/users — list all users with admin roles
export async function GET() {
    try {
        const query = `
            SELECT au.admin_id, au.user_id, au.role_id, au.status, au.last_login,
                   u.name, u.email, ar.role_name
            FROM AdminUsers au
            JOIN Users u ON au.user_id = u.id
            JOIN AdminRoles ar ON au.role_id = ar.role_id
            ORDER BY u.name ASC
        `;
        const [rows] = await pool.query(query);
        return NextResponse.json(rows);
    } catch (error) {
        console.error('AdminUsers GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch admin users' }, { status: 500 });
    }
}

// POST /api/admin/users — assign admin role to a user
export async function POST(request: Request) {
    try {
        const { user_id, role_id } = await request.json();
        if (!user_id || !role_id) return NextResponse.json({ error: 'user_id and role_id required' }, { status: 400 });

        const [result] = await pool.execute(
            'INSERT INTO AdminUsers (user_id, role_id, status) VALUES (?, ?, "Active") ON DUPLICATE KEY UPDATE role_id = VALUES(role_id), status = "Active"',
            [user_id, role_id]
        );

        // Also ensure user role in main Users table is 'admin'
        await pool.execute("UPDATE Users SET role = 'admin' WHERE id = ?", [user_id]);

        return NextResponse.json({ message: 'Admin user assigned', id: (result as any).insertId }, { status: 201 });
    } catch (error) {
        console.error('AdminUsers POST error:', error);
        return NextResponse.json({ error: 'Failed to assign admin user' }, { status: 500 });
    }
}

// DELETE /api/admin/users?id=X — remove admin role
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    try {
        // Find user_id first to potentially demote them in Users table
        const [rows] = await pool.query<any[]>('SELECT user_id FROM AdminUsers WHERE admin_id = ?', [id]);
        if (rows.length > 0) {
            const userId = rows[0].user_id;
            await pool.execute('DELETE FROM AdminUsers WHERE admin_id = ?', [id]);
            // Optional: demote to attendee if no other admin roles (assuming 1-to-1 for now)
            await pool.execute("UPDATE Users SET role = 'attendee' WHERE id = ?", [userId]);
        }
        return NextResponse.json({ message: 'Admin user removed' });
    } catch (error) {
        console.error('AdminUsers DELETE error:', error);
        return NextResponse.json({ error: 'Failed to remove admin user' }, { status: 500 });
    }
}
