const mysql = require('mysql2/promise');

async function createRoleRequestsTable() {
    const connection = await mysql.createConnection({
        host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
        port: 4000,
        user: '3rJY34mhCM3gBcj.root',
        password: 'omnMwCMTgMLGS6Ws',
        database: 'event_koi',
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('Creating RoleRequests table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS RoleRequests (
                request_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                requested_role ENUM('organizer', 'admin') NOT NULL,
                status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ RoleRequests table created successfully!');
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await connection.end();
    }
}

createRoleRequestsTable();
