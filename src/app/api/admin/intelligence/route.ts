import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/admin/intelligence — analytics about search and discovery
export async function GET() {
    try {
        // TOP 20 search queries
        const [queries] = await pool.query(`
            SELECT search_query AS query, COUNT(*) AS count, AVG(results_count) AS avg_results, 
                   MAX(searched_at) AS last_last_searched
            FROM SearchHistory
            GROUP BY search_query
            ORDER BY count DESC
            LIMIT 20
        `);

        // Most recommended categories (joining with Events for category info)
        const [recommendations] = await pool.query(`
            SELECT c.name AS recommended_category, COUNT(*) AS count, AVG(ur.recommendation_score) AS avg_score
            FROM UserRecommendations ur
            JOIN Events e ON ur.event_id = e.event_id
            JOIN Categories c ON e.category_id = c.category_id
            GROUP BY c.name
            ORDER BY count DESC
            LIMIT 10
        `);

        // Daily analytics snapshot
        const [dailyMetrics] = await pool.query(`
            SELECT metric_date, new_users, new_events, total_bookings, total_revenue AS net_revenue, active_users
            FROM DailyMetrics
            ORDER BY metric_date DESC
            LIMIT 30
        `);

        return NextResponse.json({ queries, recommendations, dailyMetrics });
    } catch (error) {
        console.error('Admin Intelligence GET error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
