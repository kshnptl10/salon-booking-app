// src/controllers/adminController.js

const pool = require('../config/db');
const bcrypt = require('bcrypt');

// ==========================================================
// 1. HELPER FUNCTIONS
// ==========================================================

const calculatePercentChange = (current, previous) => {
    if (previous === 0 && current === 0) return 0;
    if (previous === 0 && current > 0) return 100; 
    return ((current - previous) / Math.abs(previous)) * 100;
};

const getSalonFilter = (req, paramIndexStart = 1) => {
    const { userRole, salonId } = req.session;
    
    // Superadmin sees everything (returns empty filter)
    if (userRole === 'superadmin') {
        return { clause: '', values: [] };
    }
    
    // Manager sees only their salon
    if (!salonId) {
        // Fallback safety: if manager has no ID, return a filter that matches nothing
        console.error("Security Warning: Manager logged in without salon_id");
        return { clause: ' AND 1=0', values: [] }; 
    }
    
    return { 
        clause: ` AND a.salon_id = $${paramIndexStart}`, 
        values: [salonId] 
    };
};

// Variant for tables where alias 'a' is not used (e.g. services, staff)
const getSimpleSalonFilter = (req, paramIndexStart = 1) => {
    const { userRole, salonId } = req.session;
    if (userRole === 'superadmin') return { clause: '', values: [] };
    if (!salonId) return { clause: ' AND 1=0', values: [] };
    
    return { clause: ` AND salon_id = $${paramIndexStart}`, values: [salonId] };
};


// ==========================================================
// A. ADMIN DASHBOARD STATISTICS
// ==========================================================
exports.getDashboardStats = async (req, res) => {
    try {
        const { userRole, userId } = req.session;
        let stats = { 
            totalSalons: 0, 
            activeManagers: 0, 
            bookingsToday: 0, 
            revenueMonth: 0 
        };

        let salonFilter = "";
        let salonParams = [];

        // --- QUERY BUILDER BASED ON ROLE ---
        if (userRole === 'superadmin') {
            // No filter needed, count everything
        } else if (userRole === 'admin') {
            // Filter: Only salons owned by this Admin OR branches under them
            salonFilter = `WHERE admin_id = $1 OR parent_id IN (SELECT salon_id FROM salons WHERE admin_id = $1)`;
            salonParams = [userId];
        } else {
            // Managers usually use a different dashboard, but if they access this:
            return res.json({ totalSalons: 1, activeManagers: 1, bookingsToday: 0, revenueMonth: 0 });
        }

        // 1. Total Salons
        const salonCount = await pool.query(`SELECT COUNT(*) FROM salons ${salonFilter}`, salonParams);
        stats.totalSalons = parseInt(salonCount.rows[0].count);

        // 2. Active Managers (Users with role 'manager')
        // For Admins, we need to join with salons to ensure we only count OUR managers
        let managerQuery = "SELECT COUNT(*) FROM users u JOIN roles r ON u.role_id = r.id WHERE r.role_name = 'manager'";
        if (userRole === 'admin') {
            managerQuery += ` AND u.salon_id IN (SELECT salon_id FROM salons ${salonFilter})`;
        }
        const managerCount = await pool.query(managerQuery, userRole === 'admin' ? salonParams : []);
        stats.activeManagers = parseInt(managerCount.rows[0].count);

        // 3. Bookings Today
        let bookingQuery = "SELECT COUNT(*) FROM appointments WHERE date(appointment_date) = CURRENT_DATE";
        if (userRole === 'admin') {
            bookingQuery += ` AND salon_id IN (SELECT salon_id FROM salons ${salonFilter})`;
        }
        const bookingCount = await pool.query(bookingQuery, userRole === 'admin' ? salonParams : []);
        stats.bookingsToday = parseInt(bookingCount.rows[0].count);

        // 4. Revenue (This Month)
        let revQuery = `
            SELECT COALESCE(SUM(total_amount), 0) as total 
            FROM appointments 
            WHERE status_id = (SELECT id FROM appointment_status WHERE status_name = 'completed') 
            AND date_part('month', appointment_date) = date_part('month', CURRENT_DATE)
            AND date_part('year', appointment_date) = date_part('year', CURRENT_DATE)
        `;
        if (userRole === 'admin') {
            revQuery += ` AND salon_id IN (SELECT salon_id FROM salons ${salonFilter})`;
        }
        const revResult = await pool.query(revQuery, userRole === 'admin' ? salonParams : []);
        stats.revenueMonth = revResult.rows[0].total;

        res.json(stats);

    } catch (err) {
        console.error("Dashboard Stats Error:", err);
        res.status(500).json({ error: "Server Error" });
    }
};

