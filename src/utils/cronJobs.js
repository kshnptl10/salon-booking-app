const cron = require('node-cron');
const pool = require('../config/db');

// Schedule: Runs every day at 00:01 (1 minute past midnight)
// Format: (minute hour day month day-of-week)
cron.schedule('1 0 * * *', async () => {
    console.log('--- 🕒 Running Auto-Cancel Task for Past Appointments ---');
    
    try {
        const query = `
            UPDATE appointments 
    SET status_id = (SELECT id FROM appointment_status WHERE status_name ILIKE 'Cancelled'),
        updated_at = NOW()
    WHERE appointment_date < CURRENT_DATE
    AND status_id IN (
        SELECT id FROM appointment_status 
        WHERE status_name ILIKE 'Pending' 
           OR status_name ILIKE 'Confirmed'
            );
        `;

        const result = await pool.query(query);
        console.log(`✅ Successfully auto-cancelled ${result.rowCount} expired appointments.`);
    } catch (err) {
        console.error('❌ Error in Auto-Cancel Cron Job:', err.message);
    }
});