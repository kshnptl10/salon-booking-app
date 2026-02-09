const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}))

// PostgreSQL Pool
const pool = new Pool({
    user: 'postgres',       // replace with your PostgreSQL username
    host: 'localhost',
    database: 'salon_booking',   // replace with your DB name
    password: 'K!shan08', // replace with your PostgreSQL password
    port: 5432
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

// --- Session Configuration ---
app.use(session({
    secret: 'your_strong_secret_key_here', // Used to sign the session ID cookie
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something is stored
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // Use 'true' in production with HTTPS
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
}));

// Routes for signup pages
app.get('/signup/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup_admin.html'));
});


app.get('/signup/superadmin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup_superadmin.html'));
});

// POST route for Admin signup
app.post('/signup/admin', async (req, res) => {
    await handleSignup(req, res, 'admin');
});
// POST route for Superadmin signup
app.post('/admin-signup', async (req, res) => {
  const { username, email, password, name, mobile } = req.body;

  try {
    // Check if a superadmin already exists
    const superAdminExists = await pool.query(
      "SELECT * FROM users WHERE role_id = (SELECT id FROM roles WHERE role_name = 'superadmin')"
    );

    let roleName = 'admin'; // default role
    if (superAdminExists.rows.length === 0) {
      // If no superadmin exists, assign first signup as superadmin
      roleName = 'superadmin';
    }

    // Get role id
    const roleResult = await pool.query("SELECT id FROM roles WHERE role_name = $1", [roleName]);
    const roleId = roleResult.rows[0].id;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new admin with decided role
    await pool.query(
      'INSERT INTO users (username, email, password, name, mobile, role_id) VALUES ($1, $2, $3, $4, $5, $6)',
            [username, email, hashedPassword, name, mobile, roleId]
    );

    res.redirect(`/sign-in.html?success=${encodeURIComponent(roleName + " registered successfully")}`);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error registering admin");
  }
});



// ✅ Signup for Customer
app.post('/signup-customer', async (req, res) => {
  const { name, email, password, phone } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Assuming role table has id=3 for Customer
    await pool.query(
      'INSERT INTO customers (name, email, password, phone) VALUES ($1, $2, $3, $4)',
      [name, email, hashedPassword, phone]
    );
    res.send("Customer registered successfully! <a href='/login.html'>Login</a>");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error signing up Customer");
  }
});

// Serve login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Handle login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const userResult = await pool.query(
            'SELECT a.id, a.username, a.password, r.role_name,a.name FROM users a JOIN roles r ON a.role_id = r.id WHERE email=$1',
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.send('Invalid email or password. <a href="/sign-in.html">Go Back</a>');
        }

        const user = userResult.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.send('Invalid email or password. <a href="/sign-in.html">Go Back</a>');
        }

        // Save minimal user info to session
        req.session.userId = user.id;
        req.session.userName = user.name || user.name || '';
        req.session.userRole = user.role_name;

        // Redirect based on role
        if (user.role_name === 'superadmin') {
            res.redirect(`/superadmin-dashboard.html`);
        } else {
            res.redirect(`/dashboard.html`);
        }

    } catch (err) {
        console.error(err);
        res.send('Error occurred during login.');
    }
});

// GET /api/me - return minimal logged-in user info
app.get('/api/me', (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  res.json({
    id: req.session.userId,
    name: req.session.userName || null,
    role: req.session.userRole || null
  });
});

const multer = require('multer');
const upload = multer({
  dest: path.join(__dirname, 'public', 'uploads'), // store in public/uploads
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB max
});

// POST /api/me/avatar
app.post('/api/me/avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.session || !req.session.userId) return res.status(401).send('Not authenticated');

    if (!req.file) return res.status(400).send('No file uploaded');

    // build public url to file (adjust if your static route differs)
    const publicUrl = `/uploads/${req.file.filename}`;

    // update user's avatar url in DB; assume users table has avatar_url column
    await pool.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [publicUrl, req.session.userId]);

    res.json({ avatar_url: publicUrl });
  } catch (err) {
    console.error('Avatar upload error', err);
    res.status(500).send('Server error');
  }
});

