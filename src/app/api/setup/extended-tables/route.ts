import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * GET /api/setup/extended-tables
 *
 * Creates all extended tables that are NOT part of the original schema
 * but are referenced in the full SELECT list:
 *
 *   Tickets, UserProfiles, UserFollowing, UserAchievements,
 *   UserPreferences, Payments, EventRevenue, Refunds, PlatformFees,
 *   SponsorshipPackages, EventSponsorships, ReportedContent,
 *   AdminAuditLog, UserModeration, RoleRequests, SystemLogs,
 *   EventSchedule, EventWaitlist, EventReviews, DailyMetrics,
 *   EventAnalytics, UserAnalytics, SearchHistory
 */

const TABLES: { name: string; sql: string }[] = [
    // ────────────────────────────────────────────────────────────
    // 1. TICKETS
    // ────────────────────────────────────────────────────────────
    {
        name: 'Tickets',
        sql: `
        CREATE TABLE IF NOT EXISTS Tickets (
            ticket_id      INT AUTO_INCREMENT PRIMARY KEY,
            booking_id     INT NOT NULL,
            event_id       INT NOT NULL,
            user_id        INT NOT NULL,
            ticket_type_id INT NOT NULL,
            ticket_number  VARCHAR(100) UNIQUE NOT NULL,
            qr_code        VARCHAR(500),
            status         ENUM('ACTIVE','USED','CANCELLED','EXPIRED') DEFAULT 'ACTIVE',
            issued_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            checked_in_at  TIMESTAMP NULL,
            expires_at     DATETIME NULL,
            FOREIGN KEY (booking_id)     REFERENCES Bookings(booking_id)         ON DELETE CASCADE,
            FOREIGN KEY (event_id)       REFERENCES Events(event_id)             ON DELETE CASCADE,
            FOREIGN KEY (user_id)        REFERENCES Users(id)                    ON DELETE CASCADE,
            FOREIGN KEY (ticket_type_id) REFERENCES TicketTypes(ticket_type_id)  ON DELETE CASCADE,
            INDEX idx_booking    (booking_id),
            INDEX idx_event      (event_id),
            INDEX idx_user       (user_id),
            INDEX idx_status     (status),
            INDEX idx_ticket_num (ticket_number)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `,
    },

    // ────────────────────────────────────────────────────────────
    // 2. USER PROFILES
    // ────────────────────────────────────────────────────────────
    {
        name: 'UserProfiles',
        sql: `
        CREATE TABLE IF NOT EXISTS UserProfiles (
            profile_id    INT AUTO_INCREMENT PRIMARY KEY,
            user_id       INT NOT NULL UNIQUE,
            bio           TEXT,
            website       VARCHAR(500),
            location      VARCHAR(255),
            date_of_birth DATE,
            gender        ENUM('Male','Female','Other','Prefer not to say'),
            avatar_url    VARCHAR(500),
            cover_image   VARCHAR(500),
            social_links  JSON,
            interests     JSON,
            is_public     BOOLEAN DEFAULT TRUE,
            created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
            INDEX idx_user   (user_id),
            INDEX idx_public (is_public)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `,
    },

    // ────────────────────────────────────────────────────────────
    // 3. USER FOLLOWING
    // ────────────────────────────────────────────────────────────
    {
        name: 'UserFollowing',
        sql: `
        CREATE TABLE IF NOT EXISTS UserFollowing (
            following_id     INT AUTO_INCREMENT PRIMARY KEY,
            follower_id      INT NOT NULL,
            following_id_ref INT NOT NULL,
            created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (follower_id)      REFERENCES Users(id) ON DELETE CASCADE,
            FOREIGN KEY (following_id_ref) REFERENCES Users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_follow (follower_id, following_id_ref),
            INDEX idx_follower  (follower_id),
            INDEX idx_following (following_id_ref)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `,
    },

    // ────────────────────────────────────────────────────────────
    // 4. USER ACHIEVEMENTS
    // ────────────────────────────────────────────────────────────
    {
        name: 'UserAchievements',
        sql: `
        CREATE TABLE IF NOT EXISTS UserAchievements (
            achievement_id   INT AUTO_INCREMENT PRIMARY KEY,
            user_id          INT NOT NULL,
            title            VARCHAR(255) NOT NULL,
            description      TEXT,
            badge_icon       VARCHAR(500),
            achievement_type ENUM(
                'FIRST_BOOKING','EVENT_CREATOR','SOCIAL_BUTTERFLY',
                'TOP_SPENDER','LOYAL_ATTENDEE','SUPER_HOST',
                'REVIEW_MASTER','FRIEND_CONNECTOR','MILESTONE'
            ) NOT NULL,
            points_awarded   INT DEFAULT 0,
            earned_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
            INDEX idx_user      (user_id),
            INDEX idx_type      (achievement_type),
            INDEX idx_earned_at (earned_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `,
    },

    // ────────────────────────────────────────────────────────────
    // 5. USER PREFERENCES
    // ────────────────────────────────────────────────────────────
    {
        name: 'UserPreferences',
        sql: `
        CREATE TABLE IF NOT EXISTS UserPreferences (
            pref_id                 INT AUTO_INCREMENT PRIMARY KEY,
            user_id                 INT NOT NULL UNIQUE,
            email_notifications     BOOLEAN DEFAULT TRUE,
            push_notifications      BOOLEAN DEFAULT TRUE,
            sms_notifications       BOOLEAN DEFAULT FALSE,
            notify_new_events       BOOLEAN DEFAULT TRUE,
            notify_event_reminders  BOOLEAN DEFAULT TRUE,
            notify_friend_requests  BOOLEAN DEFAULT TRUE,
            notify_messages         BOOLEAN DEFAULT TRUE,
            notify_promotions       BOOLEAN DEFAULT FALSE,
            preferred_categories    JSON,
            preferred_location      VARCHAR(255),
            preferred_radius_km     INT DEFAULT 50,
            language                VARCHAR(10)  DEFAULT 'en',
            timezone                VARCHAR(100) DEFAULT 'UTC',
            theme                   ENUM('light','dark','system') DEFAULT 'system',
            currency                VARCHAR(10)  DEFAULT 'BDT',
            created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
            INDEX idx_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `,
    },

    // ────────────────────────────────────────────────────────────
    // 6. PAYMENTS
    // ────────────────────────────────────────────────────────────
    {
        name: 'Payments',
        sql: `
        CREATE TABLE IF NOT EXISTS Payments (
            payment_id       INT AUTO_INCREMENT PRIMARY KEY,
            booking_id       INT,
            user_id          INT NOT NULL,
            event_id         INT,
            amount           DECIMAL(10,2) NOT NULL,
            currency         VARCHAR(10)   DEFAULT 'BDT',
            payment_method   ENUM(
                'CARD','BKASH','NAGAD','ROCKET',
                'BANK_TRANSFER','CASH','STRIPE','PAYPAL','OTHER'
            ) DEFAULT 'CARD',
            payment_status   ENUM('PENDING','COMPLETED','FAILED','REFUNDED','CANCELLED') DEFAULT 'PENDING',
            transaction_id   VARCHAR(255),
            gateway_response JSON,
            payment_type     ENUM('TICKET','LISTING_FEE','SPONSORSHIP') DEFAULT 'TICKET',
            paid_at          TIMESTAMP NULL,
            created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id) ON DELETE SET NULL,
            FOREIGN KEY (user_id)    REFERENCES Users(id)            ON DELETE CASCADE,
            FOREIGN KEY (event_id)   REFERENCES Events(event_id)     ON DELETE SET NULL,
            INDEX idx_booking    (booking_id),
            INDEX idx_user       (user_id),
            INDEX idx_event      (event_id),
            INDEX idx_status     (payment_status),
            INDEX idx_type       (payment_type),
            INDEX idx_created_at (created_at),
            UNIQUE KEY unique_transaction (transaction_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `,
    },

    // ────────────────────────────────────────────────────────────
    // 7. EVENT REVENUE
    // ────────────────────────────────────────────────────────────
    {
        name: 'EventRevenue',
        sql: `
        CREATE TABLE IF NOT EXISTS EventRevenue (
            revenue_id         INT AUTO_INCREMENT PRIMARY KEY,
            event_id           INT NOT NULL UNIQUE,
            ticket_revenue     DECIMAL(12,2) DEFAULT 0.00,
            sponsor_revenue    DECIMAL(12,2) DEFAULT 0.00,
            listing_fee_paid   DECIMAL(10,2) DEFAULT 0.00,
            total_refunds      DECIMAL(12,2) DEFAULT 0.00,
            platform_fee       DECIMAL(12,2) DEFAULT 0.00,
            net_revenue        DECIMAL(12,2) DEFAULT 0.00,
            currency           VARCHAR(10)   DEFAULT 'BDT',
            last_calculated_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            created_at         TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (event_id) REFERENCES Events(event_id) ON DELETE CASCADE,
            INDEX idx_event (event_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `,
    },

    // ────────────────────────────────────────────────────────────
    // 8. REFUNDS
    // ────────────────────────────────────────────────────────────
    {
        name: 'Refunds',
        sql: `
        CREATE TABLE IF NOT EXISTS Refunds (
            refund_id        INT AUTO_INCREMENT PRIMARY KEY,
            booking_id       INT NOT NULL,
            payment_id       INT,
            user_id          INT NOT NULL,
            amount           DECIMAL(10,2) NOT NULL,
            reason           TEXT,
            status           ENUM('REQUESTED','PROCESSING','COMPLETED','REJECTED') DEFAULT 'REQUESTED',
            reviewed_by      INT,
            reviewed_at      TIMESTAMP NULL,
            processed_at     TIMESTAMP NULL,
            rejection_reason TEXT,
            created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id)  REFERENCES Bookings(booking_id) ON DELETE CASCADE,
            FOREIGN KEY (payment_id)  REFERENCES Payments(payment_id) ON DELETE SET NULL,
            FOREIGN KEY (user_id)     REFERENCES Users(id)            ON DELETE CASCADE,
            FOREIGN KEY (reviewed_by) REFERENCES Users(id)            ON DELETE SET NULL,
            INDEX idx_booking    (booking_id),
            INDEX idx_user       (user_id),
            INDEX idx_status     (status),
            INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `,
    },

    // ────────────────────────────────────────────────────────────
    // 9. PLATFORM FEES
    // ────────────────────────────────────────────────────────────
    {
        name: 'PlatformFees',
        sql: `
        CREATE TABLE IF NOT EXISTS PlatformFees (
            fee_id         INT AUTO_INCREMENT PRIMARY KEY,
            fee_type       ENUM('TICKET_PERCENTAGE','LISTING_FLAT','SPONSORSHIP_PERCENTAGE') NOT NULL,
            percentage     DECIMAL(5,2) DEFAULT 0.00,
            flat_amount    DECIMAL(10,2) DEFAULT 0.00,
            event_id       INT,
            payment_id     INT,
            applied_amount DECIMAL(10,2) DEFAULT 0.00,
            description    VARCHAR(500),
            is_active      BOOLEAN DEFAULT TRUE,
            effective_from DATE,
            effective_to   DATE,
            created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (event_id)   REFERENCES Events(event_id)     ON DELETE SET NULL,
            FOREIGN KEY (payment_id) REFERENCES Payments(payment_id) ON DELETE SET NULL,
            INDEX idx_fee_type  (fee_type),
            INDEX idx_event     (event_id),
            INDEX idx_is_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `,
    },

    // ────────────────────────────────────────────────────────────
    // 10. SPONSORSHIP PACKAGES
    // ────────────────────────────────────────────────────────────
    {
        name: 'SponsorshipPackages',
        sql: `
        CREATE TABLE IF NOT EXISTS SponsorshipPackages (
            package_id  INT AUTO_INCREMENT PRIMARY KEY,
            event_id    INT NOT NULL,
            name        VARCHAR(255) NOT NULL,
            tier        ENUM('Partner','Bronze','Silver','Gold','Platinum') DEFAULT 'Partner',
            price       DECIMAL(10,2) NOT NULL,
            benefits    JSON,
            max_slots   INT     DEFAULT 1,
            slots_taken INT     DEFAULT 0,
            is_active   BOOLEAN DEFAULT TRUE,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (event_id) REFERENCES Events(event_id) ON DELETE CASCADE,
            INDEX idx_event  (event_id),
            INDEX idx_tier   (tier),
            INDEX idx_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `,
    },

    // ────────────────────────────────────────────────────────────
    // 11. EVENT SPONSORSHIPS
    // ────────────────────────────────────────────────────────────
    {
        name: 'EventSponsorships',
        sql: `
        CREATE TABLE IF NOT EXISTS EventSponsorships (
            sponsorship_id INT AUTO_INCREMENT PRIMARY KEY,
            event_id       INT NOT NULL,
            sponsor_id     INT NOT NULL,
            package_id     INT,
            amount_paid    DECIMAL(10,2) DEFAULT 0.00,
            payment_id     INT,
            status         ENUM('PENDING','CONFIRMED','CANCELLED','REJECTED') DEFAULT 'PENDING',
            contract_url   VARCHAR(500),
            notes          TEXT,
            approved_by    INT,
            approved_at    TIMESTAMP NULL,
            created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (event_id)    REFERENCES Events(event_id)                ON DELETE CASCADE,
            FOREIGN KEY (sponsor_id)  REFERENCES Sponsors(sponsor_id)            ON DELETE CASCADE,
            FOREIGN KEY (package_id)  REFERENCES SponsorshipPackages(package_id) ON DELETE SET NULL,
            FOREIGN KEY (payment_id)  REFERENCES Payments(payment_id)            ON DELETE SET NULL,
            FOREIGN KEY (approved_by) REFERENCES Users(id)                       ON DELETE SET NULL,
            INDEX idx_event   (event_id),
            INDEX idx_sponsor (sponsor_id),
            INDEX idx_status  (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `,
    },

    // ────────────────────────────────────────────────────────────
    // 12. REPORTED CONTENT
    // ────────────────────────────────────────────────────────────
    {
        name: 'ReportedContent',
        sql: `
        CREATE TABLE IF NOT EXISTS ReportedContent (
            report_id       INT AUTO_INCREMENT PRIMARY KEY,
            reporter_id     INT NOT NULL,
            content_type    ENUM('EVENT','POST','USER','COMMENT','MESSAGE','REVIEW') NOT NULL,
            content_id      INT NOT NULL,
            reason          ENUM(
                'SPAM','INAPPROPRIATE','MISLEADING',
                'VIOLENCE','HARASSMENT','OTHER'
            ) NOT NULL,
            description     TEXT,
            status          ENUM('PENDING','UNDER_REVIEW','RESOLVED','DISMISSED') DEFAULT 'PENDING',
            reviewed_by     INT,
            reviewed_at     TIMESTAMP NULL,
            resolution_note TEXT,
            created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (reporter_id) REFERENCES Users(id) ON DELETE CASCADE,
            FOREIGN KEY (reviewed_by) REFERENCES Users(id) ON DELETE SET NULL,
            INDEX idx_reporter     (reporter_id),
            INDEX idx_content_type (content_type),
            INDEX idx_content_id   (content_id),
            INDEX idx_status       (status),
            INDEX idx_created_at   (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `,
    },

    // ────────────────────────────────────────────────────────────
    // 13. ADMIN AUDIT LOG
    // ────────────────────────────────────────────────────────────
    {
        name: 'AdminAuditLog',
        sql: `
        CREATE TABLE IF NOT EXISTS AdminAuditLog (
            log_id      INT AUTO_INCREMENT PRIMARY KEY,
            admin_id    INT NOT NULL,
            action      VARCHAR(255) NOT NULL,
            entity_type VARCHAR(100),
            entity_id   INT,
            old_value   JSON,
            new_value   JSON,
            ip_address  VARCHAR(45),
            user_agent  TEXT,
            notes       TEXT,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (admin_id) REFERENCES Users(id) ON DELETE CASCADE,
            INDEX idx_admin       (admin_id),
            INDEX idx_entity_type (entity_type),
            INDEX idx_entity_id   (entity_id),
            INDEX idx_action      (action),
            INDEX idx_created_at  (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `,
    },

    // ────────────────────────────────────────────────────────────
    // 14. USER MODERATION
    // ────────────────────────────────────────────────────────────
    {
        name: 'UserModeration',
        sql: `
        CREATE TABLE IF NOT EXISTS UserModeration (
            moderation_id INT AUTO_INCREMENT PRIMARY KEY,
            user_id       INT NOT NULL,
            admin_id      INT NOT NULL,
            action        ENUM('WARNING','SUSPENSION','BAN','UNBAN','UNSUSPEND') NOT NULL,
            reason        TEXT,
            duration_days INT,
            starts_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ends_at       TIMESTAMP NULL,
            is_active     BOOLEAN DEFAULT TRUE,
            notes         TEXT,
            created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id)  REFERENCES Users(id) ON DELETE CASCADE,
            FOREIGN KEY (admin_id) REFERENCES Users(id) ON DELETE CASCADE,
            INDEX idx_user    (user_id),
            INDEX idx_admin   (admin_id),
            INDEX idx_action  (action),
            INDEX idx_active  (is_active),
            INDEX idx_ends_at (ends_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `,
    },

    // ────────────────────────────────────────────────────────────
    // 15. ROLE REQUESTS
    // ────────────────────────────────────────────────────────────
    {
        name: 'RoleRequests',
        sql: `
        CREATE TABLE IF NOT EXISTS RoleRequests (
            request_id       INT AUTO_INCREMENT PRIMARY KEY,
            user_id          INT NOT NULL,
            requested_role   ENUM('organizer','admin') NOT NULL,
            status           ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
            reason           TEXT,
            document_url     VARCHAR(500),
            reviewed_by      INT,
            reviewed_at      TIMESTAMP NULL,
            rejection_reason TEXT,
            created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id)     REFERENCES Users(id) ON DELETE CASCADE,
            FOREIGN KEY (reviewed_by) REFERENCES Users(id) ON DELETE SET NULL,
            INDEX idx_user       (user_id),
            INDEX idx_status     (status),
            INDEX idx_role       (requested_role),
            INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `,
    },

    // ────────────────────────────────────────────────────────────
    // 16. SYSTEM LOGS
    // ────────────────────────────────────────────────────────────
    {
        name: 'SystemLogs',
        sql: `
        CREATE TABLE IF NOT EXISTS SystemLogs (
            sys_log_id     INT AUTO_INCREMENT PRIMARY KEY,
            level          ENUM('DEBUG','INFO','WARN','ERROR','CRITICAL') DEFAULT 'INFO',
            category       VARCHAR(100),
            message        TEXT NOT NULL,
            context        JSON,
            user_id        INT,
            ip_address     VARCHAR(45),
            request_path   VARCHAR(500),
            request_method VARCHAR(10),
            response_code  INT,
            duration_ms    INT,
            created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL,
            INDEX idx_level      (level),
            INDEX idx_category   (category),
            INDEX idx_user       (user_id),
            INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `,
    },

    // ────────────────────────────────────────────────────────────
    // 17. EVENT SCHEDULE
    // ────────────────────────────────────────────────────────────
    {
        name: 'EventSchedule',
        sql: `
        CREATE TABLE IF NOT EXISTS EventSchedule (
            schedule_id   INT AUTO_INCREMENT PRIMARY KEY,
            event_id      INT NOT NULL,
            title         VARCHAR(500) NOT NULL,
            description   TEXT,
            speaker_name  VARCHAR(255),
            speaker_bio   TEXT,
            speaker_photo VARCHAR(500),
            start_time    DATETIME NOT NULL,
            end_time      DATETIME NOT NULL,
            location      VARCHAR(255),
            session_type  ENUM('KEYNOTE','TALK','WORKSHOP','PANEL','BREAK','NETWORKING','OTHER') DEFAULT 'TALK',
            order_index   INT DEFAULT 0,
            created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (event_id) REFERENCES Events(event_id) ON DELETE CASCADE,
            INDEX idx_event      (event_id),
            INDEX idx_start_time (start_time),
            INDEX idx_order      (order_index)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `,
    },

    // ────────────────────────────────────────────────────────────
    // 18. EVENT WAITLIST
    // ────────────────────────────────────────────────────────────
    {
        name: 'EventWaitlist',
        sql: `
        CREATE TABLE IF NOT EXISTS EventWaitlist (
            waitlist_id    INT AUTO_INCREMENT PRIMARY KEY,
            event_id       INT NOT NULL,
            user_id        INT NOT NULL,
            ticket_type_id INT,
            quantity       INT DEFAULT 1,
            status         ENUM('WAITING','NOTIFIED','BOOKED','EXPIRED','CANCELLED') DEFAULT 'WAITING',
            position       INT,
            notified_at    TIMESTAMP NULL,
            expires_at     TIMESTAMP NULL,
            created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (event_id)       REFERENCES Events(event_id)            ON DELETE CASCADE,
            FOREIGN KEY (user_id)        REFERENCES Users(id)                   ON DELETE CASCADE,
            FOREIGN KEY (ticket_type_id) REFERENCES TicketTypes(ticket_type_id) ON DELETE SET NULL,
            UNIQUE KEY unique_waitlist (event_id, user_id),
            INDEX idx_event    (event_id),
            INDEX idx_user     (user_id),
            INDEX idx_status   (status),
            INDEX idx_position (position)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `,
    },

    // ────────────────────────────────────────────────────────────
    // 19. EVENT REVIEWS
    // ────────────────────────────────────────────────────────────
    {
        name: 'EventReviews',
        sql: `
        CREATE TABLE IF NOT EXISTS EventReviews (
            review_id     INT AUTO_INCREMENT PRIMARY KEY,
            event_id      INT NOT NULL,
            user_id       INT NOT NULL,
            booking_id    INT,
            rating        TINYINT NOT NULL,
            title         VARCHAR(255),
            content       TEXT,
            pros          TEXT,
            cons          TEXT,
            is_verified   BOOLEAN DEFAULT FALSE,
            is_featured   BOOLEAN DEFAULT FALSE,
            helpful_count INT DEFAULT 0,
            status        ENUM('PENDING','APPROVED','REJECTED','HIDDEN') DEFAULT 'PENDING',
            admin_note    TEXT,
            created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (event_id)   REFERENCES Events(event_id)     ON DELETE CASCADE,
            FOREIGN KEY (user_id)    REFERENCES Users(id)            ON DELETE CASCADE,
            FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id) ON DELETE SET NULL,
            UNIQUE KEY unique_review (event_id, user_id),
            INDEX idx_event      (event_id),
            INDEX idx_user       (user_id),
            INDEX idx_rating     (rating),
            INDEX idx_status     (status),
            INDEX idx_created_at (created_at),
            CHECK (rating BETWEEN 1 AND 5)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `,
    },

    // ────────────────────────────────────────────────────────────
    // 20. DAILY METRICS
    // ────────────────────────────────────────────────────────────
    {
        name: 'DailyMetrics',
        sql: `
        CREATE TABLE IF NOT EXISTS DailyMetrics (
            metric_id          INT AUTO_INCREMENT PRIMARY KEY,
            metric_date        DATE NOT NULL UNIQUE,
            new_users          INT          DEFAULT 0,
            active_users       INT          DEFAULT 0,
            new_events         INT          DEFAULT 0,
            published_events   INT          DEFAULT 0,
            total_bookings     INT          DEFAULT 0,
            cancelled_bookings INT          DEFAULT 0,
            total_revenue      DECIMAL(14,2) DEFAULT 0.00,
            total_refunds      DECIMAL(14,2) DEFAULT 0.00,
            net_revenue        DECIMAL(14,2) DEFAULT 0.00,
            new_friendships    INT          DEFAULT 0,
            messages_sent      INT          DEFAULT 0,
            notifications_sent INT          DEFAULT 0,
            new_reviews        INT          DEFAULT 0,
            new_reports        INT          DEFAULT 0,
            created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_metric_date (metric_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `,
    },

    // ────────────────────────────────────────────────────────────
    // 21. EVENT ANALYTICS
    // ────────────────────────────────────────────────────────────
    {
        name: 'EventAnalytics',
        sql: `
        CREATE TABLE IF NOT EXISTS EventAnalytics (
            analytics_id    INT AUTO_INCREMENT PRIMARY KEY,
            event_id        INT NOT NULL,
            snapshot_date   DATE NOT NULL,
            page_views      INT          DEFAULT 0,
            unique_visitors INT          DEFAULT 0,
            bookings_count  INT          DEFAULT 0,
            waitlist_count  INT          DEFAULT 0,
            share_count     INT          DEFAULT 0,
            review_count    INT          DEFAULT 0,
            avg_rating      DECIMAL(3,2) DEFAULT 0.00,
            revenue         DECIMAL(12,2) DEFAULT 0.00,
            conversion_rate DECIMAL(5,2) DEFAULT 0.00,
            created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (event_id) REFERENCES Events(event_id) ON DELETE CASCADE,
            UNIQUE KEY unique_event_snapshot (event_id, snapshot_date),
            INDEX idx_event         (event_id),
            INDEX idx_snapshot_date (snapshot_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `,
    },

    // ────────────────────────────────────────────────────────────
    // 22. USER ANALYTICS
    // ────────────────────────────────────────────────────────────
    {
        name: 'UserAnalytics',
        sql: `
        CREATE TABLE IF NOT EXISTS UserAnalytics (
            analytics_id           INT AUTO_INCREMENT PRIMARY KEY,
            user_id                INT NOT NULL,
            snapshot_date          DATE NOT NULL,
            events_viewed          INT          DEFAULT 0,
            events_booked          INT          DEFAULT 0,
            amount_spent           DECIMAL(12,2) DEFAULT 0.00,
            friends_added          INT          DEFAULT 0,
            messages_sent          INT          DEFAULT 0,
            posts_liked            INT          DEFAULT 0,
            comments_made          INT          DEFAULT 0,
            reviews_written        INT          DEFAULT 0,
            search_count           INT          DEFAULT 0,
            session_count          INT          DEFAULT 0,
            total_session_time_min INT          DEFAULT 0,
            created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_user_snapshot (user_id, snapshot_date),
            INDEX idx_user          (user_id),
            INDEX idx_snapshot_date (snapshot_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `,
    },

    // ────────────────────────────────────────────────────────────
    // 23. SEARCH HISTORY
    // ────────────────────────────────────────────────────────────
    {
        name: 'SearchHistory',
        sql: `
        CREATE TABLE IF NOT EXISTS SearchHistory (
            search_id     INT AUTO_INCREMENT PRIMARY KEY,
            user_id       INT,
            query         VARCHAR(500) NOT NULL,
            filters       JSON,
            results_count INT DEFAULT 0,
            clicked_ids   JSON,
            session_id    VARCHAR(255),
            ip_address    VARCHAR(45),
            created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL,
            INDEX idx_user       (user_id),
            INDEX idx_query      (query),
            INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `,
    },
];

export async function GET() {
    const connection = await pool.getConnection();
    const results: { table: string; status: string; error?: string }[] = [];

    try {
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        for (const table of TABLES) {
            try {
                await connection.query(table.sql);
                results.push({ table: table.name, status: 'created' });
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                results.push({ table: table.name, status: 'error', error: message });
            }
        }

        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        const errors = results.filter((r) => r.status === 'error');
        return NextResponse.json(
            {
                message:
                    errors.length === 0
                        ? 'All 23 extended tables created successfully!'
                        : `${results.length - errors.length} tables created, ${errors.length} failed.`,
                results,
            },
            { status: errors.length === 0 ? 200 : 207 }
        );
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('Migration failed:', err);
        return NextResponse.json({ error: 'Migration failed', detail: message }, { status: 500 });
    } finally {
        connection.release();
    }
}
