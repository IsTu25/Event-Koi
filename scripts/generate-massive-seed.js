const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const OUTPUT_DIR = path.join(__dirname, '../database');

// Helper to escape strings
const esc = (str) => str.replace(/'/g, "''");

// Helper to random int
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper to random array item
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Random date in range
const randomDate = (start, end) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().slice(0, 19).replace('T', ' ');
}

// 1. Generate Users (1000 lines approx)
const generateUsers = () => {
    let sql = `-- =====================================================\n-- 1. BULK USERS (500 users)\n-- =====================================================\n\n`;
    sql += `INSERT INTO Users (name, email, password, role, phone, designation, is_verified, created_at) VALUES\n`;

    const roles = ['attendee', 'attendee', 'attendee', 'organizer'];
    const designations = ['Student', 'Engineer', 'Doctor', 'Teacher', 'Artist', 'Developer', 'Manager', 'Director'];

    const values = [];
    for (let i = 1; i <= 500; i++) {
        const role = randomItem(roles);
        const name = `User ${i}`;
        const email = `user${i}_${uuidv4().substring(0, 8)}@example.com`;
        const phone = `+8801${randomInt(100000000, 999999999)}`;
        const designation = randomItem(designations);
        const verified = Math.random() > 0.5 ? 'TRUE' : 'FALSE';

        values.push(`('${name}', '${email}', '$2a$10$SampleHash', '${role}', '${phone}', '${designation}', ${verified}, '${randomDate(new Date(2024, 0, 1), new Date())}')`);
    }

    sql += values.join(',\n') + ';\n';
    fs.writeFileSync(path.join(OUTPUT_DIR, '10_seed_users.sql'), sql);
    console.log('Generated 10_seed_users.sql');
};


// 2. Generate Events & Ticket Types (1000+ lines)
const generateEvents = () => {
    let sql = `-- =====================================================\n-- 2. BULK EVENTS & TICKETS\n-- =====================================================\n\n`;

    // Events
    sql += `INSERT INTO Events (organizer_id, venue_id, category_id, title, description, start_time, end_time, status, listing_fee, is_listing_paid) VALUES\n`;
    const eventValues = [];
    const statuses = ['PUBLISHED', 'DRAFT', 'COMPLETED', 'CANCELLED'];

    for (let i = 1; i <= 300; i++) {
        const orgId = randomInt(3, 17); // Assuming organizers are in this range from base seed
        const venueId = randomInt(1, 20);
        const catId = randomInt(1, 15);
        const title = `Event Title ${i} - ${uuidv4().substring(0, 8)}`;
        const desc = `This is a generated description for event ${i}. It has random content.`;
        const start = randomDate(new Date(2024, 0, 1), new Date(2025, 12, 31));
        const end = randomDate(new Date(start), new Date(new Date(start).getTime() + 86400000));
        const status = randomItem(statuses);

        eventValues.push(`(${orgId}, ${venueId}, ${catId}, '${title}', '${desc}', '${start}', '${end}', '${status}', ${randomInt(0, 5000)}, TRUE)`);
    }
    sql += eventValues.join(',\n') + ';\n\n';

    // Ticket Types
    sql += `INSERT INTO TicketTypes (event_id, name, price, quantity) VALUES\n`;
    const ticketValues = [];
    for (let i = 1; i <= 300; i++) { // For each event (assuming ids 31-330 approx, but let's just use 31+ logic)
        // Note: In real scenarios we'd query DB for IDs, but here we assume sequential ID generation continues from seed (max id 20)
        // Let's generate for IDs 21 to 320
        const eventId = 20 + i;
        ticketValues.push(`(${eventId}, 'General', ${randomInt(100, 1000)}, ${randomInt(50, 500)})`);
        ticketValues.push(`(${eventId}, 'VIP', ${randomInt(1000, 5000)}, ${randomInt(10, 50)})`);
    }
    sql += ticketValues.join(',\n') + ';\n';

    fs.writeFileSync(path.join(OUTPUT_DIR, '11_seed_events.sql'), sql);
    console.log('Generated 11_seed_events.sql');
};

// 3. Generate Bookings (1000+ lines)
const generateBookings = () => {
    let sql = `-- =====================================================\n-- 3. BULK BOOKINGS (2000 bookings)\n-- =====================================================\n\n`;
    sql += `INSERT INTO Bookings (user_id, event_id, ticket_type_id, unique_code, status, created_at) VALUES\n`;

    const bookingValues = [];
    const statuses = ['VALID', 'USED', 'CANCELLED'];

    for (let i = 0; i < 2000; i++) {
        const userId = randomInt(18, 550); // From users generated in seed + bulk
        // Map event 1-300 to ticket types. We know ticket types. 
        // Simplified: just pick random event 1-50 (from 04_seed) or new ones.
        // Let's pick random event ID 1-100 and random ticket type ID associated (simplified logic)
        // Actually, to be safe on FKs without querying DB, let's use the known seed data range (1-20 events, 1-42 tickets) usually safe, 
        // BUT we just inserted new ones.
        // We will target the ORIGINAL seed data for safety in this valid SQL file independently, OR refer to new ones knowing they run sequentially.
        // Let's mix.

        const eventId = randomInt(1, 20);
        const ticketTypeId = randomInt(1, 40); // Approximate match

        bookingValues.push(`(${userId}, ${eventId}, ${ticketTypeId}, '${uuidv4()}', '${randomItem(statuses)}', '${randomDate(new Date(2024, 0, 1), new Date())}')`);
    }

    sql += bookingValues.join(',\n') + ';\n';
    fs.writeFileSync(path.join(OUTPUT_DIR, '12_seed_bookings.sql'), sql);
    console.log('Generated 12_seed_bookings.sql');
};

// 4. Generate Social Data (Messages, Posts, Notifications)
const generateSocial = () => {
    let sql = `-- =====================================================\n-- 4. BULK SOCIAL DATA\n-- =====================================================\n\n`;

    // Messages
    sql += `INSERT INTO Messages (sender_id, receiver_id, content, is_read, created_at) VALUES\n`;
    const msgValues = [];
    for (let i = 0; i < 1000; i++) {
        const s = randomInt(18, 500);
        const r = randomInt(18, 500);
        if (s === r) continue;
        msgValues.push(`(${s}, ${r}, 'Random message content ${uuidv4()}', ${Math.random() > 0.5}, '${randomDate(new Date(2024, 0, 1), new Date())}')`);
    }
    sql += msgValues.join(',\n') + ';\n\n';

    // Notifications
    sql += `INSERT INTO Notifications (user_id, type, reference_id, content, is_read, created_at) VALUES\n`;
    const notifValues = [];
    const types = ['MESSAGE', 'EVENT_REMINDER', 'NEW_EVENT'];
    for (let i = 0; i < 1000; i++) {
        const u = randomInt(18, 500);
        notifValues.push(`(${u}, '${randomItem(types)}', ${randomInt(1, 100)}, 'Notification content ${i}', ${Math.random() > 0.5}, '${randomDate(new Date(2024, 0, 1), new Date())}')`);
    }
    sql += notifValues.join(',\n') + ';\n';

    fs.writeFileSync(path.join(OUTPUT_DIR, '13_seed_social.sql'), sql);
    console.log('Generated 13_seed_social.sql');
};

// Run all
generateUsers();
generateEvents();
generateBookings();
generateSocial();
