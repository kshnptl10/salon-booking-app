// public/js/profile.js

document.addEventListener('DOMContentLoaded', () => {

    // Helper function to set content safely
    const setContent = (id, value, fallback = '') => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value || fallback; 
        }
    };
async function loadLoggedUser() {
  try {
    const res = await fetch('/api/me');
    if (!res.ok) {
      // not logged in; optionally redirect to sign-in
      console.warn('Not authenticated (api/me)', res.status);
      return;
    }
    const user = await res.json();
    // element where you want to show name
    const nameEl = document.getElementById('profileName');
    if (nameEl && user.name) {
      nameEl.textContent = user.name;
    }

    // optionally show role
    const roleEl = document.getElementById('profileRole');
    if (roleEl && user.role) {
      roleEl.textContent = user.role;
    }
  } catch (err) {
    console.error('Error loading logged user', err);
  }
}

  loadLoggedUser();
  
    // --- Function to fetch and update static profile fields ---
    async function loadProfileData() {
        try {
            // Fetch session data and profile data concurrently (BEST PRACTICE)
            const [sessionRes, profileRes] = await Promise.all([
                fetch('/api/me'),
                fetch('/get-profile')
            ]);
            
            // Check for authentication failure
            if (!sessionRes.ok) {
                console.warn('Authentication failed during profile load. Redirecting...');
                // Optionally redirect to login page here if middleware failed
                return;
            }
            
            if (!profileRes.ok) {
                console.error('Failed to fetch detailed profile data. Status:', profileRes.status);
                return;
            }

            const sessionData = await sessionRes.json();
            const profileData = await profileRes.json();
            const { name, email, mobile, avatar_url, location } = profileData;
            const userRole = sessionData.role;
            const mainAvatar = document.getElementById('mainProfileAvatar');

            // 1. Update Static Display Fields (Name, Role, Contact)
            setContent('profile-full-name', name);
            setContent('profile-header-name', name);
            setContent('profile-mobile', mobile, 'N/A');
            setContent('profile-email', email);
            setContent('profile-location', location || 'Not specified');
            
            const displayRole = userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'User';
            setContent('profile-header-role', displayRole);

            // 2. Update Profile Picture on Initial Load
            if (mainAvatar) {
                 if (avatar_url) {
                    mainAvatar.src = avatar_url;
                } else {
                    // Fallback to the default image if no avatar_url is returned
                    mainAvatar.src = '../images/bruce-mars.jpg'; 
                }
            }

        } catch (error) {
            console.error('Error loading profile data:', error);
        }
    }
    
    // --- Load Data Initially ---
    loadProfileData(); 
    
    // --- 3. Modal Handler: Populate Fields on Show ---
    const editModal = document.getElementById('editProfileModal');
    
    if (editModal && window.bootstrap) {
        editModal.addEventListener('show.bs.modal', () => {
            const currentName = document.getElementById('profile-full-name')?.textContent;
            const currentMobile = document.getElementById('profile-mobile')?.textContent;
            const currentEmail = document.getElementById('profile-email')?.textContent;
            const currentLocation = document.getElementById('profile-location')?.textContent;

            // Populate the modal input fields
            document.getElementById('edit-name').value = currentName || '';
            document.getElementById('edit-mobile').value = currentMobile || '';
            document.getElementById('edit-email-display').value = currentEmail || ''; 
            document.getElementById('edit-location').value = currentLocation || '';
            document.getElementById('edit-avatar').value = '';
        });
    }

    // --- 4. Form Submission Handler: Save Changes to Backend ---
    const editForm = document.getElementById('edit-profile-form');
    
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            const updatedName = document.getElementById('edit-name').value;
            const updatedMobile = document.getElementById('edit-mobile').value;
            const avatarFile = document.getElementById('edit-avatar').files[0];
            const mainAvatar = document.getElementById('mainProfileAvatar');
            const updatedLocation = document.getElementById('edit-location').value;
            
            let updateSuccessful = true;
            
            // --- A. Update Text Fields (Name & Mobile) ---
            try {
                const textResponse = await fetch('/update-profile', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `name=${encodeURIComponent(updatedName)}&mobile=${encodeURIComponent(updatedMobile)}&location=${encodeURIComponent(updatedLocation)}`
                });

                if (!textResponse.ok) {
                    updateSuccessful = false;
                    alert(`Error updating profile text: ${await textResponse.text()}`);
                }
            } catch (error) {
                console.error('Text update network error:', error);
                updateSuccessful = false;
            }
            
            // --- B. Handle File Upload (Avatar) ---
            if (avatarFile) {
                const formData = new FormData();
                formData.append('avatar', avatarFile); 
                
                try {
                    const avatarResponse = await fetch('/api/me/avatar', {
                        method: 'POST',
                        body: formData
                    });

                    if (avatarResponse.ok) {
                        const data = await avatarResponse.json();
                        // CRITICAL: Update the main profile image source with the new URL
                        if (mainAvatar && data.avatar_url) {
                            mainAvatar.src = data.avatar_url;
                        }
                    } else {
                        // If avatar upload fails, mark overall update as failed and alert user
                        updateSuccessful = false; 
                        alert(`Error uploading avatar: ${await avatarResponse.text()}`);
                    }
                } catch (error) {
                    console.error('Avatar upload network error:', error);
                    updateSuccessful = false;
                }
            }
            
            // --- C. Final Status and Cleanup ---
            if (updateSuccessful) {
                // Update static display fields after successful saves
                document.getElementById('profile-full-name').textContent = updatedName;
                document.getElementById('profile-header-name').textContent = updatedName;
                document.getElementById('profile-mobile').textContent = updatedMobile;
                document.getElementById('profile-location').textContent = document.getElementById('edit-location').value;
                
                alert('Profile changes saved successfully!');
            }
            
            // Clear the file input and close modal
            document.getElementById('edit-avatar').value = ''; 
            const modalInstance = bootstrap.Modal.getInstance(editModal);
            if (modalInstance) {
                modalInstance.hide();
            }
        });
    }
});