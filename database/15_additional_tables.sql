-- ============================================================
-- 15_additional_tables.sql
-- Extra tables from the expansion guide not yet created:
-- EventCategories, EventTags, AdminRoles, AdminUsers, UserRecommendations
-- ============================================================
SET FOREIGN_KEY_CHECKS = 0;
-- Many-to-many event ↔ category
CREATE TABLE IF NOT EXISTS EventCategories (
    event_category_id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    category_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_event_category (event_id, category_id),
    FOREIGN KEY (event_id) REFERENCES Events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
-- Tags per event
CREATE TABLE IF NOT EXISTS EventTags (
    tag_id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    tag_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES Events(event_id) ON DELETE CASCADE,
    INDEX idx_tag_name (tag_name),
    INDEX idx_event_tags (event_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
-- Admin roles with permissions
CREATE TABLE IF NOT EXISTS AdminRoles (
    role_id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    permissions JSON COMMENT 'Array of permission strings',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
-- Seed default admin roles
INSERT IGNORE INTO AdminRoles (role_name, description, permissions)
VALUES (
        'super_admin',
        'Full platform access',
        '["users.manage","events.manage","finance.manage","moderation.manage","system.manage","analytics.view","roles.manage"]'
    ),
    (
        'moderator',
        'Content & user moderation',
        '["users.view","events.view","moderation.manage","reports.manage"]'
    ),
    (
        'finance_admin',
        'Revenue & payment management',
        '["finance.manage","events.view","users.view","analytics.view"]'
    ),
    (
        'event_admin',
        'Event approval & management',
        '["events.manage","events.approve","users.view","analytics.view"]'
    );
-- Admin user extensions
CREATE TABLE IF NOT EXISTS AdminUsers (
    admin_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    role_id INT NOT NULL,
    department VARCHAR(100),
    permissions JSON COMMENT 'Override permissions on top of role',
    status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
    last_login TIMESTAMP NULL,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES AdminRoles(role_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
-- ML/rule-based event recommendations per user
CREATE TABLE IF NOT EXISTS UserRecommendations (
    recommendation_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    recommendation_score DECIMAL(5, 2) DEFAULT 0.00,
    reason VARCHAR(255) COMMENT 'e.g. Category Match, Friend Attending, Trending',
    algorithm_version VARCHAR(50) DEFAULT 'v1',
    clicked BOOLEAN DEFAULT FALSE,
    clicked_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_event_rec (user_id, event_id),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES Events(event_id) ON DELETE CASCADE,
    INDEX idx_user_score (user_id, recommendation_score DESC)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
SET FOREIGN_KEY_CHECKS = 1;