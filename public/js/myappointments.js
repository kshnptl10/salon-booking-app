// booking.js
// ---------------------------------------------
// Handles salon service booking modal logic
// ---------------------------------------------

const API_BASE = "http://localhost:3000"; // Change this if backend runs elsewhere

// Open the booking modal and load staff dynamically
async function openBookingModal(customerId, salonId, serviceId) {
  const modal = document.getElementById("bookingModal");
  const staffDropdown = document.getElementById("staffDropdown");

  // Set hidden values
  document.getElementById("modalCustomerId").value = customerId;
  document.getElementById("modalSalonId").value = salonId;
  document.getElementById("modalServiceId").value = serviceId;

  // Clear previous staff options
  staffDropdown.innerHTML = `<option value="">Loading staff...</option>`;

  try {
    // Fetch available staff for the salon
    const res = await fetch(`${API_BASE}/api/staff/${salonId}`);
    const staffList = await res.json();

    if (staffList.length > 0) {
      staffDropdown.innerHTML =
        `<option value="">Select Staff</option>` +
        staffList
          .map(
            (st) =>
              `<option value="${st.staff_id}">${st.staff_name} (${st.specialization || "General"})</option>`
          )
          .join("");
    } else {
      staffDropdown.innerHTML = `<option value="">No staff available</option>`;
    }
  } catch (err) {
    console.error("Error loading staff:", err);
    staffDropdown.innerHTML = `<option value="">Error loading staff</option>`;
  }

  // Show the modal
  modal.style.display = "flex";
}

// Close the booking modal
function closeModal() {
  const modal = document.getElementById("bookingModal");
  modal.style.display = "none";
}

// Handle booking form submission
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("bookingForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Collect form data
    const customer_id = document.getElementById("modalCustomerId").value;
    const salon_id = document.getElementById("modalSalonId").value;
    const service_id = document.getElementById("modalServiceId").value;
    const staff_id = document.getElementById("staffDropdown").value || null;
    const appointment_date = document.getElementById("appointmentDate").value;
    const appointment_time = document.getElementById("appointmentTime").value;
    const notes = document.getElementById("notes").value;

    // Validate
    if (!appointment_date || !appointment_time) {
      alert("Please select both date and time for your appointment.");
      return;
    }

    // Prepare data
    const bookingData = {
      customer_id,
      salon_id,
      service_id,
      staff_id,
      appointment_date,
      appointment_time,
      notes,
    };

    try {
      const res = await fetch(`${API_BASE}/api/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });

      const data = await res.json();

      if (res.ok) {
        alert("✅ " + data.msg);
        closeModal();
        // Optional: refresh appointments dynamically
        if (typeof loadAppointments === "function") {
          loadAppointments(customer_id);
        }
      } else {
        alert("⚠️ Booking failed: " + (data.msg || "Please try again."));
      }
    } catch (err) {
      console.error("Error booking appointment:", err);
      alert("Server error while booking. Please try again later.");
    }
  });
});

// Optional helper to refresh appointment list after booking
async function loadAppointments(customerId) {
  try {
    const res = await fetch(`${API_BASE}/api/appointments/${customerId}`);
    const appointments = await res.json();
    const appointmentList = document.getElementById("appointmentList");

    if (!appointmentList) return;

    if (appointments.length === 0) {
      appointmentList.innerHTML = "<p>No appointments found.</p>";
      return;
    }

    appointmentList.innerHTML = appointments
      .map(
        (a) => `
        <div class="appointment-item">
          <div>
            <strong>${a.service_name}</strong> at ${a.salon_name}<br>
            <small>${a.appointment_date} | ${a.appointment_time}</small>
          </div>
          <span>${a.status}</span>
        </div>`
      )
      .join("");
  } catch (err) {
    console.error("Error loading appointments:", err);
  }
}

function navigateToBooking(salonId, serviceId) {
  // Navigate to book-service page with parameters
  window.location.href = `book-service.html?salon_id=${salonId}&service_id=${serviceId}`;
}