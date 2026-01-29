import { NextResponse } from 'next/server';
import pool from '@/lib/db';

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get('event_id');
        const userId = searchParams.get('user_id'); // Current user to check if liked

        if (!eventId) {
            return NextResponse.json({ message: 'Event ID required' }, { status: 400 });
        }

        const query = `
            SELECT 
                p.*,
                u.name as author_name,
                u.profile_image as author_image,
                (SELECT COUNT(*) FROM PostLikes WHERE post_id = p.post_id) as like_count,
                (SELECT COUNT(*) > 0 FROM PostLikes WHERE post_id = p.post_id AND user_id = ?) as is_liked
            FROM EventPosts p
            JOIN Users u ON p.user_id = u.id
            WHERE p.event_id = ?
            ORDER BY p.created_at DESC
        `;

        const [posts] = await pool.query(query, [userId || 0, eventId]);

        // For each post, get comments
        for (const post of (posts as any[])) {
            const [comments] = await pool.query(`
                SELECT c.*, u.name as user_name, u.profile_image 
                FROM PostComments c
                JOIN Users u ON c.user_id = u.id
                WHERE c.post_id = ?
                ORDER BY c.created_at ASC
            `, [post.post_id]);
            post.comments = comments;
        }

        return NextResponse.json(posts);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Error fetching posts' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        console.log('📝 POST /api/posts - Starting request processing');

        const formData = await request.formData();
        const event_id = formData.get('event_id');
        const user_id = formData.get('user_id');
        const content = formData.get('content');
        const image = formData.get('image');

        console.log('📋 Received data:', { event_id, user_id, content: content?.toString().substring(0, 50), hasImage: !!image });

        // Validation
        if (!event_id || !user_id || !content) {
            console.error('❌ Missing required fields:', { event_id: !!event_id, user_id: !!user_id, content: !!content });
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        let image_url = null;
        if (image && typeof image === 'object' && (image as any).name) {
            try {
                console.log('📷 Processing image upload to Local Storage...');
                const file = image as File;
                const buffer = Buffer.from(await file.arrayBuffer());

                // create a safe filename
                const filename = `post-${Date.now()}-${file.name.replace(/\s/g, '_')}`;
                const uploadDir = path.join(process.cwd(), 'public/uploads');

                // Ensure directory exists
                await mkdir(uploadDir, { recursive: true });

                // Write file
                await writeFile(path.join(uploadDir, filename), buffer);
                image_url = `/uploads/${filename}`;

                console.log('✅ Image uploaded locally:', image_url);
            } catch (imgError) {
                console.error('⚠️ Image upload failed (continuing without image):', imgError);
                // Continue without image rather than failing the entire post
            }
        }

        console.log('💾 Inserting post into database...');
        const [result] = await pool.execute(
            'INSERT INTO EventPosts (event_id, user_id, content, image_url) VALUES (?, ?, ?, ?)',
            [event_id, user_id, content, image_url]
        );

        console.log('✅ Post created successfully:', (result as any).insertId);
        return NextResponse.json({ message: 'Post created', post_id: (result as any).insertId }, { status: 201 });
    } catch (error) {
        console.error('❌ Error creating post:', error);
        console.error('Error details:', {
            message: (error as any).message,
            code: (error as any).code,
            sqlMessage: (error as any).sqlMessage
        });
        return NextResponse.json({
            message: 'Error creating post',
            error: (error as any).message
        }, { status: 500 });
    }
}
