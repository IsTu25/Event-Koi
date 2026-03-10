import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/user-achievements?user_id=X
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    if (!userId) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

    try {
        const [rows] = await pool.query(`
            SELECT * FROM UserAchievements
            WHERE user_id = ?
            ORDER BY earned_at DESC
        `, [userId]);
        return NextResponse.json(rows);
    } catch (error) {
        console.error('UserAchievements GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
    }
}

// POST /api/user-achievements — grant an achievement (admin/system)
export async function POST(request: Request) {
    try {
        const { user_id, title, description, badge_icon, achievement_type, points_awarded } = await request.json();
        if (!user_id || !title || !achievement_type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const [result] = await pool.execute(`
            INSERT INTO UserAchievements (user_id, title, description, badge_icon, achievement_type, points_awarded)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [user_id, title, description || '', badge_icon || null, achievement_type, points_awarded || 0]);

        // Notify user
        await pool.execute(
            'INSERT INTO Notifications (user_id, type, reference_id, content) VALUES (?, ?, ?, ?)',
            [user_id, 'EVENT_UPDATE', (result as any).insertId, `🏆 You earned a new achievement: ${title}!`]
        );

        return NextResponse.json({ message: 'Achievement granted', achievement_id: (result as any).insertId }, { status: 201 });
    } catch (error) {
        console.error('UserAchievements POST error:', error);
        return NextResponse.json({ error: 'Failed to grant achievement' }, { status: 500 });
    }
}
