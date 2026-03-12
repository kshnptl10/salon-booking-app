document.addEventListener("DOMContentLoaded", () => {

async function loadLoggedUser() {
  try {
    const res = await fetch('/api/me');
    if (!res.ok) {
      // not logged in; optionally redirect to sign-in
      console.warn('Not authenticated (api/me)', res.status);
      return;
    }
    const user = await res.json();
    // element where you want to show name
    const nameEl = document.getElementById('profileName');
    if (nameEl && user.name) {
      nameEl.textContent = user.name;
    }

    // optionally show role
    const roleEl = document.getElementById('profileRole');
    if (roleEl && user.role) {
      roleEl.textContent = user.role;
    }
  } catch (err) {
    console.error('Error loading logged user', err);
  }
}

  loadLoggedUser();

  // ----------BOOKED APPOINTMENTS ----------
function isInCurrentMonth(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

async function loadAppointments() {
  try {

    const staffRes = await fetch("/api/admin/staff");
    let staffList = [];

    if (staffRes.ok) {
        const staffData = await staffRes.json();
        staffList = Array.isArray(staffData) ? staffData : (staffData.staff || staffData.data || []);
    }

    const res = await fetch("/api/admin/today-appointments");
    const data = await res.json();
    
    const container = document.querySelector("#appointments-container");
    container.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = "<p>No Booked appointments found.</p>";
      return;
    }

    data.forEach(a => {
      const status = a.status || "Pending";
      const formattedDate = new Date(a.appointment_date).toLocaleDateString("en-GB");
      const formattedTime = new Date(`1970-01-01T${a.appointment_time}Z`).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });
      if (status === "Completed") return;
      let staffOptions = `<option value="">-- Assign Staff --</option>`;
      staffList.forEach(staff => {
          // If the appointment already has a staff assigned, select them by default
          const isSelected = (a.staff_id == staff.id || a.staff_name == staff.name) ? "selected" : "";
          // Note: Check if your db uses 'id' or 'staff_id'
          const staffId = staff.id || staff.staff_id; 
          staffOptions += `<option value="${staffId}" ${isSelected}>${staff.name || staff.staff_name}</option>`;
      });
      const html = `
       <ul class="list-group">
                <li class="list-group-item border-0 d-flex p-4 mb-2 mt-3 bg-gray-100 border-radius-lg">
                  <div class="d-flex flex-column">
                    <h6 class="mb-3 text-sm text-uppercase">${a.customer_name}</h6>
                    <span class="mb-2 text-xs">Service: <span id="service" class="text-dark font-weight-bold ms-sm-2">${a.service_name}</span></span>
                    <span class="mb-2 text-xs">Email Address: <span id="email" class="text-dark ms-sm-2 font-weight-bold">${a.email}</span></span>
                    <span class="mb-2 text-xs d-flex align-items-center">Staff: 
    <select id="staff-${a.id}" class="form-select form-select-sm ms-2" style="width: auto; display: inline-block; padding: 2px 24px 2px 8px; font-size: 0.75rem;">
        ${staffOptions}
    </select>
</span>
                    <span class="mb-2 text-xs">Date: <span id="date" class="text-dark ms-sm-2 font-weight-bold">${formattedDate}</span></span>
                    <span class="mb-2 text-xs">Time Slot: <span id="slot" class="text-dark ms-sm-2 font-weight-bold">${formattedTime}</span></span>
                    <span class="mb-2 text-xs">Status: <span id="status-${a.id}" class="text-${getStatusClass(a.status)} font-weight-bold">${a.status}</span></span>
                  </div>
                  <div class="ms-auto text-end">
                    <div class="mt-2">
                       <a href="#" onclick="updateStatus(${a.id}, 'Completed'); return false;" class="text-dark ms-sm-2 font-weight-bold">Completed</a>
                       <a href="#" onclick="updateStatus(${a.id}, 'Pending'); return false;" class="text-dark ms-sm-2 font-weight-bold">Pending</a>
                       <a href="#" onclick="updateStatus(${a.id}, 'Active'); return false;" class="text-dark ms-sm-2 font-weight-bold">Active</a>
                    </div>
                  </div>
                </li>
              </ul>
    `;container.insertAdjacentHTML("beforeend", html);
    });

  } catch (err) {
    console.error("Error loading appointments:", err);
  }
}
// Helper function for status color
function getStatusClass(status) {
  switch(status) {
    case 'Completed': return 'success'; // green
    case 'Pending': return 'warning';   // orange
    case 'Active': return 'info';       // blue
    default: return 'secondary';        // gray
  }
} 
// Make updateStatus global so inline onclick works
window.updateStatus = async function(id, status) {

  const staffDropdown = document.getElementById(`staff-${id}`);
  const selectedStaffId = staffDropdown ? staffDropdown.value : null;

  // 2. THE RULE: If changing to Active, they MUST assign staff
  if (status === 'Active' && !selectedStaffId) {
      alert("⚠️ Please select a staff member from the dropdown before setting this to Active.");
      return; // Stops the function
  }

  try {
    const res = await fetch(`/api/admin/appointments/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, staff_id: selectedStaffId || null })
    });

    const result = await res.json();
    if (result.success) {
      // Remove the appointment from the UI if completed
      loadAppointments();
      loadPendingAppointments();
      loadCompletedAppointments();
      loadMonthAppointments();
      
      loadCompletedAppointmentsMonth();
      loadPendingAppointmentsMonth();
      loadTodaySales();
      loadMonthSales();
      loadTodayPercent();
      loadMonthPercent();
      if (status === "Completed") {
        const appointmentDiv = document.querySelector(`#appointment-${id}`);
        if (appointmentDiv) appointmentDiv.remove();
      } else {
        // If not completed, just update the status text/color
        const statusSpan = document.querySelector(`#status-${id}`);
        statusSpan.textContent = status;
        statusSpan.className = `text-${getStatusClass(status)} font-weight-bold`;
      }
    } else {
      alert("Failed to update status");
    }
  } catch (err) {
    console.error(err);
    alert("Error updating status");
  }
};