exports.getSalonsForUser = async (req, res) => {
    try {
        const { userId, userRole, salonId } = req.session;

        let query = "";
        let params = [];

        const baseSelect = `
            SELECT 
                s.*, 
                u.name AS manager_name
            FROM salons s
            LEFT JOIN users u ON s.salon_id = u.salon_id 
            LEFT JOIN roles r ON u.role_id = r.id AND r.role_name = 'manager'
        `;

        // --- LEVEL 1: SUPERADMIN (Global View Only) ---
        // Can see ALL salons and ALL branches in the system.
        if (userRole === 'superadmin') {
            query = `
                SELECT salon_id, salon_name, branch_name, location, contact_number, parent_id, admin_id 
                FROM salons 
                ORDER BY id ASC`;
        } 
        
        // --- LEVEL 2: ADMIN (Owner View) ---
        // Can see Salons they OWN (admin_id) AND branches of those salons (parent_id)
        else if (userRole === 'admin') {
            query = `
                ${baseSelect}
                WHERE admin_id = $1  -- The Main Salon I created
                OR parent_id IN (SELECT salon_id FROM salons WHERE admin_id = $1) -- The branches under it
                ORDER BY parent_id NULLS FIRST, salon_id ASC`;
            params = [userId]; // Use the logged-in User's ID
        } 
        
        // --- LEVEL 3: MANAGER (Branch View) ---
        // Can ONLY see the specific branch they are assigned to.
        else if (userRole === 'manager') {
            if (!salonId) {
                return res.status(403).json({ message: "Manager has no assigned salon." });
            }
            query = `${baseSelect} WHERE salon_id = $1`;
            params = [salonId]; // Use the Manager's assigned Salon ID
        } 
        
        // --- LEVEL 4: CUSTOMER / UNKNOWN ---
        else {
            return res.status(403).json({ message: "Unauthorized Access" });
        }

        // Execute Query
        const result = await pool.query(query, params);

        res.json({
            success: true,
            role: userRole,
            count: result.rows.length,
            salons: result.rows
        });

    } catch (err) {
        console.error("Get Salons Error:", err);
        res.status(500).json({ success: false, message: "Server Error fetching salons" });
    }
};


