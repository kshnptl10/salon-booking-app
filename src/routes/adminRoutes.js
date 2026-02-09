// src/routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdmin, requireSuperadmin } = require('../middleware/auth');
const reportController = require('../controllers/reportController');
const settingsController = require('../controllers/settingsController');
 // Check your path
const { verifyToken } = require('../middleware/auth');

// All Admin APIs require 'admin' role or higher
router.use(requireAdmin); 

// --- 1. Dashboard Stats ---
router.get('/sales/today', adminController.getTodaySales);
router.get('/sales/month', adminController.getThisMonthSales);
router.get('/appointments/completed-month', adminController.getCompletedAppointmentsMonth);
router.get('/appointments/pending-month', adminController.getPendingAppointmentsMonth);
router.get('/sales/today-percent', adminController.getTodaySalesPercentChange);
router.get('/sales/month-percent', adminController.getMonthSalesPercentChange);
router.get('/my-salons', adminController.getSalonsForUser);
router.get('/dashboard-stats', adminController.getDashboardStats);
router.post('/create-salon', adminController.createSalon);
router.get('/available-managers', adminController.getAvailableManagers);
router.get('/all-managers', adminController.getAllManagers);
//router.get('/all-managers', verifyToken, adminController.getAllManagers);
router.post('/add-manager', adminController.addManager);
router.get('/manager/:id', adminController.getManagerById);
router.put('/update-manager/:id', adminController.updateManager);
router.put('/remove-manager/:id', adminController.removeManager);
router.get('/salons-list', adminController.getSalonsList);
router.get('/salon/:id', adminController.getSalonById);
router.put('/edit-salon/:id', adminController.editSalon);
router.put('/toggle-salon-status/:id', adminController.toggleSalonStatus);
router.post('/generate-report', reportController.generateReport);
router.get('/settings', settingsController.getSettings);
router.put('/settings', settingsController.updateSettings);
router.get('/getTimesettings', adminController.getSettings);
router.put('/updateTimeSettings', adminController.updateSettings);
router.get('/schedule', adminController.getSchedule);
router.post('/schedule', adminController.saveSchedule);
router.get('/overrides', adminController.getOverrides);
router.post('/overrides', adminController.addOverride);
router.delete('/overrides/:id', adminController.deleteOverride);


// --- 2. Appointments Management ---
router.get("/today-appointments", adminController.getTodayAppointments);
router.get("/this-month-appointments", adminController.getThisMonthAppointments);
router.patch("/appointments/:id/status", adminController.updateAppointmentStatus);
router.get("/appointments", adminController.getAllAppointments);

// --- 3. Staff CRUD ---
router.get("/staff", adminController.getAllStaff);
router.post("/staff", adminController.createStaff);
router.put("/staff/:id", adminController.updateStaff);
router.delete("/staff/:id", adminController.deleteStaff);

// --- 4. Services CRUD ---
router.get("/services", adminController.getAllServices);
router.post("/services", adminController.createService);
router.put("/services/:id", adminController.updateService);
router.delete("/services/:id", adminController.deleteService);

// --- 5. Time Slots CRUD ---
router.get("/timeslots", adminController.getAllTimeSlots);
router.post("/timeslots", adminController.createTimeSlot);
router.put("/timeslots/:id", adminController.updateTimeSlot);
router.delete("/timeslots/:id", adminController.deleteTimeSlot);

// --- 6. Superadmin Only Routes ---
router.get('/admins', requireSuperadmin, adminController.getAllAdmins);
router.delete('/admins/:id', requireSuperadmin, adminController.deleteAdmin);

router.get('/api/admin/salons', adminController.getAllSalons);

module.exports = router;