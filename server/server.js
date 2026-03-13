const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// --- AUTH MIDDLEWARE ---
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, username }
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token.' });
    }
}

// --- AUTH ROUTES ---

// Health check (no auth)
app.get('/api/health', (req, res) => {
    res.json({ status: 'API is running' });
});

// Signup
app.post('/api/auth/signup', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    try {
        // Check if username exists
        const existing = await db.query('SELECT id FROM users WHERE username = $1', [username]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Username already exists.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create user
        const result = await db.query(
            'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at',
            [username, passwordHash]
        );

        const user = result.rows[0];

        // Create default notification preferences for this user
        await db.query(
            'INSERT INTO notification_preferences (email_enabled, budget_alerts, expense_warnings, weekly_summary, daily_threshold, user_id) VALUES (false, true, true, true, 1000, $1)',
            [user.id]
        );

        // Generate JWT
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            message: 'Account created successfully',
            token,
            user: { id: user.id, username: user.username }
        });
    } catch (err) {
        console.error('Signup error:', err.message);
        res.status(500).json({ error: 'Server error during signup.' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    try {
        // Find user
        const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        const user = result.rows[0];

        // Compare password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        // Generate JWT
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, username: user.username }
        });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ error: 'Server error during login.' });
    }
});

// Unified Authenticate (Signup or Login)
app.post('/api/auth/authenticate', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    try {
        // Special case for 'guest' (Skip button)
        if (username === 'guest' && password === 'guest') {
            const guestRes = await db.query("SELECT * FROM users WHERE username = 'guest'");
            let user;
            if (guestRes.rows.length === 0) {
                const signupResult = await db.query(
                    "INSERT INTO users (username, password_hash) VALUES ('guest', 'skip_mode') RETURNING id, username"
                );
                user = signupResult.rows[0];
                await db.query(
                    'INSERT INTO notification_preferences (email_enabled, budget_alerts, expense_warnings, weekly_summary, daily_threshold, user_id) VALUES (false, true, true, true, 1000, $1)',
                    [user.id]
                );
            } else {
                user = guestRes.rows[0];
            }
            const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
            return res.json({ message: 'Skip mode (Guest) enabled', token, user: { id: user.id, username: user.username } });
        }

        // Find regular user
        const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);

        if (result.rows.length === 0) {
            // --- SIGNUP LOGIC ---
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            const signupResult = await db.query(
                'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
                [username, passwordHash]
            );

            const newUser = signupResult.rows[0];

            // Create default notification preferences
            await db.query(
                'INSERT INTO notification_preferences (email_enabled, budget_alerts, expense_warnings, weekly_summary, daily_threshold, user_id) VALUES (false, true, true, true, 1000, $1)',
                [newUser.id]
            );

            const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET, { expiresIn: '7d' });

            return res.status(201).json({
                message: 'Account created and logged in',
                token,
                user: { id: newUser.id, username: newUser.username }
            });
        } else {
            // --- LOGIN LOGIC ---
            const user = result.rows[0];

            // If they happen to use 'guest' as username but wrong password
            if (user.username === 'guest' && password !== 'guest') {
                return res.status(401).json({ error: 'Invalid password.' });
            }

            const validPassword = await bcrypt.compare(password, user.password_hash);

            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid password for existing user.' });
            }

            const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

            return res.json({
                message: 'Login successful',
                token,
                user: { id: user.id, username: user.username }
            });
        }
    } catch (err) {
        console.error('Authentication error:', err.message);
        res.status(500).json({ error: 'Server error during authentication.' });
    }
});

// Verify token (check if still valid)
app.get('/api/auth/verify', authenticateToken, (req, res) => {
    res.json({ valid: true, user: req.user });
});

// ============================
// ALL ROUTES BELOW REQUIRE AUTH
// ============================

// --- EXPENSE ENDPOINTS ---

