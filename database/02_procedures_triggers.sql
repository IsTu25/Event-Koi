

DELIMITER $$

-- 1. Book a ticket with transaction safety
DROP PROCEDURE IF EXISTS sp_BookTicket$$
CREATE PROCEDURE sp_BookTicket(
    IN p_user_id INT,
    IN p_event_id INT,
    IN p_ticket_type_id INT,
    OUT p_booking_id INT,
    OUT p_unique_code VARCHAR(255),
    OUT p_status VARCHAR(50)
)
BEGIN
    DECLARE v_available_quantity INT;
    DECLARE v_sold_count INT;
    DECLARE v_price DECIMAL(10,2);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_status = 'ERROR';
    END;
    
    START TRANSACTION;
    
    SELECT quantity, sold_count, price
    INTO v_available_quantity, v_sold_count, v_price
    FROM TicketTypes
    WHERE ticket_type_id = p_ticket_type_id
    FOR UPDATE;
    
    IF v_sold_count >= v_available_quantity THEN
        SET p_status = 'SOLD_OUT';
        ROLLBACK;
    ELSE
        SET p_unique_code = UUID();
        
        INSERT INTO Bookings (user_id, event_id, ticket_type_id, unique_code, status, payment_status)
        VALUES (p_user_id, p_event_id, p_ticket_type_id, p_unique_code, 'VALID', 'COMPLETED');
        
        SET p_booking_id = LAST_INSERT_ID();
        
        UPDATE TicketTypes
        SET sold_count = sold_count + 1
        WHERE ticket_type_id = p_ticket_type_id;
        
    
        INSERT INTO Notifications (user_id, type, reference_id, content)
        VALUES (p_user_id, 'BOOKING_CONFIRMATION', p_booking_id, 
                CONCAT('Your ticket has been confirmed! Booking ID: ', p_booking_id));
        
        SET p_status = 'SUCCESS';
        COMMIT;
    END IF;
END$$

-- 2. Cancel booking with refund calculation
DROP PROCEDURE IF EXISTS sp_CancelBooking$$
CREATE PROCEDURE sp_CancelBooking(
    IN p_booking_id INT,
    IN p_user_id INT,
    OUT p_refund_amount DECIMAL(10,2),
    OUT p_status VARCHAR(50)
)
BEGIN
    DECLARE v_event_start DATETIME;
    DECLARE v_ticket_price DECIMAL(10,2);
    DECLARE v_days_until_event INT;
    DECLARE v_current_status VARCHAR(20);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_status = 'ERROR';
    END;
    
    START TRANSACTION;
    

    SELECT e.start_time, tt.price, b.status
    INTO v_event_start, v_ticket_price, v_current_status
    FROM Bookings b
    JOIN Events e ON b.event_id = e.event_id
    JOIN TicketTypes tt ON b.ticket_type_id = tt.ticket_type_id
    WHERE b.booking_id = p_booking_id AND b.user_id = p_user_id
    FOR UPDATE;
    
    IF v_current_status != 'VALID' THEN
        SET p_status = 'ALREADY_CANCELLED';
        ROLLBACK;
    ELSE
        SET v_days_until_event = DATEDIFF(v_event_start, NOW());
        
        -- Calculate refund based on cancellation policy
        IF v_days_until_event > 7 THEN
            SET p_refund_amount = v_ticket_price;  -- 100% refund
        ELSEIF v_days_until_event >= 2 THEN
            SET p_refund_amount = v_ticket_price * 0.5;  -- 50% refund
        ELSE
            SET p_refund_amount = 0;  -- No refund
            SET p_status = 'TOO_LATE';
            ROLLBACK;
        END IF;
        
        IF p_status IS NULL THEN
            
            UPDATE Bookings
            SET status = 'CANCELLED',
                refund_amount = p_refund_amount,
                cancelled_at = NOW(),
                payment_status = 'REFUNDED'
            WHERE booking_id = p_booking_id;
            
            
            UPDATE TicketTypes tt
            JOIN Bookings b ON tt.ticket_type_id = b.ticket_type_id
            SET tt.sold_count = tt.sold_count - 1
            WHERE b.booking_id = p_booking_id;
            
            SET p_status = 'SUCCESS';
            COMMIT;
        END IF;
    END IF;
END$$

