document.addEventListener("DOMContentLoaded", async () => {
  loadAdmins();
});

async function loadAdmins() {
  try {
    const response = await fetch("/api/admins");
    const admins = await response.json();

    const tbody = document.querySelector("#adminTable tbody");
    tbody.innerHTML = ""; // Clear old rows

    admins.forEach(admin => {
      const row = document.createElement("tr");
      row.innerHTML = `        
        <td>
             <div class="d-flex px-2 py-1">
                  <div>
                    <img src="../images/small-logos/logo-xd.png" class="avatar avatar-sm me-3" alt="xd">
                  </div>
                  <div class="d-flex flex-column justify-content-center">
                      <h6 class="mb-0 text-sm">${admin.name}</h6>
                  </div>
              </div>
        </td>
        <td>
             <div class="d-flex px-2 py-1">
                <div>
                    <img src="../images/small-logos/emailbox.png" class="avatar avatar-sm me-3" alt="xd">
                  </div>
                  <div class="d-flex flex-column justify-content-center">
                      <h6 class="mb-0 text-sm">${admin.email}</h6>
                  </div>
             </div>
        </td>
        <td>
             <div class="d-flex px-2 py-1">
             <div>
                    <img src="../images/small-logos/telephone.png" class="avatar avatar-sm me-3" alt="xd">
                  </div>
                  <div class="d-flex flex-column justify-content-center">
                      <h6 class="mb-0 text-sm">${admin.mobile || '-'}</h6>
                  </div>
             </div>
        </td>
        
        <td><h6 class="uppercase">${admin.role_name}</h6></td>
        <style>
           .uppercase {
           text-transform: uppercase;
           }
  </style>
        <td>
          <button class="nav-link active bg-gradient-dark text-white" onclick="deleteAdmin(${admin.id})">
          <span class="nav-link-text ms-1">Delete</span>
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error("Error loading admins:", error);
  }
}

async function updateAdmin(id) {
  const name = document.getElementById(`name-${id}`).value;
  const email = document.getElementById(`email-${id}`).value;

  try {
    const response = await fetch(`/api/admins/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email })
    });
    const result = await response.json();
    alert(result.message);
    loadAdmins();
  } catch (error) {
    console.error("Error updating admin:", error);
  }
}

async function deleteAdmin(id) {
  if (!confirm("Are you sure you want to delete this admin?")) return;

  try {
    const response = await fetch(`/api/admins/${id}`, { method: "DELETE" });
    const result = await response.json();
    alert(result.message);
    loadAdmins();
  } catch (error) {
    console.error("Error deleting admin:", error);
  }
}

app.get('/customer-dashboard', (req, res) => {
  if (!req.session.customerId) {
    return res.redirect('/sign-in.html');
  }
  res.sendFile(path.join(__dirname, 'public', 'superadmin-dashboard.html'));
});
