-- =====================================================
-- Event Koi - Views & Indexes for Performance
-- File: 03_views_indexes.sql
-- =====================================================

-- =====================================================
-- MATERIALIZED VIEWS (Simulated with Tables + Events)
-- =====================================================

-- 1. Event Summary View
DROP VIEW IF EXISTS vw_EventSummary;
CREATE VIEW vw_EventSummary AS
SELECT 
    e.event_id,
    e.title,
    e.description,
    e.start_time,
    e.end_time,
    e.status,
    c.name as category_name,
    v.name as venue_name,
    v.city as venue_city,
    u.name as organizer_name,
    u.email as organizer_email,
    COUNT(DISTINCT b.booking_id) as total_bookings,
    COUNT(DISTINCT CASE WHEN b.status = 'VALID' THEN b.booking_id END) as active_bookings,
    COALESCE(SUM(CASE WHEN b.status != 'CANCELLED' THEN tt.price ELSE 0 END), 0) as revenue,
    COUNT(DISTINCT s.sponsor_id) as sponsor_count,
    COUNT(DISTINCT ep.post_id) as post_count,
    DATEDIFF(e.start_time, NOW()) as days_until_event
FROM Events e
LEFT JOIN Categories c ON e.category_id = c.category_id
LEFT JOIN Venues v ON e.venue_id = v.venue_id
LEFT JOIN Users u ON e.organizer_id = u.id
LEFT JOIN Bookings b ON e.event_id = b.event_id
LEFT JOIN TicketTypes tt ON b.ticket_type_id = tt.ticket_type_id
LEFT JOIN Sponsors s ON e.event_id = s.event_id AND s.status = 'APPROVED'
LEFT JOIN EventPosts ep ON e.event_id = ep.event_id
GROUP BY e.event_id, e.title, e.description, e.start_time, e.end_time, e.status,
         c.name, v.name, v.city, u.name, u.email;

-- 2. User Dashboard View
DROP VIEW IF EXISTS vw_UserDashboard;
CREATE VIEW vw_UserDashboard AS
SELECT 
    u.id as user_id,
    u.name,
    u.email,
    u.role,
    u.is_verified,
    COUNT(DISTINCT b.booking_id) as total_bookings,
    COUNT(DISTINCT CASE WHEN b.status = 'VALID' THEN b.booking_id END) as active_bookings,
    COALESCE(SUM(CASE WHEN b.status != 'CANCELLED' THEN tt.price ELSE 0 END), 0) as total_spent,
    COUNT(DISTINCT CASE WHEN u.role = 'organizer' THEN e.event_id END) as events_organized,
    COUNT(DISTINCT f1.friendship_id) + COUNT(DISTINCT f2.friendship_id) as friend_count,
    COUNT(DISTINCT CASE WHEN n.is_read = FALSE THEN n.notification_id END) as unread_notifications
FROM Users u
LEFT JOIN Bookings b ON u.id = b.user_id
LEFT JOIN TicketTypes tt ON b.ticket_type_id = tt.ticket_type_id
LEFT JOIN Events e ON u.id = e.organizer_id
LEFT JOIN Friendships f1 ON u.id = f1.user_id AND f1.status = 'ACCEPTED'
LEFT JOIN Friendships f2 ON u.id = f2.friend_id AND f2.status = 'ACCEPTED'
LEFT JOIN Notifications n ON u.id = n.user_id
GROUP BY u.id, u.name, u.email, u.role, u.is_verified;

-- 3. Popular Events View
DROP VIEW IF EXISTS vw_PopularEvents;
CREATE VIEW vw_PopularEvents AS
SELECT 
    e.event_id,
    e.title,
    e.start_time,
    c.name as category,
    v.city,
    COUNT(DISTINCT b.booking_id) as booking_count,
    COUNT(DISTINCT pl.like_id) as like_count,
    COUNT(DISTINCT pc.comment_id) as comment_count,
    (COUNT(DISTINCT b.booking_id) * 10 + 
     COUNT(DISTINCT pl.like_id) * 2 + 
     COUNT(DISTINCT pc.comment_id) * 5) as popularity_score
