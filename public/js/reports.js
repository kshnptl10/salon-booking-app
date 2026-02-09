let currentReportData = []; 
let currentReportType = 'Sales Report';

document.addEventListener('DOMContentLoaded', () => {
    console.log("1. Page Loaded. Script running...");

    // 1. Set Default Dates
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const startInput = document.getElementById('startDate');
    const endInput = document.getElementById('endDate');

    if(startInput && endInput) {
        startInput.valueAsDate = firstDay;
        endInput.valueAsDate = today;
    } else {
        console.error("CRITICAL ERROR: Date inputs not found! Check IDs 'startDate' and 'endDate' in HTML.");
    }

    // 2. Attach Listener
    const btn = document.getElementById('generateBtn');
    if (btn) {
        console.log("2. Button found. Attaching listener.");
        btn.addEventListener('click', () => {
            console.log("3. Button Clicked!"); // <--- If you don't see this, the click isn't registering
            generateReport();
        });
    } else {
        console.error("CRITICAL ERROR: Button with id 'generateBtn' not found!");
    }
    
    // 3. Load Initial Report
    generateReport();
    document.getElementById('exportCsvBtn').addEventListener('click', () => exportData('csv'));
    document.getElementById('exportPdfBtn').addEventListener('click', exportPdf);
});

async function generateReport() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const reportType = document.getElementById('reportType').value;
    const btn = document.getElementById('generateBtn');

    btn.textContent = "Loading...";
    btn.disabled = true;

    try {
        const response = await fetch('/api/admin/generate-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ startDate, endDate, reportType })
        });

        const data = await response.json();

        if (data.success) {
            currentReportData = data.tableData;
            currentReportType = data.reportType;
            
            updateCards(data.summary);
            updateTable(data.tableData, data.reportType);
        } else {
            alert("Failed to load data");
        }

    } catch (error) {
        console.error("Report Error:", error);
    } finally {
        btn.textContent = "Generate Report";
        btn.disabled = false;
    }
}

function exportPdf() {
    if (!currentReportData || currentReportData.length === 0) {
        alert("No data to export. Please generate a report first.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // 1. Add Title
    const reportTitle = `${currentReportType} (${new Date().toLocaleDateString()})`;
    doc.setFontSize(16);
    doc.text(reportTitle, 14, 15);

    // 2. Define Columns & Rows based on Report Type
    let columns = [];
    let rows = [];

    // Format helper for currency (Rs. is safer than ₹ symbol in standard PDF fonts)
    const fmtMoney = (amount) => `Rs. ${Number(amount).toLocaleString()}`;

    if (currentReportType === 'Sales Report') {
        columns = ["Date", "Salon Name", "Bookings", "Revenue", "Cancelled"];
        rows = currentReportData.map(item => [
            item.date_col,
            item.salon_name,
            item.total_count,
            fmtMoney(item.revenue),
            item.cancelled_count
        ]);
    } else if (currentReportType === 'Staff Performance') {
        columns = ["Staff Name", "Salon", "Bookings", "Revenue Generated"];
        rows = currentReportData.map(item => [
            item.staff_name,
            item.salon_name,
            item.total_bookings,
            fmtMoney(item.revenue_generated)
        ]);
    } else if (currentReportType === 'Salon Performance') {
        columns = ["Salon Name", "City", "Total Bookings", "Total Revenue"];
        rows = currentReportData.map(item => [
            item.salon_name,
            item.city,
            item.total_bookings,
            fmtMoney(item.total_revenue)
        ]);
    }

    // 3. Generate Table
    doc.autoTable({
        head: [columns],
        body: rows,
        startY: 20, // Start below the title
        theme: 'grid', // 'striped', 'grid', or 'plain'
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185] } // Blue header color
    });

    // 4. Save File
    const fileName = `${currentReportType.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`;
    doc.save(fileName);
}

