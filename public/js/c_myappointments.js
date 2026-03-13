//const session = require("express-session");

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  const [hour, minute] = timeStr.split(":");
  let h = parseInt(hour, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${minute} ${suffix}`;
}

let currentPage = 1; // Global variable to track page

// // 1. Function to Fetch Data
async function loadAppointments(page = 1) {
    currentPage = page;
    
    const dateValue = document.getElementById('filterDate').value;
    const serviceId = document.getElementById('filterService').value;
    
    // 2. Build the URL with both Pagination and Filter params
    let url = `/api/customer/my-appointments?page=${page}&limit=5`;

    if (dateValue) url += `&date=${dateValue}`;
    if (serviceId) url += `&serviceId=${serviceId}`;

    try {
        const res = await fetch(url, { credentials: 'same-origin' });
        const data = await res.json();

        if (data.success) {
            renderAppointments(data.appointments); // Draws the cards
            renderPagination(data.pagination);     // Draws the buttons
        } else {
            console.error("Failed to load appointments:", data.message);
        }
    } catch (error) {
        console.error("Network Error:", error);
    }
}

// 2. Function to Render the List (You likely already have this, just update it)
function renderAppointments(appointments) {
    const listContainer = document.getElementById('appointmentList'); 
    
    if (!listContainer) return; // Safety check

    listContainer.innerHTML = ''; 

    if (appointments.length === 0) {
        listContainer.innerHTML = '<p>No appointments found.</p>';
        return;
    }

    // Build the HTML using .map and .join
    listContainer.innerHTML = appointments.map(a => {
        // 1. Calculate Time Difference for the 24-Hour Rule
        // Ensure date is formatted correctly for parsing (YYYY-MM-DD)
        const dateStr = a.appointment_date.split('T')[0]; 
        const appointmentDateTime = new Date(`${dateStr}T${a.appointment_time}`);
        const now = new Date();
        const diffInHours = (appointmentDateTime - now) / (1000 * 60 * 60);

        // 2. Generate Action Buttons (Reschedule / Cancel)
        let actionButtonsHtml = '';
        if (a.status === 'Pending' || a.status === 'Confirmed') {
            if (diffInHours >= 24) {
                // More than 24 hours away: Show standard buttons
                actionButtonsHtml = `
                    <div class="appointment-actions">
                        <button onclick="openRescheduleModal(${a.id}, ${a.salon_id})">Reschedule</button>
                        <button class="btn-cancel" onclick="cancelAppointment(${a.id})">Cancel</button>
                    </div>
                `;
            } else if (diffInHours > 0) {
                // Less than 24 hours away: Lock the buttons
                actionButtonsHtml = `
                    <div class="appointment-actions">
                        <span class="locked-text" style="color: #d9534f; font-size: 0.9em;">
                            🔒 Locked (Less than 24h remaining)
                        </span>
                    </div>
                `;
            }
        }

        // 3. Generate Payment Button (Only if Unpaid and appointment is upcoming)
        let paymentButtonHtml = '';
        if (a.payment_status === 'Unpaid' && diffInHours > 0 && (a.status === 'Pending' || a.status === 'Confirmed')) {
            paymentButtonHtml = `
                <div style="margin-top: 10px;">
                    <button class="btn-pay" style="background-color: #28a745; color: white;" onclick="handleRepay('${a.id}', ${a.total_amount})">
                        Pay Now (₹${a.total_amount})
                    </button>
                </div>
            `;
        }

        // 4. Return the complete Card HTML
        return `
        <div class="appointment-card">
          <h4>${a.salon_name}</h4>
          <p><strong>Service:</strong> ${a.service_name}</p>
          <p><strong>Date:</strong> ${formatDate(a.appointment_date)}</p>
          <p><strong>Time Slot:</strong> ${formatTime(a.appointment_time)}</p>
          <p><strong>Price:</strong> ₹${a.total_amount}</p>
          <p><strong>Payment Status:</strong> ${a.payment_status}</p>
          <p><strong>Stylist:</strong> ${a.staff_name}</p>
          <p><strong>Status:</strong> ${a.status}</p>
          ${actionButtonsHtml}  
        ${paymentButtonHtml}
        </div>
        `;
    }).join('');
}

async function handleRepay(appointmentId, amount) {
    console.log(`Restarting payment for Appointment: ${appointmentId}`);
    
    // Call the same function you used in your booking.js
    // Ensure this function is imported or available in this file
    await initiatePayment(appointmentId, amount);
}

// 3. ✅ NEW: Function to Render Pagination Buttons
function renderPagination(pagination) {
    const container = document.getElementById('pagination-controls');
    container.innerHTML = '';

    // "Previous" Button
    if (pagination.currentPage > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.innerText = "« Previous";
        prevBtn.className = "btn btn-sm btn-secondary mx-1";
        prevBtn.onclick = () => loadAppointments(pagination.currentPage - 1);
        container.appendChild(prevBtn);
    }

    // Page Numbers (e.g., "Page 1 of 5")
    const infoSpan = document.createElement('span');
    infoSpan.innerText = ` Page ${pagination.currentPage} of ${pagination.totalPages} `;
    infoSpan.style.margin = "0 10px";
    container.appendChild(infoSpan);

    // "Next" Button
    if (pagination.currentPage < pagination.totalPages) {
        const nextBtn = document.createElement('button');
        nextBtn.innerText = "Next »";
        nextBtn.className = "btn btn-sm btn-secondary mx-1";
        nextBtn.onclick = () => loadAppointments(pagination.currentPage + 1);
        container.appendChild(nextBtn);
    }
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    loadAppointments(1);
});


async function cancelAppointment(apptId) {
    if (!confirm("Are you sure you want to cancel this appointment? This action cannot be undone.")) {
        return;
    }

    try {
        const response = await fetch(`/api/appointments/${apptId}/cancel`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (response.ok) {
            alert("Appointment cancelled successfully.");
            loadAppointments(); // Refresh the list to show updated status
        } else {
            alert("Error: " + result.message);
        }
    } catch (error) {
        console.error("Cancellation Error:", error);
        alert("Network error. Could not cancel appointment.");
    }
}

async function populateServiceFilter() {
    try {
        const res = await fetch("/api/customer/my-used-services", { credentials: 'same-origin' });
        const data = await res.json();
        const select = document.getElementById("filterService");

        if (data.success && data.services) {
            // Keep the "All Services" option and add the rest
            data.services.forEach(service => {
                const opt = new Option(service.name, service.id);
                select.add(opt);
            });
        }
    } catch (err) {
        console.error("Could not load booked services filter", err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    populateServiceFilter(); // <--- Populate the dropdown
    loadAppointments(1);     // <--- Load the list
});

document.getElementById('btnFilter').addEventListener('click', (e) => {
    e.preventDefault(); // Prevent page reload if it's inside a form
    loadAppointments(1); // Reset to page 1 for new search results
});

loadAppointments();