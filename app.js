const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000; // ✅ Use dynamic port for Render

// ===== Middleware =====
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// ===== View Engine =====
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');

// ===== In‑Memory Review Store =====
let reviews = [
  { name: 'Ravi',  rating: 5, comment: 'Great experience, I learned to drive confidently.' },
  { name: 'Meena', rating: 4, comment: 'Professional instructor and practical training.' }
];

// ===== Routes =====
app.get('/', (req, res) => {
  res.render('index', { reviews });
});

app.get('/about',   (req, res) => res.redirect('/#about'));
app.get('/courses', (req, res) => res.redirect('/#courses'));
app.get('/contact', (req, res) => res.redirect('/#contact'));
app.get('/gallery', (req, res) => res.render('gallery'));
app.get('/reviews', (req, res) => res.render('reviews', { comments: reviews }));

app.post('/submit-review', (req, res) => {
  const { name, rating, comment } = req.body;
  if (name && rating && comment) {
    reviews.push({ name, rating: Number(rating), comment });
  }
  res.redirect('/#reviews');
});

// ===== Start server =====
app.listen(port, () => console.log(`🚗 Server running on http://localhost:${port}`));
