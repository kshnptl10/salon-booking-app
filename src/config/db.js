// src/config/db.js

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // REQUIRED for cloud databases (Neon/Render)
    }
});

// const pool = new Pool({
//     user: 'postgres',
//     host: 'localhost',
//     database: 'salon_booking',
//     password: 'K!shan08', 
//     port: 5432
// });

// Optional: Test connection on startup
pool.connect((err, client, done) => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Successfully connected to PostgreSQL database.');
    done();
});

module.exports = pool;