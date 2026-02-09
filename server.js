// server.js
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');

// Import configuration and routes
const pool = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const customerRoutes = require('./src/routes/customerRoutes');
const appointmentRoutes = require('./src/routes/appointmentRoutes');
const searchRoutes = require('./src/routes/searchRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');

// Import authentication middlewares
const { checkAuthentication, checkCustomerAuthentication } = require('./src/middleware/auth');

const app = express();
const PORT = 3000;

require('./src/utils/cronJobs');

// --- 1. Global Middleware Setup ---
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// Standard cache control middleware
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});

// --- 2. Session Configuration ---
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_strong_secret_key_here',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production', 
        maxAge: 1000 * 60 * 60 * 24 
    }
}));

// --- 3. URL Cleanup Middleware (MOVED HERE) ---
// This forces any request with .html to redirect to the clean version
// Example: /sign-in.html -> Redirects to /sign-in
app.use((req, res, next) => {
    if (req.path.endsWith('.html')) {
        const newUrl = req.originalUrl.replace(/\.html($|\?)/, '$1');
        return res.redirect(301, newUrl);    }
    next();
});

// --- 4. API & Route Mounting ---
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/appointments', appointmentRoutes); 
app.use('/api/payment', paymentRoutes);
app.use('/api', searchRoutes);

// Handles root-level auth like /sign-in, /logout
app.use('/', authRoutes); 

// --- 5. Protected Page Handlers ---
// Customer Dashboard
app.get('/c_dashboard', checkCustomerAuthentication, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'customer', 'c_dashboard.html'));
});

// Admin Dashboard
app.get('/dashboard', checkAuthentication, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'manager', 'dashboard.html'));
});

// Superadmin Dashboard
app.get('/superadmin-dashboard', checkAuthentication, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'superadmin-dashboard.html'));
});

// --- 6. Unprotected Page Handlers ---
app.get('/c_login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'customer', 'c_login.html'));
});

app.use('/defaults', express.static(path.join(__dirname, 'public', 'uploads', 'salons', 'defaults')));
// --- 7. Static File Serving ---
app.use(express.static(path.join(__dirname, 'public'), {
    extensions: ['html', 'htm'] 
}));

// --- 8. Error Handling ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Something went wrong on the server!' });
});

// --- 9. Start Server ---
app.listen(PORT, () => {
    console.log(`\n================================================`);
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📅 Current Date: ${new Date().toLocaleString()}`);
    console.log(`================================================\n`);
});