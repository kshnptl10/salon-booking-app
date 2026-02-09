const pool = require('../config/db');

exports.rescheduleAppointment = async (req, res) => {
    const appointmentId = req.params.id;
    const { newDate, newTime } = req.body;
    
    if (!newDate || !newTime) {
        return res.status(400).json({ message: "New date and time are required." });
    }
    
    const newDateTime = new Date(`${newDate}T${newTime}:00`);
    
    if (newDateTime < new Date()) {
        return res.status(400).json({ message: "Cannot reschedule to a past date or time." });
    }

    try {
        const result = await pool.query(
            `UPDATE appointments 
     SET appointment_date = $1, 
         appointment_time = $2,
         updated_at = NOW()
     WHERE id = $3 
     AND status_id NOT IN (
         SELECT id FROM appointment_status 
         WHERE status_name ILIKE 'Completed' 
            OR status_name ILIKE 'Cancelled'
     )
     RETURNING id`, 
            [newDate, newTime, appointmentId]
        );
        
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Appointment not found or cannot be rescheduled." });
        }

        res.json({ 
            success: true, 
            message: "Appointment rescheduled successfully.", 
            appointmentId: appointmentId 
        });

    } catch (err) {
        console.error("Error rescheduling appointment:", err.message);
        res.status(500).json({ message: "Server error during rescheduling." });
    }
};

exports.getAvailableTimeSlots = async (req, res) => {
    // We add 'appointmentId' to the required parameters
    const { salonId, date, appointmentId } = req.query;

    if (!salonId || !date || !appointmentId) {
        return res.status(400).json({ error: 'Missing salonId, date, or appointmentId query parameter.' });
    }

    try {
        const result = await pool.query(
            `
    WITH 
    rules AS (
        SELECT slot_duration, COALESCE(buffer_time, 0) AS buffer_time, slot_capacity 
        FROM slot_configs 
        WHERE salon_id = $1
    ),
    hours AS (
        SELECT opening_time, closing_time FROM salons WHERE salon_id = $1
    ),
    day_status AS (
        SELECT is_open 
        FROM time_slots 
        WHERE salon_id = $1 
        AND (
            TRIM(CAST(day_of_week AS TEXT)) = CAST(EXTRACT(DOW FROM $2::DATE) AS TEXT)
            OR 
            LOWER(TRIM(day_of_week)) = LOWER(TRIM(TO_CHAR($2::DATE, 'Day')))
        )
    ),
    raw_slots AS (
        SELECT generate_series(
            ($2::date + (SELECT opening_time FROM hours)), 
            ($2::date + (SELECT closing_time FROM hours)) - ((SELECT slot_duration FROM rules) * INTERVAL '1 minute'), 
            (COALESCE((SELECT slot_duration FROM rules), 30) + COALESCE((SELECT buffer_time FROM rules), 0)) * INTERVAL '1 minute'
        )::time AS slot_time
        WHERE EXISTS (SELECT 1 FROM day_status WHERE is_open = TRUE)
    )
    SELECT rs.slot_time
    FROM raw_slots rs
    LEFT JOIN appointments a 
        ON a.salon_id = $1 
        AND a.appointment_date = $2 
        AND a.appointment_time = rs.slot_time
        AND a.status_id IN (SELECT id FROM appointment_status WHERE status_name IN ('Pending', 'Confirmed'))
        AND a.id != $3  -- 👈 KEY CHANGE: Ignore the appointment being rescheduled
    GROUP BY rs.slot_time
    HAVING COUNT(a.id) < (SELECT slot_capacity FROM rules)
    ORDER BY rs.slot_time ASC;
            `,
            [salonId, date, appointmentId] // Pass appointmentId as $3
        );

        // Return the clean list of slots
        // The frontend expects { success: true, slots: [...] } based on your previous code
        res.json({ success: true, slots: result.rows.map(row => row.slot_time) });

    } catch (err) {
        console.error("Error fetching reschedule slots:", err.message);
        res.status(500).json({ error: 'Server error fetching time slots.' });
    }
};

exports.cancelAppointment = async (req, res) => {
    const appointmentId = req.params.id;

    try {
        const query = `
            UPDATE appointments 
            SET 
                status_id = (SELECT id FROM appointment_status WHERE status_name ILIKE 'Cancelled'),
                updated_at = NOW()
            WHERE id = $1 
            AND status_id IN (
                SELECT id FROM appointment_status 
                WHERE status_name ILIKE 'Pending' 
                   OR status_name ILIKE 'Confirmed'
            )
            RETURNING id;
        `;

        const result = await pool.query(query, [appointmentId]);

        if (result.rowCount === 0) {
            return res.status(400).json({ 
                message: "Appointment cannot be cancelled (it may already be completed or cancelled)." 
            });
        }

        res.json({ success: true, message: "Appointment cancelled successfully." });

    } catch (err) {
        console.error("Cancel Controller Error:", err.message);
        res.status(500).json({ message: "Server error during cancellation." });
    }
};