USE event_koi;
-- Standard standard procedures and triggers sync
SET FOREIGN_KEY_CHECKS = 0;
DROP TRIGGER IF EXISTS trg_after_booking_insert;
DROP TRIGGER IF EXISTS trg_after_post_insert;
DROP TRIGGER IF EXISTS trg_before_tickettype_update;
DROP TRIGGER IF EXISTS trg_after_friendship_update;
DROP TRIGGER IF EXISTS trg_after_payment_insert;
DROP TRIGGER IF EXISTS trg_after_payment_update;
DELIMITER $$ CREATE TRIGGER trg_after_booking_insert
AFTER
INSERT ON Bookings FOR EACH ROW BEGIN
INSERT IGNORE INTO Notifications (user_id, type, reference_id, content)
VALUES (
        NEW.user_id,
        'BOOKING_CONFIRMATION',
        NEW.booking_id,
        'Your booking is confirmed!'
    );
INSERT INTO UserAnalytics (user_id, snapshot_date, events_booked)
VALUES (NEW.user_id, CURDATE(), 1) ON DUPLICATE KEY
UPDATE events_booked = events_booked + 1;
END $$ CREATE TRIGGER trg_before_tickettype_update BEFORE
UPDATE ON TicketTypes FOR EACH ROW BEGIN IF NEW.quantity < NEW.sold_count THEN SIGNAL SQLSTATE '45000'
SET MESSAGE_TEXT = 'Quantity cannot be less than sold count';
END IF;
END $$ CREATE TRIGGER trg_after_payment_insert
AFTER
INSERT ON Payments FOR EACH ROW BEGIN IF NEW.payment_status = 'COMPLETED'
    AND NEW.payment_type = 'TICKET' THEN
INSERT INTO EventRevenue (event_id, ticket_revenue)
VALUES (NEW.event_id, NEW.amount) ON DUPLICATE KEY
UPDATE ticket_revenue = ticket_revenue + NEW.amount;
END IF;
END $$ CREATE TRIGGER trg_after_friendship_update
AFTER
UPDATE ON Friendships FOR EACH ROW BEGIN IF NEW.status = 'ACCEPTED'
    AND OLD.status = 'PENDING' THEN
INSERT IGNORE INTO Notifications (user_id, type, reference_id, content)
VALUES (
        NEW.user_id,
        'FRIEND_REQUEST',
        NEW.friendship_id,
        'You are now friends!'
    );
INSERT IGNORE INTO Notifications (user_id, type, reference_id, content)
VALUES (
        NEW.friend_id,
        'FRIEND_REQUEST',
        NEW.friendship_id,
        'Friend request accepted!'
    );
END IF;
END $$ DELIMITER;
SET FOREIGN_KEY_CHECKS = 1;
SELECT 'Triggers synchronized successfully' AS Status;