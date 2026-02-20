// src/routes/customerRoutes.js (CORRECTED)

const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
// Ensure requireAuth/requireCustomer is correctly imported
const { requireCustomer } = require('../middleware/auth'); 

// --- 1. Public Endpoints (Accessible without login) ---
// These are routes used for general browsing (e.g., viewing a list of all salons).
router.get('/salons', customerController.getSalons);
router.get('/nearby', customerController.getNearbySalons);
router.get('/salons/:salonId', customerController.getSalonDetails);
router.get('/services/:salonId', customerController.getServicesBySalon);
router.get('/staff/:salonId', customerController.getAvailableStaffBySalon);
router.get('/timeslots', customerController.getAvailableTimeSlots);
router.get('/my-appointments', customerController.getCustomerAppointments);
router.get('/customerAppointments', customerController.getAppoinments); // Fixed typo in route name

// --- 2. Authorization Boundary ---
// Apply the authorization middleware here. 
// All routes BELOW this line require the 'customer' role.
router.use(requireCustomer); 

// Booking (Needs to be protected to ensure only a customer can submit a booking)
router.post('/appointments', customerController.createAppointment); 
router.post('/bookings', customerController.createAppointment); 

// Customer Dashboard Data (These routes are often called '/me' or imply the current user)
// NOTE: I've updated the path consistency (e.g., using /me convention).
router.get('/appointments/me', customerController.getCustomerAppointments); 
router.get('/recommended/me', customerController.getRecommendedServices);
router.get('/recommended', customerController.getRecommendedServices);

router.post('/submitReview', customerController.submitReview);
router.get('/salonReviews/:salon_id', customerController.getSalonReviews);
router.get('/pendingReviews/:user_id', customerController.getPendingReview);
// You must change your frontend JavaScript calls to use the updated, explicit paths:
// Old: fetch('/api/appointments')  -->  New: fetch('/api/customer/appointments/me') 

module.exports = router;