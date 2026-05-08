const express = require("express");
const cors = require("cors");
require("dotenv").config();

const parksRouter = require("./routes/parks");
const uvRouter = require("./routes/uv");
const coolingRouter = require("./routes/cooling");
const crowdRouter = require("./routes/crowd");
const authRouter = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// API Routes
// These return JSON data and are called using fetch() inside EJS files
app.use("/api/auth", authRouter);           // signup, login, logout
app.use("/api/parks", parksRouter);         // Vancouver park GeoJSON for the map
app.use("/api/uv", uvRouter);               // UV index and risk level
app.use("/api/cooling-centres", coolingRouter); // cooling centre locations
app.use("/api/crowd", crowdRouter);         // crowd busyness reports

// Page Routes
// These render EJS files from the views/ folder
// Access server variables in EJS using <%= variableName %>

// HOME - passes maptilerKey so the map can load
app.get("/", (req, res) => {
  res.render("index", { maptilerKey: process.env.MAPTILER_KEY });
});

app.get("/homepage", (req, res) => {
  res.render("homepage");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.get("/crowds", (req, res) => {
  res.render("crowds");
});

app.get("/locations", (req, res) => {
  res.render("locations");
});

// Location detail - fetches location from database before rendering
// Access in EJS: <%= location.name %>, <%= location.address %>, <%= location.lat %>, <%= location.lon %>
app.get("/location/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = require("./db/supabase");

    const { data, error } = await supabase
      .from("cooling_centres")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).send("Location not found");
    }

    res.render("location", { location: data });
  } catch (err) {
    console.error("Error fetching location:", err.message);
    res.status(500).send("Server error");
  }
});

app.get("/usersettings", (req, res) => {
  res.render("usersettings");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});