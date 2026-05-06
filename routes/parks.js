const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");

router.get("/", async (req, res) => {
  try {
    const url =
      "https://opendata.vancouver.ca/api/explore/v2.1/catalog/datasets/parks-polygon-representation/exports/geojson";
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Vancouver Open Data API error: ${response.status}`);
    }
    const geojson = await response.json();
    res.json(geojson);
  } catch (error) {
    console.error("Error fetching parks data:", error.message);
    res.status(500).json({ error: "Failed to fetch parks data" });
  }
});

module.exports = router;
