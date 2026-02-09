// src/controllers/customerController.js

const pool = require('../config/db');

// --- 1. Get Nearby Salons ---
exports.getSalons = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                S.salon_id, 
                S.salon_name, 
                S.address, 
                S.city,
                S.image_url,
                S.parent_id,
                s.branch_name
            FROM salons S
            WHERE 
                -- Condition 1: It is a branch (It has a parent)
                S.parent_id IS NOT NULL
                
                OR 
                
                -- Condition 2: It is a standalone salon (No parent AND No children)
                (
                    S.parent_id IS NULL 
                    AND NOT EXISTS (
                        SELECT 1 FROM salons child WHERE child.parent_id = S.salon_id
                    )
                )
            ORDER BY S.city ASC, S.salon_name ASC 
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching salons:", err.message);
        res.status(500).send('Server Error');
    }
};

exports.getNearbySalons = async (req, res) => {
    const { lat, lng } = req.query;

    try {
        let query;
        let params = [];

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);

        if (!isNaN(latitude) && !isNaN(longitude)) {
            // OPTIMIZATION: Create a "Bounding Box" of ~0.5 degrees (approx 50km)
            // This filters out 99% of salons INSTANTLY before running the heavy math.
            const roughDist = 0.5; 

            query = `
                WITH nearby_candidates AS (
                    SELECT * FROM salons
                    -- FIX: Cast parameters to float so DB knows these are numbers
                    WHERE latitude BETWEEN ($1::float - $3::float) AND ($1::float + $3::float)
                      AND longitude BETWEEN ($2::float - $3::float) AND ($2::float + $3::float)
                )
                SELECT 
                    salon_id, salon_name, address, city, image_url, rating,
                    (
                        6371 * acos(
                            cos(radians($1)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2)) + 
                            sin(radians($1)) * sin(radians(latitude))
                        )
                    ) AS distance_km
                FROM nearby_candidates
                WHERE (
                    6371 * acos(
                        cos(radians($1)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2)) + 
                        sin(radians($1)) * sin(radians(latitude))
                    )
                ) <= 5 
                ORDER BY distance_km ASC
                LIMIT 20;
            `;
            params = [latitude, longitude, roughDist]; 
        } else {
            // Default view if no location
            query = `SELECT * FROM salons ORDER BY salon_id  LIMIT 5`;
            params = [];
        }

        const result = await pool.query(query, params);
        res.json({ success: true, salons: result.rows });

    } catch (err) {
        console.error("Get Salons Error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// --- 2. Get Services for Dashboard ---
exports.getServicesBySalon = async (req, res) => {
    try {
        const { salonId } = req.params;
        const result = await pool.query(`
            SELECT id, salon_id, name, price, duration_minutes, description
            FROM services
            WHERE is_active = TRUE AND salon_id = $1
            ORDER BY id ASC
        `, [salonId]);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching services:", err.message);
        res.status(500).send('Server Error');
    }
};

// --- 3. Get Customer Appointments ---

exports.getCustomerAppointments = async (req, res) => {
    
    // 1. Check Session
    if (!req.session.userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const customerId = req.session.userId;

    // 2. Setup Query Vars
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5; 
    const offset = (page - 1) * limit;
    const isDashboard = req.query.flat === 'true';

    try {
        // --- QUERY: GET DATA ---
        const dataQuery = `
            SELECT 
                a.id, 
                to_char(a.appointment_date, 'YYYY-MM-DD') as appointment_date, 
                a.appointment_time, 
                ast.status_name AS status, 
                s.salon_name, 
                sv.name AS service_name, 
                COALESCE(st.name, 'Unassigned Stylist') AS staff_name,
                a.total_amount,
                a.payment_status,
                a.salon_id
            FROM appointments a
            JOIN salons s ON a.salon_id = s.salon_id
            JOIN services sv ON a.service_id = sv.id 
            JOIN appointment_status ast ON a.status_id = ast.id 
            LEFT JOIN staff st ON a.staff_id = st.id 
            WHERE a.customer_id = $1
            ORDER BY 
                -- 🟢 PRIORITY SORTING: Active First, Canceled Last
                CASE ast.status_name
                    WHEN 'Confirmed' THEN 1  -- Highest Priority
                    WHEN 'Pending'   THEN 2
                    WHEN 'Active'    THEN 3
                    WHEN 'Completed' THEN 4
                    WHEN 'No-Show'   THEN 5
                    WHEN 'Canceled'  THEN 6  -- Lowest Priority
                    WHEN 'Cancelled' THEN 6  -- (Just in case of spelling diff)
                    ELSE 7
                END ASC,
                
                -- Secondary Sort: Newest Dates First
                a.appointment_date DESC, 
                a.appointment_time DESC 
            LIMIT $2 OFFSET $3
        `;
        
        const { rows } = await pool.query(dataQuery, [customerId, limit, offset]);

        // --- 🚀 THE FIX IS HERE ---
        
        if (isDashboard) {
            // Option A: Dashboard Mode -> Send JUST the Array [{}, {}]
            // This keeps your dashboard code working without changes!
            return res.json(rows); 
        } else {
            // Option B: Pagination Mode -> Send the full Object { appointments: [], pagination: {} }
            // This makes the "My Appointments" page work.
            
            // (Only calculate count if we are in Pagination Mode to save speed)
            const countQuery = `SELECT COUNT(*) FROM appointments WHERE customer_id = $1`;
            const countResult = await pool.query(countQuery, [customerId]);
            const totalAppointments = parseInt(countResult.rows[0].count);
            const totalPages = Math.ceil(totalAppointments / limit);

            return res.json({
                success: true,
                appointments: rows,
                pagination: {
                    currentPage: page,
                    totalPages: totalPages,
                    totalItems: totalAppointments
                }
            });
        }

    } catch (err) {
        console.error("Error fetching appointments:", err.message);
        res.status(500).send('Server Error');
    }
};

// --- 4. Recommended Services (Mock) ---
exports.getRecommendedServices = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, name, price
            FROM services
            WHERE is_active = TRUE
            ORDER BY id ASC
            LIMIT 5
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching recommended services:", err.message);
        res.status(500).send('Server Error');
    }
};

exports.createAppointment = async (req, res) => {
    // 1. Destructure and validate required fields from the request body
    const { 
        user_id, 
        salon_id, 
        service_id, 
        appointment_date, 
        appointment_time, 
        staff_id, // staff_id is optional/nullable
        notes = '' // Default notes to empty string if not provided
    } = req.body;

    // Use a unified variable for the customer ID
    const customer_id = user_id; 

    // Early validation for essential IDs
    if (!customer_id) {
        return res.status(401).json({ msg: 'User ID required for booking.' }); 
    }
    if (!salon_id || !service_id || !appointment_date || !appointment_time) {
        return res.status(400).json({ msg: 'Missing required appointment data (salon, service, date, or time).' });
    }

    try {
        // --- 1. Get Price (total_amount) ---
        const serviceRes = await pool.query(
            'SELECT price FROM services WHERE id = $1',
            [service_id]
        );
        if (serviceRes.rows.length === 0) {
            return res.status(404).json({ msg: 'Service not found or inactive.' });
        }
        const total_amount = serviceRes.rows[0].price;

        // --- 2. Get Numerical Status ID for 'Pending' ---
        const statusRes = await pool.query(
            "SELECT id FROM appointment_status WHERE status_name = 'Pending'"
        );
        if (statusRes.rows.length === 0) {
            console.error("Database error: 'Pending' status ID not found.");
            return res.status(500).json({ msg: 'System configuration error (Status ID missing).' });
        }
        const pendingStatusId = statusRes.rows[0].id;
        
        // --- 3. Prepare Final Query Execution ---
        
        // Use COALESCE (staff_id || null) for optional staff ID
        const values = [
            customer_id, 
            salon_id, 
            service_id, 
            staff_id || null, 
            appointment_date, 
            appointment_time, 
            total_amount, 
            pendingStatusId,
            // The 'notes' variable is required for the final query if you include it in the column list
            'Unpaid' // payment_status is hardcoded to 'Unpaid'
        ];

        // CRITICAL: Ensure the number of parameters and the column list match the values array.
        // NOTE: If you do not have a 'notes' column, remove $10 and the 'notes' value above.
        const insertQuery = `
            INSERT INTO appointments 
            (customer_id, salon_id, service_id, staff_id, appointment_date, appointment_time, total_amount, status_id, payment_status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING id`; 

        const result = await pool.query(insertQuery, values);
       if (result.rows.length > 0) {
            const newAppointmentId = result.rows[0].id; // <--- CAPTURE THE ID

            // 2. Send the ID back to the frontend
            res.json({ 
                success: true, 
                message: "Booking created successfully", 
                appointmentId: newAppointmentId // <--- CRITICAL: SEND IT BACK
            });
        } else {
            res.status(500).json({ success: false, message: "Insert failed, no ID returned." });
        }

    } catch (err) {
        // Log the detailed error for backend debugging
        console.error("Error creating appointment:", err.message);
        
        // Return a clean JSON error response to the client
        res.status(500).json({ msg: 'Server Error during appointment creation.' });
    }
};

// --- 6. Get available staff for a salon ---
exports.getAvailableStaffBySalon = async (req, res) => {
    const { salonId } = req.params; 
    try {
        const result = await pool.query(
            `SELECT id, name
             FROM staff
             WHERE salon_id = $1 AND is_available = TRUE
             ORDER BY name ASC`,
            [salonId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching available staff:", err.message);
        res.status(500).send('Server Error');
    }
};

// --- Get Details for a Single Salon ---
exports.getSalonDetails = async (req, res) => {
    try {
        const { salonId } = req.params;
        
        // Fetch all necessary details for the modal
        const result = await pool.query(
            `SELECT 
                salon_id, salon_name, address, city, rating, image_url, phone_number, owner_name, total_reviews 
            FROM 
                salons 
            WHERE 
                salon_id = $1 AND is_active = TRUE`, 
            [salonId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Salon not found.' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error fetching single salon details:", err.message);
        res.status(500).send('Server Error');
    }
};

exports.getAvailableTimeSlots = async (req, res) => {
    // Expected query parameters: ?salonId=X&date=YYYY-MM-DD
    const { salonId, date } = req.query;

    if (!salonId || !date) {
        return res.status(400).json({ error: 'Missing salonId or date query parameter.' });
    }

    try {
        // Query to fetch time slots available for the given salon (based on staff working there)
        // AND ensuring the slot hasn't been booked or marked as unavailable.
        // NOTE: This query assumes your 'staff' table has a 'salon_id' and 'time_slots' links to staff.
        
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
            -- MATCH METHOD 1: Direct Number (0-6)
            TRIM(CAST(day_of_week AS TEXT)) = CAST(EXTRACT(DOW FROM $2::DATE) AS TEXT)
            
            OR 
            
            -- MATCH METHOD 2: Case-Insensitive English Name (e.g. "Friday" = "friday")
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
GROUP BY rs.slot_time
HAVING COUNT(a.id) < (SELECT slot_capacity FROM rules)
ORDER BY rs.slot_time ASC;
            `,
            [salonId, date]
        );

        // Return only the time strings
        res.json(result.rows);

    } catch (err) {
        console.error("Error fetching available time slots:", err.message);
        res.status(500).json({ error: 'Server error fetching time slots.' });
    }
};