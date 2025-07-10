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

// ===== Middleware =====
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressLayouts);

// ===== View Engine =====
app.set('view engine', 'ejs');
app.set('layout', 'layout');

// ===== Helper: Load Reviews from File =====
function loadReviews() {
  try {
    const data = fs.readFileSync(reviewsPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// ===== Helper: Save a Review to File =====
function saveReview(newReview) {
  const allReviews = loadReviews();
  allReviews.push(newReview);
  fs.writeFileSync(reviewsPath, JSON.stringify(allReviews, null, 2));
}

// ===== GET: Home Page (latest 2 reviews only) =====
app.get('/', (req, res) => {
  const reviews = loadReviews();
  const latestReviews = reviews.slice(-2).reverse(); // get latest 2
  res.render('index', { reviews: latestReviews, req });
});

// ===== GET: Separate Reviews Page =====
app.get('/reviews', (req, res) => {
  const reviews = loadReviews();
  res.render('reviews', { reviews });
});

// ===== Anchor Redirects =====
app.get('/about',   (req, res) => res.redirect('/#about'));
app.get('/courses', (req, res) => res.redirect('/#courses'));
app.get('/gallery', (req, res) => res.redirect('/#gallery'));
app.get('/contact', (req, res) => res.redirect('/#contact'));

// ===== POST: Submit Review =====
app.post('/submit-review', (req, res) => {
  const { name, rating, comment } = req.body;
  if (name && rating && comment) {
    const newReview = { name, rating: Number(rating), comment };
    saveReview(newReview);
  }
  res.redirect('/reviews');
});

// ===== POST: Contact Form Email Sender =====
app.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).send("Please fill all fields.");
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'Omsairamvehicleinsurance@gmail.com',
        pass: 'vwmi tgmd rtji uamm' // 🔐 App password (safe in dev, use env in prod)
      }
    });

    const mailOptions = {
      from: `"${name}" <${email}>`,
      to: 'Omsairamvehicleinsurance@gmail.com',
      subject: '📩 New Contact Message - ABC Driving School',
      text: `You received a new message from your site:\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Contact message sent.");
    res.redirect('/?sent=1#contact');

  } catch (err) {
    console.error("❌ Failed to send contact message:", err);
    res.status(500).send("Something went wrong. Try again later.");
  }
});

// ===== Start Server =====
app.listen(port, () => console.log(`🚗 Server running at http://localhost:${port}`));
