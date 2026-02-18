
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// --- 1. CONFIGURATION ---

// Setup multer for avatar uploads
const upload = multer({
    dest: path.join(__dirname, '..', '..', 'public', 'uploads'),
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB Limit
});

const handleSignup = async (req, res, targetRole) => {
    const { username, email, password, name, mobile, salon_id } = req.body; 

    try {
        // --- 1. ROLE-SPECIFIC VALIDATION ---
        
        // Scenario A: Manager Signup
        // Managers MUST belong to a salon. Validation fails if salon_id is missing.
        if (targetRole === 'manager') {
            if (!salon_id) {
                return res.status(400).send("Error: Managers must be assigned to a Salon ID.");
            }
        }

        // --- 2. GET ROLE ID FROM DB ---
        const roleResult = await pool.query("SELECT id FROM roles WHERE role_name = $1", [targetRole]);
        if (roleResult.rows.length === 0) {
            return res.status(500).send(`Error: Role '${targetRole}' not configured in database.`);
        }
        const roleId = roleResult.rows[0].id;


        // --- 3. PREPARE DATA ---
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // For Admins, salon_id is NULL. For Managers, it is what they sent.
        const finalSalonId = (targetRole === 'manager') ? salon_id : null;


        // --- 4. INSERT USER ---
        await pool.query(
            `INSERT INTO users (username, email, password, name, mobile, role_id, salon_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [username, email, hashedPassword, name, mobile, roleId, finalSalonId]
        );

        // --- 5. RESPONSE ---
        if (targetRole === 'manager') {
            // Manager created via API (likely from Dashboard)
            return res.status(201).json({ message: "Manager created successfully" });
        } else {
            // Admin signed up publicly -> Redirect to login
            return res.redirect(`/sign-in?success=${encodeURIComponent("Account created! Please log in.")}`);
        }

    } catch (err) {
        console.error(`${targetRole} Signup Error:`, err);
        if (err.code === '23505') { 
            return res.status(409).send("Error: Username or Email already exists.");
        }
        res.status(500).send("Error registering user");
    }
};

exports.postAdminSignup = (req, res) => handleSignup(req, res, 'admin');

exports.createSalonManager = (req, res) => handleSignup(req, res, 'manager');

exports.postSuperadminSignup = (req, res) => handleSignup(req, res, 'superadmin');

exports.getAdminSignupPage = (req, res) => res.sendFile(path.join(__dirname, '../../public/signup_admin.html'));
exports.getSuperadminSignupPage = (req, res) => res.sendFile(path.join(__dirname, '../../public/signup_superadmin.html'));

exports.getSignInPage = (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/manager/sign-in.html'));
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Fetch User (Including salon_id and role_name)
        const query = `
            SELECT u.id, u.password, u.name, u.salon_id, r.role_name 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.email = $1`;
            
        const result = await pool.query(query, [email]);

        if (result.rows.length === 0) {
            return res.send('Invalid email or password. <a href="/sign-in">Go Back</a>');
        }

        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.send('Invalid email or password. <a href="/sign-in">Go Back</a>');
        }

        // 2. Set Session
        req.session.userId = user.id;
        req.session.userName = user.name || '';
        req.session.userRole = user.role_name; 
        
        // Critical: Ensure Managers get their salon_id saved
        req.session.salonId = user.salon_id || null; 

        // 3. Define Redirects
        const redirectMap = {
            'superadmin': '/superadmin-dashboard',
            'admin': '/admin/dashboard',  
            'manager': '/dashboard' 
        };

        // 4. Redirect Logic
        // Checks the map. If role exists, go there. If not (e.g. customer), go to customer dash.
        const targetUrl = redirectMap[user.role_name] || '/manager/dashboard';
        
        res.redirect(targetUrl);

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).send('Error occurred during login.');
    }
};
exports.createSalonManager = async (req, res) => {
    // 1. SECURITY CHECK: Only Superadmin can perform this action
    if (!req.session || req.session.userRole !== 'superadmin') {
        return res.status(403).json({ message: "Unauthorized: Only Super Admin can create managers." });
    }

    const { username, email, password, name, mobile, salon_id } = req.body;

    // 2. Validation
    if (!salon_id) {
        return res.status(400).json({ message: "Salon selection is required." });
    }

    try {
        // 3. Check if Admin role exists
        const roleRes = await pool.query("SELECT id FROM roles WHERE role_name = 'admin'");
        if (roleRes.rows.length === 0) return res.status(500).json({ message: "Role configuration error" });
        const adminRoleId = roleRes.rows[0].id;

        // 4. Check for duplicates
        const userCheck = await pool.query("SELECT id FROM users WHERE email = $1 OR username = $2", [email, username]);
        if (userCheck.rows.length > 0) {
            return res.status(409).json({ message: "Username or Email already exists." });
        }

        // 5. Hash Password & Insert
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await pool.query(
            `INSERT INTO users (username, email, password, name, mobile, role_id, salon_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [username, email, hashedPassword, name, mobile, adminRoleId, salon_id]
        );

        res.status(201).json({ message: "Manager created successfully!" });

    } catch (err) {
        console.error("Create Manager Error:", err);
        res.status(500).json({ message: "Server Error creating manager" });
    }
};

exports.logoutUser = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Logout Error:", err);
            return res.status(500).json({ message: "Logout failed" });
        }
        
        res.clearCookie('connect.sid'); // Clear the session cookie
        
        // Respond with JSON, NOT redirect
        res.json({ message: "Logout successful" }); 
    });
};

