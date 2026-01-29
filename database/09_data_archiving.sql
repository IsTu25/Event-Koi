-- =====================================================
-- Event Ekhanei - Data Archiving & Maintenance
-- File: 09_data_archiving.sql
-- Description: Procedures for data lifecycle management
-- =====================================================

-- =====================================================
-- 1. ARCHIVE TABLES
-- Create shadow tables for archiving old data
-- =====================================================

CREATE TABLE IF NOT EXISTS Archived_Events LIKE Events;
ALTER TABLE Archived_Events ADD COLUMN archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS Archived_Bookings LIKE Bookings;
ALTER TABLE Archived_Bookings ADD COLUMN archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS Archived_Notifications LIKE Notifications;
ALTER TABLE Archived_Notifications ADD COLUMN archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- =====================================================
-- 2. ARCHIVING PROCEDURES
-- =====================================================

DELIMITER //

-- Procedure to archive events older than 2 years
CREATE PROCEDURE Archive_Old_Events()
BEGIN
    DECLARE v_cutoff_date DATETIME;
    SET v_cutoff_date = DATE_SUB(NOW(), INTERVAL 2 YEAR);
    
    START TRANSACTION;
    
    -- Insert into Archive
    INSERT INTO Archived_Events 
    SELECT *, NOW() FROM Events 
    WHERE end_time < v_cutoff_date AND status IN ('COMPLETED', 'CANCELLED');
    
    -- Delete from Main (Cascading delete will handle related items if configured, 
    -- but for safety we might normally archive related items first. 
    -- Here we assume foreign keys allow delete or we would archive children first)
    DELETE FROM Events 
    WHERE end_time < v_cutoff_date AND status IN ('COMPLETED', 'CANCELLED');
    
    COMMIT;
    
    SELECT CONCAT('Archived events before ', v_cutoff_date) as Status;
END //

-- Procedure to archive notifications older than 6 months
CREATE PROCEDURE Archive_Old_Notifications()
BEGIN
    DECLARE v_cutoff_date DATETIME;
    SET v_cutoff_date = DATE_SUB(NOW(), INTERVAL 6 MONTH);
    
    START TRANSACTION;
    
    INSERT INTO Archived_Notifications
    SELECT *, NOW() FROM Notifications
    WHERE created_at < v_cutoff_date;
    
    DELETE FROM Notifications
    WHERE created_at < v_cutoff_date;
    
    COMMIT;
END //

-- Procedure to cleanup unverified users after 30 days
CREATE PROCEDURE Cleanup_Unverified_Users()
BEGIN
    DELETE FROM Users
    WHERE is_verified = FALSE 
    AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
    AND role != 'admin'; -- Safety check
END //

DELIMITER ;

-- =====================================================
-- 3. MAINTENANCE SCHEDULE (Event Scheduler)
-- =====================================================

SET GLOBAL event_scheduler = ON;

CREATE EVENT IF NOT EXISTS Monthly_Archiving_Job
ON SCHEDULE EVERY 1 MONTH STARTS '2025-01-01 03:00:00'
DO
BEGIN
    CALL Archive_Old_Events();
    CALL Archive_Old_Notifications();
END;

CREATE EVENT IF NOT EXISTS Weekly_Cleanup_Job
ON SCHEDULE EVERY 1 WEEK STARTS '2025-01-01 04:00:00'
DO
    CALL Cleanup_Unverified_Users();

-- =====================================================
-- 4. DATABASE HEALTH CHECKS
-- =====================================================

CREATE OR REPLACE VIEW View_Table_Sizes AS
SELECT 
    table_name AS `Table`, 
    round(((data_length + index_length) / 1024 / 1024), 2) `Size in MB` 
FROM information_schema.TABLES 
WHERE table_schema = DATABASE()
ORDER BY (data_length + index_length) DESC;

CREATE OR REPLACE VIEW View_Index_Usage AS
SELECT 
    TABLE_NAME, 
    INDEX_NAME, 
    SEQ_IN_INDEX, 
    COLUMN_NAME, 
    CARDINALITY
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE(); 