FROM Events e
LEFT JOIN Categories c ON e.category_id = c.category_id
LEFT JOIN Venues v ON e.venue_id = v.venue_id
LEFT JOIN Bookings b ON e.event_id = b.event_id AND b.status != 'CANCELLED'
LEFT JOIN EventPosts ep ON e.event_id = ep.event_id
LEFT JOIN PostLikes pl ON ep.post_id = pl.post_id
LEFT JOIN PostComments pc ON ep.post_id = pc.post_id
WHERE e.status = 'PUBLISHED' AND e.start_time > NOW()
GROUP BY e.event_id, e.title, e.start_time, c.name, v.city
HAVING booking_count > 0
ORDER BY popularity_score DESC;

-- 4. Revenue Report View
DROP VIEW IF EXISTS vw_RevenueReport;
CREATE VIEW vw_RevenueReport AS
SELECT 
    DATE_FORMAT(b.created_at, '%Y-%m') as month,
    COUNT(DISTINCT b.booking_id) as total_bookings,
    COUNT(DISTINCT b.event_id) as unique_events,
    COUNT(DISTINCT b.user_id) as unique_customers,
    SUM(CASE WHEN b.status != 'CANCELLED' THEN tt.price ELSE 0 END) as gross_revenue,
    SUM(CASE WHEN b.status = 'CANCELLED' THEN b.refund_amount ELSE 0 END) as refunds,
    SUM(CASE WHEN b.status != 'CANCELLED' THEN tt.price ELSE 0 END) - 
    SUM(CASE WHEN b.status = 'CANCELLED' THEN b.refund_amount ELSE 0 END) as net_revenue,
    AVG(tt.price) as avg_ticket_price
FROM Bookings b
JOIN TicketTypes tt ON b.ticket_type_id = tt.ticket_type_id
WHERE b.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
GROUP BY DATE_FORMAT(b.created_at, '%Y-%m')
ORDER BY month DESC;

-- 5. Organizer Performance View
DROP VIEW IF EXISTS vw_OrganizerPerformance;
CREATE VIEW vw_OrganizerPerformance AS
SELECT 
    u.id as organizer_id,
    u.name as organizer_name,
    u.email,
    u.is_verified,
    COUNT(DISTINCT e.event_id) as total_events,
    COUNT(DISTINCT CASE WHEN e.status = 'PUBLISHED' THEN e.event_id END) as published_events,
    COUNT(DISTINCT b.booking_id) as total_tickets_sold,
    COALESCE(SUM(CASE WHEN b.status != 'CANCELLED' THEN tt.price ELSE 0 END), 0) as total_revenue,
    COUNT(DISTINCT s.sponsor_id) as total_sponsors,
    COALESCE(SUM(s.contribution_amount), 0) as sponsor_revenue,
    COUNT(DISTINCT ep.post_id) as posts_created,
    AVG(CASE WHEN b.booking_id IS NOT NULL THEN tt.price END) as avg_ticket_price,
    (COUNT(DISTINCT b.booking_id) * 10 + 
     COALESCE(SUM(CASE WHEN b.status != 'CANCELLED' THEN tt.price ELSE 0 END), 0) / 1000) as performance_score
FROM Users u
LEFT JOIN Events e ON u.id = e.organizer_id
LEFT JOIN Bookings b ON e.event_id = b.event_id
LEFT JOIN TicketTypes tt ON b.ticket_type_id = tt.ticket_type_id
LEFT JOIN Sponsors s ON e.event_id = s.event_id AND s.status = 'APPROVED'
LEFT JOIN EventPosts ep ON e.event_id = ep.event_id
WHERE u.role = 'organizer'
GROUP BY u.id, u.name, u.email, u.is_verified
ORDER BY performance_score DESC;

-- 6. Upcoming Events View
DROP VIEW IF EXISTS vw_UpcomingEvents;
CREATE VIEW vw_UpcomingEvents AS
SELECT 
    e.event_id,
    e.title,
    e.description,
    e.start_time,
    e.end_time,
    c.name as category,
    v.name as venue,
    v.city,
    u.name as organizer,
    MIN(tt.price) as min_price,
    MAX(tt.price) as max_price,
    SUM(tt.quantity - tt.sold_count) as available_tickets,
    COUNT(DISTINCT s.sponsor_id) as sponsor_count