// --- 3. CUSTOMER AUTHENTICATION ---
exports.signupCustomer = async (req, res) => {
    const { name, email, password, phone } = req.body;

    try {
        // Check existing email
        const existing = await pool.query('SELECT 1 FROM customers WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ message: "Email already registered." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO customers (name, email, password, phone) VALUES ($1, $2, $3, $4)',
            [name, email, hashedPassword, phone]
        );

        res.status(201).json({ success: true, message: "Registration successful! Please log in." });

    } catch (err) {
        console.error("Customer Signup Error:", err);
        res.status(500).json({ message: "Error signing up. Please try again." });
    }
};

exports.loginCustomer = async (req, res) => {
    const { email, password } = req.body;
    
    const isApiRequest = req.headers.accept === 'application/json'|| req.headers['content-type'] === 'application/json';
    
    try {
        const result = await pool.query('SELECT id, password, name FROM customers WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            if (isApiRequest) return res.status(401).json({ message: "Invalid credentials" });
            return res.send('Invalid email or password. <a href="/c_login">Go Back</a>');
        }

        const customer = result.rows[0];
        const match = await bcrypt.compare(password, customer.password);

        if (!match) {

            if (isApiRequest) return res.status(401).json({ message: "Invalid credentials" });
            return res.send('Invalid email or password. <a href="/c_login">Go Back</a>');
        }

        // Set Session
        req.session.userId = customer.id;
        req.session.userName = customer.name || '';
        req.session.userRole = 'customer';

      if (isApiRequest) {
            // ✅ Send JSON for Android
            return res.status(200).json({ 
                success: true, 
                user: { id: customer.id, name: customer.name } 
            });
        }

        res.redirect('/c_dashboard');

    } catch (err) {
        console.error("Customer Login Error:", err);
        if (isApiRequest) return res.status(500).json({ error: "Server error" });
        res.status(500).send('Error occurred during login.');
    }
};

exports.logoutCustomer = (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error("Customer Logout Error:", err);
        res.clearCookie('connect.sid');
        res.redirect('/c_login');
    });
};

exports.getMe = (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json({
        id: req.session.userId,
        name: req.session.userName || null,
        role: req.session.userRole || null
    });
};

// Admin Profile
exports.getProfile = async (req, res) => {
    try {
        const userId = req.session.userId || req.query.userId;

        if (!userId) return res.status(401).send("Unauthorized");

        const result = await pool.query(
            "SELECT name, email, mobile, location, avatar_url FROM users WHERE id = $1", 
            [userId]
        );

        if (result.rows.length === 0) return res.status(404).send("User not found");
        res.json(result.rows[0]);

    } catch (err) {
        console.error("Get Profile Error:", err);
        res.status(500).send("Error fetching profile");
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.status(401).send("Unauthorized");

        const { name, mobile, location } = req.body;
        await pool.query(
            "UPDATE users SET name=$1, mobile=$2, location=$3 WHERE id=$4", 
            [name, mobile, location, userId]
        );
        res.send("Profile updated successfully");

    } catch (err) {
        console.error("Update Profile Error:", err);
        res.status(500).send("Error updating profile");
    }
};

// Customer Profile
// exports.getCustomerProfile = async (req, res) => {
//     try {
//         const userId = req.session.userId;
//         if (!userId) return res.status(401).send("Unauthorized");

//         const result = await pool.query(
//             "SELECT name, email, phone, gender, date_of_birth, address, city, avatar_url FROM customers WHERE id = $1",
//             [userId]
//         );

//         if (result.rows.length === 0) return res.status(404).send("User not found");
//         res.json(result.rows[0]);

//     } catch (err) {
//         console.error("Get Customer Profile Error:", err);
//         res.status(500).send("Error fetching profile");
//     }
// };

exports.getCustomerProfile = async (req, res) => {
    try {
        // 🚀 Fix: Accept userId from session OR query string
        const userId = req.session.userId || req.query.userId;
        
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized - No ID provided" });
        }

        const result = await pool.query(
            "SELECT name, email, phone, gender, to_char(date_of_birth, 'YYYY-MM-DD') as date_of_birth, address, city, avatar_url FROM customers WHERE id = $1",
            [userId]
        );

        if (result.rows.length === 0) return res.status(404).send("User not found");
        
        // Return JSON
        res.json(result.rows[0]);

    } catch (err) {
        console.error("Get Customer Profile Error:", err);
        res.status(500).send("Error fetching profile");
    }
};

