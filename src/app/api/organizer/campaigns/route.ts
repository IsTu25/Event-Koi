import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const organizerId = searchParams.get('organizer_id');

    if (!organizerId) return NextResponse.json({ error: 'Missing organizer_id' }, { status: 400 });

    try {
        const [campaigns] = await pool.query(`
            SELECT c.*, 
                   s.total_sent, s.opened, s.clicked, s.failed 
            FROM EmailCampaigns c
            LEFT JOIN CampaignStats s ON c.campaign_id = s.campaign_id
            WHERE c.organizer_id = ?
            ORDER BY c.created_at DESC
        `, [organizerId]);
        return NextResponse.json(campaigns);
    } catch (error) {
        console.error('Campaigns GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { organizer_id, campaign_name, subject, body_content, target_audience } = body;

        // In a real app we'd validate required fields here
        if (!organizer_id || !campaign_name || !subject || !body_content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [result]: any = await connection.execute(`
                INSERT INTO EmailCampaigns (organizer_id, campaign_name, subject, body_content, target_audience, status)
                VALUES (?, ?, ?, ?, ?, 'DRAFT')
            `, [organizer_id, campaign_name, subject, body_content, target_audience || 'ALL_ATTENDEES']);

            const campaignId = result.insertId;

            await connection.execute(`
                INSERT INTO CampaignStats (campaign_id) VALUES (?)
            `, [campaignId]);

            await connection.commit();
            return NextResponse.json({ message: 'Campaign Created', campaign_id: campaignId }, { status: 201 });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Campaigns POST error:', error);
        return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        // action = 'SEND' means mock sending the email, updating status to SENT
        if (body.action === 'SEND') {
            await pool.execute(`
                 UPDATE EmailCampaigns 
                 SET status = 'SENT', sent_at = CURRENT_TIMESTAMP
                 WHERE campaign_id = ? AND organizer_id = ?
             `, [body.campaign_id, body.organizer_id]);

            // Mock the stats updating immediately since we don't have real webhooks
            const mockSent = Math.floor(Math.random() * 50) + 10;
            const mockOpened = Math.floor(mockSent * (Math.random() * 0.4 + 0.3));

            await pool.execute(`
                 UPDATE CampaignStats
                 SET total_sent = ?, opened = ?, clicked = ?
                 WHERE campaign_id = ?
             `, [mockSent, mockOpened, Math.floor(mockOpened * 0.2), body.campaign_id]);

            return NextResponse.json({ message: 'Campaign Sent (Mocked)' });
        }

        return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });

    } catch (error: any) {
        console.error('Campaigns PUT error:', error);
        return NextResponse.json({ error: 'Failed to process campaign' }, { status: 500 });
    }
}
