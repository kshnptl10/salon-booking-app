const { Pool } = require('pg');
require('dotenv').config();

// 1. Get the connection string from the environment
const connectionString = process.env.DATABASE_URL;

// 2. Log status (Helps debugging logs in Render)
if (!connectionString) {
    console.error("❌ FATAL ERROR: DATABASE_URL is missing! Defaulting to localhost (Will fail on Cloud).");
} else {
    console.log("✅ Found DATABASE_URL. Connecting to Cloud DB...");
}

// 3. Configure the Pool
const pool = new Pool({
    connectionString: connectionString,
    // SSL is REQUIRED for Neon. We enable it if a connection string exists.
    ssl: connectionString ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('❌ Database Error:', err);
});

module.exports = pool;