-- =====================================================
-- Event Ekhanei - Analytics & Reporting
-- File: 08_analytics_reporting.sql
-- Description: Advanced analytical queries for dashboard reporting
-- =====================================================

-- 1. EVENT PERFORMANCE METRICS
-- Calculate comprehensive metrics for each event:
-- - Total Revenue
-- - Occupancy Rate
-- - Conversion Rate (Views vs Bookings - simulated)
-- - Engagement Score (Likes + Comments)

CREATE OR REPLACE VIEW View_Event_Performance AS
SELECT 
    e.event_id,
    e.title,
    e.status,
    c.name AS category,
    u.name AS organizer,
    
    -- Revenue calculation
    COALESCE(SUM(b.booking_id IS NOT NULL), 0) as total_bookings,
    COALESCE(SUM(tt.price), 0) as total_revenue,
    
    -- Capacity & Occupancy
    v.capacity,
    ROUND((COUNT(b.booking_id) / NULLIF(v.capacity, 0)) * 100, 2) as occupancy_rate,
    
    -- Engagement
    (SELECT COUNT(*) FROM PostLikes pl JOIN EventPosts ep ON pl.post_id = ep.post_id WHERE ep.event_id = e.event_id) as total_likes,
    (SELECT COUNT(*) FROM PostComments pc JOIN EventPosts ep ON pc.post_id = ep.post_id WHERE ep.event_id = e.event_id) as total_comments,
    
    -- Days until event
    DATEDIFF(e.start_time, NOW()) as days_until_event

FROM Events e
LEFT JOIN Users u ON e.organizer_id = u.id
LEFT JOIN Categories c ON e.category_id = c.category_id
LEFT JOIN Venues v ON e.venue_id = v.venue_id
LEFT JOIN TicketTypes tt ON e.event_id = tt.event_id
LEFT JOIN Bookings b ON tt.ticket_type_id = b.ticket_type_id AND b.status = 'VALID'
GROUP BY e.event_id, e.title, e.status, c.name, u.name, v.capacity, e.start_time;

-- 2. USER GROWTH ANALYTICS
-- Monthly user registration trends by role

CREATE OR REPLACE VIEW View_Monthly_User_Growth AS
SELECT 
    DATE_FORMAT(created_at, '%Y-%m') as month,
    role,
    COUNT(*) as new_users,
    SUM(COUNT(*)) OVER (PARTITION BY role ORDER BY DATE_FORMAT(created_at, '%Y-%m')) as cumulative_users
FROM Users
GROUP BY DATE_FORMAT(created_at, '%Y-%m'), role
ORDER BY month DESC;

-- 3. REVENUE FORECASTING
-- Predicted revenue based on current sales velocity (Linear Projection)

DELIMITER //

CREATE PROCEDURE Analyze_Revenue_Forecast(IN p_event_id INT)
BEGIN
    DECLARE v_days_selling INT;
    DECLARE v_total_revenue DECIMAL(10,2);
    DECLARE v_daily_avg DECIMAL(10,2);
    DECLARE v_days_remaining INT;
    DECLARE v_predicted_revenue DECIMAL(10,2);
    
    -- Calculate details
    SELECT 
        DATEDIFF(NOW(), MIN(b.created_at)),
        SUM(tt.price)
    INTO v_days_selling, v_total_revenue
    FROM Bookings b
    JOIN TicketTypes tt ON b.ticket_type_id = tt.ticket_type_id
    WHERE b.event_id = p_event_id;
    
    -- Avoid division by zero
    IF v_days_selling = 0 THEN SET v_days_selling = 1; END IF;
    
    SET v_daily_avg = v_total_revenue / v_days_selling;
    
    SELECT DATEDIFF(start_time, NOW()) INTO v_days_remaining
    FROM Events WHERE event_id = p_event_id;
    
    IF v_days_remaining < 0 THEN SET v_days_remaining = 0; END IF;
    
    SET v_predicted_revenue = v_total_revenue + (v_daily_avg * v_days_remaining);
    
    -- Return Analysis
    SELECT 
        p_event_id as event_id,
        v_total_revenue as current_revenue,
        v_days_selling as days_selling,
        v_daily_avg as daily_velocity,
        v_days_remaining as days_remaining,
        v_predicted_revenue as forecasted_final_revenue;
        
