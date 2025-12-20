const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function syncDatabase() {
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
        console.log('🔄 Syncing database to TiDB Cloud...\n');

        // Files to execute in order
        const files = [
            '01_schema_tidb.sql',
            '04_seed.sql',
            '05_role_requests.sql'
        ];

        for (const file of files) {
            console.log(`📄 Executing ${file}...`);
            const sql = await fs.readFile(path.join(__dirname, '../database', file), 'utf8');

            // Split by semicolons and execute each statement
            const statements = sql.split(';').filter(s => s.trim());

            for (const statement of statements) {
                if (statement.trim()) {
                    try {
                        await connection.query(statement);
                    } catch (err) {
                        // Ignore duplicate/already exists errors
                        if (!err.message.includes('already exists') && !err.message.includes('Duplicate')) {
                            console.log(`   ⚠️  Warning: ${err.message.substring(0, 100)}`);
                        }
                    }
                }
            }
            console.log(`   ✅ ${file} completed\n`);
        }

        console.log('✅ Database sync complete!');
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

syncDatabase();