function exportData(fileType) {
    if (!currentReportData || currentReportData.length === 0) {
        alert("No data to export. Please generate a report first.");
        return;
    }

    // 1. Format Data for Export (Rename columns to be readable)
    // We map the raw DB keys to nice English Headers
    const formattedData = currentReportData.map(row => {
        if (currentReportType === 'Sales Report') {
            return {
                "Date": row.date_col,
                "Salon Name": row.salon_name,
                "Total Bookings": row.total_count,
                "Revenue": row.revenue, // Raw number is better for Excel math
                "Cancelled": row.cancelled_count
            };
        } else if (currentReportType === 'Staff Performance') {
            return {
                "Staff Name": row.staff_name,
                "Salon": row.salon_name,
                "Bookings": row.total_bookings,
                "Revenue Generated": row.revenue_generated
            };
        } else if (currentReportType === 'Salon Performance') {
            return {
                "Salon Name": row.salon_name,
                "City": row.city,
                "Total Bookings": row.total_bookings,
                "Total Revenue": row.total_revenue
            };
        }
        return row; // Fallback
    });

    // 2. Create a new Workbook
    const wb = XLSX.utils.book_new();
    
    // 3. Convert JSON data to Worksheet
    const ws = XLSX.utils.json_to_sheet(formattedData);

    // 4. Append Worksheet to Workbook
    XLSX.utils.book_append_sheet(wb, ws, "Report");

    // 5. Generate File Name
    const fileName = `${currentReportType.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.${fileType}`;

    // 6. Download
    XLSX.writeFile(wb, fileName);
}

function updateCards(summary) {
    // Helper to format currency
    const fmt = (num) => '₹' + Number(num).toLocaleString('en-IN');

    // Update the DOM elements (Make sure your HTML has these IDs, see Part 4)
    document.getElementById('cardRevenue').textContent = fmt(summary.total_revenue);
    document.getElementById('cardBookings').textContent = summary.total_bookings;
    document.getElementById('cardCompleted').textContent = summary.completed_services;
    document.getElementById('cardCancelled').textContent = summary.cancelled_bookings;
}

function updateTable(data, type) {
    const tableHead = document.querySelector('#reportTable thead tr');
    const tableBody = document.querySelector('#reportTable tbody');
    
    tableBody.innerHTML = ''; // Clear existing
    tableHead.innerHTML = ''; // Clear headers

    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No data found for this period.</td></tr>';
        return;
    }

    // --- Define Columns based on Report Type ---
    let columns = [];

    if (type === 'Sales Report') {
        columns = ['Date', 'Salon', 'Total Bookings', 'Revenue', 'Cancelled'];
        // Render Headers
        columns.forEach(col => tableHead.innerHTML += `<th>${col}</th>`);
        
        // Render Rows
        data.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.date_col}</td>
                <td>${row.salon_name}</td>
                <td>${row.total_count}</td>
                <td>₹${Number(row.revenue).toLocaleString()}</td>
                <td style="color:red">${row.cancelled_count}</td>
            `;
            tableBody.appendChild(tr);
        });

    } else if (type === 'Staff Performance') {
        columns = ['Staff Name', 'Salon', 'Total Bookings', 'Revenue Generated'];
        columns.forEach(col => tableHead.innerHTML += `<th>${col}</th>`);

        data.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${row.staff_name}</strong></td>
                <td>${row.salon_name}</td>
                <td>${row.total_bookings}</td>
                <td style="color:green">₹${Number(row.revenue_generated).toLocaleString()}</td>
            `;
            tableBody.appendChild(tr);
        });

    } else if (type === 'Salon Performance') {
        columns = ['Salon Name', 'City', 'Total Bookings', 'Total Revenue'];
        columns.forEach(col => tableHead.innerHTML += `<th>${col}</th>`);

        data.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${row.salon_name}</strong></td>
                <td>${row.city}</td>
                <td>${row.total_bookings}</td>
                <td style="font-weight:bold">₹${Number(row.total_revenue).toLocaleString()}</td>
            `;
            tableBody.appendChild(tr);
        });
    }
}

