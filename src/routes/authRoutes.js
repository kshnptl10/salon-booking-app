// src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const path = require('path');

router.get('/sign-in', authController.getSignInPage);

// Admin & Superadmin Signup Pages
router.get('/signup-admin', authController.getAdminSignupPage);
router.get('/signup-superadmin', authController.getSuperadminSignupPage);


// --- 2. AUTH FORM SUBMISSIONS ---

// Login & Logout
router.post('/login', authController.loginUser);
router.post('/logout', authController.logoutUser);

// Customer Login/Logout
router.post('/c_login', authController.loginCustomer);
router.get('/c_logout', authController.logoutCustomer);

// Signup Submissions
router.post('/signup-admin', authController.postAdminSignup);
router.post('/signup-superadmin', authController.postSuperadminSignup);
router.post('/signup-customer', authController.signupCustomer);

// Create Manager (Protected API)
router.post('/api/admin/create-manager', authController.createSalonManager);


// --- 3. PROFILE & API ROUTES ---

router.get('/api/me', requireAuth, authController.getMe);
router.post('/api/me/avatar', requireAuth, authController.uploadAvatar);
router.get('/get-profile', requireAuth, authController.getProfile);
router.post('/update-profile', requireAuth, authController.updateProfile);
router.get('/api/customerprofile', requireAuth, authController.getCustomerProfile);
router.put('/api/customerupdateprofile', requireAuth, authController.updateCustomerProfile);


// --- 4. PASSWORD RECOVERY ---rs
router.post('/reset-password', authController.resetPassword);
router.post('/set-password', authController.setNewPassword);
module.exports = router;