const Razorpay = require('razorpay');
const crypto = require('crypto');
const pool = require('../config/db');

const KEY_ID = 'rzp_test_SQHilCdObMSecn';
const KEY_SECRET = 'yR9XY4yuck607t0vFaRTPb9o';

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: KEY_ID,
    key_secret: KEY_SECRET
});

// 1. Create an Order
exports.createOrder = async (req, res) => {
    const { appointmentId } = req.body; 

    if (!appointmentId) {
        return res.status(400).json({ success: false, message: "Appointment ID is missing." });
    }

    try {
        // --- STEP 1: FETCH DATA & CHECK STATUS FIRST ---
        // We can get the price and the status in one single query to be efficient
        const checkQuery = `
            SELECT s.price, a.payment_status 
            FROM appointments a
            JOIN services s ON a.service_id = s.id
            WHERE a.id = $1
        `;
        
        const checkResult = await pool.query(checkQuery, [appointmentId]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Appointment not found." });
        }

        const appointment = checkResult.rows[0];

        // 🔥 CRITICAL: Check if already paid BEFORE calling Razorpay API
        if (appointment.payment_status === 'Paid') {
            return res.status(400).json({ success: false, message: "This appointment is already paid." });
        }

        const realAmount = parseFloat(appointment.price); 

        // --- STEP 2: CREATE RAZORPAY ORDER ---
        const options = {
            amount: Math.round(realAmount * 100), // Convert to Paise
            currency: "INR",
            receipt: `receipt_${appointmentId}`,
            payment_capture: 1
        };

        const order = await razorpay.orders.create(options);

        // --- STEP 3: UPDATE DB WITH NEW ORDER ID ---
        // We set status back to 'Unpaid' or 'Pending' for the retry attempt
        await pool.query(
            `UPDATE appointments 
             SET razorpay_order_id = $1, payment_status = 'Unpaid' 
             WHERE id = $2`,
            [order.id, appointmentId]
        );

        // --- STEP 4: SEND RESPONSE ---
        res.json({
            success: true,
            order_id: order.id,
            amount: order.amount,
            key_id: KEY_ID 
        });

    } catch (error) {
        console.error("🔥 Razorpay Controller Error:", error);
        res.status(500).json({ success: false, message: "Server error: " + error.message });
    }
};

// 2. Verify Payment
exports.verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, appointmentId } = req.body;
    const secret = KEY_SECRET;

    try {
        const generated_signature = crypto
            .createHmac('sha256', secret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (generated_signature === razorpay_signature) {
            await pool.query(
                `UPDATE appointments 
                 SET payment_id = $1, payment_status = 'Paid', status_id = (SELECT id FROM appointment_status WHERE status_name = 'Confirmed') 
                 WHERE id = $2`,
                [razorpay_payment_id, appointmentId]
            );
            res.json({ success: true, message: "Payment Verified!" });
        } else {
            res.status(400).json({ success: false, message: "Invalid Signature" });
        }
    } catch (err) {
        console.error("Verify Error:", err);
        res.status(500).json({ success: false, message: "Verification Server Error" });
    }
};