exports.getAvailableManagers = async (req, res) => {
    try {
        // Find users with role 'manager' whose salon_id is NULL
        const query = `
            SELECT u.id, u.name 
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE r.role_name = 'manager' 
            AND u.salon_id IS NULL
            ORDER BY u.name ASC
        `;
        
        const result = await pool.query(query);
        res.json(result.rows);

    } catch (err) {
        console.error("Get Managers Error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getAllManagers = async (req, res) => {

    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ message: "Unauthorized: Please log in." });
        }

        // 2. CHANGE: Get details from Session
        const { userId, userRole } = req.session;
        
        console.log("------------------------------------------");
        console.log("DEBUG /all-managers");
        console.log("User ID:", userId, "(Type:", typeof userId, ")");
        console.log("User Role:", userRole);
        console.log("------------------------------------------");
        if (!userId) {
            return res.status(401).json({ message: "Error: User ID is missing from session." });
        }
        let query = `
            SELECT u.id, u.name, u.email, u.mobile, 
                   s.salon_name, s.branch_name, s.salon_id as salon_id
            FROM users u
            JOIN salons s ON u.salon_id = s.salon_id 
            WHERE u.role_id = (SELECT id FROM roles WHERE role_name = 'manager')
        `;
        
        const values = [];

        if (userRole === 'super_admin' || userRole === 'superadmin') {
            // Super Admin sees all (or filters manually)
            if (req.query.salon_id) {
                query += ` AND s.salon_id = $1`;
                values.push(req.query.salon_id);
            }
        } 
        else if (userRole === 'admin') {
            // ADMIN FILTER:
            // "Show me managers where the salon's ADMIN_ID matches MY ID"
            query += ` AND s.admin_id = $1`;
            values.push(userId);
        }

        const result = await pool.query(query, values);
        res.json(result.rows);

    } catch (err) {
        console.error("Get Managers Error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.addManager = async (req, res) => {
    const { name, email, mobile, salon_id, username, password } = req.body;

    if (!password) {
            return res.status(400).json({ message: "Password is required" });
        }
    
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    try {
        const query = `
            INSERT INTO users (name, email, mobile, role_id,username,password,salon_id)
            VALUES ($1, $2, $3, (SELECT id FROM roles WHERE role_name = 'manager'), $4, $5, $6)
            RETURNING id
        `;
        const result = await pool.query(query, [name, email, mobile, username, hashedPassword, salon_id]);
        const userId = result.rows[0].id;

        // Assign the manager to a salon
        /*await pool.query(`
            UPDATE users 
            SET salon_id = $1 
            WHERE id = $2
        `, [salonId, userId]); */

        res.json({ message: "Manager added successfully." });

    } catch (err) {
        console.error("Add Manager Error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.updateManager = async (req, res) => {
    const { id } = req.params; // Get ID from URL
    const { name, email, mobile, salon_id } = req.body;

    try {
        const query = `
            UPDATE users 
            SET name = $1, email = $2, mobile = $3, salon_id = $4
            WHERE id = $5
        `;

        await pool.query(query, [name, email, mobile, salon_id, id]);

        res.json({ success: true, message: "Manager updated successfully" });

    } catch (err) {
        console.error("Update Manager Error:", err);
        res.status(500).json({ message: "Server error updating manager" });
    }
};
// Also add a helper to get single manager details (for pre-filling)
exports.getManagerById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("SELECT id, name, email, mobile, salon_id FROM users WHERE id = $1", [id]);
        
        if (result.rows.length === 0) return res.status(404).json({ message: "Manager not found" });
        
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.removeManager = async (req, res) => {
    const { id } = req.params;

    try {
        const query = `
            UPDATE users 
            SET salon_id = NULL 
            WHERE id = $1 AND role_id IN (SELECT id FROM roles WHERE role_name = 'manager')
        `;
        
        await pool.query(query, [id]);
        res.json({ message: "Manager removed successfully." });

    } catch (err) {
        console.error("Remove Manager Error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.createSalon = async (req, res) => {
    // 1. Remove owner_name from input (we will fetch it automatically)
    const { 
        name, branch_name, address, city, phone, email, 
        status, manager_id, opening_time, closing_time 
    } = req.body;
    
    const adminId = req.session.userId; 

    if (!adminId) {
        return res.status(401).json({ message: "Unauthorized. Please login." });
    }

    const isActive = (status === 'Active' || status === 'true' || status === true);

    const client = await pool.connect();

    try {
        // --- STEP 1: Fetch Admin Name ---
        const adminQuery = `SELECT name FROM users WHERE id = $1`;
        const adminResult = await client.query(adminQuery, [adminId]);
        
        if (adminResult.rows.length === 0) {
            throw new Error("Admin user not found in database");
        }
        
        const ownerName = adminResult.rows[0].name; // <--- Auto-detected name

        // --- STEP 2: Check for Main Branch ---
        const checkQuery = `
            SELECT salon_id FROM salons 
            WHERE admin_id = $1 AND is_main_branch = TRUE 
            LIMIT 1
        `;
        const existingMain = await client.query(checkQuery, [adminId]);

        let parentId = null;
        let isMain = false;

        if (existingMain.rows.length > 0) {
            parentId = existingMain.rows[0].salon_id;
            isMain = false;
        } else {
            parentId = null;
            isMain = true;
        }

        await client.query('BEGIN');

        // --- STEP 3: Insert Query ---
        const insertQuery = `
            INSERT INTO salons (
                salon_name, branch_name, address, city, phone_number, email, 
                is_active, owner_name, admin_id, is_main_branch, parent_id, 
                opening_time, closing_time, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
            RETURNING *
        `;

        const newSalon = await client.query(insertQuery, [
            name,           // $1
            branch_name,    // $2
            address,        // $3
            city,           // $4
            phone,          // $5
            email,          // $6
            isActive,       // $7
            ownerName,      // $8 <--- Using the fetched name
            adminId,        // $9
            isMain,         // $10
            parentId,       // $11
            opening_time,   // $12
            closing_time    // $13
        ]);

        if (manager_id) {
            await client.query(
                `UPDATE users SET salon_id = $1 WHERE id = $2`,
                [newSalon.rows[0].salon_id, manager_id]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ success: true, salon: newSalon.rows[0] });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Create Salon Error:", err);
        res.status(500).json({ message: "Database error" });
    } finally {
        client.release();
    }
};

exports.getSalonsList = async (req, res) => {
    try {
        const adminId = req.session.userId;
        
        // Fetch only ID and Name for the dropdown
        // (Optional: Filter out salons that already have a manager if you only allow 1 per salon)
        const query = `
            SELECT salon_id, salon_name, branch_name 
            FROM salons 
            WHERE admin_id = $1 
            ORDER BY salon_name ASC
        `;
        
        const result = await pool.query(query, [adminId]);
        res.json(result.rows);

    } catch (err) {
        console.error("Get Salons List Error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getSalonById = async (req, res) => {
    try {
        const { id } = req.params; 
        const result = await pool.query(" SELECT s.*, u.name AS manager_name, u.id AS manager_id FROM salons s LEFT JOIN users u ON s.salon_id = u.salon_id LEFT JOIN roles r ON u.role_id = r.id AND r.role_name = 'manager' WHERE s.salon_id = $1", [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: "Salon not found" });
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Get Salon By ID Error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.editSalon = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, branch_name, address, city, phone, email, status, manager_id, opening_time, closing_time } = req.body;
        
        const isActive = status === 'Active' || status === 'true' || status === true;

        await pool.query(
            `UPDATE salons 
             SET salon_name = $1, email = $2, phone_number = $3, address = $4, 
                 city = $5, branch_name = $6, opening_time = $7, closing_time = $8, is_active = $9
             WHERE salon_id = $10`,
            [name, email, phone, address, city, branch_name, opening_time, closing_time, isActive, id]
        );
        if (manager_id) {
            // A. Remove 'salon_id' from whoever currently manages this salon (The Old Manager)
            // This ensures we don't accidentally have two managers for one salon
            await pool.query(
                `UPDATE users SET salon_id = NULL WHERE salon_id = $1`, 
                [id]
            );

            // B. Assign the NEW manager to this salon
            await pool.query(
                `UPDATE users SET salon_id = $1 WHERE id = $2`, 
                [id, manager_id]
            );
        } else if (manager_id === "") {
             // If user selected "Select Manager" (empty), unassign everyone
             await pool.query(
                `UPDATE users SET salon_id = NULL WHERE salon_id = $1`, 
                [id]
            );
        }

        res.json({ message: "Salon updated successfully." });
    } catch (err) {
        console.error("Edit Salon Error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.toggleSalonStatus = async (req, res) => {
    try {
        const { id } = req.params;

        // FIX: Use SQL 'NOT' operator to flip the value automatically
        // We also use RETURNING * to see what the new value became
        const result = await pool.query(
            `UPDATE salons 
             SET is_active = NOT is_active 
             WHERE salon_id = $1 
             RETURNING is_active`, 
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Salon not found" });
        }

        const newStatus = result.rows[0].is_active; // Get the new boolean value
        
        res.json({ 
            success: true,
            message: `Salon status updated to ${newStatus ? 'Active' : 'Inactive'}.` 
        });

    } catch (err) {
        console.error("Toggle Salon Status Error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ==========================================================
// A. MANAGER DASHBOARD STATISTICS
// ==========================================================

exports.getTodaySales = async (req, res) => {
    try {
        const filter = getSalonFilter(req);
        
        const query = `
            SELECT COALESCE(SUM(total_amount), 0) AS today_sales
            FROM appointments a
            WHERE (payment_status = 'Paid' OR a.status_id = (SELECT id FROM appointment_status WHERE status_name = 'Completed'))
            AND a.appointment_date = CURRENT_DATE
            ${filter.clause}
        `;

        const result = await pool.query(query, filter.values);
        res.json({ todaySales: parseFloat(result.rows[0].today_sales) || 0 });
    } catch (err) {
        console.error("Error fetching today's sales", err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getThisMonthSales = async (req, res) => {
    try {
        const filter = getSalonFilter(req);
        const query = `
            SELECT COALESCE(SUM(total_amount), 0) AS month_sales
            FROM appointments a
            WHERE (payment_status = 'Paid' OR a.status_id = (SELECT id FROM appointment_status WHERE status_name = 'Completed'))
            AND DATE_TRUNC('month', appointment_date) = DATE_TRUNC('month', CURRENT_DATE)
            ${filter.clause}
        `;
        const result = await pool.query(query, filter.values);
        res.json({ monthSales: parseFloat(result.rows[0].month_sales) || 0 });
    } catch (err) {
        console.error("Error fetching month sales", err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getCompletedAppointmentsMonth = async (req, res) => {
    try {
        const filter = getSalonFilter(req);
        const query = `
            SELECT COUNT(*) AS completed_count
            FROM appointments a
            WHERE a.status_id = (SELECT id FROM appointment_status WHERE status_name = 'Completed')
            AND DATE_TRUNC('month', appointment_date) = DATE_TRUNC('month', CURRENT_DATE)
            ${filter.clause}
        `;
        const result = await pool.query(query, filter.values);
        res.json({ completedThisMonth: parseInt(result.rows[0].completed_count) || 0 });
    } catch (err) {
        console.error("Error fetching completed appts", err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getPendingAppointmentsMonth = async (req, res) => {
    try {
        const filter = getSalonFilter(req);
        const query = `
            SELECT COUNT(*) AS pending_count
            FROM appointments a
            WHERE a.status_id = (SELECT id FROM appointment_status WHERE status_name = 'Pending')
            AND DATE_TRUNC('month', appointment_date) = DATE_TRUNC('month', CURRENT_DATE)
            ${filter.clause}
        `;
        const result = await pool.query(query, filter.values);
        res.json({ pendingThisMonth: parseInt(result.rows[0].pending_count) || 0 });
    } catch (err) {
        console.error("Error fetching pending appts", err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getTodaySalesPercentChange = async (req, res) => {
    try {
        const completedIdResult = await pool.query("SELECT id FROM appointment_status WHERE status_name = 'Completed'");
        const completedId = completedIdResult.rows[0]?.id || 0; 
        
        // RBAC: Get filter starting at parameter index $2 (since $1 is completedId)
        const filter = getSalonFilter(req, 2); 

        const todayQuery = `
            SELECT COALESCE(SUM(total_amount), 0) AS today_sales 
            FROM appointments a
            WHERE (payment_status = 'Paid' OR status_id = $1) 
            AND appointment_date = CURRENT_DATE
            ${filter.clause}`;

        const yesterdayQuery = `
            SELECT COALESCE(SUM(total_amount), 0) AS yesterday_sales 
            FROM appointments a
            WHERE (payment_status = 'Paid' OR status_id = $1) 
            AND appointment_date = (CURRENT_DATE - INTERVAL '1 day')
            ${filter.clause}`;
        
        // Combine parameters: [completedId, salonId (if exists)]
        const params = [completedId, ...filter.values];

        const [todayRes, yesterdayRes] = await Promise.all([
            pool.query(todayQuery, params),
            pool.query(yesterdayQuery, params)
        ]);

        const today = parseFloat(todayRes.rows[0].today_sales);
        const yesterday = parseFloat(yesterdayRes.rows[0].yesterday_sales);
        const percent = calculatePercentChange(today, yesterday);

        res.json({ percent: Number(percent.toFixed(2)) });
        
    } catch (err) {
        console.error("Error calculating today percent change", err.message);
        res.status(500).json({ error: "Server error", details: err.message });
    }
};

exports.getMonthSalesPercentChange = async (req, res) => {
    try {
        const completedIdResult = await pool.query("SELECT id FROM appointment_status WHERE status_name = 'Completed'");
        const completedId = completedIdResult.rows[0]?.id || 0; 

        // RBAC: Get filter starting at parameter index $2
        const filter = getSalonFilter(req, 2);

        const thisMonthQuery = `
            SELECT COALESCE(SUM(total_amount), 0) AS this_month 
            FROM appointments a
            WHERE (payment_status = 'Paid' OR status_id = $1) 
            AND DATE_TRUNC('month', appointment_date) = DATE_TRUNC('month', CURRENT_DATE)
            ${filter.clause}`;

        const lastMonthQuery = `
            SELECT COALESCE(SUM(total_amount), 0) AS last_month 
            FROM appointments a
            WHERE (payment_status = 'Paid' OR status_id = $1) 
            AND DATE_TRUNC('month', appointment_date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
            ${filter.clause}`;

        const params = [completedId, ...filter.values];

        const [thisMonthRes, lastMonthRes] = await Promise.all([
            pool.query(thisMonthQuery, params),
            pool.query(lastMonthQuery, params)
        ]);

        const thisMonth = parseFloat(thisMonthRes.rows[0].this_month);
        const lastMonth = parseFloat(lastMonthRes.rows[0].last_month);
        const percent = calculatePercentChange(thisMonth, lastMonth);

        res.json({ percent: Number(percent.toFixed(2)) });
        
    } catch (err) {
        console.error("Error calculating month percent change", err.message);
        res.status(500).json({ error: "Server error", details: err.message });
    }
};

// ==========================================================
// B. APPOINTMENT MANAGEMENT
// ==========================================================

const appointmentQueryBase = `
    SELECT 
        a.id, c.name AS customer_name, c.email,
        s.name AS service_name, st.name AS staff_name,
        a.appointment_date, a.appointment_time, ast.status_name AS status
    FROM appointments a
    JOIN customers c ON a.customer_id = c.id
    JOIN services s ON a.service_id = s.id
    LEFT JOIN staff st ON a.staff_id = st.id
    JOIN appointment_status ast ON a.status_id = ast.id
`;

exports.getAllAppointments = async (req, res) => {
    try {
        const filter = getSalonFilter(req);
        
        // Since getSalonFilter returns " AND ...", we need a base WHERE clause (1=1)
        const query = `
            ${appointmentQueryBase}
            WHERE 1=1 
            ${filter.clause}
            ORDER BY a.appointment_date, a.appointment_time
        `;
        
        const result = await pool.query(query, filter.values);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching all appointments", err);
        res.status(500).json({ error: "Server error" });
    }
};

exports.getTodayAppointments = async (req, res) => {
    try {
        const filter = getSalonFilter(req);
        const query = `
            ${appointmentQueryBase}
            WHERE a.appointment_date = CURRENT_DATE
            ${filter.clause}
            ORDER BY a.appointment_date, a.appointment_time
        `;
        const result = await pool.query(query, filter.values);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching today appointments", err);
        res.status(500).json({ error: "Server error" });
    }
};

exports.getThisMonthAppointments = async (req, res) => {
    try {
        const filter = getSalonFilter(req);
        const query = `
            ${appointmentQueryBase}
            WHERE DATE_TRUNC('month', a.appointment_date) = DATE_TRUNC('month', CURRENT_DATE)
            ${filter.clause}
            ORDER BY a.appointment_date, a.appointment_time
        `;
        const result = await pool.query(query, filter.values);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching month appointments", err);
        res.status(500).json({ error: "Server error" });
    }
};

exports.updateAppointmentStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const { userRole, salonId } = req.session;

    try {
        const statusIdResult = await pool.query("SELECT id FROM appointment_status WHERE status_name = $1", [status]);
        if (statusIdResult.rows.length === 0) return res.status(400).json({ success: false, message: "Invalid status" });
        
        const statusId = statusIdResult.rows[0].id;

        let query, params;
        
        // SECURITY: Ensure manager can only update their own salon's appointment
        if (userRole === 'superadmin') {
            query = "UPDATE appointments SET status_id = $1 WHERE id = $2";
            params = [statusId, id];
        } else {
            // Manager: Enforce salon_id check on the update
            query = "UPDATE appointments SET status_id = $1 WHERE id = $2 AND salon_id = $3";
            params = [statusId, id, salonId];
        }

        const result = await pool.query(query, params);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: "Appointment not found or access denied" });
        }

        res.json({ success: true, message: "Status updated" });
    } catch (err) {
        console.error("Error updating status", err);
        res.status(500).json({ success: false, message: "Error updating status" });
    }
};

// ==========================================================
// C. STAFF MANAGEMENT (Scoped to Salon)
// ==========================================================

exports.getAllStaff = async (req, res) => {
    try {
        const filter = getSimpleSalonFilter(req);
        // Note: Staff table should have 'salon_id'
        const query = `SELECT * FROM staff WHERE 1=1 ${filter.clause} ORDER BY id`;
        const result = await pool.query(query, filter.values);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
};

exports.createStaff = async (req, res) => {
    const { name, email, phone, is_available } = req.body;
    const { salonId, userRole } = req.session; 
    
    // Safety check: Managers must have a salonId
    if (userRole !== 'superadmin' && !salonId) return res.status(403).json({message: "No Salon ID found for user"});

    try {
        // Only insert salon_id if it exists (for superadmin it might be null if creating global staff? 
        // Or superadmin should select a salon. For now, we assume simple manager creation)
        await pool.query(
            "INSERT INTO staff (name, email, phone, is_available, salon_id) VALUES ($1,$2,$3,$4,$5)", 
            [name, email, phone, is_available || false, salonId]
        );
        res.status(201).json({ message: 'Staff created' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating staff' });
    }
};

exports.updateStaff = async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, is_available } = req.body;
    const { salonId, userRole } = req.session;

    try {
        let query, params;
        if (userRole === 'superadmin') {
             query = "UPDATE staff SET name=$1, email=$2, phone=$3, is_available=$4 WHERE id=$5";
             params = [name, email, phone, is_available, id];
        } else {
             // Manager check
             query = "UPDATE staff SET name=$1, email=$2, phone=$3, is_available=$4 WHERE id=$5 AND salon_id=$6";
             params = [name, email, phone, is_available, id, salonId];
        }
        
        const result = await pool.query(query, params);
        if (result.rowCount === 0) return res.status(404).json({message: "Staff not found or access denied"});
        
        res.json({ message: 'Staff updated successfully' });
    } catch (err) {
        console.error("Error updating staff", err);
        res.status(500).json({ message: 'Error updating staff' });
    }
};

exports.deleteStaff = async (req, res) => {
    const { id } = req.params;
    const { salonId, userRole } = req.session;

    try {
        let query, params;
        if (userRole === 'superadmin') {
            query = "DELETE FROM staff WHERE id=$1";
            params = [id];
        } else {
            query = "DELETE FROM staff WHERE id=$1 AND salon_id=$2";
            params = [id, salonId];
        }
        const result = await pool.query(query, params);
        if (result.rowCount === 0) return res.status(404).json({message: "Staff not found or access denied"});

        res.json({ message: 'Staff deleted successfully' });
    } catch (err) {
        console.error("Error deleting staff", err);
        res.status(500).json({ message: 'Error deleting staff' });
    }
};

// ==========================================================
// D. SERVICES MANAGEMENT (Scoped to Salon)
// ==========================================================

exports.getAllServices = async (req, res) => {
    try {
        const filter = getSimpleSalonFilter(req);
        const query = `SELECT * FROM services WHERE 1=1 ${filter.clause} ORDER BY id`;
        const result = await pool.query(query, filter.values);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
};

exports.createService = async (req, res) => {
    const { name, description, duration, price } = req.body;
    const { salonId, userRole } = req.session;

    if (userRole !== 'superadmin' && !salonId) return res.status(403).json({message: "No Salon ID found"});

    try {
        await pool.query(
            "INSERT INTO services (name, description, duration_minutes, price, salon_id) VALUES ($1,$2,$3,$4,$5)", 
            [name, description, duration, price, salonId]
        );
        res.status(201).json({ message: 'Service created' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating service' });
    }
};

exports.updateService = async (req, res) => {
    const { id } = req.params;
    const { name, description, duration, price } = req.body;
    const { salonId, userRole } = req.session;

    try {
        let query, params;
        if (userRole === 'superadmin') {
            query = "UPDATE services SET name=$1, description=$2, duration_minutes=$3, price=$4 WHERE id=$5";
            params = [name, description, duration, price, id];
        } else {
            query = "UPDATE services SET name=$1, description=$2, duration_minutes=$3, price=$4 WHERE id=$5 AND salon_id=$6";
            params = [name, description, duration, price, id, salonId];
        }

        const result = await pool.query(query, params);
        if (result.rowCount === 0) return res.status(404).json({message: "Service not found or access denied"});

        res.json({ message: 'Service updated successfully' });
    } catch (err) {
        console.error("Error updating service", err);
        res.status(500).json({ message: 'Error updating service' });
    }
};

exports.deleteService = async (req, res) => {
    const { id } = req.params;
    const { salonId, userRole } = req.session;
    
    try {
        let query, params;
        if (userRole === 'superadmin') {
            query = "DELETE FROM services WHERE id=$1";
            params = [id];
        } else {
            query = "DELETE FROM services WHERE id=$1 AND salon_id=$2";
            params = [id, salonId];
        }
        
        const result = await pool.query(query, params);
        if (result.rowCount === 0) return res.status(404).json({message: "Service not found or access denied"});

        res.json({ message: 'Service deleted successfully' });
    } catch (err) {
        console.error("Error deleting service", err);
        res.status(500).json({ message: 'Error deleting service' });
    }
};

// ==========================================================
// E. ADMIN MANAGEMENT (Only for Superadmin)
// ==========================================================

exports.getAllAdmins = async (req, res) => {
    if (req.session.userRole !== 'superadmin') return res.status(403).json({ error: 'Access Denied' });

    try {
        const result = await pool.query(`
             SELECT u.id, u.name, u.email, u.mobile, r.role_name
             FROM users u
             JOIN roles r ON u.role_id = r.id
             WHERE r.role_name = 'admin';
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching admins' });
    }
};

exports.deleteAdmin = async (req, res) => {
    if (req.session.userRole !== 'superadmin') return res.status(403).json({ error: 'Access Denied' });
    
    const { id } = req.params;
    try {
        await pool.query("DELETE FROM users WHERE id = $1", [id]);
        res.json({ message: 'Admin deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting admin' });
    }
};

exports.getAllSalons = async (req, res) => {
    // --- DEBUGGING LOGS ---
    console.log("Debugging /api/admin/salons:");
    console.log("Session User ID:", req.session.userId);
    console.log("Session Role:", req.session.userRole);
    // ----------------------

    // Security: Only Superadmin can see this list
    if (req.session.userRole !== 'superadmin') {
        console.log("Access Denied: Role mismatch"); // <--- Log this
        return res.status(403).json({ message: "Access Denied: You are not a Super Admin" });
    }

    try {
        const result = await pool.query("SELECT salon_id, salon_name FROM salons ORDER BY name ASC");
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching salons:", err);
        res.status(500).json({ message: "Server Error" });
    }
};
// ==========================================================
// F. TIME SLOTS CRUD
// ==========================================================

exports.getAllTimeSlots = async (req, res) => {
    try {
        // RBAC: We join staff to check salon_id via staff, OR check salon_id directly on time_slots if it exists.
        // Assuming time_slots has salon_id (recommended)
        const filter = getSimpleSalonFilter(req); // use "salon_id"
        
        const query = `
            SELECT t.id, t.staff_id, t.slot_time, t.is_available, s.name as staff_name
            FROM time_slots t
            JOIN staff s ON t.staff_id = s.id
            WHERE 1=1 ${filter.clause}
            ORDER BY t.id
        `;
        const result = await pool.query(query, filter.values);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
};

// ==========================================================
// F. TIME SLOTS CRUD (Add these to the bottom of the file)
// ==========================================================

exports.createTimeSlot = async (req, res) => {
    const { slot_time } = req.body; // Removed staff_id from body, we might need to fetch it or imply it
    const { salonId, userRole } = req.session;

    // 1. Validation: Managers need a salon ID
    if (userRole !== 'superadmin' && !salonId) {
        return res.status(403).json({ message: "No Salon ID found" });
    }

    // 2. We need a staff_id. 
    // If your form sends 'staff_id', ensure that staff belongs to this salon first!
    const { staff_id } = req.body; 

    try {
        // Security Check: Ensure the staff member belongs to the manager's salon
        if (userRole !== 'superadmin') {
            const staffCheck = await pool.query("SELECT id FROM staff WHERE id=$1 AND salon_id=$2", [staff_id, salonId]);
            if (staffCheck.rows.length === 0) {
                return res.status(403).json({ message: "Invalid Staff ID or Access Denied" });
            }
        }

        await pool.query(
            "INSERT INTO time_slots (staff_id, slot_time, is_available, salon_id) VALUES ($1, $2, true, $3)", 
            [staff_id, slot_time, salonId]
        );
        res.status(201).json({ message: 'Time slot created successfully' });
    } catch (err) {
        console.error("Error creating time slot", err);
        res.status(500).json({ message: 'Error creating time slot' });
    }
};

exports.updateTimeSlot = async (req, res) => {
    const { id } = req.params;
    const { staff_id, slot_time, is_available } = req.body;
    const { salonid, userRole } = req.session;

    try {
        let query, params;

        if (userRole === 'superadmin') {
            query = "UPDATE time_slots SET staff_id=$1, slot_time=$2, is_available=$3 WHERE id=$4";
            params = [staff_id, slot_time, is_available, id];
        } else {
            // Manager: Ensure the time slot belongs to their salon before updating
            // Note: We also assume the new 'staff_id' is valid for this salon (validation omitted for brevity)
            query = "UPDATE time_slots SET staff_id=$1, slot_time=$2, is_available=$3 WHERE id=$4 AND salon_id=$5";
            params = [staff_id, slot_time, is_available, id, salonId];
        }

        const result = await pool.query(query, params);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Time slot not found or access denied' });

        res.json({ message: 'Time slot updated successfully' });
    } catch (err) {
        console.error("Error updating time slot", err);
        res.status(500).json({ message: 'Error updating time slot' });
    }
};

exports.deleteTimeSlot = async (req, res) => {
    const { id } = req.params;
    const { salonId, userRole } = req.session;

    try {
        let query, params;
        if (userRole === 'superadmin') {
            query = "DELETE FROM time_slots WHERE id=$1";
            params = [id];
        } else {
            query = "DELETE FROM time_slots WHERE id=$1 AND salon_id=$2";
            params = [id, salonId];
        }

        const result = await pool.query(query, params);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Time slot not found or access denied' });

        res.json({ message: 'Time slot deleted successfully' });
    } catch (err) {
        console.error("Error deleting time slot", err);
        res.status(500).json({ message: 'Error deleting time slot' });
    }
};

async function getSalonId(userId) {
    if (!userId) return null;
    const result = await pool.query("SELECT salon_id FROM users WHERE id = $1", [userId]);
    return result.rows[0]?.salon_id || null;
}

// ==========================================
// 1. GENERAL SETTINGS (Now using 'slot_configs' table)
// ==========================================

exports.getSettings = async (req, res) => {
    try {
        const salonId = await getSalonId(req.session.userId);
        if (!salonId) return res.status(400).json({ message: "No Salon Assigned" });

        // Query the NEW table
        const query = `
            SELECT slot_duration, buffer_time, slot_capacity 
            FROM slot_configs 
            WHERE salon_id = $1
        `;
        const result = await pool.query(query, [salonId]);

        if (result.rows.length === 0) {
            // Return defaults if no config exists yet
            return res.json({ slot_duration: 30, buffer_time: 5, slot_capacity: 1 });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Get Settings Error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.updateSettings = async (req, res) => {
    const { slot_duration, buffer_time, slot_capacity } = req.body;

    try {
        const salonId = await getSalonId(req.session.userId);
        if (!salonId) return res.status(400).json({ message: "No Salon Assigned" });

        // UPSERT Query: Insert new row, or Update if it already exists
        const query = `
            INSERT INTO slot_configs (salon_id, slot_duration, buffer_time, slot_capacity, updated_at)
            VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT (salon_id) 
            DO UPDATE SET 
                slot_duration = EXCLUDED.slot_duration,
                buffer_time = EXCLUDED.buffer_time,
                slot_capacity = EXCLUDED.slot_capacity,
                updated_at = NOW()
        `;
        
        await pool.query(query, [salonId, slot_duration, buffer_time, slot_capacity]);
        
        res.json({ success: true, message: "Settings updated successfully" });
    } catch (err) {
        console.error("Update Settings Error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ==========================================
// 2. WEEKLY SCHEDULE
// ==========================================
exports.getSchedule = async (req, res) => {
    try {
        const salonId = await getSalonId(req.session.userId);
        if (!salonId) return res.status(400).json({ message: "No Salon Assigned" });

        // We fetch hours from 'salons' table, but alias them as start_time/end_time
        // so the frontend JavaScript can read them correctly.
        const query = `
            SELECT 
                ts.day_of_week, 
                ts.is_open, 
                s.opening_time AS start_time, 
                s.closing_time AS end_time
            FROM time_slots ts
            JOIN salons s ON s.salon_id = ts.salon_id
            WHERE s.salon_id = $1
        `;
        
        const result = await pool.query(query, [salonId]);
        res.json(result.rows);

    } catch (err) {
        console.error("Get Schedule Error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.saveSchedule = async (req, res) => {
    const { schedule } = req.body; 
    
    try {
        const salonId = await getSalonId(req.session.userId);
        if (!salonId) return res.status(400).json({ message: "No Salon Assigned" });

        // 1. EXTRACT GLOBAL TIMES
        // Since times are stored in the 'salons' table, we assume the user 
        // wants the same hours for all open days. We pick the first valid time found.
        const firstOpenDay = schedule.find(d => d.isOpen && d.startTime);
        const newOpenTime = firstOpenDay ? firstOpenDay.startTime : null;
        const newCloseTime = firstOpenDay ? firstOpenDay.endTime : null;

        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            // 2. UPDATE GLOBAL SALON HOURS (If provided)
            if (newOpenTime && newCloseTime) {
                await client.query(
                    `UPDATE salons SET opening_time = $1, closing_time = $2 WHERE salon_id = $3`,
                    [newOpenTime, newCloseTime, salonId]
                );
            }

            // 3. UPDATE DAILY STATUS (Open/Closed) IN TIME_SLOTS
            // We do NOT save start_time/end_time here because they are now in the salons table.
            for (const item of schedule) {
                const { day, isOpen } = item;
                
                const query = `
                    INSERT INTO time_slots (salon_id, day_of_week, is_open)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (salon_id, day_of_week) 
                    DO UPDATE SET is_open = EXCLUDED.is_open;
                `;
                
                await client.query(query, [salonId, day, isOpen]);
            }

            await client.query('COMMIT');
            res.json({ success: true, message: "Weekly schedule and salon hours updated" });

        } catch (dbErr) {
            await client.query('ROLLBACK');
            throw dbErr;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error("Save Schedule Error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
// ==========================================
// 3. DATE OVERRIDES (Exceptions)
// ==========================================

exports.getOverrides = async (req, res) => {
    try {
        const salonId = await getSalonId(req.session.userId);
        if (!salonId) return res.status(400).json({ message: "No Salon Assigned" });

        // Fetch overrides for today or future dates only
        const query = `
            SELECT id, specific_date, is_open, start_time, end_time 
            FROM salon_date_overrides 
            WHERE salon_id = $1 AND specific_date >= CURRENT_DATE
            ORDER BY specific_date ASC
        `;
        const result = await pool.query(query, [salonId]);
        
        res.json(result.rows);
    } catch (err) {
        console.error("Get Overrides Error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.addOverride = async (req, res) => {
    const { specific_date, is_open, start_time, end_time } = req.body;

    try {
        const salonId = await getSalonId(req.session.userId);
        if (!salonId) return res.status(400).json({ message: "No Salon Assigned" });

        const start = is_open ? start_time : null;
        const end = is_open ? end_time : null;

        const query = `
            INSERT INTO salon_date_overrides (salon_id, specific_date, is_open, start_time, end_time)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, specific_date, is_open, start_time, end_time
        `;

        const result = await pool.query(query, [salonId, specific_date, is_open, start, end]);
        
        res.json({ success: true, override: result.rows[0], message: "Exception added" });

    } catch (err) {
        console.error("Add Override Error:", err);
        // Handle Unique Constraint Violation (Duplicate Date)
        if (err.code === '23505') { 
            return res.status(400).json({ message: "An override for this date already exists. Delete it first." });
        }
        res.status(500).json({ message: "Server error" });
    }
};

exports.deleteOverride = async (req, res) => {
    const { id } = req.params;

    try {
        const salonId = await getSalonId(req.session.userId);
        if (!salonId) return res.status(400).json({ message: "No Salon Assigned" });

        // Ensure the override belongs to the logged-in manager's salon
        const query = `DELETE FROM salon_date_overrides WHERE id = $1 AND salon_id = $2`;
        const result = await pool.query(query, [id, salonId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Exception not found or unauthorized" });
        }

        res.json({ success: true, message: "Exception deleted" });
    } catch (err) {
        console.error("Delete Override Error:", err);
        res.status(500).json({ message: "Server error" });
    }
};