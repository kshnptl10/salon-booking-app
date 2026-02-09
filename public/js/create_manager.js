document.addEventListener("DOMContentLoaded", async () => {

const form = document.getElementById('createManagerForm');
const salonSelect = document.getElementById('salonSelect');
const statusMsg = document.getElementById('statusMessage');

  // 1. Initialize Material Inputs (Float labels)
        const inputs = document.querySelectorAll('.form-control');
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                this.parentElement.classList.add('is-focused');
            });
            input.addEventListener('focusout', function() {
                if(this.value != ""){
                    this.parentElement.classList.add('is-filled');
                } else {
                    this.parentElement.classList.remove('is-focused');
                }
            });
        });

        // 2. Fetch Salons for Dropdown

        try {
            const response = await fetch('/api/admin/salons');
            if (response.ok) {
                const salons = await response.json();
                salonSelect.innerHTML = '<option value="" disabled selected>Select a Salon</option>';
                salons.forEach(salon => {
                    const option = document.createElement('option');
                    option.value = salon.salon_id;
                    option.textContent = salon.salon_name;
                    option.style.color = "black";
                    salonSelect.appendChild(option);
                });
            } else {
                salonSelect.innerHTML = '<option value="" disabled>Error loading salons</option>';
                console.error("Failed to fetch salons");
            }
        } catch (err) {
            console.error("Network Error:", err);
            salonSelect.innerHTML = '<option value="" disabled>Network Error</option>';
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // UI Feedback: Loading
            const btn = form.querySelector('button[type="submit"]');
            const originalBtnText = btn.innerText;
            btn.innerText = "Processing...";
            btn.disabled = true;
            statusMsg.style.display = 'none';

            // Gather Data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/api/admin/create-manager', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                statusMsg.style.display = 'block';
                
                if (response.ok) {
                    statusMsg.innerText = "Manager created successfully!";
                    statusMsg.className = "text-center text-sm mb-2 text-success font-weight-bold";
                    form.reset();
                    // Reset Material Input styles
                    document.querySelectorAll('.input-group').forEach(group => group.classList.remove('is-filled', 'is-focused'));
                } else {
                    statusMsg.innerText = result.message || "Error creating manager.";
                    statusMsg.className = "text-center text-sm mb-2 text-danger font-weight-bold";
                }

            } catch (err) {
                statusMsg.style.display = 'block';
                statusMsg.innerText = "Server connection error.";
                statusMsg.className = "text-center text-sm mb-2 text-danger font-weight-bold";
            } finally {
                btn.innerText = originalBtnText;
                btn.disabled = false;
            }
        });
});