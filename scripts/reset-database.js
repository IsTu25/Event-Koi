const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');

async function resetAndSetup() {
    const connection = await mysql.createConnection({
        host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
        port: 4000,
        user: '3rJY34mhCM3gBcj.root',
        password: 'omnMwCMTgMLGS6Ws',
        database: 'event_koi',
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔄 Resetting and setting up database...\n');

        // Drop all tables first
        console.log('🗑️  Dropping existing tables...');
        const dropTables = [
            'Notifications', 'Messages', 'Friendships', 'PostComments', 'PostLikes',
            'EventPosts', 'Sponsors', 'Bookings', 'TicketTypes', 'Events',
            'Venues', 'Categories', 'RoleRequests', 'Users'
        ];

        for (const table of dropTables) {
            try {
                await connection.query(`DROP TABLE IF EXISTS ${table}`);
            } catch (err) {
                // Ignore errors
            }
        }
        console.log('   ✅ Tables dropped\n');

        // Read and execute schema
        console.log('📋 Creating tables...');
        const schema = await fs.readFile(path.join(__dirname, '../database/01_schema_tidb.sql'), 'utf8');

        // Split by CREATE TABLE and execute each separately
        const createStatements = schema.split('CREATE TABLE').filter(s => s.trim());

        for (let i = 0; i < createStatements.length; i++) {
            if (i === 0) continue; // Skip first empty part
            const statement = 'CREATE TABLE' + createStatements[i].split(';')[0] + ';';
            try {
                await connection.query(statement);
                console.log(`   ✅ Table ${i} created`);
            } catch (err) {
                console.log(`   ⚠️  Table ${i}: ${err.message.substring(0, 60)}`);
            }
        }

        // Create RoleRequests
        console.log('\n📋 Creating RoleRequests table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS RoleRequests (
                request_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                requested_role ENUM('organizer', 'admin') NOT NULL,
                status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('   ✅ RoleRequests created\n');

        // Load seed data
        console.log('📋 Loading seed data...');
        const seed = await fs.readFile(path.join(__dirname, '../database/04_seed.sql'), 'utf8');
        const insertStatements = seed.split('INSERT INTO').filter(s => s.trim() && !s.includes('--'));

        for (const stmt of insertStatements) {
            if (stmt.trim()) {
                try {
                    await connection.query('INSERT INTO' + stmt.split(';')[0] + ';');
                } catch (err) {
                    if (!err.message.includes('Duplicate')) {
                        console.log(`   ⚠️  ${err.message.substring(0, 60)}`);
                    }
                }
            }
        }
        console.log('   ✅ Seed data loaded\n');

        // Create admin user
        console.log('📋 Creating admin user...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await connection.query('DELETE FROM Users WHERE email = ?', ['admin@eventkoi.com']);
        await connection.query(`
            INSERT INTO Users (name, email, password, role, phone, designation, is_verified, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `, ['Admin User', 'admin@eventkoi.com', hashedPassword, 'admin', '+8801711111111', 'System Administrator', 1]);
        console.log('   ✅ Admin created\n');

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ DATABASE READY!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📌 Login: admin@eventkoi.com / admin123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

resetAndSetup();
