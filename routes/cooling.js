const express = require("express");
const router = express.Router();

// PLACEHOLDER DATA - Supabase integration pending

// GET /api/cooling-centres
router.get("/", async (req, res) => {
  try {
    const url =
      "https://opendata.vancouver.ca/api/explore/v2.1/catalog/datasets/community-centres/exports/geojson";
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Vancouver Open Data API error: ${response.status}`);
    }
    const geojson = await response.json();
    res.json(geojson);
  } catch (error) {
    console.error("Error fetching community centres data:", error.message);
    res.status(500).json({ error: "Failed to fetch community centre data" });
  }
});

module.exports = router;
