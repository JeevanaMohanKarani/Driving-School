const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
// const fs = require('fs'); // REMOVE: No longer needed for local file system operations
// const path = require('path'); // REMOVE: No longer needed for local file system operations

// --- Firebase Admin SDK Imports and Initialization ---
const admin = require('firebase-admin');

// Ensure you set these environment variables on Render!
// The private key needs special handling for newlines when read from env var.
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Crucial for multi-line private key
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL
    })
});

const db = admin.firestore(); // Get a reference to the Firestore database
const reviewsCollection = db.collection('reviews'); // Reference to your 'reviews' collection
// --- End Firebase Setup ---

const app = express();
const port = process.env.PORT || 3000;

// ===== Middleware =====
// Serve static files from the 'public' directory
app.use(express.static('public'));
// Parse URL-encoded bodies (for form data)
app.use(bodyParser.urlencoded({ extended: true }));
// Use express-ejs-layouts middleware
app.use(expressLayouts);

// --- CRITICAL MODIFICATION: Make 'req' available to all EJS templates via res.locals ---
app.use((req, res, next) => {
    res.locals.req = req; // Expose the 'req' object to all EJS templates
    next(); // Pass control to the next middleware or route handler
});
// --- END OF CRITICAL MODIFICATION ---

// ===== View Engine Setup =====
app.set('view engine', 'ejs'); // Set EJS as the template engine
app.set('views', 'views'); // Views directory is relative to app.js, 'views' is fine
app.set('layout', 'layout'); // Set 'layout.ejs' as the default layout for all views

// ===== Helper functions for reviews are REMOVED as Firebase handles this =====
// function loadReviews() { ... }
// function saveReview(newReview) { ... }


// ===== GET: Home Page (Updated to fetch latest reviews from Firestore) =====
app.get('/', async (req, res) => {
    try {
        // Fetch the 2 latest reviews, ordered by timestamp descending
        const snapshot = await reviewsCollection.orderBy('timestamp', 'desc').limit(2).get();
        const latestReviews = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Convert Firestore Timestamp to a readable format if needed for display
            // If timestamp might be null (e.g., old reviews without it), handle that
            data.timestamp = data.timestamp ? data.timestamp.toDate().toISOString() : new Date().toISOString(); // Default to current if missing
            latestReviews.push(data);
        });
        res.render('index', { latestReviews: latestReviews });
    } catch (error) {
        console.error("❌ Error fetching latest reviews from Firestore:", error);
        res.render('index', { latestReviews: [] }); // Render with empty array on error
    }
});

// ===== GET: Separate Reviews Page (Displays all reviews from Firestore) =====
app.get('/reviews', async (req, res) => {
    try {
        // Fetch all reviews, ordered by timestamp descending
        const snapshot = await reviewsCollection.orderBy('timestamp', 'desc').get();
        const allReviews = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Convert Firestore Timestamp to a readable format if needed for display
            data.timestamp = data.timestamp ? data.timestamp.toDate().toISOString() : new Date().toISOString(); // Default to current if missing
            allReviews.push(data);
        });
        res.render('reviews', { reviews: allReviews });
    } catch (error) {
        console.error("❌ Error fetching all reviews from Firestore:", error);
        res.render('reviews', { reviews: [] }); // Render with empty array on error
    }
});

// ===== Anchor Redirects (remain unchanged) =====
app.get('/about', (req, res) => res.redirect('/#about'));
app.get('/courses', (req, res) => res.redirect('/#courses'));
app.get('/gallery', (req, res) => res.redirect('/#gallery'));
app.get('/contact', (req, res) => res.redirect('/#contact'));

// ===== POST: Submit Review (Updated to save to Firestore) =====
app.post('/submit-review', async (req, res) => { // Made async
    const { name, rating, comment } = req.body;

    if (name && rating && comment) {
        try {
            const newReview = {
                name: name.trim(),
                rating: Number(rating),
                comment: comment.trim(),
                timestamp: admin.firestore.FieldValue.serverTimestamp() // Firestore's server-generated timestamp
            };
            
            await reviewsCollection.add(newReview); // Add document to the 'reviews' collection
            console.log("✅ Review added to Firestore successfully.");
            res.redirect('/reviews?submitted=1'); // Redirect with success query param
        } catch (error) {
            console.error("❌ Error adding review to Firestore:", error);
            res.redirect('/reviews?error=1&message=Failed to submit review'); // Redirect with error
        }
    } else {
        res.redirect('/reviews?error=1&message=Please fill all fields');
    }
});

// ===== POST: Contact Form Email Sender (remains unchanged) =====
app.post('/contact', async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.redirect('/?sent=0#contact');
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'Omsairamvehicleinsurance@gmail.com',
                pass: 'vwmitgmdrtjiuamm' // 🔐 Important: Use environment variables for production!
            }
        });

        const mailOptions = {
            from: `"${name.trim()}" <${email.trim()}>`,
            to: 'Omsairamvehicleinsurance@gmail.com',
            subject: '📩 New Contact Message - Om Sai Ram Driving School',
            text: `You received a new message from your site:\n\nName: ${name.trim()}\nEmail: ${email.trim()}\n\nMessage:\n${message.trim()}`
        };

        await transporter.sendMail(mailOptions);
        console.log("✅ Contact message sent successfully.");
        res.redirect('/?sent=1#contact');

    } catch (err) {
        console.error("❌ Failed to send contact message:", err);
        res.redirect('/?sent=0&error=email_failed#contact');
    }
});

// ===== Start Server =====
app.listen(port, () => {
    console.log(`🚗 Server running at http://localhost:${port}`);
});