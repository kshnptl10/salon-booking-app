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
    
    try {
        // Pass the 'page' query param
        const res = await fetch(`/api/customer/my-appointments?page=${page}&limit=5`);
        const data = await res.json();

        if (data.success) {
            renderAppointments(data.appointments); // Helper to draw table
            renderPagination(data.pagination);     // Helper to draw buttons
        } else {
            console.error("Failed to load data");
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
    listContainer.innerHTML = appointments.map(a => `
        <div class="appointment-card">
          <h4>${a.salon_name}</h4>
          <p><strong>Service:</strong> ${a.service_name}</p>
          <p><strong>Date:</strong> ${formatDate(a.appointment_date)}</p>
          <p><strong>Time Slot:</strong> ${formatTime(a.appointment_time)}</p>
          <p><strong>Price:</strong> ₹${a.total_amount}</p>
          <p><strong>Payment Status:</strong> ${a.payment_status}</p>
          <p><strong>Stylist:</strong> ${a.staff_name}</p>
          <p>Status: <strong>${a.status}</strong></p>
        ${(a.status === 'Pending' || a.status === 'Confirmed')
            ? `
            <div class="appointment-actions">
            <button onclick="openRescheduleModal(${a.id}, ${a.salon_id})">Reschedule</button>
            <button class="btn-cancel" onclick="cancelAppointment(${a.id})">Cancel</button>
            </div>
            `
            : ''
        }
        </div>`
    ).join("");
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

loadAppointments();