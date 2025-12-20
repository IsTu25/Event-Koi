const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
    const connection = await mysql.createConnection({
        host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
        port: 4000,
        user: '3rJY34mhCM3gBcj.root',
        password: 'omnMwCMTgMLGS6Ws',
        database: 'event_koi',
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('Creating admin user...');

        // Hash the password "admin123"
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Delete existing admin if exists
        await connection.query('DELETE FROM Users WHERE email = ?', ['admin@eventkoi.com']);

        // Insert new admin
        await connection.query(`
            INSERT INTO Users (name, email, password, role, phone, designation, is_verified, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            'Admin User',
            'admin@eventkoi.com',
            hashedPassword,
            'admin',
            '+8801711111111',
            'System Administrator',
            1
        ]);

        console.log('✅ Admin user created successfully!');
        console.log('');
        console.log('Login credentials:');
        console.log('Email: admin@eventkoi.com');
        console.log('Password: admin123');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

createAdminUser();