END //

DELIMITER ;

-- 4. SPONSORSHIP ROI ANALYSIS
-- Analyze potential exposure for sponsors based on ticket sales and social reach

CREATE OR REPLACE VIEW View_Sponsor_Exposure AS
SELECT 
    s.sponsor_id,
    s.name as sponsor_name,
    e.title as event_title,
    s.tier,
    s.contribution_amount,
    
    -- Direct Reach (Attendees)
    (SELECT COUNT(*) FROM Bookings WHERE event_id = e.event_id AND status = 'VALID') as confirmed_attendees,
    
    -- Digital Reach (Social Interactions)
    (SELECT COUNT(*) FROM EventPosts WHERE event_id = e.event_id) as total_posts,
    (SELECT COUNT(*) FROM PostLikes pl JOIN EventPosts ep ON pl.post_id = ep.post_id WHERE ep.event_id = e.event_id) as social_likes,
    
    -- Cost Per Attendee (CPA)
    ROUND(s.contribution_amount / NULLIF((SELECT COUNT(*) FROM Bookings WHERE event_id = e.event_id), 0), 2) as cost_per_attendee

FROM Sponsors s
JOIN Events e ON s.event_id = e.event_id
WHERE s.status = 'APPROVED';

-- 5. CHURN ANALYSIS CANDIDATES
-- Identify users who haven't booked anything in 6 months

CREATE OR REPLACE VIEW View_Inactive_Users AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.last_login_at, -- Assuming column exists or we use max booking date
    MAX(b.created_at) as last_booking_date,
    DATEDIFF(NOW(), MAX(b.created_at)) as days_since_last_booking
FROM Users u
LEFT JOIN Bookings b ON u.id = b.user_id
WHERE u.role = 'attendee'
GROUP BY u.id
HAVING days_since_last_booking > 180 OR last_booking_date IS NULL;

-- 6. TICKET SALES HEATMAP (Hourly)
-- Identify peak booking times to optimize marketing emails

CREATE OR REPLACE VIEW View_Sales_Heatmap AS
SELECT 
    DAYNAME(created_at) as day_of_week,
    HOUR(created_at) as hour_of_day,
    COUNT(*) as tickets_sold
FROM Bookings
GROUP BY day_of_week, hour_of_day
ORDER BY tickets_sold DESC;

-- 7. TOP ORGANIZER LEADERBOARD
-- Ranks organizers by revenue and ratings (simulated)

CREATE OR REPLACE VIEW View_Organizer_Leaderboard AS
SELECT 
    u.name as organizer_name,
    COUNT(DISTINCT e.event_id) as events_hosted,
    COUNT(b.booking_id) as total_tickets_sold,
    SUM(tt.price) as total_revenue_generated
FROM Users u
JOIN Events e ON u.id = e.organizer_id
JOIN TicketTypes tt ON e.event_id = tt.event_id
JOIN Bookings b ON tt.ticket_type_id = b.ticket_type_id
WHERE u.role = 'organizer' AND b.status = 'VALID'
GROUP BY u.id
ORDER BY total_revenue_generated DESC;

-- 8. FRAUD DETECTION FLAGS
-- Identify suspicious booking patterns (same user, multiple bookings, short timeframe)

CREATE OR REPLACE VIEW View_Suspicious_Activity AS
SELECT 
    user_id,
    event_id,
    COUNT(*) as booking_count,
    MAX(created_at) as last_attempt,
    MIN(created_at) as first_attempt,
    TIMESTAMPDIFF(MINUTE, MIN(created_at), MAX(created_at)) as duration_minutes
FROM Bookings
GROUP BY user_id, event_id
HAVING booking_count > 5 AND duration_minutes < 10;
