// Global Images Array for Services
const images = [
    '/images/services/s1.png',
    '/images/services/s2.png',
    '/images/services/s3.png',
    '/images/services/s4.png',
    '/images/services/s5.png',
    '/images/services/s6.png',
    '/images/services/s7.png',
    '/images/services/s8.png',
    '/images/services/s9.png',
    '/images/services/s10.png'
];

// ==========================================
// 1. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initSalonFeed();    
    loadServices();
    loadAppointments();
    loadMostBrowsed();
    // loadUserProfile(); // Uncomment if you have this function defined elsewhere
});
 
// ==========================================
// 2. GEOLOCATION & SALON FEED LOGIC
// ==========================================
// In c_dashboard.js

function initSalonFeed() {
    const statusMsg = document.getElementById('locationStatus');
    
    // 1. Debug Log: Did we find the status element?
    if (!statusMsg) {
        console.error("❌ ERROR: <div id='locationStatus'> is missing in HTML.");
        fetchAndRenderSalons(null, null); 
        return;
    }

    // 2. Debug Log: Does browser support it?
    if (!navigator.geolocation) {
        console.warn("⚠️ Geolocation not supported by this browser.");
        statusMsg.innerText = "Geolocation not supported.";
        statusMsg.style.display = 'block';
        fetchAndRenderSalons(null, null);
        return;
    }

    console.log("📍 Asking browser for location...");
    statusMsg.innerText = "Locating nearby salons...";
    statusMsg.style.display = 'block';

    navigator.geolocation.getCurrentPosition(
        // SUCCESS CALLBACK
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            console.log("✅ Location Success:", lat, lng);
            statusMsg.innerText = "Showing salons near you.";
            fetchAndRenderSalons(lat, lng);
        },
        // ERROR CALLBACK
        (error) => {
            console.error("❌ Location Failed:", error.message);
            
            // Customize message based on error code
            let msg = "Location error.";
            if (error.code === 1) msg = "Location permission denied.";
            if (error.code === 2) msg = "Position unavailable (GPS off).";
            if (error.code === 3) msg = "Location request timed out.";

            statusMsg.innerText = `${msg} Showing all salons.`;
            fetchAndRenderSalons(null, null); // Load default list
        },
        // OPTIONS (Important for accuracy and timeout)
        {
            enableHighAccuracy: true,
            timeout: 10000, // Wait 10 seconds max
            maximumAge: 0
        }
    );
}

