let currentSalonId = null; 
let currentServiceId = null;

function openRescheduleModal(apptId, salon_id) {
    let salonId = parseInt(salon_id); 
    if (isNaN(salonId)) {
        salonId = null;
    }

    currentSalonId = salonId;

    document.getElementById('rescheduleApptId').value = apptId;
    document.getElementById('newDate').value = '';
    document.getElementById('timeSlotsContainer').innerHTML = 'Please select a date.';
    document.getElementById('rescheduleModal').style.display = 'flex'; 
}
async function fetchAvailableSlots() {
    const newDate = document.getElementById('newDate').value;
    const container = document.getElementById('timeSlotsContainer');

    const salonIdToSend = currentSalonId;
    const appointmentIdToSend = document.getElementById('rescheduleApptId').value;
    // --- Validation ---
    if (!newDate) {
        container.innerHTML = '<div class="alert alert-warning">Please select a date first.</div>';
        return;
    }
    if (!salonIdToSend || !appointmentIdToSend) {
        container.innerHTML = '<div class="alert alert-danger">Error: Missing Salon or Appointment ID.</div>';
        return;
    }

    container.innerHTML = '<div class="text-center"><i class="fa fa-spinner fa-spin"></i> Loading available times...</div>';

    try {

        const url = `/api/appointments/slots?date=${newDate}&salonId=${salonIdToSend}&appointmentId=${appointmentIdToSend}`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok || (!data.success && !Array.isArray(data))) {
            throw new Error(data.message || data.error || "Failed to load slots");
        }

        // Handle both return formats: { success: true, slots: [...] } OR [...]
        const slotsArray = Array.isArray(data) ? data : data.slots;

        // --- Render Buttons ---
        if (slotsArray && slotsArray.length > 0) {
            container.innerHTML = `<div class="d-flex flex-wrap gap-2">` + 
                slotsArray.map(slot => 
                    `<button type="button" class="btn btn-outline-primary btn-slot m-1" 
                        onclick="selectTimeSlot('${slot}', this)">
                        ${formatTime(slot)}
                    </button>`
                ).join('') + 
            `</div>`;
        } else {
            container.innerHTML = '<div class="alert alert-secondary">No available slots for this date. Please try another day.</div>';
        }

    } catch (error) {
        console.error("Slot Error:", error);
        container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
    }
}

// Helper: Format 24h time to 12h AM/PM
function formatTime(timeString) {
    const [hour, minute] = timeString.split(':');
    const h = parseInt(hour);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minute} ${ampm}`;
}

// Helper: Selection Logic
function selectTimeSlot(time, element) {
    // Hidden Input for the form
    document.getElementById('selectedNewTime').value = time;
    
    // UI: Highlight selected button
    document.querySelectorAll('.btn-slot').forEach(btn => {
        btn.classList.remove('active', 'btn-primary');
        btn.classList.add('btn-outline-primary');
    });
    element.classList.remove('btn-outline-primary');
    element.classList.add('active', 'btn-primary');
}

async function submitReschedule() {
    const apptId = document.getElementById('rescheduleApptId').value;
    const newDate = document.getElementById('newDate').value;
    const newTime = document.getElementById('selectedNewTime').value;
    const messageElement = document.getElementById('rescheduleMessage');

    // 1. Basic Validation
    if (!newDate || !newTime) {
        messageElement.innerText = "Please select both a date and a time slot.";
        messageElement.style.color = "red";
        return;
    }

    try {
        // 2. Send the PUT request to the backend route defined in appointmentRoutes.js
        const response = await fetch(`/api/appointments/${apptId}/reschedule`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                newDate: newDate,
                newTime: newTime
            })
        });

        const result = await response.json();

        if (response.ok) {
            // 3. Handle Success
            messageElement.innerText = "Appointment successfully rescheduled!";
            messageElement.style.color = "green";

            // Refresh the list and close modal after a short delay
            setTimeout(() => {
                closeRescheduleModal();
                if (typeof loadAppointments === 'function') {
                    loadAppointments(); // Re-fetch the cards in c_myappointments.js
                }
            }, 1500);
        } else {
            // 4. Handle Server-side Errors
            messageElement.innerText = `Error: ${result.message}`;
            messageElement.style.color = "red";
        }
    } catch (error) {
        console.error("Reschedule Submission Error:", error);
        messageElement.innerText = "Network error. Please try again.";
        messageElement.style.color = "red";
    }
}

function closeRescheduleModal() {
    const modal = document.getElementById('rescheduleModal');
    if (modal) {
        modal.style.display = 'none';
    }
    document.getElementById('rescheduleMessage').innerText = '';
}

async function initiatePayment(appointmentId, amount) {
    // 1. Create Order on Backend
    const response = await fetch('/api/appointments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amount, appointmentId: appointmentId })
    });
    
    const orderData = await response.json();

    if (!orderData.success) {
        alert("Error creating order: " + orderData.message);
        return;
    }

    // 2. Open Razorpay Checkout
    const options = {
        "key": orderData.key_id, 
        "amount": orderData.amount, 
        "currency": "INR",
        "name": "BookNStyle",
        "description": "Appointment Payment",
        "order_id": orderData.order_id, 
        "handler": async function (response) {
            // 3. On Success: Verify Payment on Backend
            const verifyRes = await fetch('/api/appointments/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    appointmentId: appointmentId
                })
            });

            const verifyData = await verifyRes.json();
            
            if (verifyData.success) {
                alert("Payment Successful! Booking Confirmed.");
                window.location.reload(); // Or redirect to dashboard
            } else {
                alert("Payment Verification Failed!");
            }
        },
        "prefill": {
            "name": "Customer Name", // Optional: Get from session if possible
            "email": "customer@example.com",
            "contact": "9999999999"
        },
        "theme": {
            "color": "#3399cc"
        }
    };

    const rzp1 = new Razorpay(options);
    rzp1.on('payment.failed', function (response){
        alert("Payment Failed: " + response.error.description);
    });
    
    rzp1.open();
}