loadAppointments();

// ---------- Pending Appointments ----------
const pendingContainer = document.querySelector("#pending-appointments-container");
async function loadPendingAppointments() {
  try {
    const res = await fetch("/api/admin/today-appointments");
    const data = await res.json();
    pendingContainer.innerHTML = "";
    const pending = data.filter(a => a.status === "Pending" && isInCurrentMonth(a.appointment_date));
    if (pending.length === 0) {
      pendingContainer.innerHTML = "<p>No pending appointments.</p>";
      return;
    }
    pending.forEach(a => {
      const formattedDate = new Date(a.appointment_date).toLocaleDateString("en-GB");
      const formattedTime = new Date(`1970-01-01T${a.appointment_time}Z`).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });
      const html = `
       <ul class="list-group">
              <li class="list-group item border-0 d-flex p-3 mb-0 mt-0 bg-gray-100 border-radius-lg">
                <div class="d-flex flex-column">
                  <h6 class="mb-3 text-sm text-uppercase">${a.customer_name}</h6>
                  <span class="mb-2 text-xs">Service: <span id="service" class="text-dark font-weight-bold ms-sm-2">${a.service_name}</span></span>
                  <span class="mb-2 text-xs">Email Address: <span id="email" class="text-dark ms-sm-2 font-weight-bold">${a.email}</span></span>
                  <span class="mb-2 text-xs">Staff Name: <span id="staff" class="text-dark ms-sm-2 font-weight-bold">${a.staff_name}</span></span>
                  <span class="mb-2 text-xs">Date: <span id="date" class="text-dark ms-sm-2 font-weight-bold">${formattedDate}</span></span>
                  <span class="mb-2 text-xs">Time Slot: <span id="slot" class="text-dark ms-sm-2 font-weight-bold">${formattedTime}</span></span>
                  <span class="mb-2 text-xs">Status: <span class="text-${getStatusClass(a.status)} font-weight-bold">${a.status}</span></span>
                </div>
              </li>
            </ul>
      `;pendingContainer.insertAdjacentHTML("beforeend", html);
    });
  } catch (err) {
    console.error("Error loading pending appointments:", err);
  }
}
loadPendingAppointments();

  // -- Completed Appointments --
  const completedContainer = document.querySelector("#completed-appointments-container");
  async function loadCompletedAppointments() {
    try {
      const res = await fetch("/api/admin/today-appointments");
      const data = await res.json();
      completedContainer.innerHTML = "";
      const completed = data.filter(a => a.status === "Completed" && isInCurrentMonth(a.appointment_date));


      if (completed.length === 0) {
        completedContainer.innerHTML = "<p>No completed appointments.</p>";
        return;
      } 
      completed.forEach(a => {
        const formattedDate = new Date(a.appointment_date).toLocaleDateString("en-GB");
        const formattedTime = new Date(`1970-01-01T${a.appointment_time}Z`).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });
        const html = `
         <ul class="list-group">
                <li class="list-group item border-0 d-flex p-3 mb-0 mt-0 bg-gray-100 border-radius-lg">
                  <div class="d-flex flex-column">
                    <h6 class="mb-3 text-sm text-uppercase">${a.customer_name}</h6>
                    <span class="mb-2 text-xs">Service: <span id="service" class="text-dark font-weight-bold ms-sm-2">${a.service_name}</span></span>
                    <span class="mb-2 text-xs">Email Address: <span id="email" class="text-dark ms-sm-2 font-weight-bold">${a.email}</span></span>
                    <span class="mb-2 text-xs">Staff Name: <span id="staff" class="text-dark ms-sm-2 font-weight-bold">${a.staff_name}</span></span>
                    <span class="mb-2 text-xs">Date: <span id="date" class="text-dark ms-sm-2 font-weight-bold">${formattedDate}</span></span>
                    <span class="mb-2 text-xs">Time Slot: <span id="slot" class="text-dark ms-sm-2 font-weight-bold">${formattedTime}</span></span>
                    <span class="mb-2 text-xs">Status: <span class="text-${getStatusClass(a.status)} font-weight-bold">${a.status}</span></span>
                  </div>
                </li>
              </ul>
        `;completedContainer.insertAdjacentHTML("beforeend", html);
      });

    } catch (err) {
      console.error("Error loading completed appointments:", err);
    }   
  }
  loadCompletedAppointments();

  // ---------- This Month Booked Appointments ----------
  const monthContainer = document.querySelector("#month-appointments-container");
  async function loadMonthAppointments() {
    try {
      const res = await fetch("/api/admin/this-month-appointments");
      const data = await res.json();
      monthContainer.innerHTML = "";
      const monthAppointments = data.filter(a => isInCurrentMonth(a.appointment_date));
      if (monthAppointments.length === 0) {
        monthContainer.innerHTML = "<p>No appointments this month.</p>";
        return;
      }
      monthAppointments.slice(0, 3).forEach(a => {
        const formattedDate = new Date(a.appointment_date).toLocaleDateString("en-GB");
        const formattedTime = new Date(`1970-01-01T${a.appointment_time}Z`).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });
        const html = `
         <ul class="list-group">
                <li class="list-group item border-0 d-flex p-3 mb-0 mt-0 bg-gray-100 border-radius-lg">
                  <div class="d-flex flex-column">
                    <h6 class="mb-3 text-sm text-uppercase">${a.customer_name}</h6>
                    <span class="mb-2 text-xs">Service: <span id="service" class="text-dark font-weight-bold ms-sm-2">${a.service_name}</span></span>
                    <span class="mb-2 text-xs">Email Address: <span id="email" class="text-dark ms-sm-2 font-weight-bold">${a.email}</span></span>
                    <span class="mb-2 text-xs">Staff Name: <span id="staff" class="text-dark ms-sm-2 font-weight-bold">${a.staff_name}</span></span>
                    <span class="mb-2 text-xs">Date: <span id="date" class="text-dark ms-sm-2 font-weight-bold">${formattedDate}</span></span>
                    <span class="mb-2 text-xs">Time Slot: <span id="slot" class="text-dark ms-sm-2 font-weight-bold">${formattedTime}</span></span>
                    <span class="mb-2 text-xs">Status: <span class="text-${getStatusClass(a.status)} font-weight-bold">${a.status}</span></span>
                  </div>
                </li>
              </ul>
        `;monthContainer.insertAdjacentHTML("beforeend", html);
      });

      if (monthAppointments.length > 5) {
        const viewAllHtml = `
            <div class="text-center mt-4 mb-2">
                <a href="/manager/appointments.html" class="btn btn-outline-primary btn-sm w-100">
                    View All ${monthAppointments.length} Appointments </a>
            </div>
        `;
        monthContainer.insertAdjacentHTML("beforeend", viewAllHtml);
    }

    } catch (err) {
      console.error("Error loading month appointments:", err);
    }
  }
  loadMonthAppointments();


  // Get current date
