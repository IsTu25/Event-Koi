import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/user-preferences?user_id=X
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    if (!userId) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

    try {
        const [rows] = await pool.query(
            'SELECT * FROM UserPreferences WHERE user_id = ?',
            [userId]
        );
        const prefs = (rows as any[])[0];
        if (!prefs) {
            // Return sensible defaults if no row yet
            return NextResponse.json({
                user_id: userId,
                email_notifications: true,
                push_notifications: true,
                sms_notifications: false,
                notify_new_events: true,
                notify_event_reminders: true,
                notify_friend_requests: true,
                notify_messages: true,
                notify_promotions: false,
                preferred_categories: [],
                preferred_location: null,
                preferred_radius_km: 50,
                language: 'en',
                timezone: 'UTC',
                theme: 'system',
                currency: 'BDT',
            });
        }
        return NextResponse.json(prefs);
    } catch (error) {
        console.error('UserPreferences GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }
}

// PUT /api/user-preferences — upsert preferences
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const {
            user_id, email_notifications, push_notifications, sms_notifications,
            notify_new_events, notify_event_reminders, notify_friend_requests,
            notify_messages, notify_promotions, preferred_categories,
            preferred_location, preferred_radius_km, language, timezone, theme, currency,
        } = body;

        if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

        await pool.execute(`
            INSERT INTO UserPreferences
                (user_id, email_notifications, push_notifications, sms_notifications,
                 notify_new_events, notify_event_reminders, notify_friend_requests,
                 notify_messages, notify_promotions, preferred_categories,
                 preferred_location, preferred_radius_km, language, timezone, theme, currency)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                email_notifications = VALUES(email_notifications),
                push_notifications = VALUES(push_notifications),
                sms_notifications = VALUES(sms_notifications),
                notify_new_events = VALUES(notify_new_events),
                notify_event_reminders = VALUES(notify_event_reminders),
                notify_friend_requests = VALUES(notify_friend_requests),
                notify_messages = VALUES(notify_messages),
                notify_promotions = VALUES(notify_promotions),
                preferred_categories = VALUES(preferred_categories),
                preferred_location = VALUES(preferred_location),
                preferred_radius_km = VALUES(preferred_radius_km),
                language = VALUES(language),
                timezone = VALUES(timezone),
                theme = VALUES(theme),
                currency = VALUES(currency),
                updated_at = CURRENT_TIMESTAMP
        `, [
            user_id,
            email_notifications ?? true, push_notifications ?? true,
            sms_notifications ?? false, notify_new_events ?? true,
            notify_event_reminders ?? true, notify_friend_requests ?? true,
            notify_messages ?? true, notify_promotions ?? false,
            preferred_categories ? JSON.stringify(preferred_categories) : null,
            preferred_location || null, preferred_radius_km || 50,
            language || 'en', timezone || 'UTC', theme || 'system', currency || 'BDT',
        ]);

        return NextResponse.json({ message: 'Preferences saved' });
    } catch (error) {
        console.error('UserPreferences PUT error:', error);
        return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });
    }
}
