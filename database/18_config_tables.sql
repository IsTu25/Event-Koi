-- =====================================================
-- 18_config_tables.sql
-- Configuration tables to replace hardcoded values
-- =====================================================
-- 1. PlatformConfig: Global settings (fees, rates, limits)
CREATE TABLE IF NOT EXISTS PlatformConfig (
    config_id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value VARCHAR(500) NOT NULL,
    value_type ENUM('STRING', 'NUMBER', 'BOOLEAN') DEFAULT 'STRING',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
INSERT INTO PlatformConfig (
        config_key,
        config_value,
        value_type,
        description
    )
VALUES (
        'PLATFORM_FEE_PERCENT',
        '0.05',
        'NUMBER',
        'Platform commission on ticket sales (5%)'
    ),
    (
        'SPONSOR_FEE_PERCENT',
        '0.10',
        'NUMBER',
        'Platform commission on sponsorships (10%)'
    ),
    (
        'MIN_EVENT_PRICE',
        '0',
        'NUMBER',
        'Minimum allowed ticket price'
    ),
    (
        'MAX_ATTENDEES_PER_EVENT',
        '10000',
        'NUMBER',
        'Maximum attendees per event'
    ),
    (
        'DEFAULT_CURRENCY',
        'BDT',
        'STRING',
        'Default platform currency'
    ),
    (
        'DEFAULT_LANGUAGE',
        'en',
        'STRING',
        'Default platform language'
    ),
    (
        'REMINDER_HOURS_BEFORE',
        '24',
        'NUMBER',
        'Hours before event to send reminder'
    ),
    (
        'ANALYTICS_DEFAULT_DAYS',
        '30',
        'NUMBER',
        'Default analytics lookback period in days'
    ),
    (
        'RECOMMENDATION_WINDOW_DAYS',
        '30',
        'NUMBER',
        'Days to look back for recommendations'
    );
-- 2. RefundPolicy: Refund rules (days before event → percentage)
CREATE TABLE IF NOT EXISTS RefundPolicy (
    policy_id INT AUTO_INCREMENT PRIMARY KEY,
    min_days_before INT NOT NULL,
    refund_percentage INT NOT NULL,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO RefundPolicy (min_days_before, refund_percentage, description)
VALUES (
        7,
        100,
        'Full refund: Cancelled 7+ days before event'
    ),
    (
        2,
        50,
        'Half refund: Cancelled 2-7 days before event'
    ),
    (
        0,
        0,
        'No refund: Cancelled less than 48 hours before event'
    );
-- 3. NotificationTemplate: Notification types and message templates
CREATE TABLE IF NOT EXISTS NotificationTemplate (
    template_id INT AUTO_INCREMENT PRIMARY KEY,
    notification_type VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    template_body TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO NotificationTemplate (notification_type, title, template_body)
VALUES (
        'EVENT_UPDATE',
        'Event Update',
        'Your event has been updated.'
    ),
    (
        'EVENT_REMINDER',
        'Event Reminder',
        'Your event "{event_title}" starts in {hours} hours!'
    ),
    (
        'BOOKING_CONFIRMATION',
        'Booking Confirmed',
        'Your booking for "{event_title}" is confirmed. Ticket: {ticket_number}'
    ),
    (
        'NEW_EVENT',
        'New Event',
        'A new event matching your interests: "{event_title}"'
    ),
    (
        'TICKET_CANCELLED',
        'Ticket Cancelled',
        'Your ticket for "{event_title}" has been cancelled. Refund ({refund_percent}%): ৳{refund_amount}'
    ),
    (
        'REFUND_PROCESSED',
        'Refund Processed',
        'Your refund of ৳{refund_amount} for "{event_title}" has been processed.'
    ),
    (
        'MODERATION_BAN',
        'Account Banned',
        '🚫 Your account has been permanently banned.'
    ),
    (
        'MODERATION_SUSPEND',
        'Account Suspended',
        '🔒 Your account has been temporarily suspended.'
    ),
    (
        'MODERATION_WARN',
        'Account Warning',
        '⚠️ A warning has been issued for your account conduct.'
    ),
    (
        'MODERATION_UNBAN',
        'Account Unbanned',
        '✅ Your account has been unbanned.'
    ),
    (
        'MODERATION_UNSUSPEND',
        'Account Unsuspended',
        '✅ Your account suspension has been lifted.'
    );
-- 4. PaginationConfig: Route-specific pagination defaults
CREATE TABLE IF NOT EXISTS PaginationConfig (
    pagination_id INT AUTO_INCREMENT PRIMARY KEY,
    route_name VARCHAR(100) NOT NULL UNIQUE,
    default_limit INT NOT NULL DEFAULT 20,
    max_limit INT NOT NULL DEFAULT 100,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO PaginationConfig (
        route_name,
        default_limit,
        max_limit,
        description
    )
VALUES ('reviews', 20, 100, 'Event reviews listing'),
    (
        'revenue_admin',
        50,
        200,
        'Admin revenue dashboard'
    ),
    ('analytics', 30, 100, 'Analytics data'),
    ('tags', 30, 100, 'Event tags'),
    (
        'recommendations',
        10,
        50,
        'User recommendations'
    ),
    ('search_results', 20, 100, 'Search results'),
    ('bookings', 20, 100, 'Bookings listing'),
    ('events', 20, 100, 'Events listing'),
    ('users_admin', 50, 200, 'Admin users listing'),
    ('notifications', 20, 50, 'User notifications');