function updateDateTime() {
  const now = new Date();

  // Format day, date, and time
  const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const formattedDate = now.toLocaleDateString('en-GB', options);

  const hours = String(now.getHours()).padStart(2,'0');
  const minutes = String(now.getMinutes()).padStart(2,'0');
  const seconds = String(now.getSeconds()).padStart(2,'0');

  // Update all elements with the class
  document.querySelectorAll('.current-date-time').forEach(el => {
    el.textContent = formattedDate;
  });
  document.querySelectorAll('.current-month').forEach(el => {
    el.textContent = now.toLocaleString('en-GB', { month: 'long' });
  });
}
// Run immediately
updateDateTime();

// Update every second
setInterval(updateDateTime, 1000);

  // ---------- STAFF ----------
const staffContainer = document.getElementById("staff-container"); 

// async function loadStaff() {
//   try {
//     const res = await fetch("/api/admin/staff");
//     const data = await res.json();

//     staffContainer.innerHTML = data.map(s => `

//       <li class="list-group-item border-0 d-flex justify-content-between ps-0 mb-2 border-radius-lg">
//           <div class="d-flex flex-column">
//             <h6 class="mb-1 text-dark font-weight-bold text-sm">${s.name}</h6>
//             <span class="text-xs">${s.phone || ''}</span>
//           </div>
//           <div class="d-flex align-items-center text-sm">
//             <span class="text-dark font-weight-bold">$180</span>
//           </div>
//         </li>