-- 3. Get event statistics
DROP PROCEDURE IF EXISTS sp_GetEventStats$$
CREATE PROCEDURE sp_GetEventStats(IN p_event_id INT)
BEGIN
    SELECT 
        e.event_id,
        e.title,
        e.status,
        COUNT(DISTINCT b.booking_id) as total_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'VALID' THEN b.booking_id END) as active_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'USED' THEN b.booking_id END) as used_tickets,
        COALESCE(SUM(CASE WHEN b.status != 'CANCELLED' THEN tt.price ELSE 0 END), 0) as revenue,
        COUNT(DISTINCT s.sponsor_id) as sponsor_count,
        COALESCE(SUM(s.contribution_amount), 0) as sponsor_revenue,
        COUNT(DISTINCT ep.post_id) as post_count,
        COUNT(DISTINCT pl.like_id) as total_likes,
        COUNT(DISTINCT pc.comment_id) as total_comments
    FROM Events e
    LEFT JOIN Bookings b ON e.event_id = b.event_id
    LEFT JOIN TicketTypes tt ON b.ticket_type_id = tt.ticket_type_id
    LEFT JOIN Sponsors s ON e.event_id = s.event_id AND s.status = 'APPROVED'
    LEFT JOIN EventPosts ep ON e.event_id = ep.event_id
    LEFT JOIN PostLikes pl ON ep.post_id = pl.post_id
    LEFT JOIN PostComments pc ON ep.post_id = pc.post_id
    WHERE e.event_id = p_event_id
    GROUP BY e.event_id, e.title, e.status;
END$$

-- 4. Get user activity summary
DROP PROCEDURE IF EXISTS sp_GetUserActivity$$
CREATE PROCEDURE sp_GetUserActivity(IN p_user_id INT)
BEGIN
    SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        COUNT(DISTINCT b.booking_id) as bookings_count,
        COUNT(DISTINCT CASE WHEN u.role = 'organizer' THEN e.event_id END) as events_organized,
        COUNT(DISTINCT f1.friendship_id) + COUNT(DISTINCT f2.friendship_id) as friend_count,
        COUNT(DISTINCT m1.message_id) + COUNT(DISTINCT m2.message_id) as message_count,
        COUNT(DISTINCT pl.like_id) as likes_given,
        COUNT(DISTINCT pc.comment_id) as comments_made,
        COALESCE(SUM(CASE WHEN b.status != 'CANCELLED' THEN tt.price ELSE 0 END), 0) as total_spent
    FROM Users u
    LEFT JOIN Bookings b ON u.id = b.user_id
    LEFT JOIN TicketTypes tt ON b.ticket_type_id = tt.ticket_type_id
    LEFT JOIN Events e ON u.id = e.organizer_id
    LEFT JOIN Friendships f1 ON u.id = f1.user_id AND f1.status = 'ACCEPTED'
    LEFT JOIN Friendships f2 ON u.id = f2.friend_id AND f2.status = 'ACCEPTED'
    LEFT JOIN Messages m1 ON u.id = m1.sender_id
    LEFT JOIN Messages m2 ON u.id = m2.receiver_id
    LEFT JOIN PostLikes pl ON u.id = pl.user_id
    LEFT JOIN PostComments pc ON u.id = pc.user_id
    WHERE u.id = p_user_id
    GROUP BY u.id, u.name, u.email, u.role;
END$$

-- =====================================================
-- TRIGGERS
-- =====================================================

-- 1. After booking insert - send notification
DROP TRIGGER IF EXISTS trg_after_booking_insert$$
CREATE TRIGGER trg_after_booking_insert
AFTER INSERT ON Bookings
FOR EACH ROW
BEGIN
    DECLARE v_event_title VARCHAR(500);
    DECLARE v_event_start DATETIME;
    
    SELECT title, start_time INTO v_event_title, v_event_start
    FROM Events WHERE event_id = NEW.event_id;
    
    -- Notification for user
    INSERT INTO Notifications (user_id, type, reference_id, content)
    VALUES (NEW.user_id, 'BOOKING_CONFIRMATION', NEW.booking_id,
            CONCAT('Booking confirmed for "', v_event_title, '" on ', DATE_FORMAT(v_event_start, '%d %b %Y')));
END$$

