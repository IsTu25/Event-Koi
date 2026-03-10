import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/admin/social — view relationship and communication activity
export async function GET() {
    try {
        // TOP followed users
        const [influencers] = await pool.query(`
            SELECT u.name, u.email, COUNT(uf.follower_user_id) AS follower_count
            FROM UserFollowing uf
            JOIN Users u ON uf.following_user_id = u.id
            GROUP BY uf.following_user_id
            ORDER BY follower_count DESC
            LIMIT 20
        `);

        // Messaging activity
        const [messaging] = await pool.query(`
            SELECT DATE(created_at) AS date, COUNT(*) AS message_count
            FROM Messages
            WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `);

        // Recent achievements
        const [achievements] = await pool.query(`
            SELECT ua.*, u.name AS user_name
            FROM UserAchievements ua
            JOIN Users u ON ua.user_id = u.id
            ORDER BY ua.earned_date DESC
            LIMIT 50
        `);

        // Friendships
        const [friendships] = await pool.query(`
            SELECT f.*, u1.name AS user1_name, u2.name AS user2_name
            FROM Friendships f
            JOIN Users u1 ON f.user_id = u1.id
            JOIN Users u2 ON f.friend_id = u2.id
            ORDER BY f.created_at DESC
            LIMIT 50
        `);

        return NextResponse.json({ influencers, messaging, achievements, friendships });
    } catch (error) {
        console.error('Admin Social GET error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
