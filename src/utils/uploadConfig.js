const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Configure how and where Multer saves files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // 1. Get the salon ID and category from the request
        // (You will pass these from your frontend form)
        const salonId = req.body.salon_id || '1';
        const category = req.body.category || 'staff'; // e.g., 'staff', 'services', 'gallery'

        // 2. Build the exact folder path
        // Example: public/images/salon_5/staff
        const rootDir = process.cwd();
        const dir = path.join(rootDir, 'public', 'images', `salon_${salonId}`, category);
       try { 
        // 3. Create the folder dynamically if it does NOT exist yet!
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true }); // recursive: true builds all necessary parent folders too
        }

        // 4. Tell Multer to save the file inside this directory
        cb(null, dir);
       } catch (err) {
        console.error("Error creating directory for file upload:", err);
        cb(err,null);
       }
    },
    filename: (req, file, cb) => {
        // 5. Give the file a unique name so it doesn't overwrite anything
        // Example: 16987654321-john-profile.jpg
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const cleanFileName = file.originalname.replace(/\s+/g, '-').toLowerCase(); // Removes spaces
        
        cb(null, uniqueSuffix + '-' + cleanFileName);
    }
});

// Create the upload middleware
const upload = multer({ storage: storage });

module.exports = upload;