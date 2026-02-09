// Global storage for Chart instances to prevent "Canvas is already in use" errors
let dashboardCharts = {
    branchComparison: null,
    categoryPie: null
};

document.addEventListener('DOMContentLoaded', () => {
    loadHeaderSalons();
    fetchSalonListTable();
    refreshDashboard();
});

async function loadHeaderSalons() {
    const dropdown = document.getElementById('headerSalonSelect');
    if (!dropdown) return; // Safety check

    try {
        const response = await fetch('/api/admin/salons-list'); 
        if (!response.ok) throw new Error('Failed to load salons');
        
        const salons = await response.json();
        
        dropdown.innerHTML = '<option value="">All Branches (Brand View)</option>';

        salons.forEach(s => {
            const option = document.createElement('option');
            option.value = s.salon_id || s.id; 
            // Format: "Glow Salon - Ahmedabad"
            option.textContent = s.branch_name 
                ? `${s.salon_name} - ${s.branch_name}` 
                : s.salon_name;
            dropdown.appendChild(option);
        });

    } catch (error) {
        console.error("Error loading header salons:", error);
        dropdown.innerHTML = '<option value="">Error loading list</option>';
    }
}

// Triggered when user changes the dropdown selection
function refreshDashboard() {
    const dropdown = document.getElementById('headerSalonSelect');
    const salonId = dropdown ? dropdown.value : null;
    
    console.log("Refreshing Dashboard for Salon ID:", salonId || "ALL");
    
    // Fetch and Render all stats
    fetchDashboardStats(salonId);
}

