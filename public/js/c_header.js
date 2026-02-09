// js/c_header.js

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Image Paths
    const MALE_AVATAR = '../images/avatar-male.png';
    const FEMALE_AVATAR = '../images/avatar-female.png';

    try {
        // 2. Fetch User Data
        const response = await fetch('/api/customerprofile');
        if (!response.ok) return; // Stop if not logged in
        
        const data = await response.json();

        // 3. Update Header Name
        const headerName = document.getElementById('profileName');
        if (headerName) {
            headerName.textContent = data.name;
        }

        // 4. Update Header Avatar
        const headerImg = document.querySelector('.profile-bubble img');
        if (headerImg) {
            const gender = data.gender ? data.gender.trim() : '';
            
            if (gender === 'Female') {
                headerImg.src = FEMALE_AVATAR;
            } else {
                headerImg.src = MALE_AVATAR;
            }
        }

    } catch (error) {
        console.error("Error loading header info:", error);
    }
});


document.addEventListener('DOMContentLoaded', () => {
    // Target the profile bubble as the click area
    const profileBubble = document.getElementById('profileBubble');
    const profileMenuPopup = document.getElementById('profileMenuPopup');

    if (profileBubble && profileMenuPopup) {
        profileBubble.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevents click from immediately bubbling to close the menu
            
            // Toggle the 'open' class to show/hide the menu
            profileMenuPopup.classList.toggle('open');
        });

        // Add handler to close the menu when clicking anywhere else on the document
        document.addEventListener('click', (e) => {
            // If the click is not inside the bubble or the menu, close the menu
            const isClickInsideMenu = profileMenuPopup.contains(e.target);
            const isClickOnBubble = profileBubble.contains(e.target);

            if (profileMenuPopup.classList.contains('open') && !isClickInsideMenu && !isClickOnBubble) {
                profileMenuPopup.classList.remove('open');
            }
        });
        
        // Optional: Ensure the profile bubble area looks clickable
        profileBubble.style.cursor = 'pointer';
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    //setupHeaderData();
    setupSearchFunctionality(); // <--- NEW FUNCTION CALL
});

// ... (Your existing setupHeaderData / Load Profile logic here) ...


// ==========================================
// SEARCH FUNCTIONALITY
// ==========================================
function setupSearchFunctionality() {
    const searchInput = document.querySelector('.search-bar input');
    
    // 1. Create the Dropdown container dynamically
    // (We do this in JS so you don't have to edit every HTML file)
    const searchContainer = document.querySelector('.search-bar');
    if (!searchContainer || !searchInput) return;

    const resultsList = document.createElement('div');
    resultsList.className = 'search-results-dropdown';
    searchContainer.appendChild(resultsList);

    // 2. Event Listener: Typing
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim();

        if (query.length < 2) {
            resultsList.classList.remove('active');
            resultsList.innerHTML = '';
            return;
        }

        // Wait 300ms after user stops typing to avoid too many API calls
        debounceTimer = setTimeout(() => fetchSearchResults(query, resultsList), 300);
    });

    // 3. Hide dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchContainer.contains(e.target)) {
            resultsList.classList.remove('active');
        }
    });
}

async function fetchSearchResults(query, resultsList) {
    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) return;

        const data = await response.json();
        const { salons, services } = data;

        resultsList.innerHTML = '';

        if (salons.length === 0 && services.length === 0) {
            resultsList.innerHTML = '<div class="search-item"><small>No results found</small></div>';
            resultsList.classList.add('active');
            return;
        }

        // A. Render Salons
        salons.forEach(salon => {
            const item = document.createElement('div');
            item.className = 'search-item';
            item.innerHTML = `
                <div>
                    <strong>${salon.salon_name}</strong>
                    <small>${salon.city}</small>
                </div>
                <span class="search-tag">Salon</span>
            `;
            // Redirect on click
            item.onclick = () => window.location.href = `/customer/c_salon_details.html?id=${salon.id}`;
            resultsList.appendChild(item);
        });

        // B. Render Services
        services.forEach(service => {
            const item = document.createElement('div');
            item.className = 'search-item';
            item.innerHTML = `
                <div>
                    <strong>${service.name}</strong>
                    <small>in ${service.salon_name}</small>
                </div>
                <span class="search-tag">Service</span>
            `;
            // Redirect on click
            item.onclick = () => window.location.href = `/customer/c_salon_details.html?id=${service.salon_id}`; // Or service details page
            resultsList.appendChild(item);
        });

        resultsList.classList.add('active');

    } catch (error) {
        console.error("Search Error", error);
    }
}