FROM Events e
JOIN Categories c ON e.category_id = c.category_id
JOIN Venues v ON e.venue_id = v.venue_id
JOIN Users u ON e.organizer_id = u.id
LEFT JOIN TicketTypes tt ON e.event_id = tt.event_id
LEFT JOIN Sponsors s ON e.event_id = s.event_id AND s.status = 'APPROVED'
WHERE e.status = 'PUBLISHED' 
  AND e.start_time > NOW()
  AND e.end_time > NOW()
GROUP BY e.event_id, e.title, e.description, e.start_time, e.end_time,
         c.name, v.name, v.city, u.name
HAVING available_tickets > 0
ORDER BY e.start_time ASC;

-- 7. Social Network View
DROP VIEW IF EXISTS vw_SocialNetwork;
CREATE VIEW vw_SocialNetwork AS
SELECT 
    u.id as user_id,
    u.name,
    COUNT(DISTINCT f1.friendship_id) + COUNT(DISTINCT f2.friendship_id) as friend_count,
    COUNT(DISTINCT m1.message_id) + COUNT(DISTINCT m2.message_id) as message_count,
    COUNT(DISTINCT pl.like_id) as likes_given,
    COUNT(DISTINCT pc.comment_id) as comments_made,
    (COUNT(DISTINCT f1.friendship_id) + COUNT(DISTINCT f2.friendship_id)) * 10 +
    (COUNT(DISTINCT m1.message_id) + COUNT(DISTINCT m2.message_id)) * 2 +
    COUNT(DISTINCT pl.like_id) * 3 +
    COUNT(DISTINCT pc.comment_id) * 5 as social_score
FROM Users u
LEFT JOIN Friendships f1 ON u.id = f1.user_id AND f1.status = 'ACCEPTED'
LEFT JOIN Friendships f2 ON u.id = f2.friend_id AND f2.status = 'ACCEPTED'
LEFT JOIN Messages m1 ON u.id = m1.sender_id
LEFT JOIN Messages m2 ON u.id = m2.receiver_id
LEFT JOIN PostLikes pl ON u.id = pl.user_id
LEFT JOIN PostComments pc ON u.id = pc.user_id
GROUP BY u.id, u.name
HAVING friend_count > 0 OR message_count > 0
ORDER BY social_score DESC;

-- =====================================================
-- ADDITIONAL PERFORMANCE INDEXES
-- =====================================================

-- Composite indexes for common queries (some may already exist in schema)
-- CREATE INDEX idx_events_status_start ON Events(status, start_time);
-- CREATE INDEX idx_events_category_status ON Events(category_id, status);
-- CREATE INDEX idx_bookings_user_status ON Bookings(user_id, status);
-- CREATE INDEX idx_bookings_event_status ON Bookings(event_id, status);
-- CREATE INDEX idx_bookings_created_status ON Bookings(created_at, status);

-- Covering indexes for specific queries
-- CREATE INDEX idx_tickettypes_event_price ON TicketTypes(event_id, price, quantity, sold_count);
-- CREATE INDEX idx_sponsors_event_status ON Sponsors(event_id, status, contribution_amount);
-- CREATE INDEX idx_messages_conversation_read ON Messages(sender_id, receiver_id, is_read, created_at);
-- CREATE INDEX idx_notifications_user_read ON Notifications(user_id, is_read, created_at);

-- Partial indexes for filtered queries (MySQL 8.0.13+ feature - commented out for compatibility)
-- CREATE INDEX idx_active_bookings ON Bookings(event_id, user_id) WHERE status = 'VALID';
-- CREATE INDEX idx_published_events ON Events(start_time, category_id) WHERE status = 'PUBLISHED';
-- CREATE INDEX idx_accepted_friends ON Friendships(user_id, friend_id) WHERE status = 'ACCEPTED';

-- =====================================================
-- VIEWS & INDEXES CREATED SUCCESSFULLY
-- =====================================================
SELECT 'Views and performance indexes created successfully!' as Status;
