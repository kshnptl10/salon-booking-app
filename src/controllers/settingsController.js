const pool = require('../config/db');

// 1. GET SETTINGS
exports.getSettings = async (req, res) => {
    try {
        // We always fetch the row with ID = 1
        const result = await pool.query('SELECT * FROM settings WHERE id = 1');
        
        if (result.rows.length === 0) {
            // Fallback if table is empty
            return res.json({ 
                platform_name: 'Salon Booking', 
                currency: 'INR', 
                tax_percentage: 18 
            });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Get Settings Error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// 2. UPDATE SETTINGS
exports.updateSettings = async (req, res) => {
    const {
        platform_name, timezone, currency,
        advance_booking_days, allow_cancellation, cancellation_window_hours,
        payment_mode, tax_percentage, enable_invoices,
        email_notifications, sms_notifications
    } = req.body;

    try {
        const query = `
            UPDATE settings SET
                platform_name = $1, timezone = $2, currency = $3,
                advance_booking_days = $4, allow_cancellation = $5, cancellation_window_hours = $6,
                payment_mode = $7, tax_percentage = $8, enable_invoices = $9,
                email_notifications = $10, sms_notifications = $11,
                updated_at = NOW()
            WHERE id = 1
            RETURNING *
        `;

        const values = [
            platform_name, timezone, currency,
            advance_booking_days, allow_cancellation, cancellation_window_hours,
            payment_mode, tax_percentage, enable_invoices,
            email_notifications, sms_notifications
        ];

        const result = await pool.query(query, values);
        res.json({ success: true, settings: result.rows[0], message: "Settings saved successfully" });

    } catch (err) {
        console.error("Update Settings Error:", err);
        res.status(500).json({ message: "Server error updating settings" });
    }
};