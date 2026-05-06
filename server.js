const express = require('express');
const cors = require('cors');
require('dotenv').config();

// These are the API routes that return JSON data.
// They are called by the frontend using fetch() inside EJS files.

const parksRouter = require('./routes/parks');
const uvRouter = require('./routes/uv');
const coolingRouter = require('./routes/cooling');
const crowdRouter = require('./routes/crowd');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files (CSS, JS, images) from the public folder
// Example: public/css/style.css is accessible at /css/style.css in EJS
app.use(express.static('public'));

// EJS SETUP
// Tells Express to use EJS as the templating engine
// All .ejs files must be placed inside the views/ folder.
// Use res.render('filename') to serve a page
app.set('view engine', 'ejs');
app.set('views', './views');

// API ROUTES
// These routes return JSON data.
// In your .ejs file, inside a <script> tag, call these like this:
//
//   fetch('/api/uv')
//     .then(r => r.json())
//     .then(data => console.log(data));

app.use('/api/auth', authRouter);     // signup, login, logout
app.use('/api/parks', parksRouter);   // Vancouver park GeoJSON for the map
app.use('/api/uv', uvRouter);         // UV index and risk level
app.use('/api/cooling-centres', coolingRouter); // cooling centre locations
app.use('/api/crowd', crowdRouter);   // crowd busyness reports

// PAGE ROUTES
// These routes render EJS files from the views/ folder.
// A user navigates to these directly in the browser
// usage:
// res.render('filename', { variable: value })
//   - 'filename' = the .ejs file inside views (no extension)
//   - The second argument is an object of variables passed to the EJS file
//   - In the EJS file, access them with <%= variable %>
//
// EXAMPLE:
//   Server:  res.render('index', { title: 'Home' })
//   EJS:     <h1><%= title %></h1>
//   Output:  <h1>Home</h1>

// HOME PAGE
// Renders views/index.ejs
// This is the main map page
// use fetch('/api/parks'), fetch('/api/uv'), fetch('/api/cooling-centres') to fetch data from the API routes
app.get('/', (req, res) => {
  res.render('index');
});

// LOGIN PAGE
// Renders views/login.ejs
// submit to POST /api/auth/login via fetch
app.get('/login', (req, res) => {
  res.render('login');
});

// SIGNUP PAGE
// Renders views/signup.ejs
// submit to POST /api/auth/signup via fetch
app.get('/signup', (req, res) => {
  res.render('signup');
});

// CROWD REPORT PAGE
// Renders views/crowd-report.ejs
// fetch cooling centres from /api/cooling-centres
// and submits reports to POST /api/crowd via fetch
app.get('/crowd-report', (req, res) => {
  res.render('crowd-report');
});

// LOCATION DETAIL PAGE
// Renders views/location.ejs
// Fetch the location from the database BEFORE rendering the page
// because we need the location data to be available in the EJS template itself
// (for things like the page title, map coordinates, and address)
//
// The location object is passed to the EJS file and accessed like this:
//   <%= location.name %>
//   <%= location.address %>
//   <%= location.lat %>
//   <%= location.lon %>
app.get('/location/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = require('./db/supabase');

    const { data, error } = await supabase
      .from('cooling_centres')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).send('Location not found');
    }

    // Pass the location data into the EJS template
    res.render('location', { location: data });
  } catch (err) {
    console.error('Error fetching location:', err.message);
    res.status(500).send('Server error');
  }
});

// SETTINGS PAGE
// Renders views/settings.ejs
app.get('/settings', (req, res) => {
  res.render('settings');
});

// Health check
app.get('/api', (req, res) => {
  res.json({ message: 'Urban Shade API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Visit: http://localhost:${PORT}`);
});