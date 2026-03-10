import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/admin/users/analytics - Aggregate user engagement and behavior
export async function GET() {
    try {
        // 1. Top Spenders
        const [topSpenders] = await pool.query(`
            SELECT u.id, u.name, u.email, 
                   COALESCE(SUM(ua.amount_spent), 0) as total_spent, 
                   COALESCE(SUM(ua.events_booked), 0) as total_bookings
            FROM Users u
            LEFT JOIN UserAnalytics ua ON u.id = ua.user_id
            GROUP BY u.id
            HAVING total_spent > 0 OR total_bookings > 0
            ORDER BY total_spent DESC
            LIMIT 10
        `);

        // 2. Real-time KPIs (DAU, MAU)
        const [dauRes]: any = await pool.query(`
            SELECT COUNT(DISTINCT user_id) as count 
            FROM SystemLogs 
            WHERE created_at >= CURDATE()
        `);
        const [mauRes]: any = await pool.query(`
            SELECT COUNT(DISTINCT user_id) as count 
            FROM SystemLogs 
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        `);

        // 3. User Retention (Approximate)
        // Users active 30-60 days ago who were also active in last 30 days
        const [retentionRes]: any = await pool.query(`
            SELECT 
                (SELECT COUNT(DISTINCT user_id) FROM SystemLogs 
                 WHERE created_at BETWEEN DATE_SUB(CURDATE(), INTERVAL 60 DAY) AND DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                 AND user_id IN (SELECT DISTINCT user_id FROM SystemLogs WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY))
                ) as retained,
                (SELECT COUNT(DISTINCT user_id) FROM SystemLogs 
                 WHERE created_at BETWEEN DATE_SUB(CURDATE(), INTERVAL 60 DAY) AND DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                ) as total_prev
        `);

        // 4. Activity Trends
        const [engagementTrends] = await pool.query(`
            SELECT snapshot_date,
                   SUM(events_booked) as bookings,
                   SUM(amount_spent) as revenue,
                   SUM(posts_made) as social_activity
            FROM UserAnalytics
            WHERE snapshot_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY snapshot_date
            ORDER BY snapshot_date ASC
        `);

        // 5. Achievement Distribution
        const [achievementStats] = await pool.query(`
            SELECT achievement_type, COUNT(*) as count, AVG(points) as avg_points
            FROM UserAchievements
            GROUP BY achievement_type
        `);

        // 6. Most Social Users (Restoring for UI)
        const [mostSocial] = await pool.query(`
            SELECT u.id, u.name, 
                   SUM(ua.posts_made) as total_posts
            FROM UserAnalytics ua
            JOIN Users u ON ua.user_id = u.id
            GROUP BY u.id
            ORDER BY total_posts DESC
            LIMIT 10
        `);

        const kpis = {
            dau: dauRes[0]?.count || 0,
            mau: mauRes[0]?.count || 0,
            retention: retentionRes[0]?.total_prev > 0
                ? ((retentionRes[0].retained / retentionRes[0].total_prev) * 100).toFixed(1)
                : "0.0"
        };

        return NextResponse.json({
            topSpenders,
            mostSocial,
            engagementTrends,
            achievementStats,
            kpis
        });
    } catch (error) {
        console.error('User Analytics API error:', error);
        return NextResponse.json({ error: 'Failed to fetch user analytics' }, { status: 500 });
    }
}
