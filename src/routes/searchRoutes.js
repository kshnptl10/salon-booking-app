const express = require('express');          // 1. Import Express
const router = express.Router();             // 2. Create the 'router' object
const searchController = require('../controllers/searchController'); // 3. Import your controller

// 4. Define the route
// Note: We use '/api/search' here. If you prefix this file in app.js, adjust accordingly.
router.get('/search', searchController.searchGlobal);

module.exports = router;                     // 5. EXPORT the router so app.js can use it