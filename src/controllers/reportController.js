const pool = require('../config/db');

exports.generateReport = async (req, res) => {
    const { startDate, endDate, reportType } = req.body;
    const adminId = req.session.userId; // <--- 1. Get Logged-in Admin ID

    if (!adminId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    // Default to current month if dates missing
    const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    try {
        // --- 1. SUMMARY CARDS DATA (Filtered by Admin) ---
        // We added JOIN salons s ... AND s.admin_id = $3
        const summaryQuery = `
            SELECT 
                COALESCE(SUM(CASE WHEN st.status_name = 'Completed' THEN a.total_amount ELSE 0 END), 0) as total_revenue,
                COUNT(a.id) as total_bookings,
                COUNT(CASE WHEN st.status_name = 'Completed' THEN 1 END) as completed_services,
                COUNT(CASE WHEN st.status_name = 'Cancelled' THEN 1 END) as cancelled_bookings
            FROM appointments a
            JOIN salons s ON a.salon_id = s.salon_id      -- Join Salons to check ownership
            LEFT JOIN appointment_status st ON a.status_id = st.id
            WHERE a.appointment_date BETWEEN $1 AND $2
            AND s.admin_id = $3                           -- Filter by Admin ID
        `;
        
        // Pass adminId as the 3rd parameter
        const summaryResult = await pool.query(summaryQuery, [start, end, adminId]);
        const summary = summaryResult.rows[0];

        // --- 2. DETAILED TABLE DATA (Filtered by Admin) ---
        let tableQuery = "";
        
        // Note: All queries below now include "AND s.admin_id = $3"
        switch (reportType) {
            case 'Sales Report':
                tableQuery = `
                    SELECT 
                        TO_CHAR(a.appointment_date, 'DD Mon YYYY') as date_col,
                        s.salon_name,
                        COUNT(a.id) as total_count,
                        SUM(CASE WHEN st.status_name = 'Completed' THEN a.total_amount ELSE 0 END) as revenue,
                        COUNT(CASE WHEN st.status_name = 'Cancelled' THEN 1 END) as cancelled_count
                    FROM appointments a
                    JOIN salons s ON a.salon_id = s.salon_id
                    LEFT JOIN appointment_status st ON a.status_id = st.id
                    WHERE a.appointment_date BETWEEN $1 AND $2
                    AND s.admin_id = $3
                    GROUP BY a.appointment_date, s.salon_name
                    ORDER BY a.appointment_date DESC
                `;
                break;

            case 'Staff Performance':
                tableQuery = `
                    SELECT 
                        u.name as staff_name,
                        s.salon_name,
                        COUNT(a.id) as total_bookings,
                        SUM(CASE WHEN st.status_name = 'Completed' THEN a.total_amount ELSE 0 END) as revenue_generated
                    FROM appointments a
                    JOIN staff u ON a.staff_id = u.id 
                    JOIN salons s ON a.salon_id = s.salon_id
                    LEFT JOIN appointment_status st ON a.status_id = st.id
                    WHERE a.appointment_date BETWEEN $1 AND $2
                    AND s.admin_id = $3
                    GROUP BY u.name, s.salon_name
                `;
                break;

            case 'Salon Performance':
                tableQuery = `
                    SELECT 
                        s.salon_name,
                        s.city,
                        COUNT(a.id) as total_bookings,
                        SUM(CASE WHEN st.status_name = 'Completed' THEN a.total_amount ELSE 0 END) as total_revenue
                    FROM appointments a
                    JOIN salons s ON a.salon_id = s.salon_id
                    LEFT JOIN appointment_status st ON a.status_id = st.id
                    WHERE a.appointment_date BETWEEN $1 AND $2
                    AND s.admin_id = $3
                    GROUP BY s.salon_id, s.salon_name, s.city
                `;
                break;

            default: 
                tableQuery = `
                    SELECT a.*, s.salon_name, st.status_name 
                    FROM appointments a 
                    JOIN salons s ON a.salon_id = s.salon_id 
                    LEFT JOIN appointment_status st ON a.status_id = st.id
                    WHERE appointment_date BETWEEN $1 AND $2
                    AND s.admin_id = $3
                `;
        }

        const tableResult = await pool.query(tableQuery, [start, end, adminId]);
        
        res.json({ success: true, summary, tableData: tableResult.rows, reportType });

    } catch (err) {
        console.error("Generate Report Error:", err);
        res.status(500).json({ message: "Server error generating report" });
    }
};