import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';

// GET - Check 2FA status
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    if (!userId) return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });

    try {
        const [rows]: any = await pool.query('SELECT * FROM UserTwoFactor WHERE user_id = ?', [userId]);
        if (rows.length === 0) return NextResponse.json({ is_enabled: false });

        return NextResponse.json({
            is_enabled: !!rows[0].is_enabled,
            method: rows[0].method,
            // never send secret_key or backup_codes to client for viewing
        });
    } catch (error) {
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}

// POST - Setup or toggle 2FA
export async function POST(request: Request) {
    try {
        const { user_id, action, method } = await request.json();
        if (!user_id || !action) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

        if (action === 'ENABLE') {
            // Generate some backup codes
            const backupCodes = Array.from({ length: 6 }, () => crypto.randomBytes(4).toString('hex')).join(',');

            await pool.execute(`
                INSERT INTO UserTwoFactor (user_id, is_enabled, method, backup_codes, verified_at)
                VALUES (?, TRUE, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE
                    is_enabled = TRUE,
                    method = ?,
                    backup_codes = ?,
                    verified_at = NOW()
            `, [user_id, method || 'EMAIL', backupCodes, method || 'EMAIL', backupCodes]);

            // Add an achievement for security! If you secure your account, you get points.
            await pool.execute(`
                INSERT IGNORE INTO UserAchievements (user_id, achievement_type, title, description, points)
                VALUES (?, 'SECURITY', 'Iron Clad', 'Enabled Two-Factor Authentication', 50)
            `, [user_id]);

            return NextResponse.json({
                message: '2FA Enabled',
                backup_codes: backupCodes.split(',')
            }, { status: 200 });

        } else if (action === 'DISABLE') {
            await pool.execute(`
                UPDATE UserTwoFactor SET is_enabled = FALSE WHERE user_id = ?
            `, [user_id]);
            return NextResponse.json({ message: '2FA Disabled' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('2FA error', error);
        return NextResponse.json({ error: 'Failed to update 2FA' }, { status: 500 });
    }
}
