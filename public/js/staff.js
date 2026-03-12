document.addEventListener("DOMContentLoaded", () => {
  const staffForm = document.getElementById("staff-form");
  const staffTable = document.querySelector("#staff-table tbody");

  // ❌ REMOVED: The hardcoded images array is gone!

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

  // --- 1. LOAD STAFF (Using dynamic database images) ---
  async function loadStaff() {
    const res = await fetch("/api/admin/staff");
    const data = await res.json();
    
    staffTable.innerHTML = data.map((s) => {
      const formattedDate = s.joiningdate ? new Date(s.joiningdate).toLocaleDateString() : '';
      
      // ✅ USE REAL IMAGE: Check if the database has an image_file, otherwise use a placeholder
      const imageUrl = s.image_file ? s.image_file : '../images/avatar.png'; 

      return `
        <tr data-id="${s.id}">
          <td>
            <div class="d-flex px-2 py-1">
              <div>
                <img src="${imageUrl}" class="avatar avatar-sm me-3 border-radius-lg" style="object-fit: cover;" alt="${s.name}"> 
              </div>
              <div class="d-flex flex-column justify-content-center">
                <h6 class="mb-0 text-sm staff-name" contenteditable="true">${s.name}</h6>
                <p class="text-xs text-secondary mb-0 staff-email" contenteditable="true">${s.email || ''}</p>
              </div>
            </div>
          </td>
          <td>
            <p class="text-xs font-weight-bold mb-0 staff-phone" contenteditable="true">${s.phone || ''}</p>
          </td>
          <td class="align-middle text-center text-sm">
            <select class="form-select staff-status-select ${s.is_available ? 'text-success' : 'text-danger'}" style="border:none; background:transparent; font-weight:bold; font-size:0.75rem;"
              onchange="this.className = 'form-select staff-status-select ' + (this.value === 'true' ? 'text-success' : 'text-danger')">
              <option value="true" ${s.is_available ? 'selected' : ''}>Active</option>
              <option value="false" ${!s.is_available ? 'selected' : ''}>Inactive</option>
            </select>
          </td>
          <td class="align-middle text-center">
            <span class="text-secondary text-xs font-weight-bold">${formattedDate}</span>
          </td>
          <td class="align-middle">
            <a class="text-secondary font-weight-bold text-xs me-2" href="javascript:;" onclick="updateStaff(${s.id})">Save</a> 
            <a class="text-danger font-weight-bold text-xs" href="javascript:;" onclick="deleteStaff(${s.id})">Delete</a> 
          </td>
        </tr>`;
    }).join('');
  }

  // --- 2. ADD STAFF (Upgraded to support File Uploads) ---
  staffForm.addEventListener("submit", async e => {
    e.preventDefault();
    
    const formData = new FormData();
    
    formData.append("salon_id", staffForm.querySelector('[name="salon_id"]').value);
    formData.append("category", "staff");

    const otherData = new FormData(staffForm);
    for (let [key, value] of otherData.entries()) {
        if (key !== "salon_id" && key !== "category") {
            formData.append(key, value);
        }
    }

    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        body: formData 
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Server Error");
      }
      
      alert("Staff member added successfully!");
      staffForm.reset();
      loadStaff();
    } catch (error) {
      console.error("Error adding staff:", error);
      alert("Failed to add staff member: " + error.message);
    }
  });

  // --- 3. EDIT STAFF (Fixed the targeting bug) ---
  window.updateStaff = async (id) => {
    const row = document.querySelector(`tr[data-id="${id}"]`);
    
    if (!row) {
        alert("Could not find row to update.");
        return;
    }

    const name = row.querySelector('.staff-name').innerText.trim();
    const email = row.querySelector('.staff-email').innerText.trim();
    const phone = row.querySelector('.staff-phone').innerText.trim();
    const is_available = row.querySelector('.staff-status-select').value === 'true';
    console.log("Sending Update:", { id, name, email, phone, is_available });
    
    try {
      // ✅ FIX 1: Change URL to /api/admin/staff
      const res = await fetch(`/api/admin/staff/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, is_available })
      });
      
      // ✅ FIX 2: Only alert and reload if the server actually updated the DB
      if (res.ok) {
        alert("Staff updated successfully!");
        loadStaff();
      } else {
        const errorData = await res.json();
        alert("Update failed: " + (errorData.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error updating staff:", error);
      alert("Network error. Please try again.");
    }
}

  // --- 4. DELETE STAFF ---
  window.deleteStaff = async (id) => {
    if(confirm("Are you sure you want to delete this staff member?")) {
      await fetch(`/api/admin/staff/${id}`, { method: "DELETE" });
      alert("Staff member deleted successfully.");
      loadStaff();
    }
  }

  // Run on load
  loadStaff();
});