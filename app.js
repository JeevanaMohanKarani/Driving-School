const express = require('express');
const expressLayouts = require('express-ejs-layouts');

const app = express();
const port = 3000;

// Set up EJS and Layouts
app.set('view engine', 'ejs');
app.use(expressLayouts);

// Optional: specify layout file (default is views/layout.ejs)
app.set('layout', 'layout'); // layout.ejs inside /views

app.use(express.static('public'));

// Routes
app.get('/', (req, res) => res.render('index'));
app.get('/about', (req, res) => res.render('about'));
app.get('/courses', (req, res) => res.render('courses'));
app.get('/contact', (req, res) => res.render('contact'));
app.use(express.static('public'));
app.get('/gallery', (req, res) => {
  res.render('gallery');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
