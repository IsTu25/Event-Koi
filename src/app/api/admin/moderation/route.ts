import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/admin/moderation?user_id=X (active moderations for a user)
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    try {
        let query = `
            SELECT um.*, u.name AS user_name, u.email,
                   a_susp.name AS suspended_by_name,
                   a_ban.name AS banned_by_name
            FROM UserModeration um
            JOIN Users u ON um.user_id = u.id
            LEFT JOIN Users a_susp ON um.suspended_by_admin = a_susp.id
            LEFT JOIN Users a_ban ON um.banned_by_admin = a_ban.id
            WHERE 1=1
        `;
        const params: any[] = [];
        if (userId) {
            query += ' AND um.user_id = ?';
            params.push(userId);
        }
        query += ' ORDER BY um.created_at DESC LIMIT 200';

        const [rows] = await pool.query(query, params);
        return NextResponse.json(rows);
    } catch (error) {
        console.error('UserModeration GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch moderation records' }, { status: 500 });
    }
}

// POST /api/admin/moderation — issue a warning/ban/suspension
export async function POST(request: Request) {
    try {
        const { user_id, admin_id, action, reason, duration_days } = await request.json();
        if (!user_id || !admin_id || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            if (action === 'WARNING') {
                await connection.execute(`
                    INSERT INTO UserModeration (user_id, warning_level, last_warning_date)
                    VALUES (?, 1, NOW())
                    ON DUPLICATE KEY UPDATE 
                        warning_level = warning_level + 1,
                        last_warning_date = NOW()
                `, [user_id]);
            } else if (action === 'SUSPENSION') {
                const ends_at = new Date(Date.now() + (duration_days || 7) * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
                await connection.execute(`
                    INSERT INTO UserModeration (user_id, is_suspended, suspension_reason, suspended_by_admin, suspension_start, suspension_end)
                    VALUES (?, 1, ?, ?, NOW(), ?)
                    ON DUPLICATE KEY UPDATE 
                        is_suspended = 1,
                        suspension_reason = ?,
                        suspended_by_admin = ?,
                        suspension_start = NOW(),
                        suspension_end = ?
                `, [user_id, reason || 'Compliance violation', admin_id, ends_at, reason || 'Compliance violation', admin_id, ends_at]);
            } else if (action === 'BAN') {
                await connection.execute(`
                    INSERT INTO UserModeration (user_id, is_banned, ban_reason, banned_by_admin, ban_date)
                    VALUES (?, 1, ?, ?, NOW())
                    ON DUPLICATE KEY UPDATE 
                        is_banned = 1,
                        ban_reason = ?,
                        banned_by_admin = ?,
                        ban_date = NOW()
                `, [user_id, reason || 'Permanent ban for policy breach', admin_id, reason || 'Permanent ban for policy breach', admin_id]);
            }

            // Record action in Audit Log
            await connection.execute(
                'INSERT INTO AdminAuditLog (admin_id, action, entity_type, entity_id, notes) VALUES (?, ?, ?, ?, ?)',
                [admin_id, action, 'USER', user_id, reason || null]
            );

            // Notify user
            const actionMsg: Record<string, string> = {
                WARNING: '⚠️ Warning issued for account conduct.',
                SUSPENSION: '🔒 Account temporarily suspended.',
                BAN: '🚫 Account permanently banned.',
            };
            await connection.execute(
                'INSERT INTO Notifications (user_id, type, reference_id, content) VALUES (?, ?, ?, ?)',
                [user_id, 'SYSTEM', user_id, actionMsg[action] || 'Security action taken on account.']
            );

            await connection.commit();
            return NextResponse.json({ message: `${action} applied successfully` });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('UserModeration POST error:', error);
        return NextResponse.json({ error: 'Failed to apply moderation' }, { status: 500 });
    }
}
