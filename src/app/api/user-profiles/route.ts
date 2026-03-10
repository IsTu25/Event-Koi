import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/user-profiles?user_id=X
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    if (!userId) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

    try {
        const [rows] = await pool.query(`
            SELECT up.*, u.name, u.email, u.role, u.is_verified, u.phone,
                   u.profile_image AS legacy_avatar
            FROM UserProfiles up
            RIGHT JOIN Users u ON up.user_id = u.id
            WHERE u.id = ?
        `, [userId]);

        const profile = (rows as any[])[0];
        if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        return NextResponse.json(profile);
    } catch (error) {
        console.error('UserProfiles GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}

// POST/PUT /api/user-profiles — upsert extended profile
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { user_id, bio, website_url, location, date_of_birth, gender, profile_image_url, cover_image_url, social_media_links, language_preference, timezone } = body;
        if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

        await pool.execute(`
            INSERT INTO UserProfiles (user_id, bio, website_url, location, date_of_birth, gender, profile_image_url, cover_image_url, social_media_links, language_preference, timezone)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                bio = VALUES(bio), website_url = VALUES(website_url), location = VALUES(location),
                date_of_birth = VALUES(date_of_birth), gender = VALUES(gender),
                profile_image_url = VALUES(profile_image_url), cover_image_url = VALUES(cover_image_url),
                social_media_links = VALUES(social_media_links), language_preference = VALUES(language_preference),
                timezone = VALUES(timezone)
        `, [
            user_id, bio || null, website_url || null, location || null,
            date_of_birth || null, gender || null, profile_image_url || null,
            cover_image_url || null,
            social_media_links ? JSON.stringify(social_media_links) : null,
            language_preference || 'en',
            timezone || null
        ]);

        return NextResponse.json({ message: 'Profile updated' });
    } catch (error) {
        console.error('UserProfiles PUT error:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