// Get all expenses with optional filtering/searching
app.get('/api/expenses', authenticateToken, async (req, res) => {
    const { category, paymentMethod, search, startDate, endDate } = req.query;
    let query = `SELECT * FROM expenses WHERE user_id = $1`;
    const params = [req.user.id];

    if (category) {
        params.push(category);
        query += ` AND category_name = $${params.length}`;
    }
    if (paymentMethod) {
        params.push(paymentMethod);
        query += ` AND payment_method = $${params.length}`;
    }
    if (search) {
        params.push(`%${search}%`);
        query += ` AND (note ILIKE $${params.length} OR category_name ILIKE $${params.length})`;
    }
    if (startDate) {
        params.push(startDate);
        query += ` AND transaction_date >= $${params.length}`;
    }
    if (endDate) {
        params.push(endDate);
        query += ` AND transaction_date <= $${params.length}::date + interval '1 day'`;
    }

    query += ` ORDER BY transaction_date DESC`;

    try {
        const response = await db.query(query, params);
        res.json(response.rows);
    } catch (err) {
        console.error('Error fetching expenses:', err.message);
        res.status(500).json({ error: 'Server error fetching expenses' });
    }
});

// Get summary data (total and category-wise)
app.get('/api/expenses/summary', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Total spent this month
        const totalMonthRes = await db.query(`
            SELECT SUM(amount) as total 
            FROM expenses 
            WHERE date_trunc('month', transaction_date) = date_trunc('month', CURRENT_DATE) AND user_id = $1
        `, [userId]);

        // Total today
        const totalTodayRes = await db.query(`
            SELECT SUM(amount) as total 
            FROM expenses 
            WHERE transaction_date::date = CURRENT_DATE AND user_id = $1
        `, [userId]);

        // Transactions this month
        const countRes = await db.query(`
            SELECT COUNT(*) as count 
            FROM expenses 
            WHERE date_trunc('month', transaction_date) = date_trunc('month', CURRENT_DATE) AND user_id = $1
        `, [userId]);

        // Category-wise totals
        const categoryRes = await db.query(`
            SELECT category_name as name, SUM(amount) as value
            FROM expenses
            WHERE date_trunc('month', transaction_date) = date_trunc('month', CURRENT_DATE) AND user_id = $1
            GROUP BY category_name
            ORDER BY value DESC
        `, [userId]);

        // Weekly breakdown
        const weeklyRes = await db.query(`
            SELECT 
                EXTRACT(WEEK FROM transaction_date) - EXTRACT(WEEK FROM date_trunc('month', CURRENT_DATE)) + 1 as week,
                SUM(amount) as total
            FROM expenses
            WHERE date_trunc('month', transaction_date) = date_trunc('month', CURRENT_DATE) AND user_id = $1
            GROUP BY week
            ORDER BY week
        `, [userId]);

        res.json({
            totalMonthly: parseFloat(totalMonthRes.rows[0].total || 0),
            totalToday: parseFloat(totalTodayRes.rows[0].total || 0),
            transactionCount: parseInt(countRes.rows[0].count || 0),
            categoryTotals: categoryRes.rows.map(row => ({
                name: row.name,
                value: parseFloat(row.value)
            })),
            weeklyData: weeklyRes.rows.map(row => ({
                name: `Week ${row.week}`,
                amount: parseFloat(row.total)
            }))
        });
    } catch (err) {
        console.error('Error fetching summary:', err.message);
        res.status(500).json({ error: 'Server error fetching summary' });
    }
});

