const express = require("express");
const cors = require("cors");
require("dotenv").config();

const parksRouter = require("./routes/parks");
const uvRouter = require("./routes/uv");
const coolingRouter = require("./routes/cooling");
const crowdRouter = require("./routes/crowd");
const authRouter = require("./routes/auth");
const locationsRouter = require("./routes/locations");
const userPreferencesRouter = require("./routes/userpreferences");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// API Routes
// These return JSON data and are called using fetch() inside EJS files
app.use("/api/auth", authRouter); // signup, login, logout
app.use("/api/parks", parksRouter); // Vancouver park GeoJSON for the map
app.use("/api/uv", uvRouter); // UV index and risk level
app.use("/api/cooling-centres", coolingRouter); // cooling centre locations
app.use("/api/crowd", crowdRouter); // crowd busyness reports
app.use("/api/locations", locationsRouter); // all map items (parks and cooling centres)
app.use("/api/user-preferences", userPreferencesRouter); // user preferences for notifications, etc.

// Page Routes
// These render EJS files from the views/ folder
// Access server variables in EJS using <%= variableName %>

// HOME - passes maptilerKey so the map can load
app.get("/", (req, res) => {
  res.render("index", {
    cssFiles: ["style.css"],
    jsFiles: ["map.js", "main.js", "tutorial.js"],
    maptilerKey: process.env.MAPTILER_KEY,
    showTutorial: true /*hardcoded for now */,
  });
});

app.get("/homepage", (req, res) => {
  res.render("homepage");
});

app.get("/login", (req, res) => {
  res.render("login", { cssFiles: ["style.css", "auth.css"] });
});

app.get("/signup", (req, res) => {
  res.render("signup", { cssFiles: ["style.css", "auth.css"] });
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

    // Get coordinates using the database function
    const { data: coords } = await supabase.rpc("get_map_item_location", {
      p_map_item_id: parseInt(id),
    });

    // Try cooling centre first
    const { data: coolingData } = await supabase
      .from("cooling_center")
      .select("*")
      .eq("map_item_id", id)
      .single();

    if (coolingData) {
      return res.render("location", {
        location: {
          ...coolingData,
          lat: coords?.[0]?.lat ?? null,
          lon: coords?.[0]?.long ?? null,
          locationType: "cooling_centre",
        },
      });
    }

    // Try park
    const { data: parkData } = await supabase
      .from("park")
      .select("*")
      .eq("map_item_id", id)
      .single();

    if (parkData) {
      return res.render("location", {
        location: {
          ...parkData,
          name: parkData.park_name,
          lat: coords?.[0]?.lat ?? null,
          lon: coords?.[0]?.long ?? null,
          locationType: "park",
        },
      });
    }

    res.status(404).send("Location not found");
  } catch (err) {
    console.error("Error fetching location:", err.message);
    res.status(500).send("Server error");
  }
});

app.get("/usersettings", (req, res) => {
  res.render("usersettings", {
    cssFiles: ["usersettings.css"],
    jsFiles: ["settings.js", "main.js"],
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
