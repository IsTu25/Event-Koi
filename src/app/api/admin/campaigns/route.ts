import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/admin/campaigns
export async function GET(request: Request) {
    try {
        const [campaigns] = await pool.query(`
            SELECT c.*, 
                   COALESCE(s.total_sent, 0) AS total_sent, 
                   COALESCE(s.opened, 0) AS opened, 
                   COALESCE(s.clicked, 0) AS clicked, 
                   COALESCE(s.failed, 0) AS failed,
                   u.name AS organizer_name,
                   u.email AS organizer_email
            FROM EmailCampaigns c
            LEFT JOIN CampaignStats s ON c.campaign_id = s.campaign_id
            LEFT JOIN Users u ON c.organizer_id = u.id
            ORDER BY c.created_at DESC
        `);
        return NextResponse.json(campaigns);
    } catch (error) {
        console.error('Admin Campaigns GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
    }
}