exports.updateCustomerProfile = async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.status(401).send("Unauthorized");

        let { full_name, phone, gender, date_of_birth, address, city } = req.body;

        // Handle empty date string
        const dob = date_of_birth === "" ? null : date_of_birth;

        await pool.query(
            "UPDATE customers SET name=$1, phone=$2, gender=$3, date_of_birth=$4, address=$5, city=$6 WHERE id=$7",
            [full_name, phone, gender, dob, address, city, userId]
        );

        res.json({ message: "Profile updated successfully" });

    } catch (err) {
        console.error("Update Customer Profile Error:", err);
        res.status(500).send("Error updating profile");
    }
};

// Avatar Upload (Works for both if they share the 'users' table or if logic handles both)
// NOTE: This currently updates the 'users' table. If customers have avatars, you need conditional logic here.
exports.uploadAvatar = [
    upload.single('avatar'),
    async (req, res) => {
        try {
            if (!req.session || !req.session.userId) return res.status(401).send('Not authenticated');
            if (!req.file) return res.status(400).send('No file uploaded');

            const publicUrl = `/uploads/${req.file.filename}`;
            const userId = req.session.userId;
            const role = req.session.userRole;

            // Determine which table to update based on role
            const table = role === 'customer' ? 'customers' : 'users';

            await pool.query(`UPDATE ${table} SET avatar_url = $1 WHERE id = $2`, [publicUrl, userId]);

            res.json({ avatar_url: publicUrl });
        } catch (err) {
            console.error('Avatar upload error', err);
            res.status(500).send('Server error');
        }
    }
];

// --- 5. PASSWORD RECOVERY ---
const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: 'kshnptl10@gmail.com',
        pass: 'yoyqsbuulvocordk' 
    }
});

exports.resetPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    try {
        // 1. Check if user exists
        const userResult = await pool.query('SELECT * FROM customers WHERE email = $1', [email]);
        
        if (userResult.rows.length === 0) {
            // SECURITY TIP: Don't reveal if email exists or not. Fake a success.
            return res.json({ message: "If that email exists, we have sent a reset link." });
        }

        // 2. Generate Token (Random 40-char string)
        const token = crypto.randomBytes(20).toString('hex');
        
        // 3. Set Expiration (e.g., 1 hour from now)
        // PostgreSQL syntax: NOW() + interval '1 hour'
        await pool.query(
            `UPDATE customers 
             SET reset_token = $1, reset_expires = NOW() + INTERVAL '1 hour' 
             WHERE email = $2`,
            [token, email]
        );

        // 4. Send Email
        // CHANGE THIS URL to match your website's actual address
        const resetUrl = `http://localhost:3000/customer/reset-password.html?token=${token}`;

        const mailOptions = {
            from: 'BookNStyle Support <no-reply@booknstyle.com>',
            to: email,
            subject: 'Password Reset Request',
            html: `
                <h3>Reset Your Password</h3>
                <p>You requested a password reset. Click the link below to set a new password:</p>
                <a href="${resetUrl}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
                <p>This link expires in 1 hour.</p>
                <p>If you did not request this, please ignore this email.</p>
            `
        };

        await transporter.sendMail(mailOptions);

        res.json({ message: "Reset link sent to your email." });

    } catch (err) {
        console.error("Forgot Password Error:", err);
        res.status(500).json({ message: "Server error sending email" });
    }
};

exports.setNewPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ message: "Missing token or password." });
    }

    try {
        // Hashing
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // --- DIAGNOSTIC QUERY: DOES THE TOKEN EVEN EXIST? ---
        const checkUser = await pool.query(
            `SELECT id, email, reset_token, reset_expires FROM customers WHERE reset_token = $1`, 
            [token]
        );

        if (checkUser.rows.length === 0) {
            return res.status(400).json({ message: "Invalid token (Not found)." });
        }

        const user = checkUser.rows[0];
        // Check Expiry Manually to see if that's the issue
        if (new Date() > new Date(user.reset_expires)) {
            return res.status(400).json({ message: "Token has expired." });
        }

        // --- THE ACTUAL UPDATE ---
        // ⚠️ Verify your column name is correct ('password' or 'pass_hash'?)
        const updateResult = await pool.query(
            `UPDATE customers 
             SET password = $1, reset_token = NULL, reset_expires = NULL 
             WHERE id = $2`, 
            [hashedPassword, user.id]
        );

        if (updateResult.rowCount === 1) {
            res.json({ message: "Password updated successfully." });
        } else {
            res.status(500).json({ message: "Update failed." });
        }

    } catch (err) {
        res.status(500).json({ message: "Server error." });
    }
};