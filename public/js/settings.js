document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
    document.getElementById('resetSettingsBtn').addEventListener('click', loadSettings); // Reset simply reloads DB data
});

async function loadSettings() {
    try {
        const response = await fetch('/api/admin/settings');
        const data = await response.json();

        // Populate Form Fields
        if (data) {
            document.getElementById('platformName').value = data.platform_name || '';
            document.getElementById('timezone').value = data.timezone || 'Asia/Kolkata';
            document.getElementById('currency').value = data.currency || 'INR';
            
            document.getElementById('advanceDays').value = data.advance_booking_days || 30;
            document.getElementById('allowCancel').value = data.allow_cancellation ? 'true' : 'false';
            document.getElementById('cancelWindow').value = data.cancellation_window_hours || 24;

            document.getElementById('paymentMode').value = data.payment_mode || 'Online & Cash';
            document.getElementById('taxPercent').value = data.tax_percentage || 0;
            document.getElementById('enableInvoices').value = data.enable_invoices ? 'true' : 'false';

            document.getElementById('emailNotif').value = data.email_notifications ? 'true' : 'false';
            document.getElementById('smsNotif').value = data.sms_notifications ? 'true' : 'false';
        }

    } catch (error) {
        console.error("Error loading settings:", error);
    }
}

async function saveSettings() {
    const btn = document.getElementById('saveSettingsBtn');
    btn.textContent = "Saving...";
    btn.disabled = true;

    const settingsData = {
        platform_name: document.getElementById('platformName').value,
        timezone: document.getElementById('timezone').value,
        currency: document.getElementById('currency').value,
        
        advance_booking_days: document.getElementById('advanceDays').value,
        allow_cancellation: document.getElementById('allowCancel').value === 'true',
        cancellation_window_hours: document.getElementById('cancelWindow').value,
        
        payment_mode: document.getElementById('paymentMode').value,
        tax_percentage: document.getElementById('taxPercent').value,
        enable_invoices: document.getElementById('enableInvoices').value === 'true',
        
        email_notifications: document.getElementById('emailNotif').value === 'true',
        sms_notifications: document.getElementById('smsNotif').value === 'true'
    };

    try {
        const response = await fetch('/api/admin/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settingsData)
        });

        const result = await response.json();

        if (response.ok) {
            alert("Settings updated successfully!");
        } else {
            alert("Error: " + result.message);
        }
    } catch (error) {
        console.error("Error saving settings:", error);
        alert("Failed to connect to server.");
    } finally {
        btn.textContent = "Save Settings";
        btn.disabled = false;
    }
}