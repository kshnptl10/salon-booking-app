document.addEventListener("DOMContentLoaded", () => {
  const servicesForm = document.getElementById("services-form");
  const servicesTable = document.querySelector("#services-table tbody");
 const images = [
  '../images/services/s1.png',
  '../images/services/s2.png',
  '../images/services/s3.png',
  '../images/services/s4.png',
  '../images/services/s5.png',
  '../images/services/s6.png',
  '../images/services/s7.png',
  '../images/services/s8.png',
  '../images/services/s9.png',
  '../images/services/s10.png'
  ];

  
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

  async function loadServices() {
    const res = await fetch("/api/admin/services");
    const data = await res.json();
    servicesTable.innerHTML = data.map((s, index) => `
    
                    <tr>
                      <td>
                        <div class="d-flex px-2">
                          <div>
                            <img src="${images[index % images.length]}" class="avatar avatar-sm rounded-circle me-2" alt="spotify">
                          </div>
                          <div class="my-auto">
                            <h6 class="mb-0 text-sm">${s.name}</h6>
                          </div>
                        </div>
                      </td>
                      <td>
                        <p class="text-sm font-weight-bold mb-0">${s.description || ''}</p>
                      </td>
                      <td>
                        <span class="text-xs font-weight-bold">${s.duration_minutes || 0} min</span>
                      </td>
                      <td class="align-middle text-center">
                        <div class="d-flex align-items-center justify-content-center">
                          <span class="me-2 text-xs font-weight-bold">${s.price || 0}</span>
                          
                        </div>
                      </td>
                      <td class="align-middle">
                        <button onclick="deleteService(${s.id})" class="btn btn-link text-secondary mb-0">
                          <i class="fa fa-ellipsis-v text-xs">Delete</i>
                        </button>
                      </td>
                    </tr>`).join("");
  }

  servicesForm.addEventListener("submit", async e => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(servicesForm).entries());
    formData.duration = parseInt(formData.duration);
    await fetch("/api/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });
    servicesForm.reset();
    loadServices();
  });

  window.updateService = async (id) => {
    const row = [...servicesTable.rows].find(r => r.cells[0].innerText == id);
    const name = row.cells[1].innerText;
    const description = row.cells[2].innerText;
    const duration = parseInt(row.cells[3].innerText);
    await fetch(`/api/services/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, duration })
    });
    loadServices();
  }

  window.deleteService = async (id) => {
    if(confirm("Are you sure to delete this service?")) {
      await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
      loadServices();
    }
  }

  loadServices();
});