-- 2. After event post - notify followers
DROP TRIGGER IF EXISTS trg_after_post_insert$$
CREATE TRIGGER trg_after_post_insert
AFTER INSERT ON EventPosts
FOR EACH ROW
BEGIN
    DECLARE v_event_title VARCHAR(500);
    
    SELECT title INTO v_event_title FROM Events WHERE event_id = NEW.event_id;
    
    -- Notify all users who booked this event
    INSERT INTO Notifications (user_id, type, reference_id, content)
    SELECT DISTINCT b.user_id, 'EVENT_UPDATE', NEW.post_id,
           CONCAT('New update for "', v_event_title, '"')
    FROM Bookings b
    WHERE b.event_id = NEW.event_id 
      AND b.status = 'VALID'
      AND b.user_id != NEW.user_id;
END$$

-- 3. Before ticket type update - validate sold count
DROP TRIGGER IF EXISTS trg_before_tickettype_update$$
CREATE TRIGGER trg_before_tickettype_update
BEFORE UPDATE ON TicketTypes
FOR EACH ROW
BEGIN
    IF NEW.quantity < NEW.sold_count THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot reduce quantity below sold count';
    END IF;
END$$

-- 4. After friendship accepted - create notification
DROP TRIGGER IF EXISTS trg_after_friendship_update$$
CREATE TRIGGER trg_after_friendship_update
AFTER UPDATE ON Friendships
FOR EACH ROW
BEGIN
    DECLARE v_user_name VARCHAR(255);
    
    IF NEW.status = 'ACCEPTED' AND OLD.status = 'PENDING' THEN
        SELECT name INTO v_user_name FROM Users WHERE id = NEW.user_id;
        
        INSERT INTO Notifications (user_id, type, reference_id, content)
        VALUES (NEW.friend_id, 'FRIEND_REQUEST', NEW.friendship_id,
                CONCAT(v_user_name, ' accepted your friend request'));
    END IF;
END$$

-- 5. After message insert - create notification
DROP TRIGGER IF EXISTS trg_after_message_insert$$
CREATE TRIGGER trg_after_message_insert
AFTER INSERT ON Messages
FOR EACH ROW
BEGIN
    DECLARE v_sender_name VARCHAR(255);
    
    SELECT name INTO v_sender_name FROM Users WHERE id = NEW.sender_id;
    
    INSERT INTO Notifications (user_id, type, reference_id, content)
    VALUES (NEW.receiver_id, 'MESSAGE', NEW.message_id,
            CONCAT('New message from ', v_sender_name));
END$$

-- 6. Before booking cancel - validate timing
DROP TRIGGER IF EXISTS trg_before_booking_cancel$$
CREATE TRIGGER trg_before_booking_cancel
BEFORE UPDATE ON Bookings
FOR EACH ROW
BEGIN
    DECLARE v_event_start DATETIME;
    DECLARE v_hours_until_event INT;
    
    IF NEW.status = 'CANCELLED' AND OLD.status = 'VALID' THEN
        SELECT start_time INTO v_event_start 
        FROM Events WHERE event_id = NEW.event_id;
        
        SET v_hours_until_event = TIMESTAMPDIFF(HOUR, NOW(), v_event_start);
        
        IF v_hours_until_event < 48 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot cancel within 48 hours of event';
        END IF;
    END IF;
END$$

-- 7. After sponsor approval - notify organizer
DROP TRIGGER IF EXISTS trg_after_sponsor_approval$$
CREATE TRIGGER trg_after_sponsor_approval
AFTER UPDATE ON Sponsors
FOR EACH ROW
BEGIN
    DECLARE v_organizer_id INT;
    DECLARE v_event_title VARCHAR(500);
    
    IF NEW.status = 'APPROVED' AND OLD.status = 'PENDING' THEN
        SELECT e.organizer_id, e.title 
        INTO v_organizer_id, v_event_title
        FROM Events e WHERE e.event_id = NEW.event_id;
        
        INSERT INTO Notifications (user_id, type, reference_id, content)
        VALUES (v_organizer_id, 'SPONSOR_APPROVED', NEW.sponsor_id,
                CONCAT('Sponsor "', NEW.name, '" approved for "', v_event_title, '"'));
    END IF;
END$$

DELIMITER ;


SELECT 'Stored procedures and triggers created successfully!' as Status;