//     `).join('');
//   } catch (err) {
//     console.error("Error loading staff:", err);
//   }
// }
// Load staff on page load
//loadStaff();

  // ---------- SERVICES ----------
  const servicesForm = document.getElementById("services-form");
  const servicesTable = document.querySelector("#services-table");

  async function loadServices() {
    const res = await fetch("/api/admin/services");
    const data = await res.json();
    servicesTable.innerHTML = data.map(se => `
 
      <li class="list-group-item border-0 d-flex justify-content-between ps-0 mb-2 border-radius-lg">
                  <div class="d-flex flex-column">
                    <h6 class="mb-1 text-dark font-weight-bold text-sm">${se.name}</h6>
                    <span class="text-xs">${se.duration_minutes} mins</span>
                  </div>
                  <div class="d-flex align-items-center text-sm">
                    $${se.price}
                  </div>
                </li>
      
      `).join("");
  }

  loadServices();
  
  function showSection(section) {
  document.querySelectorAll('.dashboard-section').forEach(sec => sec.style.display = 'none');
  document.getElementById(section + '-section').style.display = 'block';
}

});

async function loadTodaySales() {
  try {
    const res = await fetch('/api/admin/sales/today');
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    document.getElementById('todaySales').textContent = `₹${data.todaySales}`;
  } catch (err) {
    console.error("Error loading today's sales", err);
  }
}
async function loadMonthSales() {
  try {
    const res = await fetch('/api/admin/sales/month');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    document.getElementById('monthSales').textContent = `₹${data.monthSales}`;
  } catch (err) {
    console.error("Error loading month sales", err);
  }
}
async function loadCompletedAppointmentsMonth() {
  try {
    const res = await fetch('/api/admin/appointments/completed-month');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    document.getElementById('completedAppointmentsMonth').textContent = data.completedThisMonth;
  } catch (err) {
    console.error("Error loading completed appointments (month)", err);
  }
}
async function loadPendingAppointmentsMonth() {
  try {
    const res = await fetch('/api/admin/appointments/pending-month');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    document.getElementById('pendingAppointmentsMonth').textContent = data.pendingThisMonth;
  } catch (err) {
    console.error("Error loading pending appointments (month)", err);
    const el = document.getElementById('pendingAppointmentsMonth');
    if (el) el.textContent = '—';
  }
}
async function loadTodayPercent() {
  const percentEl = document.getElementById('todayPercent');
  const arrowEl = document.getElementById('todayArrow');
  if (!percentEl) return;

  try {
    const res = await fetch('/api/admin/sales/today-percent');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    console.log("Percent response:", json);

    let percent = Number(json.percent);
    if (isNaN(percent)) percent = 0;

    // Display percent (with natural sign)
    percentEl.textContent = percent.toFixed(2) + "%";

    // Remove old classes
    percentEl.classList.remove('text-success', 'text-danger', 'text-warning');
    arrowEl.classList.remove('text-success', 'text-danger', 'text-warning');

    // Decide arrow + color
    if (percent > 0) {
      // Up arrow, green
      arrowEl.textContent = "▲";
      percentEl.classList.add('text-success');
      arrowEl.classList.add('text-success');

    } else if (percent < 0) {
      // Down arrow, red
      arrowEl.textContent = "▼";
      percentEl.classList.add('text-danger');
      arrowEl.classList.add('text-danger');

    } else {
      // No change
      arrowEl.textContent = "—";
      percentEl.classList.add('text-warning');
      arrowEl.classList.add('text-warning');
    }

  } catch (err) {
    console.error("Error loading percent:", err);
    percentEl.textContent = "—";
    arrowEl.textContent = "—";
    percentEl.classList.add('text-warning');
    arrowEl.classList.add('text-warning');
  }
}
async function loadMonthPercent() {
  const el = document.getElementById('monthPercent');
  if (!el) return;

  try {
    const res = await fetch('/api/admin/sales/month-percent');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    console.log("Month percent response:", json);

    let percent = Number(json.percent);
    if (isNaN(percent)) percent = 0;

    // ---------- Arrow logic ----------
    let arrow = "—";
    if (percent > 0) arrow = "▲";
    else if (percent < 0) arrow = "▼";
    // ---------------------------------

    const display = arrow + " " + percent.toFixed(2) + "%";
    el.textContent = display;

    // remove previous colors
    el.classList.remove('text-success', 'text-danger', 'text-warning');

    if (percent > 0) el.classList.add('text-success');   // green
    else if (percent < 0) el.classList.add('text-danger'); // red
    else el.classList.add('text-warning');                 // neutral

  } catch (err) {
    console.error("Error loading month percent:", err);
    el.textContent = "—";
    el.classList.remove('text-success','text-danger','text-warning');
    el.classList.add('text-warning');
  }
}

