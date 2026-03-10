import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/admin/audit-log?admin_id=X&entity_type=X
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('admin_id');
    const entityType = searchParams.get('entity_type');
    const limit = parseInt(searchParams.get('limit') || '100');

    try {
        // AdminAuditLog.admin_id → Users.id  (LEFT JOIN so missing rows don't break it)
        let query = `
            SELECT al.*,
                   u.name  AS admin_name,
                   u.email AS admin_email
            FROM AdminAuditLog al
            LEFT JOIN Users u ON al.admin_id = u.id
            WHERE 1=1
        `;
        const params: any[] = [];
        if (adminId) { query += ' AND al.admin_id = ?'; params.push(adminId); }
        if (entityType) { query += ' AND al.entity_type = ?'; params.push(entityType); }
        query += ` ORDER BY al.created_at DESC LIMIT ${Math.min(limit, 1000)}`;

        const [rows] = await pool.query(query, params);
        return NextResponse.json(rows);
    } catch (error: any) {
        // Table not yet migrated — return empty array so admin panel doesn't crash
        if (error?.code === 'ER_NO_SUCH_TABLE' || error?.errno === 1146) {
            return NextResponse.json([]);
        }
        console.error('AdminAuditLog GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 });
    }
}
