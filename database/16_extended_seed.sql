-- ============================================================
-- 16_extended_seed.sql
-- Comprehensive seeding for all 43 tables including expansion tables
-- ============================================================
USE event_koi;
SET FOREIGN_KEY_CHECKS = 0;
-- 1. AdminUsers link (linking User ID 1 as SuperAdmin)
INSERT IGNORE INTO AdminUsers (user_id, role_id, department, status, last_login)
VALUES (1, 1, 'Core Team', 'ACTIVE', NOW());
-- 2. EventCategories (mapping existing events to categories)
INSERT IGNORE INTO EventCategories (event_id, category_id)
SELECT event_id,
    category_id
FROM Events
WHERE category_id IS NOT NULL
LIMIT 100;
-- 3. EventRevenue (generating revenue snapshots for historical events)
INSERT IGNORE INTO EventRevenue (
        event_id,
        ticket_revenue,
        sponsor_revenue,
        platform_fee,
        total_refunds,
        net_revenue
    )
SELECT event_id,
    50000.00,
    15000.00,
    2500.00,
    500.00,
    62000.00
FROM Events
LIMIT 30;
-- 4. Payments (mock successful transactions)
INSERT IGNORE INTO Payments (
        booking_id,
        user_id,
        event_id,
        amount,
        currency,
        payment_method,
        payment_status,
        transaction_id,
        payment_type,
        paid_at
    )
SELECT booking_id,
    user_id,
    event_id,
    1500.00,
    'BDT',
    'CARD',
    'COMPLETED',
    CONCAT('TXN-', UUID_SHORT()),
    'TICKET',
    NOW()
FROM Bookings
LIMIT 50;
-- 5. Tickets (issuing tickets for existing bookings)
INSERT IGNORE INTO Tickets (
        booking_id,
        event_id,
        user_id,
        ticket_type_id,
        ticket_number,
        qr_code,
        status
    )
SELECT booking_id,
    event_id,
    user_id,
    ticket_type_id,
    CONCAT('TKT-', UUID_SHORT()),
    'https://api.qrserver.com/v1/create-qr-code/?data=MOCK&size=200x200',
    'ACTIVE'
FROM Bookings
LIMIT 150;
-- 6. UserAchievements (rewarding our active users)
INSERT IGNORE INTO UserAchievements (
        user_id,
        achievement_type,
        title,
        description,
        badge_icon_url,
        points
    )
SELECT id,
    'ENGAGEMENT',
    'Early Adopter',
    'Joined Event Koi in the first month!',
    '⭐',
    100
FROM Users
LIMIT 20;
INSERT IGNORE INTO UserAchievements (
        user_id,
        achievement_type,
        title,
        description,
        badge_icon_url,
        points
    )
SELECT id,
    'BOOKING',
    'Event Enthusiast',
    'Booked 5+ events on the platform',
    '🎟️',
    500
FROM Users
LIMIT 10;
-- 7. UserPreferences (personalizing user feeds)
INSERT IGNORE INTO UserPreferences (
        user_id,
        theme_preference,
        currency_preference,
        email_notifications,
        push_notifications
    )
SELECT id,
    'dark',
    'BDT',
    1,
    1
FROM Users
LIMIT 50;
-- 8. SearchHistory (populating trending searches)
INSERT IGNORE INTO SearchHistory (
        user_id,
        search_query,
        search_type,
        results_count
    )
VALUES (1, 'Concerts Dhaka', 'Event', 12),
    (2, 'Tech Meetup', 'Event', 5),
    (3, 'Photography Workshop', 'Category', 3),
    (4, 'Banani Venues', 'Venue', 8),
    (NULL, 'Ekushey Book Fair', 'Event', 100);
-- 9. UserRecommendations (filling the discovery feed)
INSERT IGNORE INTO UserRecommendations (user_id, event_id, recommendation_score, reason)
SELECT u.id,
    e.event_id,
    95.00,
    'Matching Interests'
FROM Users u
    CROSS JOIN Events e
LIMIT 50;
-- 10. PlatformFees (tracking system earnings)
-- Linking to some payments
INSERT IGNORE INTO PlatformFees (event_id, payment_id, total_fees, percentage_fee)
SELECT event_id,
    payment_id,
    150.00,
    5.00
FROM Payments
LIMIT 50;
-- 11. UserAnalytics (historical engagement)
INSERT IGNORE INTO UserAnalytics (
        user_id,
        snapshot_date,
        events_booked,
        amount_spent,
        posts_made
    )
SELECT id,
    DATE_SUB(CURDATE(), INTERVAL 7 DAY),
    2,
    3000.00,
    5
FROM Users
LIMIT 20;
-- 12. UserModeration (some sample moderation history)
INSERT IGNORE INTO UserModeration (
        user_id,
        warning_level,
        is_suspended,
        suspension_reason
    )
SELECT id,
    1,
    0,
    'Keep it friendly on the boards'
FROM Users
WHERE id > 10
LIMIT 3;
-- 13. SystemLogs & AdminAuditLog (making the admin tool look used)
INSERT IGNORE INTO SystemLogs (log_type, message, status_code, response_time_ms)
VALUES (
        'Info',
        'Platform wide migration completed',
        200,
        120
    ),
    (
        'Warning',
        'Performance threshold exceeded for /api/events',
        200,
        650
    );
INSERT IGNORE INTO AdminAuditLog (
        admin_user_id,
        action_type,
        entity_type,
        entity_id,
        description
    )
VALUES (
        1,
        'UPDATE',
        'Events',
        26,
        'Event status changed to PUBLISHED'
    );
-- 14. EventTags (adding metadata to events)
INSERT IGNORE INTO EventTags (event_id, tag_name)
SELECT event_id,
    'Trending'
FROM Events
LIMIT 10;
INSERT IGNORE INTO EventTags (event_id, tag_name)
SELECT event_id,
    'Limited Space'
FROM Events
WHERE event_id > 30
LIMIT 10;
-- 15. EventWaitlist (some popular sold out events)
INSERT IGNORE INTO EventWaitlist (event_id, user_id, position_in_queue)
SELECT event_id,
    id,
    1
FROM Events
    CROSS JOIN Users
WHERE event_id IN (26, 27)
LIMIT 5;
SET FOREIGN_KEY_CHECKS = 1;