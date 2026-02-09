// c_salon.js (Refactored and Corrected)

// --- Global Data and Configuration (Keep at top) ---
const images = [
  '../images/services/s1.png', // Assuming correct path is ../images
  '../images/services/s2.png',
  '../images/services/s3.png',
  '../images/services/s4.png',
  '../images/services/s5.png',
  '../images/services/s6.png',
  '../images/services/s7.png',
  '../images/services/s8.png',
  '../images/services/s9.png',
  '../images/services/s10.png'
];

// --- Main Salon Loading and Display ---
async function loadSalons() {
    const res = await fetch("/api/customer/salons");
    const salons = await res.json();
    const container = document.getElementById("salonList");
    
    container.innerHTML = salons 
        .map(s => {

            const imgUrl = s.image_url || '/images/salon_default.jpg';

            return `
            <div class="card">
                <img src="${imgUrl}" alt="${s.salon_name}" />
                <h3>${s.salon_name}</h3>
                <p>${s.city} • ${s.distance || '1.2'} km away</p> 
                <p>⭐ ${s.rating}</p>
                <button class="btn btn-secondary btn-sm" 
                    onclick="viewSalonDetails(${s.salon_id}, '${s.salon_name}')">
                    View Details
                </button>
                 <button class="btn btn-primary btn-sm mt-2" 
                    onclick="bookNow(${s.salon_id}, '${s.salon_name}')">
                    Book Now
                </button>
            </div>`;
        })
        .join("");
}


// --- Salon Details Modal Handler ---
async function viewSalonDetails(salonId, salonName) {
    // ... (Your modal setup and loading state) ...
    const detailsBody = document.getElementById('salonDetailsBody');
    const modalTitle = document.getElementById('salonDetailsModalLabel');
    const bookLink = document.getElementById('bookServicesLink');
    
    modalTitle.textContent = `Loading ${salonName}...`;
    detailsBody.innerHTML = '<div class="text-center p-4">Loading details... <i class="fas fa-spinner fa-spin"></i></div>';
    
    const modalElement = document.getElementById('salonDetailsModal');
    // Ensure you have access to Bootstrap 5 JS (e.g., linked in the HTML)
    if (typeof bootstrap !== 'undefined' && modalElement) { 
        const modalInstance = new bootstrap.Modal(modalElement);
        modalInstance.show();
    }


    try {
        // 2. Fetch Salon Details (Assumed route exists)
        const salonRes = await fetch(`/api/customer/salons/${salonId}`);
        const salonData = await salonRes.json(); 
        
        // 3. Fetch Services for this Salon
        const servicesRes = await fetch(`/api/customer/services/${salonId}`);
        const servicesData = await servicesRes.json();
        
        // 4. Update the modal dynamically
        modalTitle.textContent = `${salonData.salon_name || salonName}`;
        detailsBody.innerHTML = `
                <h5 class="text-primary mb-1 section-title">${salonData.salon_name || salonName}</h5>
                <p class="text-muted">${salonData.address || 'Address N/A'}, ${salonData.city || 'City N/A'}</p>
            <div class="d-flex align-items-center mb-3">
                <p class="text-warning mb-0">Rating: ${salonData.rating || 'N/A'} ⭐</p>
                <span class="ms-3 text-sm text-muted">(${salonData.total_reviews || '0'} reviews)</span> 
            </div>
                <p>Phone: ${salonData.phone_number || 'N/A'}</p>
                <p>Owner: ${salonData.owner_name || 'N/A'}</p>
                <p>${salonData.description || 'No detailed description available.'}</p>
            <hr>
            <h6 class="section-title">Available Services (${servicesData.length})</h6>
            <ul class="list-group list-group-flush">
                ${servicesData.map(svc => 
                `<li class="list-group-item d-flex justify-content-between align-items-center">
                    <span class="text-dark">${svc.name}</span>
                    <span class="badge bg-primary rounded-pill"> ₹${svc.price}</span>
                </li>`).join('')}
            </ul>
        `;
        
        // 5. Update the Book Now link to pre-select this salon
        bookLink.href = `/customer/booking.html?salonId=${salonId}&salonName=${encodeURIComponent(salonName)}`;

    } catch (error) {
        console.error("Error fetching salon or service details:", error);
        detailsBody.innerHTML = `<div class="alert alert-danger">Failed to load salon details. Please try again later.</div>`;
    }
}

// --- Booking Logic (Placeholder Function) ---
// Universal bookNow function used by the dashboard:

function bookNow(salonId, salonName, serviceId, serviceName) {
    // Clear ALL specific selections first to prevent cross-page leakage
    sessionStorage.removeItem("selectedSalonId");
    sessionStorage.removeItem("selectedServiceName");
    sessionStorage.removeItem("selectedServiceId"); 
    
    // Save Salon Info (CRITICAL)
    if (salonId) {
        sessionStorage.setItem("selectedSalonId", salonId);
        sessionStorage.setItem("selectedSalonName", salonName);
    }

    // Save Service Info (Only if clicked from a specific service card)
    if (serviceId) {
        sessionStorage.setItem("selectedServiceId", serviceId);
        sessionStorage.setItem("selectedServiceName", serviceName);
    }
    
    window.location.href = "/customer/booking.html";
}
// --- Initialization ---
document.addEventListener('DOMContentLoaded', loadSalons);

