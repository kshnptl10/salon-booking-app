document.addEventListener("DOMContentLoaded", () => {
  const staffForm = document.getElementById("staff-form");
  const staffTable = document.querySelector("#staff-table tbody");

  const images = [
  '../images/team-1.jpg',
  '../images/team-2.jpg',
  '../images/team-3.jpg',
  '../images/team-4.jpg',
  '../images/team-5.jpg'
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


  async function loadStaff() {
    const res = await fetch("/api/admin/staff");
    const data = await res.json();
   staffTable.innerHTML = data.map((s, index) => {
  const formattedDate = s.joiningdate ? new Date(s.joiningdate).toLocaleDateString() : '';
  const imageUrl = images[index % images.length]; // Cycle through images if more staff than images
  return `
    <tr>
      <td contenteditable="true">
        <div class="d-flex px-2 py-1">
          <div>
            <img src="${imageUrl}" class="avatar avatar-sm me-3 border-radius-lg" alt="user1"> 
          </div>
          <div class="d-flex flex-column justify-content-center">
            <h6 class="mb-0 text-sm">${s.name}</h6>
              <p class="text-xs text-secondary mb-0">${s.email || ''}</p>
          </div>
        </div>
      </td>
      <td>
        <p class="text-xs font-weight-bold mb-0">${s.phone || ''}</p>
      </td>
      <td class="align-middle text-center text-sm">
        <span class="badge badge-sm bg-gradient-success">${s.status || ''}</span>
      </td>
      <td class="align-middle text-center">
        <span class="text-secondary text-xs font-weight-bold">${formattedDate}</span>
      </td>
      <td class="align-middle">
        <a class="text-secondary font-weight-bold text-xs" href="javascript:;" data-toggle="tooltip" data-original-title="Edit user" onclick="updateStaff(${s.id})">
          Save
        </a> 
        <a class="text-secondary font-weight-bold text-xs" href="javascript:;" data-toggle="tooltip" data-original-title="Edit user" onclick="deleteStaff(${s.id})">
          / Delete
        </a> 
      </td>
    </tr>`;
}).join('');

  }

  staffForm.addEventListener("submit", async e => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(staffForm).entries());
    await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });
    staffForm.reset();
    loadStaff();
  });

  window.updateStaff = async (id) => {
    const row = [...staffTable.rows].find(r => r.cells[0].innerText == id);
    const name = row.cells[1].innerText;
    const email = row.cells[2].innerText;
    const phone = row.cells[3].innerText;
    await fetch(`/api/staff/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone })
    });
    loadStaff();
  }

  window.deleteStaff = async (id) => {
    if(confirm("Are you sure to delete this staff?")) {
      await fetch(`/api/admin/staff/${id}`, { method: "DELETE" });
      loadStaff();
    }
  }

  loadStaff();
});
