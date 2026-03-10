import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/admin/roles  — list all roles (admin)
export async function GET() {
    try {
        const [roles] = await pool.query('SELECT * FROM AdminRoles ORDER BY created_at ASC');
        return NextResponse.json(roles);
    } catch (error) {
        console.error('AdminRoles GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
    }
}

// POST /api/admin/roles — create a new role
export async function POST(request: Request) {
    try {
        const { role_name, description, permissions } = await request.json();
        if (!role_name) return NextResponse.json({ error: 'role_name required' }, { status: 400 });

        const [result] = await pool.execute(
            'INSERT INTO AdminRoles (role_name, description, permissions) VALUES (?, ?, ?)',
            [role_name, description || null, permissions ? JSON.stringify(permissions) : null]
        );
        return NextResponse.json({ message: 'Role created', role_id: (result as any).insertId }, { status: 201 });
    } catch (error) {
        console.error('AdminRoles POST error:', error);
        return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
    }
}

// PUT /api/admin/roles — update a role's permissions
export async function PUT(request: Request) {
    try {
        const { role_id, description, permissions } = await request.json();
        if (!role_id) return NextResponse.json({ error: 'role_id required' }, { status: 400 });

        await pool.execute(
            'UPDATE AdminRoles SET description = COALESCE(?, description), permissions = COALESCE(?, permissions) WHERE role_id = ?',
            [description || null, permissions ? JSON.stringify(permissions) : null, role_id]
        );
        return NextResponse.json({ message: 'Role updated' });
    } catch (error) {
        console.error('AdminRoles PUT error:', error);
        return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
    }
}
