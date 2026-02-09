
const elements = {
    salonSelect: document.getElementById("salon"),
    serviceSelect: document.getElementById("service"),
    staffSelect: document.getElementById("staff"),
    bookingForm: document.getElementById("bookingForm"),
    dateInput: document.getElementById("date"),
    timeInput: document.getElementById("time"), // Hidden input
    timeSlotContainer: document.getElementById("timeSlotContainer"),
    profileName: document.getElementById("profileName"),
    profileImg: document.querySelector(".profile-bubble img"),
    profileBubble: document.getElementById('profileBubble'),
    profileMenuPopup: document.getElementById('profileMenuPopup')
};

const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const [hourStr, minute] = timeStr.split(":");
    let h = parseInt(hourStr, 10);
    const suffix = h >= 12 ? "PM" : "AM";
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return `${h}:${minute} ${suffix}`;
};

const resetDropdown = (selectElement, defaultText) => {
    selectElement.innerHTML = `<option value="">${defaultText}</option>`;
    selectElement.disabled = false;
};

async function getUserId() {
    try {
        const res = await fetch("/api/me");
        if (!res.ok) throw new Error("Failed to fetch user data.");
        const user = await res.json();
        return user.id;
    } catch (err) {
        console.error("User ID fetch failed:", err);
        return null;
    }
}

async function fetchSalons() {
    const res = await fetch("/api/customer/salons");
    if (!res.ok) throw new Error("Failed to fetch salons");
    return await res.json();
}

async function fetchServices(salonId) {
    const res = await fetch(`/api/customer/services/${salonId}`);
    if (!res.ok) throw new Error("Failed to fetch services");
    return await res.json();
}

async function fetchStaff(salonId) {
    const res = await fetch(`/api/customer/staff/${salonId}`);
    if (!res.ok) throw new Error("Failed to fetch staff");
    return await res.json();
}

async function fetchTimeSlots(salonId, date) {
    const res = await fetch(`/api/customer/timeslots?salonId=${salonId}&date=${date}`);
    if (!res.ok) throw new Error("Failed to fetch time slots");
    return await res.json();
}

async function loadSalons(preselectedSalonId, preselectedServiceId) {
    try {
        const salons = await fetchSalons();

        // clear previous options
        resetDropdown(elements.salonSelect, "Select a Salon");

        salons.forEach(salon => {
            const option = document.createElement("option");
            option.value = salon.salon_id;
            const locationInfo = salon.branch_name || salon.city || '';
            const branchLabel = locationInfo ? ` - ${locationInfo}` : '';
            option.textContent = salon.salon_name + branchLabel;

            if (preselectedSalonId && salon.salon_id == preselectedSalonId) {
                option.selected = true;
            }
            elements.salonSelect.appendChild(option);
        });

        if (preselectedSalonId) {
            elements.salonSelect.disabled = true; // Lock salon if preselected via session
            loadServices(preselectedSalonId, preselectedServiceId);
        }
    } catch (err) {
        console.error("Error loading salons:", err);
    }
}

async function loadServices(salonId, preselectedServiceId) {
    resetDropdown(elements.serviceSelect, "Choose a Service");
    resetDropdown(elements.staffSelect, "Choose Staff");

    if (!salonId) return;

    try {
        const services = await fetchServices(salonId);
        services.forEach(service => {
            const option = document.createElement("option");
            option.value = service.id;
            option.textContent = service.name;

            if (preselectedServiceId && service.id == preselectedServiceId) {
                option.selected = true;
                loadStaff(salonId, service.id); // Trigger staff load
            }
            elements.serviceSelect.appendChild(option);
        });
    } catch (err) {
        console.error("Error loading services:", err);
    }
}

async function loadStaff(salonId, serviceId) {
    resetDropdown(elements.staffSelect, "Any Staff Member"); // "Any" implies null is okay

    if (!salonId) return;

    try {
        const staffList = await fetchStaff(salonId);
        staffList.forEach(staff => {
            const option = document.createElement("option");
            option.value = staff.id;
            option.textContent = staff.name;
            elements.staffSelect.appendChild(option);
        });
    } catch (err) {
        console.error("Error loading staff:", err);
    }
}

