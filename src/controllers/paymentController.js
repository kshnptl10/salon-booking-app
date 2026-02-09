const Razorpay = require('razorpay');
const crypto = require('crypto');
const pool = require('../config/db');

const KEY_ID = 'rzp_test_SBFfyfQ9jHXAOA';
const KEY_SECRET = 'YTEqCC0NJF0RtLpHHa5tZKmZ';

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
        // --- STEP 1: FETCH REAL PRICE FROM DB ---
        const priceQuery = `
            SELECT s.price 
            FROM appointments a
            JOIN services s ON a.service_id = s.id
            WHERE a.id = $1
        `;
        
        const priceResult = await pool.query(priceQuery, [appointmentId]);

        if (priceResult.rows.length === 0) {
            // This was likely your previous 404 cause!
            return res.status(404).json({ success: false, message: "Appointment not found in database." });
        }

        const realAmount = parseFloat(priceResult.rows[0].price); 
        // --- STEP 2: CREATE RAZORPAY ORDER ---
        const options = {
            amount: Math.round(realAmount * 100), // Convert to Paise & ensure integer
            currency: "INR",
            receipt: `receipt_${appointmentId}`,
            payment_capture: 1
        };

        const order = await razorpay.orders.create(options);

        // --- STEP 3: SAVE ORDER ID TO DB ---
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