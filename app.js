const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// ===== File Path for Reviews =====
const reviewsPath = path.join(__dirname, 'data', 'reviews.json');

// Ensure 'data' directory exists and reviews.json file is initialized
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}
if (!fs.existsSync(reviewsPath)) {
    fs.writeFileSync(reviewsPath, '[]', 'utf-8'); // Initialize with an empty array
}

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
app.set('views', path.join(__dirname, 'views')); // Specify the views directory
app.set('layout', 'layout'); // Set 'layout.ejs' as the default layout for all views

// ===== Helper: Load Reviews from File =====
function loadReviews() {
    try {
        const data = fs.readFileSync(reviewsPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error loading reviews from file:", error.message);
        return []; // Return an empty array if file is unreadable or empty/corrupt
    }
}

// ===== Helper: Save a Review to File =====
function saveReview(newReview) {
    const allReviews = loadReviews();
    allReviews.push(newReview);
    try {
        fs.writeFileSync(reviewsPath, JSON.stringify(allReviews, null, 2), 'utf-8');
    } catch (error) {
        console.error("Error saving review to file:", error.message);
    }
}

// ===== GET: Home Page =====
app.get('/', (req, res) => {
    // You mentioned only wanting 'latestReviews' on the homepage if any.
    // However, the `index.ejs` provided above does NOT contain a reviews section.
    // So, 'reviews' data is not strictly needed for the default index page.
    // If you add a small "Latest Reviews" section to index.ejs, you can pass this:
    // const reviews = loadReviews();
    // const latestReviews = reviews.slice().sort((a, b) => {
    //     if (a.timestamp && b.timestamp) {
    //         return new Date(b.timestamp) - new Date(a.timestamp);
    //     }
    //     return 0;
    // }).slice(0, 2);
    // res.render('index', { reviews: latestReviews }); // if needed
    res.render('index'); // No specific data needed for the current index.ejs
});

// ===== GET: Separate Reviews Page =====
app.get('/reviews', (req, res) => {
    const reviews = loadReviews();
    // Sort all reviews by timestamp to display newest first on the dedicated reviews page
    const sortedReviews = reviews.slice().sort((a, b) => {
        if (a.timestamp && b.timestamp) {
            return new Date(b.timestamp) - new Date(a.timestamp);
        }
        return 0;
    });
    res.render('reviews', { reviews: sortedReviews });
});

// ===== Anchor Redirects (for navigation within the single page layout) =====
// These redirect to the root path and rely on client-side JS for scrolling to anchors.
app.get('/about', (req, res) => res.redirect('/#about')); // Note: Your HTML doesn't have an #about section
app.get('/courses', (req, res) => res.redirect('/#courses'));
app.get('/gallery', (req, res) => res.redirect('/#gallery'));
app.get('/contact', (req, res) => res.redirect('/#contact'));

// ===== POST: Submit Review =====
app.post('/submit-review', (req, res) => {
    const { name, rating, comment } = req.body;
    if (name && rating && comment) {
        const newReview = {
            name: name.trim(), // Trim whitespace
            rating: Number(rating),
            comment: comment.trim(), // Trim whitespace
            timestamp: new Date().toISOString() // Add a timestamp for consistent sorting
        };
        saveReview(newReview);
        res.redirect('/reviews?submitted=1'); // Redirect with a query param for success feedback
    } else {
        res.redirect('/reviews?error=1&message=Please fill all fields'); // Redirect with an error
    }
});

// ===== POST: Contact Form Email Sender =====
app.post('/contact', async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        // Redirect back to the contact section with an error message
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
        // Redirect to home page with 'sent=1' query parameter and anchor to contact section
        res.redirect('/?sent=1#contact');

    } catch (err) {
        console.error("❌ Failed to send contact message:", err);
        // Redirect back to the contact section with a failure indicator
        res.redirect('/?sent=0&error=email_failed#contact');
    }
});

// ===== Start Server =====
app.listen(port, () => {
    console.log(`🚗 Server running at http://localhost:${port}`);
});