// ---------------- Admin DASHBOARD STATS ----------------
app.get('/api/sales/today', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) AS today_sales
      FROM appointments
      WHERE (payment_status = 'Paid' OR status = 'Completed')
        AND appointment_date = CURRENT_DATE
    `);

    res.json({ todaySales: parseFloat(result.rows[0].today_sales) || 0 });
  } catch (err) {
    console.error("Error fetching today's sales", err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// GET total sales for the current month
app.get('/api/sales/month', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) AS month_sales
      FROM appointments
      WHERE (payment_status = 'Paid' OR status = 'Completed')
        AND DATE_TRUNC('month', appointment_date) = DATE_TRUNC('month', CURRENT_DATE)
    `);

    res.json({ monthSales: parseFloat(result.rows[0].month_sales) || 0 });
  } catch (err) {
    console.error("Error fetching month sales", err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// GET total completed appointments for this month
app.get('/api/appointments/completed-month', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) AS completed_count
      FROM appointments
      WHERE status = 'Completed'
        AND DATE_TRUNC('month', appointment_date) = DATE_TRUNC('month', CURRENT_DATE)
    `);

    res.json({ completedThisMonth: parseInt(result.rows[0].completed_count) || 0 });
  } catch (err) {
    console.error("Error fetching completed appointments for month", err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// GET total pending appointments for this month
app.get('/api/appointments/pending-month', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) AS pending_count
      FROM appointments
      WHERE status = 'Pending'
        AND DATE_TRUNC('month', appointment_date) = DATE_TRUNC('month', CURRENT_DATE)
    `);

    res.json({ pendingThisMonth: parseInt(result.rows[0].pending_count, 10) || 0 });
  } catch (err) {
    console.error("Error fetching pending appointments for month", err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// GET percentage change: this week vs last week
// GET only percentage change between this period (today) and previous (yesterday)
app.get('/api/sales/today-percent', async (req, res) => {
  try {
    const todayRes = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) AS today_sales
      FROM appointments
      WHERE (payment_status = 'Paid' OR status = 'Completed')
        AND appointment_date = CURRENT_DATE
    `);

    const yesterdayRes = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) AS yesterday_sales
      FROM appointments
      WHERE (payment_status = 'Paid' OR status = 'Completed')
        AND appointment_date = (CURRENT_DATE - INTERVAL '1 day')
    `);

    const today = parseFloat(todayRes.rows[0].today_sales) || 0;
    const yesterday = parseFloat(yesterdayRes.rows[0].yesterday_sales) || 0;

    let percent = 0;

    if (yesterday === 0 && today === 0) {
      percent = 0;
    } else if (yesterday === 0 && today > 0) {
      // from 0 to >0 — define as +100 (you could use null or Infinity if preferred)
      percent = 100;
    } else {
      // regular percent change (signed)
      percent = ((today - yesterday) / Math.abs(yesterday)) * 100;
    }

    // send numeric value (signed), two decimals
    res.json({ percent: Number(percent.toFixed(2)) });

  } catch (err) {
    console.error("Error calculating percentage change", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// GET percentage change: this month vs last month
app.get('/api/sales/month-percent', async (req, res) => {
  try {
    // This month
    const thisMonthRes = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) AS this_month
      FROM appointments
      WHERE (payment_status = 'Paid' OR status = 'Completed')
        AND DATE_TRUNC('month', appointment_date) = DATE_TRUNC('month', CURRENT_DATE)
    `);

    // Last month
    const lastMonthRes = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) AS last_month
      FROM appointments
      WHERE (payment_status = 'Paid' OR status = 'Completed')
        AND DATE_TRUNC('month', appointment_date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    `);

    const thisMonth = parseFloat(thisMonthRes.rows[0].this_month);
    const lastMonth = parseFloat(lastMonthRes.rows[0].last_month);

    let percent = 0;

    if (lastMonth === 0 && thisMonth === 0) {
      percent = 0;
    } else if (lastMonth === 0 && thisMonth > 0) {
      percent = 100; // define growth from zero; change if needed
    } else {
      percent = ((thisMonth - lastMonth) / Math.abs(lastMonth)) * 100;
    }

    res.json({ percent: Number(percent.toFixed(2)) });

  } catch (err) {
    console.error("Error calculating month percent change", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all admins
app.get('/api/admins', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.mobile, r.role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE r.role_name = 'admin';`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching admins' });
  }
});

// Delete admin
app.delete('/api/admins/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(`DELETE FROM users WHERE id = $1 AND role_id = 2`, [id]);
    res.json({ message: 'Admin deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting admin' });
  }
});

// Get profile info
app.get('/get-profile', async (req, res) => {
  try {
    const userId = req.session.adminId || req.session.customerId;
    if (!userId) return res.status(401).send("Unauthorized");

    const result = await pool.query("SELECT name, email, mobile FROM users WHERE id = $1", [userId]);
    if (result.rows.length === 0) return res.status(404).send("User not found");

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching profile");
  }
});

// Update profile info
app.post('/update-profile', async (req, res) => {
  try {
    const userId = req.session.adminId || req.session.customerId;
    if (!userId) return res.status(401).send("Unauthorized");

    const { name, mobile } = req.body;
    await pool.query("UPDATE users SET name=$1, mobile=$2 WHERE id=$3", [name, mobile, userId]);
    res.send("Profile updated successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating profile");
  }
});

// Logout Route
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
      return res.redirect('/superadmin-dashboard.html'); // or admin-dashboard.html
    }
    res.clearCookie('connect.sid'); // clear session cookie
    res.redirect('/sign-in.html'); // redirect to login page
  });
});

// ---------------- TODAY BOOKED APPOINTMENTS ----------------
app.get("/api/today-appointments", async (req, res) => {
  const result = await pool.query(`
    SELECT 
    a.id,
    c.name AS customer_name,
    c.email,
    s.name AS service_name,
    st.name AS staff_name,
    a.appointment_date,
    a.appointment_time,
    a.status
FROM appointments a
JOIN customers c ON a.customer_id = c.id
JOIN services s ON a.service_id = s.id
LEFT JOIN staff st ON a.staff_id = st.id
WHERE a.appointment_date = CURRENT_DATE
ORDER BY a.appointment_date, a.appointment_time
  `);
  res.json(result.rows);
});

// ---------------- THIS MONTH BOOKED APPOINTMENT  ----------------
app.get("/api/this-month-appointments", async (req, res) => {
  const result = await pool.query(`
    SELECT 
    a.id,
    c.name AS customer_name,
    c.email,
    s.name AS service_name,
    st.name AS staff_name,
    a.appointment_date,
    a.appointment_time,
    a.status
FROM appointments a
JOIN customers c ON a.customer_id = c.id
JOIN services s ON a.service_id = s.id
LEFT JOIN staff st ON a.staff_id = st.id
WHERE DATE_TRUNC('month', a.appointment_date) = DATE_TRUNC('month', CURRENT_DATE)
ORDER BY a.appointment_date, a.appointment_time
  `);
  res.json(result.rows);
});

// Update appointment status
app.patch("/api/appointments/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

 if (!status) {
    return res.status(400).json({ success: false, message: "Status is required" });
  }

  try {
  // Update in database
  await pool.query("UPDATE appointments SET status = $1 WHERE id = $2", [status, id]);
  res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error updating status" });
  }
});

// ---------------- STAFF CRUD ----------------
app.get("/api/staff", async (req, res) => {
  const result = await pool.query("SELECT * FROM staff ORDER BY id");
  res.json(result.rows);
});

app.post("/api/staff", async (req, res) => {
  const { name, email, phone, is_available } = req.body;
  await pool.query("INSERT INTO staff (name, email, phone, is_available) VALUES ($1,$2,$3,$4)", [name,email,phone,is_available]);
  res.sendStatus(200);
}); 
app.put("/api/staff/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, is_available } = req.body;
  await pool.query("UPDATE staff SET name=$1, email=$2, phone=$3, is_available=$4 WHERE id=$5", [name, email, phone, is_available, id]);
  res.sendStatus(200);
}); 
app.delete("/api/staff/:id", async (req, res) => {
  const { id } = req.params;
  await pool.query("DELETE FROM staff WHERE id=$1", [id]);
  res.sendStatus(200);
});

// ---------------- SERVICES CRUD ----------------
app.get("/api/services", async (req, res) => {
  const result = await pool.query("SELECT * FROM services ORDER BY id");
  res.json(result.rows);
});

app.post("/api/services", async (req, res) => {
  const { name, description, duration, price } = req.body;
  await pool.query("INSERT INTO services (name, description, duration_minutes, price) VALUES ($1,$2,$3,$4)", [name,description,duration,price]);
  res.sendStatus(200);
});

app.put("/api/services/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description, duration, price } = req.body;
  await pool.query("UPDATE services SET name=$1, description=$2, duration_minutes=$3, price=$4 WHERE id=$4", [name, description, duration, id]);
  res.sendStatus(200);
});

app.delete("/api/services/:id", async (req, res) => {
  const { id } = req.params;
  await pool.query("DELETE FROM services WHERE id=$1", [id]);
  res.sendStatus(200);
  
});

// ---------------- TIME SLOTS CRUD ----------------
app.get("/api/timeslots", async (req, res) => {
  const result = await pool.query(`
    SELECT t.id, t.staff_id, t.slot_time, t.is_available, s.name as staff_name
    FROM time_slots t
    JOIN staff s ON t.staff_id = s.id
    ORDER BY t.id
  `);
  res.json(result.rows);
});

app.post("/api/timeslots", async (req, res) => {
  const { staff_id, slot_time } = req.body;
  await pool.query("INSERT INTO time_slots (staff_id, slot_time, is_available) VALUES ($1,$2,true)", [staff_id, slot_time]);
  res.sendStatus(200);
});

app.put("/api/timeslots/:id", async (req, res) => {
  const { id } = req.params;
  const { staff_id, slot_time, is_available } = req.body;
  await pool.query("UPDATE time_slots SET staff_id=$1, slot_time=$2, is_available=$3 WHERE id=$4", [staff_id, slot_time, is_available, id]);
  res.sendStatus(200);
});

app.delete("/api/timeslots/:id", async (req, res) => {
  const { id } = req.params;
  await pool.query("DELETE FROM time_slots WHERE id=$1", [id]);
  res.sendStatus(200);
});

///----------------- Customer Dashboard ----------------

// --- 1. Get Nearby Salons ---
app.get('/api/salons', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT salon_id, salon_name, address, city, rating, image_url
      FROM salons
      WHERE is_active = TRUE
      ORDER BY rating DESC
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- 2. Get Services for Dashboard ---
app.get('/api/services/:salonId', async (req, res) => {
  try {
    const { salonId } = req.params;
    const result = await pool.query(`
      SELECT id, salon_id, name, price
      FROM services
      WHERE is_active = TRUE AND salon_id = $1
      ORDER BY id ASC
      LIMIT 10
    `, [salonId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- 3. Get Customer Appointments ---
app.get('/api/appointments/:customerId', async (req, res) => {
  const { customerId } = req.params;
  try {
    const result = await pool.query(`
      SELECT a.id, a.appointment_date, a.appointment_time, a.status,
             s.salon_name, sv.name, st.name
      FROM appointments a
      JOIN salons s ON a.salon_id = s.salon_id
      JOIN services sv ON a.service_id = sv.id
      LEFT JOIN staff st ON a.staff_id = st.id
      WHERE a.customer_id = $1
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `, [customerId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- 4. Recommended Services (mock example) ---
app.get('/api/recommended/:customerId', async (req, res) => {
  try {
    // Simple mock: Top 5 services by popularity
    const result = await pool.query(`
      SELECT id, name, price
      FROM services
      WHERE is_active = TRUE
      ORDER BY id ASC
      LIMIT 5
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ---  Create a new appointment ---
app.post('/api/appointments', async (req, res) => {
  try {
    const { customer_id, salon_id, service_id, staff_id, appointment_date, appointment_time, notes } = req.body;

    // Get price from service
    const serviceRes = await pool.query(
      'SELECT price FROM services WHERE service_id = $1',
      [service_id]
    );

    if (serviceRes.rows.length === 0) {
      return res.status(400).json({ msg: 'Service not found' });
    }

    const price = serviceRes.rows[0].price;

    const insertRes = await pool.query(
      `INSERT INTO appointments (customer_id, salon_id, service_id, staff_id, appointment_date, appointment_time, total_amount, status, payment_status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'Pending','Unpaid',$8) RETURNING *`,
      [customer_id, salon_id, service_id, staff_id || null, appointment_date, appointment_time, price, notes || '']
    );

    res.json({ msg: 'Appointment booked successfully', appointment: insertRes.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- 6. Get available staff for a salon ---
app.get('/api/staff/:salonId', async (req, res) => {
  const { salonId } = req.params;   
  try {
    const result = await pool.query(
      `SELECT id, name
       FROM staff
       WHERE salon_id = $1 AND is_available = TRUE
       ORDER BY name ASC`,
      [salonId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const { user_id, salon_id, service_id, staff_id, date, time } = req.body;
    // For simplicity, assuming user_id is customer_id
    const customer_id = user_id;
    const appointment_date = date;
    const appointment_time = time;
    // Get price from service
    const serviceRes = await pool.query(
      'SELECT price FROM services WHERE id = $1',
      [service_id]
    );
    if (serviceRes.rows.length === 0) {
      return res.status(400).json({ msg: 'Service not found' });
    }
    const price = serviceRes.rows[0].price;
    const insertRes = await pool.query(
      `INSERT INTO appointments (customer_id, salon_id, service_id, staff_id, appointment_date, appointment_time, total_amount, status, payment_status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,'Pending','Unpaid') RETURNING *`,
      [customer_id, salon_id, service_id, staff_id, appointment_date, appointment_time, price]
    );
    res.json({ msg: 'Appointment booked successfully', appointment: insertRes.rows[0] });
  }
  catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
function formatTime(timeStr) {
  const time = new Date(`1970-01-01T${timeStr}Z`);
  return time.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

app.set('view engine', 'ejs'); // Example: using EJS template engine
app.set('views', './views');

// ---------------- START SERVER ----------------
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
