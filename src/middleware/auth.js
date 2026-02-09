/**
 * Middleware to check if a user is authenticated (Any logged-in user).
 */
const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        // Use a standard unauthorized response for APIs
        return res.status(401).json({ error: 'Authentication required.' }); 
    }
    next();
};

const checkAuthentication = (req, res, next) => {
    // Check if user session exists and has a userId
    if (!req.session || !req.session.userId) {
        // If not logged in, redirect them to the sign-in page
        return res.redirect('/login');    
    }

    const role = req.session.userRole;

    // 1. Allow Admin, Superadmin, AND Manager
    if (role === 'admin' || role === 'superadmin' || role === 'manager') {
        return next(); // Authorized: Proceed to dashboard
    } 
    
    // 2. Redirect Customers back to their own area
    if (role === 'customer') {
        return res.redirect('/c_dashboard'); 
    }
    
    // 3. Default denial for other invalid roles
    return res.status(403).send('Access Denied: You must be an Administrator or Manager.');
};

/**
 * Middleware to check if the user is a Superadmin.
 * (No changes needed: Managers/Admins are strictly excluded)
 */
const requireSuperadmin = (req, res, next) => {
    if (!req.session || req.session.userRole !== 'superadmin') {
        return res.status(403).json({ error: 'Forbidden. Superadmin access required.' });
    }
    next();
};

const requireAdmin = (req, res, next) => {
    const role = req.session.userRole;
    
    // If session is missing OR role is NOT one of the allowed types
    if (!req.session || (role !== 'admin' && role !== 'superadmin' && role !== 'manager')) {
        return res.status(403).json({ error: 'Forbidden. Admin/Manager access required.' });
    }
    next();
};

const checkCustomerAuthentication = (req, res, next) => {
    // Check if user session exists and has a userId
    if (!req.session || !req.session.userId) {
        // If not logged in, redirect them to the sign-in page
        return res.redirect('/c_login');
    }
    next(); // User is authenticated, proceed to the requested page
};

const requireCustomer = (req, res, next) => {
    if (!req.session || req.session.userRole !== 'customer') {
        return res.status(403).json({ error: 'Forbidden. Customer access required.' });
    }
    next();
};

module.exports = {
    requireAuth,
    checkAuthentication,
    requireSuperadmin,
    requireAdmin,
    checkCustomerAuthentication,
    requireCustomer
};