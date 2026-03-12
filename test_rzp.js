const Razorpay = require('razorpay');

const rzp = new Razorpay({
    key_id: 'rzp_test_SQHilCdObMSecn',
    key_secret: 'yR9XY4yuck607t0vFaRTPb9o'
});

// If this works, your keys are valid. If not, you get a 401.
rzp.orders.all({ count: 1 })
    .then(data => console.log("✅ Connection Successful! Keys are valid."))
    .catch(err => console.error("❌ Connection Failed:", err.error.description));