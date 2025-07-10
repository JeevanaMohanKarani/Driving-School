const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer'); // ✅ Nodemailer included

const app = express();
const port = process.env.PORT || 3000;

// ===== Middleware =====
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// ===== View Engine =====
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');

// ===== In-Memory Review Store =====
let reviews = [
  { name: 'Ravi', rating: 5, comment: 'Great experience, I learned to drive confidently.' },
  { name: 'Meena', rating: 4, comment: 'Professional instructor and practical training.' }
];

// ===== Routes =====
app.get('/', (req, res) => {
  res.render('index', { reviews });
});

// ===== Anchor Redirects =====
app.get('/about',   (req, res) => res.redirect('/#about'));
app.get('/courses', (req, res) => res.redirect('/#courses'));
app.get('/contact', (req, res) => res.redirect('/#contact'));
app.get('/gallery', (req, res) => res.redirect('/#gallery'));
app.get('/reviews', (req, res) => res.redirect('/#reviews'));

// ===== POST: Submit Review =====
app.post('/submit-review', (req, res) => {
  const { name, rating, comment } = req.body;
  if (name && rating && comment) {
    reviews.push({ name, rating: Number(rating), comment });
  }
  res.redirect('/#reviews');
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
        user: 'Omsairamvehicleinsurance@gmail.com',        // 🔁 Replace with your Gmail
        pass: 'vwmi tgmd rtji uamm'            // 🔁 App password from Google
      }
    });

    const mailOptions = {
      from: `"${name}" <${email}>`,
      to: 'Omsairamvehicleinsurance@gmail.com',            // 🔁 Replace with your Gmail again
      subject: '📩 New Contact Message - ABC Driving School',
      text: `You received a new message from your site:\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Contact message sent to your inbox.");
    res.redirect('/#contact');

  } catch (err) {
    console.error("❌ Failed to send contact message:", err);
    res.status(500).send("Something went wrong. Try again later.");
  }
});

// ===== Start Server =====
app.listen(port, () => console.log(`🚗 Server running at http://localhost:${port}`));
