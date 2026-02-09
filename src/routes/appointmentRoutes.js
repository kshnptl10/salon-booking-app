// src/routes/appointmentRoutes.js

const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
// const authMiddleware = require('../middleware/authMiddleware'); // assuming you use auth

// New PUT route for rescheduling
router.put('/:id/reschedule', appointmentController.rescheduleAppointment); 
router.get('/slots', appointmentController.getAvailableTimeSlots);
router.put('/:id/cancel', appointmentController.cancelAppointment);

module.exports = router;