async function renderTimeSlots(salonId, date) {
    const container = elements.timeSlotContainer;
    
    // Reset UI
    container.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading slots...</div>';
    elements.timeInput.value = ""; // Clear hidden input

    if (!salonId || !date) {
        container.innerHTML = '<p class="text-muted">Please select a salon and date.</p>';
        return;
    }

    try {
        const slots = await fetchTimeSlots(salonId, date);

        if (slots.length === 0) {
            container.innerHTML = '<p class="text-danger">No available slots for this date.</p>';
            return;
        }

        // Render buttons using data attributes (cleaner than onclick)
        container.innerHTML = slots.map(slot => `
            <button type="button" class="btn btn-slot" data-value="${slot.slot_time}">
                ${formatTime(slot.slot_time)}
            </button>
        `).join('');

    } catch (error) {
        console.error("Error fetching timeslots:", error);
        container.innerHTML = '<p class="text-danger">Error loading slots.</p>';
    }
}
// 5.1. Dropdown Changes
elements.salonSelect.addEventListener("change", () => {
    const salonId = elements.salonSelect.value;
    
    // Reset downstream logic
    loadServices(salonId, null);
    elements.timeInput.value = ''; 
    elements.dateInput.value = ''; 
    elements.timeSlotContainer.innerHTML = '<p class="text-muted">Please select a date.</p>';
});

elements.serviceSelect.addEventListener("change", () => {
    loadStaff(elements.salonSelect.value, elements.serviceSelect.value);
});

// 5.2. Date Selection (Triggers Slot Loading)
elements.dateInput.addEventListener("change", () => {
    renderTimeSlots(elements.salonSelect.value, elements.dateInput.value);
});

// 5.3. Time Slot Selection (Event Delegation)
elements.timeSlotContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-slot');
    if (!btn) return; // Ignore clicks that aren't on buttons

    // Deselect siblings
    elements.timeSlotContainer.querySelectorAll('.btn-slot').forEach(b => b.classList.remove('selected'));
    
    // Select clicked button
    btn.classList.add('selected');
    
    // Update Hidden Input
    elements.timeInput.value = btn.dataset.value;
});

// 5.4. Form Submission

elements.bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const { salonSelect, serviceSelect, staffSelect, dateInput, timeInput } = elements;

    // 1. Validation
    if (!salonSelect.value || !serviceSelect.value || !dateInput.value || !timeInput.value) {
        alert("Please complete all required fields.");
        return;
    }

    const userId = await getUserId();
    if (!userId) return alert("Please log in again.");

    // 2. Prepare Data
    const bookingData = {
        user_id: userId,
        salon_id: salonSelect.value,
        service_id: serviceSelect.value,
        staff_id: staffSelect.value || null,
        appointment_date: dateInput.value,
        appointment_time: timeInput.value,
        // IMPORTANT: Add price if you have it in a hidden field, or backend calculates it
        // payment_status: 'Pending' (Backend should set this default)
    };

    const submitBtn = document.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    try {
        // 3. STEP 1: CREATE THE BOOKING (Pending Status)
        const res = await fetch("/api/customer/bookings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bookingData)
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Booking failed.');

        // ✅ WE NOW HAVE THE ID!
        const newAppointmentId = data.appointmentId; 
        const amountToPay = 500; // You should ideally get this from the backend response too: data.price
        
        // 4. STEP 2: INITIATE PAYMENT
        // We pass the new ID to your Razorpay function
        await initiatePayment(newAppointmentId, amountToPay);

    } catch (err) {
        console.error("Booking failed:", err);
        alert(`Failed to book. ${err.message}`);
        submitBtn.disabled = false;
        submitBtn.innerText = 'Confirm Booking';
    }
});

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
    // 1. Check URL parameters for pre-selected salon/service
    // (e.g. if user clicked "Book Now" from a specific salon card)
    const urlParams = new URLSearchParams(window.location.search);
    const preSalonId = urlParams.get('salonId');
    const preServiceId = urlParams.get('serviceId');

    // 2. Load the Salons
    loadSalons(preSalonId, preServiceId);
});


async function initiatePayment(appointmentId, amount) {
    try {
        // 1. Create Order
        const response = await fetch('/api/payment/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: amount, appointmentId: appointmentId })
        });
        
        const orderData = await response.json();
        if (!orderData.success) throw new Error(orderData.message);

        // 2. Open Razorpay
        const options = {
            "key": orderData.key_id,
            "amount": orderData.amount,
            "currency": "INR",
            "name": "BookNStyle",
            "description": "Service Payment",
            "order_id": orderData.order_id,
            "handler": async function (response) {
                // 3. Verify Payment
                const verifyRes = await fetch('/api/payment/verify-payment', {
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
                    window.location.href = "c_dashboard.html"; // Redirect on success
                } else {
                    alert("Payment Verification Failed. Please contact support.");
                }
            },
            "prefill": { "contact": "9999999999" }, // Optional: prefill user phone
            "theme": { "color": "#3399cc" },
            "modal": {
                "ondismiss": function() {
                    alert('Payment cancelled. Your booking is saved as Pending.');
                    window.location.href = "c_myappointments.html"; // Redirect to "My Bookings" so they can pay later
                }
            }
        };

        const rzp1 = new Razorpay(options);
        rzp1.open();

    } catch (error) {
        console.error("Payment Error:", error);
        alert("Could not initialize payment: " + error.message);
    }
}