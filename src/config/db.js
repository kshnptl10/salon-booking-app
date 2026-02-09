// src/config/db.js

const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const connectionConfig = {
    connectionString: process.env.DATABASE_URL, // This reads the long URL from Render/Neon
    ssl: isProduction ? { rejectUnauthorized: false } : false // REQUIRED for Cloud DBs
};

const pool = new Pool(connectionConfig);

// const pool = new Pool({
//     user: 'postgres',
//     host: 'localhost',
//     database: 'salon_booking',
//     password: 'K!shan08', 
//     port: 5432
// });

// Optional: Test connection on startup
pool.on('connect', () => {
    console.log('✅ Database connected successfully!');
});

pool.on('error', (err) => {
    console.error('❌ Database connection error:', err);
});

module.exports = pool;