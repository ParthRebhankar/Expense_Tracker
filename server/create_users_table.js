const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function migrate() {
    try {
        // 1. Create users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Table "users" created.');

        // 2. Add user_id column to expenses (if not exists)
        const expCol = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'expenses' AND column_name = 'user_id'
        `);
        if (expCol.rows.length === 0) {
            await pool.query('ALTER TABLE expenses ADD COLUMN user_id INTEGER REFERENCES users(id)');
            console.log('✅ Added user_id to expenses.');
        } else {
            console.log('ℹ️  expenses.user_id already exists.');
        }

        // 3. Add user_id column to budgets (if not exists)
        const budCol = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'budgets' AND column_name = 'user_id'
        `);
        if (budCol.rows.length === 0) {
            await pool.query('ALTER TABLE budgets ADD COLUMN user_id INTEGER REFERENCES users(id)');
            // Drop old unique constraint and create new one with user_id
            await pool.query('ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_category_name_month_year_key');
            await pool.query('ALTER TABLE budgets ADD CONSTRAINT budgets_category_user_month_unique UNIQUE(category_name, month_year, user_id)');
            console.log('✅ Added user_id to budgets + updated unique constraint.');
        } else {
            console.log('ℹ️  budgets.user_id already exists.');
        }

        // 4. Add user_id column to notifications (if not exists)
        const notifCol = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'notifications' AND column_name = 'user_id'
        `);
        if (notifCol.rows.length === 0) {
            await pool.query('ALTER TABLE notifications ADD COLUMN user_id INTEGER REFERENCES users(id)');
            console.log('✅ Added user_id to notifications.');
        } else {
            console.log('ℹ️  notifications.user_id already exists.');
        }

        // 5. Add user_id column to notification_preferences (if not exists)
        const prefCol = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'notification_preferences' AND column_name = 'user_id'
        `);
        if (prefCol.rows.length === 0) {
            await pool.query('ALTER TABLE notification_preferences ADD COLUMN user_id INTEGER REFERENCES users(id)');
            console.log('✅ Added user_id to notification_preferences.');
        } else {
            console.log('ℹ️  notification_preferences.user_id already exists.');
        }

        console.log('\n🎉 Migration complete!');
    } catch (err) {
        console.error('❌ Migration error:', err.message);
    } finally {
        await pool.end();
    }
}

migrate();
