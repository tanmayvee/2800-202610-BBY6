const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");

// GET /api/uv?lat=49.2827&lon=-123.1207
// Fetches current UV index for a given latitude/longitude
// Defaults to Vancouver city centre if no coords provided
router.get("/", async (req, res) => {
  try {
    const lat = req.query.lat || 49.2827;
    const lng = req.query.lng || -123.1207;

    // Open-Meteo is free and requires no API key
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,uv_index&timezone=America%2FVancouver`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status}`);
    }

    const data = await response.json();

    // Get the current hour's UV index
    const currentHour = new Date().getHours();
    const uvIndex = data.current.uv_index;
    const temperature = data.current.temperature_2m;

    // Determine risk level based on UV index
    let riskLevel;
    let colour;

    if (uvIndex <= 2) {
      riskLevel = "Low";
      colour = "#00cc00"; // green
    } else if (uvIndex <= 5) {
      riskLevel = "Moderate";
      colour = "#ffcc00"; // yellow
    } else if (uvIndex <= 7) {
      riskLevel = "High";
      colour = "#ff6600"; // orange
    } else if (uvIndex <= 10) {
      riskLevel = "Very High";
      colour = "#cc0000"; // red
    } else {
      riskLevel = "Extreme";
      colour = "#660066"; // purple
    }

    res.json({
      uvIndex,
      riskLevel,
      temperature,
      colour,
      lat,
      lng,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching UV data:", error.message);
    res.status(500).json({ error: "Failed to fetch UV index data" });
  }
});

module.exports = router;
