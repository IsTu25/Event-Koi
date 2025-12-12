import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('user_id');

        if (!userId) {
            return NextResponse.json({ message: 'User ID required' }, { status: 400 });
        }

        // Get confirmed friends (complex join because user_id could be coll 1 or coll 2)
        // Actually, simpler query:
        // Find rows where user_id is involved.

        // Let's get "My Friends" (Accepted) separately? Or all in one.
        // Let's fetch all relevant rows and process in JS or do smart SQL.

        const query = `
            SELECT 
                f.friendship_id,
                f.status,
                f.user_id,
                f.friend_id,
                u1.name as name_1, u1.profile_image as image_1,
                u2.name as name_2, u2.profile_image as image_2
            FROM Friendships f
            JOIN Users u1 ON f.user_id = u1.id
            JOIN Users u2 ON f.friend_id = u2.id
            WHERE f.user_id = ? OR f.friend_id = ?
        `;

        const [rows] = await pool.query(query, [userId, userId]);

        // Transform for frontend
        const friendships = (rows as any[]).map(row => {
            const isSender = row.user_id == userId;
            const friendId = isSender ? row.friend_id : row.user_id;
            const friendName = isSender ? row.name_2 : row.name_1;
            const friendImage = isSender ? row.image_2 : row.image_1;

            return {
                id: row.friendship_id,
                status: row.status,
                friend: {
                    id: friendId,
                    name: friendName,
                    image: friendImage
                },
                is_incoming: !isSender && row.status === 'PENDING'
            };
        });

        return NextResponse.json(friendships);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Error fetching friends' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { user_id, friend_id } = await request.json();

        // Check if exists
        const [existing] = await pool.query(
            'SELECT * FROM Friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
            [user_id, friend_id, friend_id, user_id]
        );

        if ((existing as any[]).length > 0) {
            return NextResponse.json({ message: 'Request already exists' }, { status: 400 });
        }

        await pool.execute(
            'INSERT INTO Friendships (user_id, friend_id, status) VALUES (?, ?, "PENDING")',
            [user_id, friend_id]
        );

        return NextResponse.json({ message: 'Friend request sent' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Error sending request' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const { friendship_id, status } = await request.json();

        if (status === 'REJECTED') {
            await pool.execute('DELETE FROM Friendships WHERE friendship_id = ?', [friendship_id]);
            return NextResponse.json({ message: 'Request rejected/removed' });
        }

        await pool.execute(
            'UPDATE Friendships SET status = ? WHERE friendship_id = ?',
            [status, friendship_id]
        );

        return NextResponse.json({ message: 'Friend request updated' });
    } catch (error) {
        return NextResponse.json({ message: 'Error updating request' }, { status: 500 });
    }
}
