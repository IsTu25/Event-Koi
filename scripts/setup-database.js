const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');

async function setupCompleteDatabase() {
    const connection = await mysql.createConnection({
        host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
        port: 4000,
        user: '3rJY34mhCM3gBcj.root',
        password: 'omnMwCMTgMLGS6Ws',
        database: 'event_koi',
        ssl: { rejectUnauthorized: false },
        multipleStatements: true
    });

    try {
        console.log('🚀 Starting complete database setup...\n');

        // Step 1: Schema
        console.log('📋 Step 1: Creating schema...');
        const schema = await fs.readFile(path.join(__dirname, '../database/01_schema_tidb.sql'), 'utf8');
        await executeSQL(connection, schema, 'Schema');

        // Step 2: RoleRequests table
        console.log('📋 Step 2: Creating RoleRequests table...');
        const roleRequests = await fs.readFile(path.join(__dirname, '../database/05_role_requests.sql'), 'utf8');
        await executeSQL(connection, roleRequests, 'RoleRequests');

        // Step 3: Seed data
        console.log('📋 Step 3: Loading seed data...');
        const seed = await fs.readFile(path.join(__dirname, '../database/04_seed.sql'), 'utf8');
        await executeSQL(connection, seed, 'Seed Data');

        // Step 4: Create working admin user
        console.log('📋 Step 4: Creating admin user with working password...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await connection.query('DELETE FROM Users WHERE email = ?', ['admin@eventkoi.com']);
        await connection.query(`
            INSERT INTO Users (name, email, password, role, phone, designation, is_verified, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `, ['Admin User', 'admin@eventkoi.com', hashedPassword, 'admin', '+8801711111111', 'System Administrator', 1]);
        console.log('   ✅ Admin user created\n');

        // Step 5: Views and Indexes (TiDB compatible parts only)
        console.log('📋 Step 5: Creating views and indexes...');
        try {
            const viewsIndexes = await fs.readFile(path.join(__dirname, '../database/03_views_indexes.sql'), 'utf8');
            await executeSQL(connection, viewsIndexes, 'Views & Indexes');
        } catch (err) {
            console.log('   ⚠️  Some views/indexes skipped (TiDB compatibility)\n');
        }

        console.log('✅ Complete database setup finished!\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📌 LOGIN CREDENTIALS:');
        console.log('   Email: admin@eventkoi.com');
        console.log('   Password: admin123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

async function executeSQL(connection, sql, name) {
    const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));

    let executed = 0;
    let skipped = 0;

    for (const statement of statements) {
        if (statement.trim()) {
            try {
                await connection.query(statement);
                executed++;
            } catch (err) {
                // Skip errors for already existing items or TiDB incompatibilities
                if (err.message.includes('already exists') ||
                    err.message.includes('Duplicate') ||
                    err.message.includes('DELIMITER') ||
                    err.message.includes('PROCEDURE') ||
                    err.message.includes('TRIGGER')) {
                    skipped++;
                } else {
                    console.log(`   ⚠️  Warning: ${err.message.substring(0, 80)}`);
                }
            }
        }
    }

    console.log(`   ✅ ${name}: ${executed} statements executed, ${skipped} skipped\n`);
}

setupCompleteDatabase();
