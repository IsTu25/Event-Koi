import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/reported-content (admin) or ?reporter_id=X
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const reporterId = searchParams.get('reporter_id');
    const status = searchParams.get('status');

    try {
        let query = `
            SELECT rc.*, u.name AS reporter_name, u.email AS reporter_email,
                   admin.name AS reviewed_by_name
            FROM ReportedContent rc
            JOIN Users u ON rc.reported_by_user_id = u.id
            LEFT JOIN Users admin ON rc.assigned_to_admin = admin.id
            WHERE 1=1
        `;
        const params: any[] = [];
        if (reporterId) { query += ' AND rc.reported_by_user_id = ?'; params.push(reporterId); }
        if (status) { query += ' AND rc.status = ?'; params.push(status); }
        query += ' ORDER BY rc.reported_date DESC LIMIT 200';

        const [rows] = await pool.query(query, params);
        return NextResponse.json(rows);
    } catch (error) {
        console.error('ReportedContent GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }
}

// POST /api/reported-content — user submits a report
export async function POST(request: Request) {
    try {
        const { reporter_id, content_type, content_id, reason, description } = await request.json();
        if (!reporter_id || !content_type || !content_id || !reason) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const [result] = await pool.execute(`
            INSERT INTO ReportedContent (reporter_id, content_type, content_id, reason, description)
            VALUES (?, ?, ?, ?, ?)
        `, [reporter_id, content_type, content_id, reason, description || null]);

        // Log
        await pool.execute(
            'INSERT INTO SystemLogs (level, category, message, user_id) VALUES (?, ?, ?, ?)',
            ['WARN', 'MODERATION', `Content reported: ${content_type}#${content_id} — ${reason}`, reporter_id]
        );

        return NextResponse.json({ message: 'Report submitted', report_id: (result as any).insertId }, { status: 201 });
    } catch (error) {
        console.error('ReportedContent POST error:', error);
        return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
    }
}

// PUT /api/reported-content — admin resolves/dismisses a report
export async function PUT(request: Request) {
    try {
        const { report_id, status, admin_id, resolution_note } = await request.json();
        if (!report_id || !status || !admin_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await pool.execute(`
            UPDATE ReportedContent
            SET status = ?, assigned_to_admin = ?, resolved_date = NOW(), resolution_notes = ?
            WHERE report_id = ?
        `, [status, admin_id, resolution_note || null, report_id]);

        await pool.execute(
            'INSERT INTO AdminAuditLog (admin_user_id, action_type, entity_type, entity_id, description) VALUES (?, ?, ?, ?, ?)',
            [admin_id, `REPORT_${status}`, 'ReportedContent', report_id, resolution_note || null]
        );

        return NextResponse.json({ message: `Report ${status.toLowerCase()}` });
    } catch (error) {
        console.error('ReportedContent PUT error:', error);
        return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
    }
}
