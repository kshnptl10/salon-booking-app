document.addEventListener("DOMContentLoaded", () => {
  const table = document.querySelector("#appointments-table tbody");
  
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

  async function loadAppointments() {
    const res = await fetch("/api/admin/appointments");
    const data = await res.json();
    table.innerHTML = data.map(a => {
      const formattedDate = new Date(a.appointment_date).toLocaleDateString("en-GB");
      const formattedTime = new Date(`1970-01-01T${a.appointment_time}Z`).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });
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
                        <span class="text-xs font-weight-bold">${a.staff_name} </span>
                      </td>
                      <td>
                        <span class="text-xs font-weight-bold">${formattedDate}</span>
                      </td>
                      <td>
                        <span class="text-xs font-weight-bold">${formattedTime} </span>
                      </td>
                    </tr>

    `}).join("");
  }

  loadAppointments();
});