async function loadQuickEntryList() {
    const container = document.getElementById('staff-entry-list');
    try {
        // Fetch both staff and services
        const [staffRes, serviceRes] = await Promise.all([
            fetch('/api/admin/staff'),
            fetch('/api/admin/services')
        ]);
        
        const staff = await staffRes.json();
        const services = await serviceRes.json();

        container.innerHTML = staff.map(s => `
            <li class="list-group-item border-0 d-flex flex-column ps-0 mb-4 border-radius-lg">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <div class="d-flex align-items-center">
                        <div class="avatar avatar-sm me-3 border-radius-lg shadow-sm">
                            <img src="${s.image_url || './images/avatar.png'}" class="w-100">
                        </div>
                        <div class="d-flex flex-column">
                            <h6 class="mb-0 text-dark font-weight-bold text-sm">${s.name}</h6>
                        </div>
                    </div>
                </div>
                
                <div class="d-flex align-items-center gap-2">
                    <div class="input-group input-group-static" style="flex: 2;">
                        <select class="form-control form-control-sm" id="service-select-${s.id}" 
                                onchange="updatePriceFromService(${s.id}, this)">
                            <option value="" selected disabled>Select Service</option>
                            ${services.map(ser => `<option value="${ser.id}" data-price="${ser.price}">${ser.name}</option>`).join('')}
                        </select>
                    </div>

                    <div class="input-group input-group-outline" style="flex: 1;">
                        <input type="number" id="amt-${s.id}" class="form-control form-control-sm text-center" placeholder="₹">
                    </div>

                    <button onclick="saveOfflineEntry(${s.id})" class="btn btn-icon-only btn-rounded btn-outline-success mb-0">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </li>
        `).join('');
    } catch (err) {
        console.error("Error loading quick entry list", err);
    }
}

