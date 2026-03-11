const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function createTable() {
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id SERIAL PRIMARY KEY,
        category_name TEXT NOT NULL,
        amount NUMERIC(10, 2) NOT NULL,
        month_year DATE NOT NULL,
        UNIQUE(category_name, month_year)
      );
    `);
        console.log('✅ Table "budgets" created successfully.');
    } catch (err) {
        console.error('❌ Error creating table:', err.message);
    } finally {
        await pool.end();
    }
}

createTable();
