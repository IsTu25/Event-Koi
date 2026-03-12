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
            // 1. Get campaign details
            const [campaignRows]: any = await pool.execute(
                'SELECT target_audience, organizer_id FROM EmailCampaigns WHERE campaign_id = ?',
                [body.campaign_id]
            );

            if (campaignRows.length === 0) {
                return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
            }

            const { target_audience, organizer_id } = campaignRows[0];
            let audienceCount = 0;

            // 2. Calculate actual audience size
            if (target_audience === 'FOLLOWERS') {
                const [countRows]: any = await pool.execute(
                    'SELECT COUNT(*) as count FROM UserFollowing WHERE following_user_id = ?',
                    [organizer_id]
                );
                audienceCount = countRows[0].count;
            } else if (target_audience === 'ALL_ATTENDEES') {
                const [countRows]: any = await pool.execute(`
                    SELECT COUNT(DISTINCT b.user_id) as count 
                    FROM Bookings b 
                    JOIN Events e ON b.event_id = e.event_id 
                    WHERE e.organizer_id = ?
                `, [organizer_id]);
                audienceCount = countRows[0].count;
            } else {
                // Default to ALL platform users if 'EVERYBODY' or other
                const [countRows]: any = await pool.execute('SELECT COUNT(*) as count FROM Users');
                audienceCount = countRows[0].count;
            }

            // 3. Update status and stats
            await pool.execute(`
                 UPDATE EmailCampaigns 
                 SET status = 'SENT', sent_at = CURRENT_TIMESTAMP
                 WHERE campaign_id = ?
             `, [body.campaign_id]);

            await pool.execute(`
                 UPDATE CampaignStats
                 SET total_sent = ?, opened = 0, clicked = 0, failed = 0
                 WHERE campaign_id = ?
             `, [audienceCount, body.campaign_id]);

            return NextResponse.json({
                message: 'Campaign Sent Successfully',
                sent_to: audienceCount
            });
        }

        return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });

    } catch (error: any) {
        console.error('Campaigns PUT error:', error);
        return NextResponse.json({ error: 'Failed to process campaign' }, { status: 500 });
    }
}