async function fetchAndRenderSalons(lat, lng) {
    const list = document.getElementById('salonList');
    const statusMsg = document.getElementById('locationStatus');
    
    list.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2 text-muted">Finding nearest salons...</p>
        </div>
    `;
    
    try {
        let url = "/api/customer/nearby"; // Default URL
        
        // If we have coordinates, append them
        if (lat && lng) {
            url += `?lat=${lat}&lng=${lng}`;
        }

        const res = await fetch(url);
        const data = await res.json();
        
        // Handle different API response structures (Array vs Object)
        // If API returns { success: true, salons: [...] }, use data.salons
        // If API returns plain array [...], use data
        const salons = Array.isArray(data) ? data : (data.salons || []);

        if (salons.length === 0) {
            list.innerHTML = '<p class="text-center">No salons found.</p>';
            if(statusMsg) statusMsg.innerText = "No results found.";
            return;
        }

        // Render the Unified Card
        list.innerHTML = salons.map(s => {
            // Logic: Show distance if 'distance_km' exists in API response
            let distanceBadge = '';
            if (s.distance_km) {
                const dist = parseFloat(s.distance_km).toFixed(1);
                distanceBadge = `<small class="text-muted ms-2">• <strong>${dist} km</strong> away</small>`;
            } else {
                distanceBadge = `<small class="text-muted ms-2">• ${s.city || 'City'}</small>`;
            }

            // Fallback for image if missing
            const imgUrl = s.image_url || '/images/salon-placeholder.jpg'; 
            const rating = s.rating || 'New';

            return `
            <div class="card salon-card mb-3">
                <div class="card-body p-3">
                    <div class="d-flex align-items-center">
                        <img src="${imgUrl}" alt="${s.salon_name}" 
                             style="card">
                        
                        <div class="flex-grow-1">
                            <h3 class="mb-1">${s.salon_name}</h3>
                            <p class="mb-0 text-sm">
                                ⭐ ${rating} ${distanceBadge}
                            </p>
                            <p class="text-xs text-secondary mb-2 text-truncate" style="max-width: 200px;">
                                ${s.address || ''}
                            </p>
                        </div>
                        
                        <button class="btn btn-primary btn-sm" 
                                onclick="bookNow(${s.id || s.salon_id}, '${s.salon_name}')">
                            Book
                        </button>
                    </div>
                </div>
            </div>`;
        }).join("");

        if(statusMsg && lat) {
            statusMsg.innerText = `Found ${salons.length} salons nearby.`;
        }

    } catch (err) {
        console.error("Error loading salons:", err);
        if(list) list.innerHTML = '<p class="text-danger">Failed to load salons.</p>';
    }
}

// ==========================================
// 3. BOOKING NAVIGATION
// ==========================================

function bookNow(salonId, salonName, serviceId = null, serviceName = null) {
    // 1. Clear previous service selection
    sessionStorage.removeItem("selectedServiceId");
    sessionStorage.removeItem("selectedServiceName");

    // 2. Save Salon Info
    if (salonId) {
        sessionStorage.setItem("selectedSalonId", salonId);
        sessionStorage.setItem("selectedSalonName", salonName);
    } else {
        sessionStorage.removeItem("selectedSalonId");
        sessionStorage.removeItem("selectedSalonName");
    }

    // 3. Save Service Info (if clicked from Recommended Services)
    if (serviceId) {
        sessionStorage.setItem("selectedServiceId", serviceId);
        sessionStorage.setItem("selectedServiceName", serviceName);
    }

    // 4. Navigate
    window.location.href = "/customer/booking.html";
}

// ==========================================
// 4. OTHER DATA LOADERS
// ==========================================

async function loadServices() {
    try {
        const res = await fetch("/api/customer/recommended/me");
        const services = await res.json();
        const container = document.getElementById("serviceList");
        
        if(!container) return;

        container.innerHTML = services
            .map((s, index) => `
                <div class="card card-body p-3 mx-2" style="min-width: 150px;">
                    <img src="${images[index % images.length]}" alt="${s.name}" 
                         style="width: 100%; height: 100px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;">
                    <h6 class="mb-1 text-truncate">${s.name}</h6>
                    <p class="text-sm font-weight-bold mb-2">₹${s.price}</p>
                    <a href="javascript:;" class="text-primary text-sm font-weight-bold" 
                       onclick="bookNow(null, null, ${s.id}, '${s.name}')">Book Now</a>
                </div>`
            )
            .join("");
    } catch (err) {
        console.error(err);
    }
}

async function loadAppointments() {
    try {
        const res = await fetch(`/api/customer/my-appointments?limit=5&flat=true`);
        const data = await res.json();
        const container = document.getElementById("appointmentList");

        if(!container) return;

        if (data.length === 0) {
            container.innerHTML = '<p class="text-sm text-center">No upcoming appointments.</p>';
            return;
        }

        container.innerHTML = data
            .map(a => {
                let statusClass = 'text-secondary';
                const statusName = a.status.toLowerCase();

                if (statusName === 'completed') statusClass = 'text-success';
                else if (statusName === 'pending') statusClass = 'text-warning';
                else if (statusName === 'confirmed' || statusName === 'active') statusClass = 'text-info';

                return `
                    <div class="card mb-3">
                        <div class="card-body p-3">
                            <h3 class="mb-1">${a.salon_name}</h3>
                            <p class="text-sm mb-1">${a.service_name}</p>
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="text-xs">
                                    <i class="fa fa-calendar"></i> ${formatDate(a.appointment_date)} 
                                    <i class="fa fa-clock-o ms-1"></i> ${formatTime(a.appointment_time)}
                                </span>
                                <span class="badge bg-light ${statusClass} text-xs">${a.status}</span>
                            </div>
                        </div>
                    </div>`;
            })
            .join("");
    } catch (err) {
        console.error(err);
    }
}

async function loadMostBrowsed() {
    try {
        const res = await fetch(`/api/customer/recommended`);
        const data = await res.json();
        const browsedList = document.getElementById("browsedList");

        if (!browsedList) return;

        if (data.length) {
            browsedList.innerHTML = data
                .map(s => `
                    <div class="list-group-item border-0 ps-0 pb-0 border-radius-lg-start">
                        <div class="d-flex align-items-center">
                            <div class="d-flex flex-column">
                                <h6 class="mb-1 text-dark font-weight-bold text-sm">${s.name}</h6>
                            </div>
                        </div>
                    </div>`
                ).join("");
        } else {
            browsedList.innerHTML = "<p class='text-sm text-secondary'>No recent history</p>";
        }
    } catch (err) {
        console.error("Error loading browsed services:", err);
    }
}

// ==========================================
// 5. HELPER FUNCTIONS
// ==========================================

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function formatTime(timeStr) {
    if (!timeStr) return "";
    const [hour, minute] = timeStr.split(":");
    let h = parseInt(hour, 10);
    const suffix = h >= 12 ? "PM" : "AM";
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return `${h}:${minute} ${suffix}`;
}