const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

const VANCOUVER_OPEN_DATA_URL = process.env.VANCOUVER_OPEN_DATA_URL;

// GET /api/parks
// Fetches park GeoJSON from Vancouver Open Data and returns it to the frontend
router.get('/', async (req, res) => {
  try {
    const url = `${VANCOUVER_OPEN_DATA_URL}/parks/exports/geojson`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Vancouver Open Data API error: ${response.status}`);
    }

    const geojson = await response.json();

    res.json(geojson);
  } catch (error) {
    console.error('Error fetching parks data:', error.message);
    res.status(500).json({ error: 'Failed to fetch parks data' });
  }
});

module.exports = router;
