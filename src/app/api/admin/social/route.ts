import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/admin/social — view relationship and communication activity
export async function GET() {
    try {
        // TOP Influencers based on Friendships
        const [influencers] = await pool.query(`
            SELECT u.name, u.email, COUNT(f.friend_id) AS friend_count
            FROM (
                SELECT user_id, friend_id FROM Friendships WHERE status = 'ACCEPTED'
                UNION
                SELECT friend_id, user_id FROM Friendships WHERE status = 'ACCEPTED'
            ) f
            JOIN Users u ON f.user_id = u.id
            GROUP BY u.id
            ORDER BY friend_count DESC
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

        // Friendships
        const [friendships] = await pool.query(`
            SELECT f.*, u1.name AS user1_name, u2.name AS user2_name
            FROM Friendships f
            JOIN Users u1 ON f.user_id = u1.id
            JOIN Users u2 ON f.friend_id = u2.id
            ORDER BY f.created_at DESC
            LIMIT 50
        `);

        return NextResponse.json({ influencers, messaging, friendships });
    } catch (error) {
        console.error('Admin Social GET error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
