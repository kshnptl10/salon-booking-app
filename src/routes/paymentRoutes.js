const paymentController = require('../controllers/paymentController');
const express = require('express');
const router = express.Router();

router.post('/create-order', paymentController.createOrder);
router.post('/verify-payment', paymentController.verifyPayment);

module.exports = router;