import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/user-following?user_id=X  (who user follows + followers)
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    if (!userId) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

    try {
        const [following] = await pool.query(`
            SELECT uf.following_id, uf.created_at,
                   u.name, u.email, u.profile_image, u.role, u.is_verified
            FROM UserFollowing uf
            JOIN Users u ON uf.following_id_ref = u.id
            WHERE uf.follower_id = ?
            ORDER BY uf.created_at DESC
        `, [userId]);

        const [followers] = await pool.query(`
            SELECT uf.following_id, uf.created_at,
                   u.name, u.email, u.profile_image, u.role, u.is_verified
            FROM UserFollowing uf
            JOIN Users u ON uf.follower_id = u.id
            WHERE uf.following_id_ref = ?
            ORDER BY uf.created_at DESC
        `, [userId]);

        return NextResponse.json({ following, followers });
    } catch (error) {
        console.error('UserFollowing GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch following data' }, { status: 500 });
    }
}

// POST /api/user-following — follow a user
export async function POST(request: Request) {
    try {
        const { follower_id, following_id } = await request.json();
        if (!follower_id || !following_id) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        if (follower_id === following_id) return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });

        await pool.execute(`
            INSERT IGNORE INTO UserFollowing (follower_id, following_id_ref)
            VALUES (?, ?)
        `, [follower_id, following_id]);

        // Notify the followed user
        const [followerRow] = await pool.query('SELECT name FROM Users WHERE id = ?', [follower_id]);
        const followerName = (followerRow as any[])[0]?.name || 'Someone';
        await pool.execute(
            'INSERT INTO Notifications (user_id, type, reference_id, content) VALUES (?, ?, ?, ?)',
            [following_id, 'FRIEND_REQUEST', follower_id, `${followerName} started following you!`]
        );

        return NextResponse.json({ message: 'Now following' }, { status: 201 });
    } catch (error) {
        console.error('UserFollowing POST error:', error);
        return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 });
    }
}

// DELETE /api/user-following — unfollow
export async function DELETE(request: Request) {
    try {
        const { follower_id, following_id } = await request.json();
        await pool.execute(
            'DELETE FROM UserFollowing WHERE follower_id = ? AND following_id_ref = ?',
            [follower_id, following_id]
        );
        return NextResponse.json({ message: 'Unfollowed' });
    } catch (error) {
        console.error('UserFollowing DELETE error:', error);
        return NextResponse.json({ error: 'Failed to unfollow' }, { status: 500 });
    }
}
