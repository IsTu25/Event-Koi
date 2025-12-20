const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const config = {
    host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '3rJY34mhCM3gBcj.root',
    password: 'omnMwCMTgMLGS6Ws',
    ssl: {
        rejectUnauthorized: true // TiDB requires SSL
    },
    multipleStatements: true // Required for running SQL scripts
};

async function main() {
    let connection;
    try {
        console.log('Connecting to TiDB Cloud...');
        // Connect without database first to create it
        connection = await mysql.createConnection(config);

        console.log('Resetting database event_koi...');
        await connection.query('DROP DATABASE IF EXISTS event_koi');
        await connection.query('CREATE DATABASE event_koi');
        await connection.query('USE event_koi');

        console.log('Database selected. Running Schema scripts...');

        const files = [
            '01_schema_tidb.sql',
            '02_procedures_triggers.sql',
            '03_views_indexes.sql',
            '04_seed.sql',
            '05_role_requests.sql'
        ];

        for (const file of files) {
            const filePath = path.join(__dirname, '../database', file);
            if (fs.existsSync(filePath)) {
                console.log(`Running ${file}...`);
                const sql = fs.readFileSync(filePath, 'utf8');
                await connection.query(sql);
                console.log(`✓ ${file} executed successfully.`);
            } else {
                console.warn(`! ${file} not found, skipping.`);
            }
        }

        console.log('Success! Database initialized.');

    } catch (err) {
        console.error('Error initializing database:', err);
    } finally {
        if (connection) await connection.end();
    }
}

main();
