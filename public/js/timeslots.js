document.addEventListener('DOMContentLoaded', () => {
    // Load all initial data when page opens
    loadGeneralSettings();
    loadWeeklySchedule();
    loadOverrides();

    // Attach Event Listeners for Forms
    document.getElementById('weekly-schedule-form').addEventListener('submit', saveWeeklySchedule);
    document.getElementById('override-form').addEventListener('submit', addOverride);
});

/* =========================================
   1. GENERAL SETTINGS LOGIC
   ========================================= */

// Load Settings from Backend
async function loadGeneralSettings() {
    try {
        const response = await fetch('/api/admin/getTimesettings');
        if (!response.ok) throw new Error('Failed to fetch settings');
        
        const data = await response.json();
        
        if (data) {
            document.getElementById('slotDuration').value = data.slot_duration || 30;
            document.getElementById('bufferTime').value = data.buffer_time || 5;
            document.getElementById('maxBookings').value = data.slot_capacity || 1;
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Save Settings (Triggered by button onclick in HTML)
window.saveGeneralSettings = async function() {
    const duration = document.getElementById('slotDuration').value;
    const buffer = document.getElementById('bufferTime').value;
    const capacity = document.getElementById('maxBookings').value;

    if (duration < 1 || capacity < 1) {
        alert("Duration and Capacity must be positive numbers.");
        return;
    }

    const payload = {
        slot_duration: parseInt(duration),
        buffer_time: parseInt(buffer),
        slot_capacity: parseInt(capacity)
    };

    try {
        const btn = document.querySelector('button[onclick="saveGeneralSettings()"]');
        const originalText = btn.innerText;
        btn.innerText = "Saving...";
        btn.disabled = true;

        const response = await fetch('/api/admin/updateTimeSettings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert('Settings updated successfully!');
        } else {
            const err = await response.json();
            alert('Error: ' + err.message);
        }

        btn.innerText = originalText;
        btn.disabled = false;
    } catch (error) {
        console.error(error);
        alert('Server connection failed.');
    }
};

/* =========================================
   2. WEEKLY SCHEDULE LOGIC
   ========================================= */

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Toggle Input Fields based on Switch (Triggered by onchange in HTML)
window.toggleDay = function(day) {
    const checkbox = document.getElementById(`switch-${day}`);
    const startInput = document.getElementById(`start-${day}`);
    const endInput = document.getElementById(`end-${day}`);
    
    // Optional: Visually dim the row if disabled
    // const row = document.getElementById(`row-${day}`); 

    if (checkbox.checked) {
        startInput.disabled = false;
        endInput.disabled = false;
    } else {
        startInput.disabled = true;
        endInput.disabled = true;
        startInput.value = ''; // Optional: clear value
        endInput.value = '';
    }
};

// Load Schedule from Backend and populate table
async function loadWeeklySchedule() {
    try {
        const response = await fetch('/api/admin/schedule');
        if (!response.ok) return; // Might be empty initially

        const schedule = await response.json(); // Expecting array of objects

        // Map backend data to UI
        schedule.forEach(item => {
            const day = item.day_of_week; // e.g., "Monday"
            if (DAYS.includes(day)) {
                const checkbox = document.getElementById(`switch-${day}`);
                const startInput = document.getElementById(`start-${day}`);
                const endInput = document.getElementById(`end-${day}`);

                checkbox.checked = item.is_open;
                startInput.value = item.start_time || ''; // Format HH:mm
                endInput.value = item.end_time || '';

                // Trigger toggle to set disabled state correctly
                window.toggleDay(day);
            }
        });
    } catch (error) {
        console.error('Error loading schedule:', error);
    }
}

// Save Weekly Schedule
async function saveWeeklySchedule(e) {
    if(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    const scheduleData = [];
    let isValid = true;

    // Helper constant for days
    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    DAYS.forEach(day => {
        const isOpen = document.getElementById(`switch-${day}`).checked;
        const start = document.getElementById(`start-${day}`).value;
        const end = document.getElementById(`end-${day}`).value;

        if (isOpen && (!start || !end)) {
            isValid = false;
            alert(`Please set Start and End times for ${day}, or disable it.`);
            return;
        }

        scheduleData.push({
            day: day,
            isOpen: isOpen,
            startTime: isOpen ? start : null,
            endTime: isOpen ? end : null
        });
    });

    if (!isValid) return;

    // Select the button correctly
    const btn = document.querySelector('#weekly-schedule-form button');
    const originalText = btn.textContent;
    
    try {
        btn.textContent = "Saving...";
        btn.disabled = true;

        // FIXED URL: Changed '/api/admin/saveSchedule' to '/api/admin/schedule'
        const response = await fetch('/api/admin/schedule', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ schedule: scheduleData })
        });

        const result = await response.json();

        if (response.ok) {
            alert("Weekly schedule saved successfully!");
        } else {
            alert("Failed to save: " + (result.message || "Unknown error"));
        }

    } catch (error) {
        console.error(error);
        alert("Server error. Check console for details.");
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

/* =========================================
   3. SPECIFIC DATE OVERRIDES LOGIC
   ========================================= */

// Toggle Inputs for Overrides (Triggered by onchange in HTML)
window.toggleOverrideInputs = function() {
    const isOpen = document.getElementById('overrideIsOpen').checked;
    document.getElementById('overrideStart').disabled = !isOpen;
    document.getElementById('overrideEnd').disabled = !isOpen;
};

// Load Overrides List
async function loadOverrides() {
    const tbody = document.getElementById('overridesList');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">Loading...</td></tr>';

    try {
        const response = await fetch('/api/admin/overrides');
        if (!response.ok) throw new Error("Failed");
        
        const data = await response.json();
        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-sm text-secondary">No exceptions found.</td></tr>';
            return;
        }

        data.forEach(override => renderOverrideRow(override));

    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error loading data.</td></tr>';
    }
}

// Render a single row in the overrides table
function renderOverrideRow(data) {
    const tbody = document.getElementById('overridesList');
    
    // Clear "No exceptions" message if it exists
    if (tbody.querySelector('td[colspan="4"]')) tbody.innerHTML = '';

    const tr = document.createElement('tr');
    tr.id = `override-row-${data.id}`;

    // Format Date (e.g., "15 Mar 2026")
    const dateObj = new Date(data.specific_date);
    const dateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    // Status Badge
    const statusBadge = data.is_open 
        ? '<span class="badge badge-sm bg-gradient-success">Open</span>' 
        : '<span class="badge badge-sm bg-gradient-danger">Closed</span>';
    
    // Hours string
    const hours = data.is_open ? `${data.start_time} - ${data.end_time}` : '—';

    tr.innerHTML = `
        <td>
            <div class="d-flex px-2 py-1">
                <div class="d-flex flex-column justify-content-center">
                    <h6 class="mb-0 text-sm">${dateStr}</h6>
                </div>
            </div>
        </td>
        <td class="align-middle text-sm">${statusBadge}</td>
        <td class="align-middle text-xs font-weight-bold">${hours}</td>
        <td class="align-middle text-center">
            <a href="javascript:;" class="text-secondary font-weight-bold text-xs" 
               data-toggle="tooltip" data-original-title="Delete"
               onclick="deleteOverride(${data.id}, this)">
                Delete
            </a>
        </td>
    `;
    tbody.appendChild(tr);
}

// Add New Override
async function addOverride(e) {
    e.preventDefault();

    const date = document.getElementById('overrideDate').value;
    const isOpen = document.getElementById('overrideIsOpen').checked;
    const start = document.getElementById('overrideStart').value;
    const end = document.getElementById('overrideEnd').value;

    // Validation
    if (!date) {
        alert("Please select a date.");
        return;
    }
    if (isOpen && (!start || !end)) {
        alert("Please select Start and End times for open days.");
        return;
    }

    const payload = {
        specific_date: date,
        is_open: isOpen,
        start_time: isOpen ? start : null,
        end_time: isOpen ? end : null
    };

    try {
        const response = await fetch('/api/admin/addOverride', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            // Add to UI immediately
            // Assuming backend returns the created object with an ID
            renderOverrideRow(result.override || { ...payload, id: Date.now() }); 
            document.getElementById('override-form').reset();
            window.toggleOverrideInputs(); // Reset disabled states
        } else {
            alert("Error: " + result.message);
        }
    } catch (error) {
        console.error(error);
        alert("Failed to add exception.");
    }
}

// Delete Override (Triggered by onclick in generated HTML)
window.deleteOverride = async function(id, btnElement) {
    if (!confirm("Are you sure you want to delete this exception?")) return;

    try {
        const response = await fetch(`/api/admin/deleteOverride/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            // Remove row from UI
            const row = btnElement.closest('tr');
            row.remove();
            
            // If empty, show message
            const tbody = document.getElementById('overridesList');
            if (tbody.children.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center text-sm text-secondary">No exceptions found.</td></tr>';
            }
        } else {
            alert("Failed to delete.");
        }
    } catch (error) {
        console.error(error);
        alert("Server error.");
    }
};