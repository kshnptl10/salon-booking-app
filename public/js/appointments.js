document.addEventListener("DOMContentLoaded", () => {
  const table = document.querySelector("#appointments-table tbody");
  const searchInput = document.getElementById("searchInput"); // Grab the search bar
  
  let allAppointments = []; // Store the data globally so we can search it

  async function loadLoggedUser() {
    try {
      const res = await fetch('/api/me');
      if (!res.ok) {
        console.warn('Not authenticated (api/me)', res.status);
        return;
      }
      const user = await res.json();
      const nameEl = document.getElementById('profileName');
      if (nameEl && user.name) {
        nameEl.textContent = user.name;
      }

      const roleEl = document.getElementById('profileRole');
      if (roleEl && user.role) {
        roleEl.textContent = user.role;
      }
    } catch (err) {
      console.error('Error loading logged user', err);
    }
  }

  loadLoggedUser();

  // 1. Function to physically draw the rows on the screen
  function renderTable(data) {
    if (!data || data.length === 0) {
        table.innerHTML = `<tr><td colspan="6" class="text-center py-4">No appointments found.</td></tr>`;
        return;
    }

    table.innerHTML = data.map(a => {
      const formattedDate = new Date(a.appointment_date).toLocaleDateString("en-GB");
      const formattedTime = new Date(`1970-01-01T${a.appointment_time}Z`).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });
      
      // Ensure staff name doesn't say "null" if unassigned
      const staffName = a.staff_name || "Unassigned";

      return `
        <tr>
          <td>
            <div class="d-flex px-2">
              <div class="my-auto">
                <h6 class="mb-0 text-sm">${a.customer_name}</h6>
              </div>
            </div>
          </td>
          <td>
            <p class="text-sm font-weight-bold mb-0">${a.email}</p>
          </td>
          <td>
            <span class="text-xs font-weight-bold">${a.service_name}</span>
          </td>
          <td>
            <span class="text-xs font-weight-bold">${staffName}</span>
          </td>
          <td>
            <span class="text-xs font-weight-bold">${formattedDate}</span>
          </td>
          <td>
            <span class="text-xs font-weight-bold">${formattedTime}</span>
          </td>
        </tr>
      `;
    }).join("");
  }

  // 2. Function to fetch data ONLY ONCE when the page loads
  async function loadAppointments() {
    try {
      const res = await fetch("/api/admin/appointments");
      allAppointments = await res.json();
      
      // Draw the table for the first time
      renderTable(allAppointments);
    } catch (err) {
      console.error("Error loading appointments:", err);
      table.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">Failed to load data.</td></tr>`;
    }
  }

  loadAppointments();
  
// --- MULTI-COLUMN FILTER LOGIC ---
  
  // 1. Grab all the new column search boxes directly
  const filterCustomer = document.getElementById("filterCustomer");
  const filterEmail = document.getElementById("filterEmail");
  const filterService = document.getElementById("filterService");
  const filterStaff = document.getElementById("filterStaff");
  const filterDate = document.getElementById("filterDate");

  // 2. The function that checks all boxes at once
  function applyColumnFilters() {
    // Get the current text typed into each box (if the box exists)
    const valCustomer = filterCustomer ? filterCustomer.value.toLowerCase() : "";
    const valEmail = filterEmail ? filterEmail.value.toLowerCase() : "";
    const valService = filterService ? filterService.value.toLowerCase() : "";
    const valStaff = filterStaff ? filterStaff.value.toLowerCase() : "";
    const valDate = filterDate ? filterDate.value.toLowerCase() : "";

    // 3. Filter the master array
    const filteredData = allAppointments.filter(a => {
      // Check each column safely
      const matchCustomer = a.customer_name ? a.customer_name.toLowerCase().includes(valCustomer) : false;
      const matchEmail = a.email ? a.email.toLowerCase().includes(valEmail) : false;
      const matchService = a.service_name ? a.service_name.toLowerCase().includes(valService) : false;
      
      const staffName = a.staff_name || "unassigned";
      const matchStaff = staffName.toLowerCase().includes(valStaff);
      
      const formattedDate = new Date(a.appointment_date).toLocaleDateString("en-GB").toLowerCase();
      const matchDate = formattedDate.includes(valDate);

      // Return true ONLY if the row matches ALL the boxes that have text in them
      return matchCustomer && matchEmail && matchService && matchStaff && matchDate;
    });

    // 4. Redraw the table with the survivors
    renderTable(filteredData);
  }

  // 5. Attach the listener to all the boxes so they filter instantly as you type
  const filterInputs = [filterCustomer, filterEmail, filterService, filterStaff, filterDate];
  
  filterInputs.forEach(input => {
    if (input) {
      input.addEventListener("input", applyColumnFilters);
    }
  });
  
});