const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// ===== Middleware =====
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// ===== View Engine =====
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');

// ===== In‑Memory Review Store =====
// In production you would replace this with a DB or a JSON file
let reviews = [
  { name: 'Ravi',  rating: 5, comment: 'Great experience, I learned to drive confidently.' },
  { name: 'Meena', rating: 4, comment: 'Professional instructor and practical training.' }
];

// ===== Routes =====
app.get('/', (req, res) => {
  res.render('index', { reviews });
});

// optional anchors keep working for SEO
app.get('/about',   (req, res) => res.redirect('/#about'));
app.get('/courses', (req, res) => res.redirect('/#courses'));
app.get('/contact', (req, res) => res.redirect('/#contact'));
app.get('/gallery', (req, res) => res.render('gallery'));

// Reviews full page
app.get('/reviews', (req, res) => {
  res.render('reviews', { comments: reviews });
});

// ===== POST: Submit a new review =====
app.post('/submit-review', (req, res) => {
  const { name, rating, comment } = req.body;
  if (name && rating && comment) {
    reviews.push({ name, rating: Number(rating), comment });
  }
  // redirect back to the reviews section on the homepage
  res.redirect('/#reviews');
});

// ===== Start server =====
app.listen(port, () => console.log(`🚗 Server running on http://localhost:${port}`));


