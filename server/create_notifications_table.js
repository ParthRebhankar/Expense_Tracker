const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function createTables() {
    try {
        // Notifications table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                type TEXT NOT NULL,
                category TEXT NOT NULL DEFAULT 'system',
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Table "notifications" created successfully.');

        // Notification preferences table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS notification_preferences (
                id SERIAL PRIMARY KEY,
                email_enabled BOOLEAN DEFAULT false,
                email_address TEXT,
                budget_alerts BOOLEAN DEFAULT true,
                expense_warnings BOOLEAN DEFAULT true,
                weekly_summary BOOLEAN DEFAULT true,
                daily_threshold NUMERIC(10, 2) DEFAULT 1000,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Table "notification_preferences" created successfully.');

        // Insert default preferences if none exist
        const existing = await pool.query('SELECT COUNT(*) FROM notification_preferences');
        if (parseInt(existing.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO notification_preferences (email_enabled, budget_alerts, expense_warnings, weekly_summary, daily_threshold)
                VALUES (false, true, true, true, 1000)
            `);
            console.log('✅ Default notification preferences inserted.');
        }

        // Seed some sample notifications
        const notifCount = await pool.query('SELECT COUNT(*) FROM notifications');
        if (parseInt(notifCount.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO notifications (type, category, title, message, is_read, created_at) VALUES
                ('budget_reached', 'budget', 'Budget Limit Reached', 'You have used 100% of your monthly budget of ₹10,000.', false, NOW() - INTERVAL '1 hour'),
                ('budget_exceeded', 'budget', 'Budget Exceeded!', 'You spent ₹800 more than your planned budget this month.', false, NOW() - INTERVAL '3 hours'),
                ('high_spending', 'warning', 'High Spending Alert', 'Your food expenses surged by 45% compared to last week.', false, NOW() - INTERVAL '6 hours'),
                ('reminder', 'system', 'Monthly Review Reminder', 'The month is almost over — review your March expenses before it ends.', true, NOW() - INTERVAL '1 day'),
                ('weekly_summary', 'system', 'Weekly Spending Summary', 'Your total spending this week was ₹2,450. Top category: Food (₹980).', true, NOW() - INTERVAL '2 days'),
                ('high_spending', 'warning', 'Unusual Shopping Spree', 'Your shopping expenses this week are 3x higher than your monthly average.', false, NOW() - INTERVAL '4 hours'),
                ('budget_reached', 'budget', 'Food Budget Limit Hit', 'You have exhausted your ₹3,000 food budget for this month.', false, NOW() - INTERVAL '12 hours')
            `);
            console.log('✅ Sample notifications seeded.');
        }

    } catch (err) {
        console.error('❌ Error creating tables:', err.message);
    } finally {
        await pool.end();
    }
}

createTables();