window.updatePriceFromService = (staffId, selectElement) => {
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    const price = selectedOption.getAttribute('data-price');
    
    const amountInput = document.getElementById(`amt-${staffId}`);
    if (price) {
        amountInput.value = price;
        // Trigger Material UI focus animation
        amountInput.parentElement.classList.add('is-focused');
        amountInput.parentElement.classList.add('is-filled');
    }
};

window.saveOfflineEntry = async (staffId) => {
    const amountInput = document.getElementById(`amt-${staffId}`);
    const serviceSelect = document.getElementById(`service-select-${staffId}`);
    const amount = amountInput.value;
    const serviceId = serviceSelect.value;

    if (!serviceId) {
        alert("Please select a service first.");
        return;
    }

    try {
        const res = await fetch('/api/admin/offline-entry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                staff_id: staffId,
                service_id: serviceId, // ✅ Now sending service ID
                final_price: amount,
                customer_name: "Walk-in"
            })
        });

        if (res.ok) {
            // Success animation code from previous step...
            amountInput.value = '';
            serviceSelect.selectedIndex = 0;
            alert("Entry recorded successfully!");

            updateOfflineTotalUI(amount);
            amountInput.value = '';
            serviceSelect.selectedIndex = 0;
        }
    } catch (error) {
        console.error("Error saving entry", error);
    }
};

function updateOfflineTotalUI(newAmount) {
    const totalElement = document.getElementById('offline-total-display');
    
    // Remove the '₹' symbol and convert to number
    let currentTotal = parseFloat(totalElement.innerText.replace('₹', '')) || 0;
    
    // Add the new entry to the total
    let updatedTotal = currentTotal + parseFloat(newAmount);
    
    // Update the text with the new sum
    totalElement.innerText = `₹${updatedTotal.toFixed(2)}`;
    
    // Optional: Add a small "glow" effect so the user notices the change
    totalElement.classList.add('text-success');
    setTimeout(() => totalElement.classList.remove('text-success'), 2000);
}

async function initOfflineTotal() {
    const res = await fetch('/api/admin/offline-total');
    const data = await res.json();
    document.getElementById('offline-total-display').innerText = `₹${data.total}`;
}

// Call this when the page loads
async function initOfflineTotal() {
    const res = await fetch('/api/admin/offline-total');
    const data = await res.json();
    document.getElementById('offline-total-display').innerText = `₹${data.total}`;
}

// Call this when the page loads
async function initOfflineTotal() {
    const res = await fetch('/api/admin/offline-total');
    const data = await res.json();
    document.getElementById('offline-total-display').innerText = `₹${data.total}`;
}

// Call this when the page loads
initOfflineTotal();
// Call this when the page loads
loadQuickEntryList();
loadMonthPercent();
loadTodayPercent();
loadTodaySales();
loadMonthSales();
loadCompletedAppointmentsMonth();
loadPendingAppointmentsMonth();

