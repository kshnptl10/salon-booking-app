// ==========================================
// 1. GLOBAL VARIABLES
// ==========================================
const profileForm = document.getElementById('profileForm');
const avatarInput = document.getElementById('avatarInput');
const avatarPreview = document.getElementById('avatarPreview');
const profilePicContainer = document.getElementById('profilePicContainer');
const profileCard = document.getElementById('profileCard');
const headerAvatar = document.querySelector('.profile-bubble img');

const MALE_AVATAR = '../images/avatar-male.png';
const FEMALE_AVATAR = '../images/avatar-female.png';

// Buttons
const btnEdit = document.getElementById('btnEdit');
const btnSave = document.getElementById('btnSave');
const btnCancel = document.getElementById('btnCancel');

// Header Elements
const genderSelect = document.getElementById('gender');
const profileBubble = document.getElementById('profileBubble');
const profileMenuPopup = document.getElementById('profileMenuPopup');
const headerProfileName = document.getElementById('profileName');
const headerProfileImg = document.querySelector(".profile-bubble img");

// Select all form inputs EXCEPT the file input
const formInputs = document.querySelectorAll('#profileForm input, #profileForm textarea, #profileForm select');

// ==========================================
// 2. INITIALIZATION (On Page Load)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    loadProfileData();
    setupHeaderMenu();
});

if (genderSelect) {
    genderSelect.addEventListener('change', (e) => {
        updateAvatarDisplay(e.target.value);
    });
}

const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const year = date.getFullYear();
    // month is 0-indexed, so we add 1. PadStart ensures '05' instead of '5'
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

function updateAvatarDisplay(genderValue) {
    const gender = genderValue ? genderValue.trim() : '';
    
    // Determine which image to use
    // Logic: If 'Female', use female image. Else (Male/Other/Null), use male image.
    const imagePath = (gender === 'Female') ? FEMALE_AVATAR : MALE_AVATAR;

    // 1. Update Large Profile Image (if it exists on this page)
    if (avatarPreview) {
        avatarPreview.src = imagePath;
    }

    // 2. Update Header Bubble Image (if it exists)
    if (headerAvatar) {
        headerAvatar.src = imagePath;
    }
}
// ==========================================
// 3. CORE FUNCTIONS
// ==========================================

// --- A. Fetch Data from API ---
async function loadProfileData() {
    try {
        // Replace with your actual API endpoint
        const response = await fetch('/customerprofile'); 
        
        if (!response.ok) throw new Error('Failed to load profile');
        const data = await response.json();

        // 1. Populate Form Fields
        document.getElementById('email').value = data.email || '';
        document.getElementById('fullName').value = data.name || '';
        document.getElementById('phone').value = data.phone || '';
        document.getElementById('city').value = data.city || ''; // Added City
        document.getElementById('address').value = data.address || '';
        const profileName = document.getElementById('profileName');
        if (profileName) profileName.textContent = data.name;
        const userGender = data.gender || 'Male';
        document.getElementById('gender').value = data.gender || '';
        document.getElementById('dateOfBirth').value = formatDate(data.date_of_birth);

        updateAvatarDisplay(userGender);

        // 2. Populate Header & Avatar
        if (headerProfileName) headerProfileName.textContent = data.name;
        
        // Handle Avatar (if API returns one, otherwise keep default)
        if (data.avtar_url) {
            if (avatarPreview) avatarPreview.src = data.avtar_url;
            if (headerProfileImg) headerProfileImg.src = data.avtar_url;
        }

    } catch (error) {
        console.error("Error loading profile:", error);
        // Fallback for demo purposes if API fails
        if(headerProfileName) headerProfileName.textContent = "Guest User";
    }
}
if (genderSelect) {
    genderSelect.addEventListener('change', (e) => {
        updateAvatarDisplay(e.target.value);
    });
}
// --- B. Toggle Edit/View Mode ---
function toggleEdit(enable) {
    if (enable) {
        profileCard.classList.add('edit-mode');
        formInputs.forEach(input => {
            if(input.id !== 'email') input.disabled = false;
        });
        btnEdit.classList.add('hidden');
        btnSave.classList.remove('hidden');
        btnCancel.classList.remove('hidden');
    } else {
        profileCard.classList.remove('edit-mode');
        formInputs.forEach(input => input.disabled = true);
        btnEdit.classList.remove('hidden');
        btnSave.classList.add('hidden');
        btnCancel.classList.add('hidden');
    }
}

// 2. Save Data (Triggered by button)
function saveData() {
    if(profileForm) profileForm.dispatchEvent(new Event('submit'));
}

// 3. Handle Form Submission
if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Create a simple JSON object
        const jsonData = {
            full_name: document.getElementById('fullName').value,
            phone: document.getElementById('phone').value,
            gender: document.getElementById('gender').value,
            date_of_birth: document.getElementById('dateOfBirth').value,
            city: document.getElementById('city').value,
            address: document.getElementById('address').value
        };

        try {
            const response = await fetch('/api/customerupdateprofile', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json' // Important for JSON
                },
                body: JSON.stringify(jsonData)
            });

            if (response.ok) {
                alert('Profile updated successfully!');
                toggleEdit(false);
            } else {
                alert('Failed to update profile.');
            }
        } catch (error) {
            console.error(error);
            alert('Error saving data.');
        }
    });
}

// --- Setup Header Dropdown Menu ---
function setupHeaderMenu() {
    if (profileBubble && profileMenuPopup) {
        profileBubble.addEventListener('click', (e) => {
            e.stopPropagation();
            profileMenuPopup.classList.toggle('open');
        });

        document.addEventListener('click', (e) => {
            if (!profileMenuPopup.contains(e.target) && !profileBubble.contains(e.target)) {
                profileMenuPopup.classList.remove('open');
            }
        });
    }
}