// ==========================================
// 3. MAIN DASHBOARD DATA FETCHER
// ==========================================
async function fetchDashboardStats(salonId) {
    try {
        // Build URL: Add query parameter if a salon is selected
        let url = '/api/admin/dashboard-stats';
        if (salonId) url += `?salon_id=${salonId}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch stats");
        
        const data = await response.json();

        // --- RENDER SECTION ---
        updateFinancialKPIs(data);
        updateOperationalKPIs(data);
        updateCharts(data, salonId);
        updateTopServices(data.topServices || []); // Safe navigation
        
        // Only update "Top Branch" widget if looking at ALL salons
        if (!salonId) {
            updateTopBranchWidget(data.branchComparison || []);
        }

    } catch (error) {
        console.error("Dashboard Error:", error);
    }
}

// ==========================================
// 4. UI RENDERERS (KPIs & Lists)
// ==========================================

function updateFinancialKPIs(data) {
    // 1. Revenue
    const revenue = data.financials?.monthRevenue || 0;
    // Format currency (e.g., ₹4,50,000)
    const formattedRev = new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', maximumFractionDigits: 0
    }).format(revenue);
    
    setText('revenueDisplay', formattedRev);

    // 2. Average Ticket Value (Revenue / Completed Appts)
    const completedAppts = data.completedThisMonth || 1; // Prevent divide by zero
    const atv = Math.round(revenue / completedAppts);
    setText('atvDisplay', `₹${atv}`);
}

function updateOperationalKPIs(data) {
    setText('bookingsToday', data.bookingsToday || 0);
    setText('activeManagers', data.activeManagers || 0);
}

function updateTopServices(servicesList) {
    const listContainer = document.getElementById('topServicesList');
    if (!listContainer) return;
    
    listContainer.innerHTML = ''; // Clear old list

    if (!servicesList || servicesList.length === 0) {
        listContainer.innerHTML = '<div style="padding:10px; color:#777;">No service data available.</div>';
        return;
    }

    servicesList.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'top-list-item';
        div.innerHTML = `
            <span><span class="rank-badge">${index + 1}</span> ${item.name}</span>
            <strong>₹${Number(item.revenue).toLocaleString()}</strong>
        `;
        listContainer.appendChild(div);
    });
}

function updateTopBranchWidget(branches) {
    const widget = document.getElementById('topBranchName');
    if (!widget) return;

    if (!branches || branches.length === 0) {
        setText('topBranchName', '-');
        setText('topBranchRevenue', '₹0');
        return;
    }

    // Sort descending by revenue and pick #1
    const sorted = [...branches].sort((a, b) => b.revenue - a.revenue);
    const winner = sorted[0];

    // Calculate % Contribution
    const totalRev = branches.reduce((sum, b) => sum + Number(b.revenue), 0);
    const percent = totalRev > 0 ? ((winner.revenue / totalRev) * 100).toFixed(1) : 0;

    setText('topBranchName', winner.branchName || winner.name);
    setText('topBranchRevenue', `₹${Number(winner.revenue).toLocaleString()}`);
    setText('topBranchPercent', percent + '%');
}

// Helper to safely set text content
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
}

// ==========================================
// 5. CHART.JS RENDERERS
// ==========================================

function updateCharts(data, salonId) {
    // A. Branch Comparison Chart
    const branchSection = document.getElementById('branchSection');
    
    // Logic: Hide comparison chart if a specific salon is selected
    if (salonId && branchSection) {
        branchSection.style.display = 'none';
    } else if (branchSection) {
        branchSection.style.display = 'block';
        renderBranchChart(data.branchComparison || []);
    }

    // B. Category Pie Chart
    renderCategoryChart(data.revenueByCategory || []);
}

function renderBranchChart(branchData) {
    const canvas = document.getElementById('branchComparisonChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Destroy old chart to avoid overlay issues
    if (dashboardCharts.branchComparison) {
        dashboardCharts.branchComparison.destroy();
    }

    const labels = branchData.map(b => b.branchName || b.name);
    const values = branchData.map(b => b.revenue);

    dashboardCharts.branchComparison = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Revenue',
                data: values,
                backgroundColor: '#4a90e2',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

function renderCategoryChart(categoryData) {
    const canvas = document.getElementById('categoryPieChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (dashboardCharts.categoryPie) {
        dashboardCharts.categoryPie.destroy();
    }

    // Use Mock Data if empty (for visualization during dev)
    if (categoryData.length === 0) {
        categoryData = [
            { name: "Hair", revenue: 5000 }, 
            { name: "Skin", revenue: 3000 },
            { name: "Nails", revenue: 2000 }
        ];
    }

    const labels = categoryData.map(c => c.name);
    const values = categoryData.map(c => c.revenue);
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];

    dashboardCharts.categoryPie = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

// ==========================================
// 6. SALON OVERVIEW TABLE (Bottom Section)
// ==========================================
async function fetchSalonListTable() {
    try {
        // This endpoint returns the list of all salons owned by the admin
        const response = await fetch('/api/admin/my-salons');

        if (!response.ok) throw new Error('Failed to fetch salon data');

        const salonData = await response.json();
        
        if (salonData.success && salonData.salons) {
            renderSalonTable(salonData.salons); 
        }

    } catch (error) {
        console.error("Error fetching salon list table:", error);
    }
}

function renderSalonTable(salons) {
    const tableBody = document.querySelector('#salon-list-container table tbody');
    
    // If the new HTML structure uses the ID 'salon-list-container' for the DIV,
    // we need to find the table inside it, or creating it dynamically if your HTML expects that.
    // Assuming your HTML has <div id="salon-list-container">...<table><tbody>...
    
    if (!tableBody) {
        // Fallback: If table doesn't exist, we skip rendering or create it.
        // For safety, checking if the container exists to inject the whole table like before.
        const container = document.getElementById('salon-list-container');
        if (container) {
            const rowsHtml = generateRows(salons);
            container.innerHTML = `
                <h3>Salon Overview</h3>
                <table class="dashboard-table">
                    <thead>
                        <tr>
                            <th>Salon Name</th>
                            <th>Owner</th>
                            <th>Contact</th>
                            <th>Location</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            `;
        }
        return;
    }

    // Normal behavior: Update existing table body
    tableBody.innerHTML = generateRows(salons);
}

function generateRows(salons) {
    return salons.map(salon => `
        <tr>
            <td>
                <strong>${salon.salon_name}</strong><br>
                <small style="color:#666;">${salon.is_main_branch ? 'Head Office' : salon.branch_name}</small>
            </td>
            <td>${salon.owner_name}</td>
            <td>${salon.phone_number || 'N/A'}</td>
            <td>${salon.city}</td>
            <td><span class="status-active">Active</span></td>
        </tr>
    `).join('');
}