// Save a new expense
app.post('/api/expenses', authenticateToken, async (req, res) => {
    const { categoryId, categoryName, amount, note, paymentMethod, transactionDate } = req.body;

    if (!amount || !categoryId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const response = await db.query(
            `INSERT INTO expenses (category_id, category_name, amount, note, payment_method, transaction_date, user_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [categoryId, categoryName, amount, note, paymentMethod, transactionDate || new Date(), req.user.id]
        );
        res.status(201).json({ message: 'Expense saved successfully', data: response.rows[0] });
    } catch (err) {
        console.error('Error saving expense:', err.message);
        res.status(500).json({ error: 'Database connection error' });
    }
});

// Update an expense
app.put('/api/expenses/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { categoryId, categoryName, amount, note, paymentMethod, transactionDate } = req.body;

    try {
        const response = await db.query(
            `UPDATE expenses 
             SET category_id = $1, category_name = $2, amount = $3, note = $4, payment_method = $5, transaction_date = $6
             WHERE id = $7 AND user_id = $8 RETURNING *`,
            [categoryId, categoryName, amount, note, paymentMethod, transactionDate, id, req.user.id]
        );

        if (response.rowCount === 0) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        res.json({ message: 'Expense updated successfully', data: response.rows[0] });
    } catch (err) {
        console.error('Error updating expense:', err.message);
        res.status(500).json({ error: 'Server error updating expense' });
    }
});

// Delete an expense
app.delete('/api/expenses/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        const response = await db.query('DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING *', [id, req.user.id]);

        if (response.rowCount === 0) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        res.json({ message: 'Expense deleted successfully' });
    } catch (err) {
        console.error('Error deleting expense:', err.message);
        res.status(500).json({ error: 'Server error deleting expense' });
    }
});

// --- BUDGET ENDPOINTS ---

// Get budget status for current month
app.get('/api/budgets/status', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const currentMonth = new Date().toISOString().slice(0, 7) + '-01';

        const budgetsRes = await db.query(
            'SELECT category_name, amount FROM budgets WHERE month_year = $1 AND user_id = $2',
            [currentMonth, userId]
        );

        const spendingRes = await db.query(`
            SELECT category_name, SUM(amount) as spent 
            FROM expenses 
            WHERE date_trunc('month', transaction_date) = $1 AND user_id = $2
            GROUP BY category_name
        `, [currentMonth, userId]);

        const spending = spendingRes.rows;
        const totalSpentAllCategories = spending.reduce((sum, s) => sum + parseFloat(s.spent), 0);

        const status = budgetsRes.rows.map(b => {
            let spent = 0;
            if (b.category_name === 'Total') {
                spent = totalSpentAllCategories;
            } else {
                const s = spending.find(s => s.category_name === b.category_name);
                spent = s ? parseFloat(s.spent) : 0;
            }

            return {
                category: b.category_name,
                budget: parseFloat(b.amount),
                spent: spent
            };
        });

        spending.forEach(s => {
            if (!status.find(st => st.category === s.category_name)) {
                status.push({
                    category: s.category_name,
                    budget: 0,
                    spent: parseFloat(s.spent)
                });
            }
        });

        if (!status.find(st => st.category === 'Total')) {
            status.unshift({
                category: 'Total',
                budget: 0,
                spent: totalSpentAllCategories
            });
        }

        res.json(status);
    } catch (err) {
        console.error('Error fetching budget status:', err.message);
        res.status(500).json({ error: 'Server error fetching budget status' });
    }
});

// Set or Update a budget
app.post('/api/budgets', authenticateToken, async (req, res) => {
    const { categoryName, amount } = req.body;
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';

    if (!categoryName || amount === undefined) {
        return res.status(400).json({ error: 'categoryName and amount are required' });
    }

    try {
        const result = await db.query(`
            INSERT INTO budgets (category_name, amount, month_year, user_id)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (category_name, month_year, user_id) 
            DO UPDATE SET amount = $2
            RETURNING *
        `, [categoryName, amount, currentMonth, req.user.id]);

        res.json({ message: 'Budget updated', data: result.rows[0] });
    } catch (err) {
        console.error('Error updating budget:', err.message);
        res.status(500).json({ error: 'Server error updating budget' });
    }
});

// Get budget history
app.get('/api/budgets/history', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const historyRes = await db.query(`
            WITH monthly_budgets AS (
                SELECT month_year, SUM(amount) as total_budget
                FROM budgets
                WHERE category_name = 'Total' AND user_id = $1
                GROUP BY month_year
                ORDER BY month_year DESC
                LIMIT 6
            ),
            monthly_spending AS (
                SELECT date_trunc('month', transaction_date) as month_year, SUM(amount) as total_spent
                FROM expenses
                WHERE user_id = $1
                GROUP BY date_trunc('month', transaction_date)
            )
            SELECT 
                mb.month_year,
                mb.total_budget,
                COALESCE(ms.total_spent, 0) as total_spent
            FROM monthly_budgets mb
            LEFT JOIN monthly_spending ms ON mb.month_year = ms.month_year
            ORDER BY mb.month_year ASC
        `, [userId]);

        res.json(historyRes.rows.map(row => {
            const budget = parseFloat(row.total_budget);
            const spent = parseFloat(row.total_spent);
            return {
                month: new Date(row.month_year).toLocaleString('default', { month: 'short', year: 'numeric' }),
                budget: budget,
                spent: spent
            };
        }));
    } catch (err) {
        console.error('Error fetching budget history:', err.message);
        res.status(500).json({ error: 'Server error fetching budget history' });
    }
});

// Budget trend data
app.get('/api/budgets/trend', authenticateToken, async (req, res) => {
    const { period = '30d', category } = req.query;
    const userId = req.user.id;
    try {
        let days;
        switch (period) {
            case '7d': days = 7; break;
            case '6m': days = 180; break;
            default: days = 30;
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        let spendingQuery = `
            SELECT transaction_date::date as date, SUM(amount) as daily_total
            FROM expenses
            WHERE transaction_date >= $1 AND user_id = $2
        `;
        const params = [startDate.toISOString(), userId];

        if (category && category !== 'all') {
            params.push(category);
            spendingQuery += ` AND category_name = $${params.length}`;
        }

        spendingQuery += ` GROUP BY transaction_date::date ORDER BY date ASC`;

        const spendingRes = await db.query(spendingQuery, params);

        const currentMonth = new Date().toISOString().slice(0, 7) + '-01';

        let budgetQuery = `SELECT SUM(amount) as total FROM budgets WHERE month_year = $1 AND user_id = $2`;
        const budgetParams = [currentMonth, userId];

        if (category && category !== 'all') {
            budgetParams.push(category);
            budgetQuery += ` AND category_name = $${budgetParams.length}`;
        } else {
            budgetQuery += ` AND category_name = 'Total'`;
        }

        const budgetRes = await db.query(budgetQuery, budgetParams);
        const totalBudget = parseFloat(budgetRes.rows[0]?.total || 0);
        const dailyBudget = totalBudget / 30;

        let cumulativeSpent = 0;
        let cumulativeBudget = 0;

        const trendData = spendingRes.rows.map(row => {
            cumulativeSpent += parseFloat(row.daily_total);
            cumulativeBudget += dailyBudget;

            return {
                date: new Date(row.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                actual: Math.round(cumulativeSpent),
                budget: Math.round(cumulativeBudget)
            };
        });

        res.json(trendData);
    } catch (err) {
        console.error('Error fetching budget trend:', err.message);
        res.status(500).json({ error: 'Server error fetching budget trend' });
    }
});

// --- MAILJET SETUP ---
let mailjet = null;
if (process.env.MJ_APIKEY_PUBLIC && process.env.MJ_APIKEY_PRIVATE) {
    const Mailjet = require('node-mailjet');
    mailjet = Mailjet.apiConnect(
        process.env.MJ_APIKEY_PUBLIC,
        process.env.MJ_APIKEY_PRIVATE
    );
    console.log('✅ Mailjet configured successfully.');
}

// Helper: Send email via Mailjet
async function sendMailjetEmail(toEmail, subject, textContent, htmlContent) {
    if (!mailjet || !toEmail) {
        console.log('Mailjet not configured or no email address. Skipping email.');
        return null;
    }
    try {
        const result = await mailjet.post('send', { version: 'v3.1' }).request({
            Messages: [{
                From: {
                    Email: process.env.MJ_SENDER_EMAIL || 'noreply@expensemanager.app',
                    Name: 'Expense Manager'
                },
                To: [{ Email: toEmail, Name: 'User' }],
                Subject: subject,
                TextPart: textContent,
                HTMLPart: htmlContent
            }]
        });
        console.log('📧 Email sent successfully via Mailjet.');
        return result.body;
    } catch (err) {
        console.error('Mailjet error:', err.message);
        return null;
    }
}

// Helper: Create notification and optionally send email
async function createNotification(type, category, title, message, userId) {
    try {
        const res = await db.query(
            'INSERT INTO notifications (type, category, title, message, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [type, category, title, message, userId]
        );

        // Check if email notifications are enabled
        const prefsRes = await db.query('SELECT * FROM notification_preferences WHERE user_id = $1 LIMIT 1', [userId]);
        const prefs = prefsRes.rows[0];

        if (prefs && prefs.email_enabled && prefs.email_address) {
            const shouldEmail = (
                (category === 'budget' && prefs.budget_alerts) ||
                (category === 'warning' && prefs.expense_warnings) ||
                (type === 'weekly_summary' && prefs.weekly_summary)
            );

            if (shouldEmail) {
                const htmlContent = `
                    <div style="font-family: 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; background: #0a0a0a; color: #fafafa; border-radius: 16px; overflow: hidden;">
                        <div style="background: #dc2626; padding: 24px 32px;">
                            <h1 style="margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 2px;">EXPENSE MANAGER</h1>
                        </div>
                        <div style="padding: 32px;">
                            <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 800;">${title}</h2>
                            <p style="margin: 0; color: #a1a1aa; font-size: 14px; line-height: 1.6;">${message}</p>
                            <hr style="border: none; border-top: 1px solid #27272a; margin: 24px 0;" />
                            <p style="margin: 0; color: #52525b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">This is an automated alert from your Expense Manager.</p>
                        </div>
                    </div>
                `;
                await sendMailjetEmail(prefs.email_address, `[Expense Manager] ${title}`, message, htmlContent);
            }
        }

        return res.rows[0];
    } catch (err) {
        console.error('Error creating notification:', err.message);
        return null;
    }
}

// --- NOTIFICATION ENDPOINTS ---

// Get all notifications
app.get('/api/notifications', authenticateToken, async (req, res) => {
    const { category } = req.query;
    try {
        let query = 'SELECT * FROM notifications WHERE user_id = $1';
        const params = [req.user.id];
        if (category && category !== 'all') {
            params.push(category);
            query += ` AND category = $${params.length}`;
        }
        query += ' ORDER BY created_at DESC';

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching notifications:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get notification count (unread)
app.get('/api/notifications/unread-count', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT COUNT(*) as count FROM notifications WHERE is_read = false AND user_id = $1', [req.user.id]);
        res.json({ count: parseInt(result.rows[0].count) });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Mark notification as read
app.patch('/api/notifications/:id/read', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
            [req.params.id, req.user.id]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Mark all as read
app.patch('/api/notifications/read-all', authenticateToken, async (req, res) => {
    try {
        await db.query('UPDATE notifications SET is_read = true WHERE is_read = false AND user_id = $1', [req.user.id]);
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete a notification
app.delete('/api/notifications/:id', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *', [req.params.id, req.user.id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ message: 'Notification deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Clear all notifications
app.delete('/api/notifications', authenticateToken, async (req, res) => {
    try {
        await db.query('DELETE FROM notifications WHERE user_id = $1', [req.user.id]);
        res.json({ message: 'All notifications cleared' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// --- NOTIFICATION PREFERENCES ---

// Get preferences
app.get('/api/notification-preferences', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM notification_preferences WHERE user_id = $1 LIMIT 1', [req.user.id]);
        if (result.rows.length === 0) {
            const newRes = await db.query(
                'INSERT INTO notification_preferences (email_enabled, budget_alerts, expense_warnings, weekly_summary, daily_threshold, user_id) VALUES (false, true, true, true, 1000, $1) RETURNING *',
                [req.user.id]
            );
            return res.json(newRes.rows[0]);
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update preferences
app.put('/api/notification-preferences', authenticateToken, async (req, res) => {
    const { email_enabled, email_address, budget_alerts, expense_warnings, weekly_summary, daily_threshold } = req.body;
    try {
        const result = await db.query(`
            UPDATE notification_preferences 
            SET email_enabled = COALESCE($1, email_enabled),
                email_address = COALESCE($2, email_address),
                budget_alerts = COALESCE($3, budget_alerts),
                expense_warnings = COALESCE($4, expense_warnings),
                weekly_summary = COALESCE($5, weekly_summary),
                daily_threshold = COALESCE($6, daily_threshold),
                updated_at = NOW()
            WHERE user_id = $7
            RETURNING *
        `, [email_enabled, email_address, budget_alerts, expense_warnings, weekly_summary, daily_threshold, req.user.id]);

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating preferences:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- AUTO-CHECK: Generate notifications when expenses are added ---
app.post('/api/notifications/check', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
        const notifications = [];

        // 1. Check total budget
        const budgetRes = await db.query(
            'SELECT amount FROM budgets WHERE category_name = $1 AND month_year = $2 AND user_id = $3',
            ['Total', currentMonth, userId]
        );
        const totalBudget = budgetRes.rows[0] ? parseFloat(budgetRes.rows[0].amount) : 0;

        const spentRes = await db.query(`
            SELECT SUM(amount) as total FROM expenses 
            WHERE date_trunc('month', transaction_date) = $1 AND user_id = $2
        `, [currentMonth, userId]);
        const totalSpent = parseFloat(spentRes.rows[0].total || 0);

        if (totalBudget > 0) {
            const percent = (totalSpent / totalBudget) * 100;

            if (percent >= 100) {
                const existing = await db.query(
                    "SELECT id FROM notifications WHERE type = 'budget_exceeded' AND created_at > CURRENT_DATE AND user_id = $1",
                    [userId]
                );
                if (existing.rows.length === 0) {
                    const overAmount = (totalSpent - totalBudget).toFixed(0);
                    const n = await createNotification(
                        'budget_exceeded', 'budget',
                        'Budget Exceeded!',
                        `You spent ₹${overAmount} more than your planned budget of ₹${totalBudget.toLocaleString()} this month.`,
                        userId
                    );
                    if (n) notifications.push(n);
                }
            } else if (percent >= 80) {
                const existing = await db.query(
                    "SELECT id FROM notifications WHERE type = 'budget_reached' AND created_at > CURRENT_DATE AND user_id = $1",
                    [userId]
                );
                if (existing.rows.length === 0) {
                    const n = await createNotification(
                        'budget_reached', 'budget',
                        'Budget Limit Almost Reached',
                        `You have used ${percent.toFixed(0)}% of your monthly budget (₹${totalSpent.toLocaleString()} / ₹${totalBudget.toLocaleString()}).`,
                        userId
                    );
                    if (n) notifications.push(n);
                }
            }
        }

        // 2. Check daily spending threshold
        const prefsRes = await db.query('SELECT * FROM notification_preferences WHERE user_id = $1 LIMIT 1', [userId]);
        const prefs = prefsRes.rows[0];
        const dailyThreshold = prefs ? parseFloat(prefs.daily_threshold) : 1000;

        const todaySpentRes = await db.query(`
            SELECT SUM(amount) as total FROM expenses 
            WHERE transaction_date::date = CURRENT_DATE AND user_id = $1
        `, [userId]);
        const todaySpent = parseFloat(todaySpentRes.rows[0].total || 0);

        if (todaySpent > dailyThreshold) {
            const existing = await db.query(
                "SELECT id FROM notifications WHERE type = 'high_spending' AND created_at > CURRENT_DATE AND user_id = $1",
                [userId]
            );
            if (existing.rows.length === 0) {
                const n = await createNotification(
                    'high_spending', 'warning',
                    'High Daily Spending Alert',
                    `You spent ₹${todaySpent.toLocaleString()} today, exceeding your daily threshold of ₹${dailyThreshold.toLocaleString()}.`,
                    userId
                );
                if (n) notifications.push(n);
            }
        }

        // 3. Check per-category budgets
        const catBudgets = await db.query(
            "SELECT category_name, amount FROM budgets WHERE month_year = $1 AND category_name != 'Total' AND user_id = $2",
            [currentMonth, userId]
        );
        const catSpending = await db.query(`
            SELECT category_name, SUM(amount) as spent FROM expenses 
            WHERE date_trunc('month', transaction_date) = $1 AND user_id = $2
            GROUP BY category_name
        `, [currentMonth, userId]);

        for (const cb of catBudgets.rows) {
            const spending = catSpending.rows.find(s => s.category_name === cb.category_name);
            if (spending && parseFloat(spending.spent) >= parseFloat(cb.amount)) {
                const existing = await db.query(
                    "SELECT id FROM notifications WHERE type = 'budget_reached' AND title LIKE $1 AND created_at > CURRENT_DATE AND user_id = $2",
                    [`%${cb.category_name}%`, userId]
                );
                if (existing.rows.length === 0) {
                    const n = await createNotification(
                        'budget_reached', 'budget',
                        `${cb.category_name} Budget Limit Hit`,
                        `You have exhausted your ₹${parseFloat(cb.amount).toLocaleString()} ${cb.category_name.toLowerCase()} budget for this month.`,
                        userId
                    );
                    if (n) notifications.push(n);
                }
            }
        }

        res.json({ checked: true, newNotifications: notifications.length, notifications });
    } catch (err) {
        console.error('Error checking notifications:', err.message);
        res.status(500).json({ error: 'Server error checking notifications' });
    }
});

// Send test email
app.post('/api/notifications/test-email', authenticateToken, async (req, res) => {
    try {
        const prefsRes = await db.query('SELECT * FROM notification_preferences WHERE user_id = $1 LIMIT 1', [req.user.id]);
        const prefs = prefsRes.rows[0];

        if (!prefs || !prefs.email_address) {
            return res.status(400).json({ error: 'No email address configured' });
        }

        const htmlContent = `
            <div style="font-family: 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; background: #0a0a0a; color: #fafafa; border-radius: 16px; overflow: hidden;">
                <div style="background: #dc2626; padding: 24px 32px;">
                    <h1 style="margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 2px;">EXPENSE MANAGER</h1>
                </div>
                <div style="padding: 32px;">
                    <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 800;">✅ Email Notifications Working!</h2>
                    <p style="margin: 0; color: #a1a1aa; font-size: 14px; line-height: 1.6;">This is a test email from your Expense Manager app. If you're reading this, your Mailjet integration is working correctly.</p>
                    <hr style="border: none; border-top: 1px solid #27272a; margin: 24px 0;" />
                    <p style="margin: 0; color: #52525b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Automated test • Expense Manager</p>
                </div>
            </div>
        `;

        const result = await sendMailjetEmail(
            prefs.email_address,
            '[Expense Manager] Test Notification',
            'This is a test email from your Expense Manager app.',
            htmlContent
        );

        if (result) {
            res.json({ message: 'Test email sent successfully' });
        } else {
            res.status(500).json({ error: 'Failed to send email. Check Mailjet configuration.' });
        }
    } catch (err) {
        console.error('Error sending test email:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
