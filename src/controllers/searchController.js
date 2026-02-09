const pool = require('../config/db'); // Your DB connection

exports.searchGlobal = async (req, res) => {
    try {
        const query = req.query.q; // Get the search term from URL (e.g., ?q=hair)
        
        if (!query || query.length < 2) {
            return res.json({ salons: [], services: [] });
        }

        const searchTerm = `%${query}%`; // Format for SQL ILIKE

        // 1. Search Salons (by Name or City)
        const salonQuery = `
            SELECT salon_id, salon_name, city, 'salon' as type 
            FROM salons 
            WHERE salon_name ILIKE $1 OR city ILIKE $1 
            LIMIT 5`;

        // 2. Search Services (by Name)
        // We also fetch the salon_name so user knows where the service is
        const serviceQuery = `
            SELECT s.id, s.name, s.price, sal.salon_name as salon_name, 'service' as type 
            FROM services s
            JOIN salons sal ON s.salon_id = sal.salon_id
            WHERE s.name ILIKE $1 
            LIMIT 5`;

        // Run both queries in parallel
        const [salons, services] = await Promise.all([
            pool.query(salonQuery, [searchTerm]),
            pool.query(serviceQuery, [searchTerm])
        ]);

        res.json({
            salons: salons.rows,
            services: services.rows
        });

    } catch (err) {
        console.error("Search Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};