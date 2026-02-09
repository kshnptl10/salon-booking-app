// Global Function to Load Salons (Reusable)
async function fetchAndPopulateSalons(targetSelectId, selectedValue = null) {
    const dropdown = document.getElementById(targetSelectId);
    if (!dropdown) return;

    try {
        const response = await fetch('/api/admin/my-salons'); // Or /api/admin/salons-list
        const data = await response.json();

        // --- THE FIX: Handle Data Structure ---
        let salonArray = [];

        // Check if 'data' IS the array, or if the array is INSIDE 'data.salons'
        if (Array.isArray(data)) {
            salonArray = data;
        } else if (data.salons && Array.isArray(data.salons)) {
            salonArray = data.salons;
        } else {
            console.error("Unexpected API format:", data);
            dropdown.innerHTML = '<option value="">Error: No Data</option>';
            return;
        }

        dropdown.innerHTML = '<option value="">Select Salon</option>';
        
        salonArray.forEach(s => {
            const opt = document.createElement('option');
            // Check for correct ID field (usually 'salon_id' or 'id')
            opt.value = s.salon_id || s.id; 
            opt.textContent = s.branch_name ? `${s.salon_name} (${s.branch_name})` : s.salon_name;
            
            if (selectedValue && (s.salon_id == selectedValue || s.id == selectedValue)) {
                opt.selected = true;
            }
            dropdown.appendChild(opt);
        });
    } catch (err) {
        console.error("Error loading salons:", err);
        dropdown.innerHTML = '<option value="">Error loading list</option>';
    }
}

// 1. Add Manager
async function addManager() {
    const nameEl = document.getElementById('managerName');
    const emailEl = document.getElementById('managerEmail');
    const userEl = document.getElementById('managerUsername'); // Added this
    const phoneEl = document.getElementById('managerPhone');
    const passEl = document.getElementById('managerPassword'); 
    const salonEl = document.getElementById('salonSelect');
debugger;
    const managerData = {
        name: nameEl.value,
        email: emailEl.value,
        mobile: phoneEl.value,
        password: passEl.value,
        salon_id: salonEl.value,        
        username: userEl.value || emailEl.value // Use username input, fallback to email
    };

    if (!managerData.name || !managerData.email || !managerData.password || !managerData.salon_id) {
        alert("Please fill in Name, Email, Password, and select a Salon.");
        return;
    }

    try {
        const response = await fetch('/api/admin/add-manager', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(managerData)
        });

        const result = await response.json();

        if (response.ok) {
            alert('Manager Created Successfully!');
            closeManagerModal();
            displayManagers();
            // Clear Form
            document.getElementById('createManagerForm').reset();
        } else {
            alert('Error: ' + (result.message || 'Failed to create manager'));
        }

    } catch (error) {
        console.error('Error adding manager:', error);
    }
}

// 2. Open Edit Modal & Populate Data
async function updateManager(id) {
    const modal = document.getElementById('editManagerModal');
    modal.style.display = 'flex'; // Use flex to center if your CSS supports it

    try {
        const response = await fetch(`/api/admin/manager/${id}`);
        const data = await response.json();

        document.getElementById('edit_manager_id').value = data.id;
        document.getElementById('edit_name').value = data.name;
        document.getElementById('edit_email').value = data.email;
        document.getElementById('edit_phone').value = data.mobile;
        
        // Load salons and pre-select the correct one
        await fetchAndPopulateSalons('edit_salonSelect', data.salon_id);

    } catch (error) {
        console.error("Error fetching manager details:", error);
        alert("Could not load manager details.");
        closeEditModal();
    }
}

// 3. Save Edit
async function saveEditManager() {
    const rawId = document.getElementById('edit_manager_id').value;
    
    // 2. Debugging: Check if ID is missing immediately
    if (!rawId || rawId === "undefined") {
        console.error("Error: Manager ID is missing or undefined.");
        alert("Cannot update: Manager ID is missing. Please refresh and try again.");
        return;
    }

    const rawSalonId = document.getElementById('edit_salonSelect').value;
    const salonId = rawSalonId ? parseInt(rawSalonId) : null;

    const payload = {
        name: document.getElementById('edit_name').value,
        email: document.getElementById('edit_email').value,
        mobile: document.getElementById('edit_phone').value,
        salon_id: salonId, 
    };

    console.log("Sending Update Payload:", payload); // For debugging

    try {
        // 4. Ensure the ID is part of the URL correctly
        const response = await fetch(`/api/admin/update-manager/${rawId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            alert("Manager Updated Successfully!");
            closeEditModal();
            displayManagers();
        } else {
            alert("Failed: " + (result.message || "Database error"));
        }
    } catch (error) {
        console.error("Error updating manager:", error);
    }
}

async function deleteManager(id) {
    if(!confirm("Are you sure you want to disable this manager?")) return;

    try {
        const response = await fetch(`/api/admin/remove-manager/${id}`, { method: 'PUT' });
        if (response.ok) {
            alert("Manager Disabled.");
            displayManagers();
        } else {
            alert("Failed to disable manager.");
        }
    } catch (error) {
        console.error(error);
    }
}

// 5. Display Table of Managers
async function displayManagers() {
    // debugger; 

    try {
       
        const response = await fetch('/api/admin/all-managers', {
            method: 'GET'
        });

        if (!response.ok) {
            // If session is expired (401) or invalid (403), redirect to login
            if (response.status === 401 || response.status === 403) {
                window.location.href = '/sign-in';
                return;
            }
            throw new Error('Failed to fetch');
        }
        
        const managers = await response.json();
        const tableBody = document.querySelector('#manager-list table tbody');
        tableBody.innerHTML = ''; 

        if (managers.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No managers found</td></tr>';
            return;
        }

        managers.forEach(manager => {
            const row = document.createElement('tr');
            
            const dateStr = manager.created_at 
                ? new Date(manager.created_at).toLocaleDateString() 
                : 'N/A';
            
            const statusClass = manager.is_active ? 'status-active' : 'status-inactive';
            const statusText = manager.is_active ? 'Active' : 'Inactive';

            row.innerHTML = `
                <td>${manager.name}</td>
                <td>${manager.email}</td>
                <td>${manager.mobile || 'N/A'}</td>
                <td>${manager.salon_name || '<span style="color:#999">Not Assigned</span>'}</td>

                <td>
                    <button class="action-btn edit" onclick="updateManager(${manager.id})">Edit</button>
                    <button class="action-btn disable" onclick="deleteManager(${manager.id})">Disable</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error('Error:', error);
        document.querySelector('#manager-list table tbody').innerHTML = '<tr><td colspan="7">Failed to load data</td></tr>';
    }
}

// UI Helpers
function openManagerModal() {
    document.getElementById("addManagerForm").classList.add("active");
    fetchAndPopulateSalons('salonSelect'); // Use the shared function
}
function closeManagerModal() {
    document.getElementById("addManagerForm").classList.remove("active");
}
function closeEditModal() {
    document.getElementById("editManagerModal").style.display = 'none';
}

// Init
document.addEventListener('DOMContentLoaded', displayManagers);