async function fetchSalons() {
    try {
        // Ensure this path matches your server route (e.g., /api/admin/my-salons)
        const response = await fetch('/api/admin/my-salons'); 

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching salons:', error);
        throw error;
    }
}

fetchSalons().then(data => {
    // 1. Target the Table Body, NOT the main div
    const tableBody = document.querySelector('#salon-list table tbody');
    
    const salons = data.salons || []; 

    tableBody.innerHTML = '';

    salons.forEach(salon => {
        const row = document.createElement('tr');
        
        const dateStr = salon.created_at 
            ? new Date(salon.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) 
            : 'N/A';

        const statusClass = salon.is_active ? 'status-active' : 'status-inactive';
        const statusText = salon.is_active ? 'Active' : 'Inactive';

        row.innerHTML = `
            <td>
                <strong>${salon.salon_name}</strong><br>
                <small>${salon.is_main_branch ? 'Main Branch' : salon.branch_name}</small>
            </td>
            <td>${salon.city || 'N/A'}</td>
            <td>${salon.manager_name || '—'}</td> 
            <td class="${statusClass}">${statusText}</td>
            <td>${dateStr}</td>
            <td>
                <button class="action-btn edit" onclick="editSalon(${salon.salon_id})">Edit</button>
                <button class="action-btn disable" onclick="toggleStatus(${salon.salon_id})">
                    ${salon.is_active ? 'Disable' : 'Enable'}
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}).catch(error => {
    console.error('Failed to render salons:', error);
    const tableBody = document.querySelector('#salon-list table tbody');
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Failed to load data</td></tr>';
});

async function loadManagerDropdown(targetSelectId, currentManagerId = null, currentManagerName = null) {
    const dropdown = document.getElementById(targetSelectId);
    
    // Safety check: Does the dropdown exist in the HTML?
    if (!dropdown) {
        console.error(`Error: Dropdown with ID '${targetSelectId}' not found.`);
        return;
    }

    dropdown.innerHTML = '<option value="">Loading...</option>';

    try {
        const response = await fetch('/api/admin/available-managers');
        const availableManagers = await response.json();

        dropdown.innerHTML = '<option value="">Select a Manager</option>';

        // 1. Add all "Available" managers from the API
        availableManagers.forEach(manager => {
            const option = document.createElement('option');
            option.value = manager.id;
            option.textContent = manager.name;
            dropdown.appendChild(option);
        });

        // 2. CRITICAL FIX: Add the "Current Manager" if they exist
        // (Because the current manager is technically "assigned", they won't be in the "available" list)
        if (currentManagerId && currentManagerName) {
            // Check if they are already added to avoid duplicates
            const alreadyInList = Array.from(dropdown.options).some(opt => opt.value == currentManagerId);
            
            if (!alreadyInList) {
                const currentOpt = document.createElement('option');
                currentOpt.value = currentManagerId;
                currentOpt.textContent = currentManagerName; // Show their name
                dropdown.appendChild(currentOpt);
            }
        }
        
        // 3. Select the current manager if applicable
        if (currentManagerId) {
             dropdown.value = currentManagerId;
        }

    } catch (error) {
        console.error("Error loading managers:", error);
        dropdown.innerHTML = '<option value="">Error loading list</option>';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    
    const salonForm = document.getElementById('addSalonForm');

    // SAFETY CHECK: Does the form actually exist?
    if (!salonForm) {
        console.error("Critical Error: <form id='addSalonForm'> not found. Check your HTML IDs.");
        return;
    }
    salonForm.addEventListener('submit', async function(e) {
        e.preventDefault(); 
        // 1. Gather Data safely (Check if inputs exist before getting .value)
        const getValue = (id) => document.getElementById(id) ? document.getElementById(id).value : '';

        const formData = {
        name: document.getElementById('salonName').value,
        email: document.getElementById('Email').value,
        phone: document.getElementById('salonPhone').value,
        address: document.getElementById('salonAddress').value,
        city: document.getElementById('salonCity').value,
        branch_name: document.getElementById('branchName').value,
        manager_id: document.getElementById('salonManager').value,
        opening_time: document.getElementById('openingTime').value,
        closing_time: document.getElementById('closingTime').value,
        status: document.getElementById('salonStatus').value,
        };

        console.log("Form Data to Send:", formData); // DEBUG LOG

        try {
            const response = await fetch('/api/admin/create-salon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            console.log("Server Response:", result); // DEBUG LOG
            if (response.ok) {
                alert('Salon Created Successfully!');
                if (typeof closeModal === 'function') {
                    closeModal('addSalonModal'); 
                } else {
                    document.getElementById('editSalonModal').style.display = 'none';
                }
                await refreshSalonTable();
            } else {
                alert('Error: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error creating salon:', error);
            alert('Failed to connect to server.');
        }
    });
});

async function editSalon(salon_id) {
    const modal = document.getElementById('editsalonModal');
    modal.style.display = 'flex'; // Use flex to center if your CSS supports it
    try {
        const response = await fetch(`/api/admin/salon/${salon_id}`);
        const salon = await response.json();

        await loadManagerDropdown('editSalonManager', salon.manager_id, salon.manager_name);
        // Populate the form fields
        document.getElementById('edit_salon_id').value = salon.salon_id;
        document.getElementById('editsalonName').value = salon.salon_name;
        document.getElementById('editEmail').value = salon.email;
        document.getElementById('editPhone').value = salon.phone_number;
        document.getElementById('editAddress').value = salon.address;
        document.getElementById('editCity').value = salon.city;
        document.getElementById('editBranchName').value = salon.branch_name;
        document.getElementById('editOpeningTime').value = salon.opening_time;
        document.getElementById('editClosingTime').value = salon.closing_time;
        document.getElementById('editSalonStatus').value = salon.is_active ? 'Active' : 'Inactive';
        debugger;
        // 4. SET THE MANAGER (Using ID, not Name)
        if (salon.manager_id) {
            document.getElementById('editSalonManager').value = salon.manager_id;
        } else {
            document.getElementById('editSalonManager').value = ""; // No manager assigned
        }
        
    } catch (error) {
        console.error('Error fetching salon details:', error);
        alert('Failed to load salon details.');
    }
}

async function saveEditSalon() {
    // 1. Gather Data
    const salonId = document.getElementById('edit_salon_id').value;

    const formData = {
        name: document.getElementById('editsalonName').value,
        email: document.getElementById('editEmail').value,
        phone: document.getElementById('editPhone').value,
        address: document.getElementById('editAddress').value,
        city: document.getElementById('editCity').value,
        branch_name: document.getElementById('editBranchName').value,
        manager_id: document.getElementById('editSalonManager').value,
        opening_time: document.getElementById('editOpeningTime').value,
        closing_time: document.getElementById('editClosingTime').value,
        status: document.getElementById('editSalonStatus').value,
    };
    console.log("Edit Form Data to Send:", formData); // DEBUG LOG

    try {
        const response = await fetch(`/api/admin/edit-salon/${salonId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const result = await response.json();
        if (response.ok) {
            alert('Salon Updated Successfully!');
            if (typeof closeModal === 'function') {
                closeModal('editsalonModal'); 
            } else {
                document.getElementById('editSalonModal').style.display = 'none';
            }

            await refreshSalonTable();    
        } else {
            alert('Error: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error updating salon:', error);
        alert('Failed to connect to server.');
    }
}

async function toggleStatus(salonId) {
    if(!confirm("Are you sure you want to toggle the status of this salon?")) return;  
    try {
        const response = await fetch(`/api/admin/toggle-salon-status/${salonId}`, { method: 'PUT' });
        const result = await response.json();
        if (response.ok) {
            alert('Salon status updated.');
            await refreshSalonTable();
        } else {
            alert('Error: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error toggling salon status:', error);
        alert('Failed to connect to server.');
    }
}

async function refreshSalonTable() {
    const tableBody = document.querySelector('#salon-list table tbody');
    if (!tableBody) return; // Safety check

    // Optional: Show a "Loading..." indicator while fetching
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Refreshing data...</td></tr>';

    try {
        const response = await fetch('/api/admin/my-salons'); // Check your route matches exactly
        if (!response.ok) throw new Error("Failed to fetch");
        
        const data = await response.json();
        
        // Handle different API formats (Array vs Object)
        const salons = Array.isArray(data) ? data : (data.salons || []);

        // Clear table
        tableBody.innerHTML = '';

        if (salons.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No salons found.</td></tr>';
            return;
        }

        // Render Rows
        salons.forEach(salon => {
            const row = document.createElement('tr');
            
            // Format Date
            const dateStr = salon.created_at 
                ? new Date(salon.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) 
                : 'N/A';

            // Determine Status Styles
            const statusClass = (salon.is_active || salon.status === 'Active') ? 'status-active' : 'status-inactive';
            const statusText = (salon.is_active || salon.status === 'Active') ? 'Active' : 'Inactive';

            row.innerHTML = `
                <td>
                    <strong>${salon.salon_name}</strong><br>
                    <small>${salon.branch_name || 'Main Branch'}</small>
                </td>
                <td>${salon.city || 'N/A'}</td>
                <td>${salon.manager_name || '—'}</td> 
                <td><span class="${statusClass}">${statusText}</span></td>
                <td>${dateStr}</td>
                <td>
                    <button class="action-btn edit" onclick="editSalon(${salon.salon_id})">Edit</button>
                    <button class="action-btn disable" onclick="toggleStatus(${salon.salon_id})">
                        ${statusText === 'Active' ? 'Disable' : 'Enable'}
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error('Error refreshing table:', error);
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Failed to load data</td></tr>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    refreshSalonTable();
    // other init code...
});
