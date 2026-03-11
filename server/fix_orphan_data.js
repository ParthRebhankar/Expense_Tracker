const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function fixData() {
    try {
        // 1. Ensure a 'guest' user exists
        const guestCheck = await pool.query("SELECT id FROM users WHERE username = 'guest'");
        let guestId;

        if (guestCheck.rows.length === 0) {
            const signupRes = await pool.query(
                "INSERT INTO users (username, password_hash) VALUES ('guest', 'guest_dummy_hash') RETURNING id"
            );
            guestId = signupRes.rows[0].id;
            console.log('✅ Created guest user.');
        } else {
            guestId = guestCheck.rows[0].id;
        }

        // 2. Assign all NULL user_id records to guestId
        const tables = ['expenses', 'budgets', 'notifications', 'notification_preferences'];

        for (const table of tables) {
            const res = await pool.query(`UPDATE ${table} SET user_id = $1 WHERE user_id IS NULL`, [guestId]);
            console.log(`✅ Updated ${res.rowCount} records in ${table}.`);
        }

        console.log('\n🎉 Data fix complete!');
    } catch (err) {
        console.error('❌ Error fixing data:', err.message);
    } finally {
        await pool.end();
    }
}

fixData();
