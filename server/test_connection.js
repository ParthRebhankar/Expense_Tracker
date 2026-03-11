const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkConnection() {
    try {
        console.log('--- Database Connection Diagnostic ---');
        const res = await pool.query('SELECT current_database(), current_user');
        console.log('✅ Connection Successful!');

        const tables = ['expenses', 'budgets'];
        for (const table of tables) {
            const tableRes = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);

            if (tableRes.rows[0].exists) {
                console.log(`✅ Table "${table}" found.`);
            } else {
                console.log(`❌ Table "${table}" NOT found.`);
            }
        }

    } catch (err) {
        console.log('❌ Connection Failed!');
        console.log('Error Message:', err.message);
    } finally {
        await pool.end();
    }
}

checkConnection();
