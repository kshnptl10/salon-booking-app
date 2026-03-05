document.addEventListener("DOMContentLoaded", () => {
  const servicesForm = document.getElementById("services-form");
  const servicesTable = document.querySelector("#services-table tbody");

  async function loadLoggedUser() {
    try {
      const res = await fetch('/api/me');
      if (!res.ok) return;
      const user = await res.json();
      const nameEl = document.getElementById('profileName');
      if (nameEl && user.name) nameEl.textContent = user.name;
    } catch (err) {
      console.error('Error loading logged user', err);
    }
  }

  loadLoggedUser();

  // --- 1. LOAD SERVICES (Using dynamic database images) ---
  async function loadServices() {
    const res = await fetch("/api/admin/services");
    const data = await res.json();
    
    servicesTable.innerHTML = data.map((s) => {
      // ✅ USE REAL IMAGE: Use DB path or a placeholder if empty
      const imageUrl = s.image_file ? s.image_file : '../images/placeholder.png';
      return `
        <tr data-id="${s.id}">
          <td>
            <div class="d-flex px-2">
              <div>
                <img src="${imageUrl}" class="avatar avatar-sm rounded-circle me-2" style="object-fit: cover;" alt="${s.name}">
              </div>
              <div class="my-auto">
                <h6 class="mb-0 text-sm service-name" contenteditable="true">${s.name}</h6>
              </div>
            </div>
          </td>
          <td>
            <p class="text-sm font-weight-bold mb-0 service-desc" contenteditable="true">${s.description || ''}</p>
          </td>
          <td>
            <span class="text-xs font-weight-bold service-duration" contenteditable="true">${s.duration_minutes || 0}</span> <span class="text-xs">min</span>
          </td>
          <td class="align-middle text-center">
            <span class="text-xs font-weight-bold service-price" contenteditable="true">${s.price || 0}</span>
          </td>
          <td class="align-middle">
             <button onclick="updateService(${s.id})" class="btn btn-link text-info mb-0">Save</button>
             <button onclick="deleteService(${s.id})" class="btn btn-link text-danger mb-0">Delete</button>
          </td>
        </tr>`;
    }).join("");
  }

  // --- 2. ADD SERVICE (With Multipart/FormData Support) ---
  servicesForm.addEventListener("submit", async e => {
    e.preventDefault();

    const formData = new FormData(servicesForm);
    
    // ✅ Logic: Add category so Multer knows to use the 'services' folder
    formData.append("category", "services");

    try {
      const res = await fetch("/api/admin/services", {
        method: "POST",
        body: formData // Send as multipart/form-data
      });

      if (res.ok) {
        servicesForm.reset();
        loadServices();
      } else {
        const errData = await res.json();
        alert("Error: " + errData.message);
      }
    } catch (err) {
      console.error("Error creating service", err);
    }
  });

  // --- 3. UPDATE SERVICE (Fixed targeting) ---
  window.updateService = async (id) => {
    const row = document.querySelector(`tr[data-id="${id}"]`);
    if (!row) return;

    const name = row.querySelector('.service-name').innerText.trim();
    const description = row.querySelector('.service-desc').innerText.trim();
    const duration = parseInt(row.querySelector('.service-duration').innerText);
    const price = parseFloat(row.querySelector('.service-price').innerText);

    try {
      const res = await fetch(`/api/admin/services/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, duration, price })
      });
      
      if(res.ok) {
        alert("Service updated!");
        loadServices();
      }
    } catch (err) {
      console.error("Update failed", err);
    }
  }

  window.deleteService = async (id) => {
    if(confirm("Are you sure to delete this service?")) {
      await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
      loadServices();
    }
  }

  loadServices();
});