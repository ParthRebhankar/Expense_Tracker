const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  user: !process.env.DATABASE_URL ? process.env.DB_USER : undefined,
  host: !process.env.DATABASE_URL ? process.env.DB_HOST : undefined,
  database: !process.env.DATABASE_URL ? process.env.DB_NAME : undefined,
  password: !process.env.DATABASE_URL ? process.env.DB_PASSWORD : undefined,
  port: !process.env.DATABASE_URL ? process.env.DB_PORT : undefined,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};

/* 
  PostgreSQL Table Creation Script:
  
  CREATE DATABASE expense_tracker;

  CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    category_id INT,
    category_name TEXT,
    amount NUMERIC(10, 2),
    note TEXT,
    payment_method TEXT,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE budgets (
    id SERIAL PRIMARY KEY,
    category_name TEXT NOT NULL, -- 'Total' for overall budget or specific category name
    amount NUMERIC(10, 2) NOT NULL,
    month_year DATE NOT NULL, -- Stored as the first day of the month (e.g., '2026-03-01')
    UNIQUE(category_name, month_year)
  );
*/
