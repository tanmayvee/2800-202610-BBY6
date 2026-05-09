const express = require("express");
const router = express.Router();
const supabase = require("../db/supabase");

// GET /api/cooling-centres
// Returns all cooling centres from the database
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("cooling_center")
      .select(`
        map_item_id,
        address,
        type,
        name
      `);

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error("Error fetching cooling centres:", error.message);
    res.status(500).json({ error: "Failed to fetch cooling centres" });
  }
});

// GET /api/cooling-centres/search?q=query
// Search cooling centres by name
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const { data, error } = await supabase
      .rpc("get_cooling_center_search", { search: q });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error("Error searching cooling centres:", error.message);
    res.status(500).json({ error: "Failed to search cooling centres" });
  }
});

// GET /api/cooling-centres/nearest?lon=-123.12&lat=49.28
// Returns nearest cooling centre to given coordinates
router.get("/nearest", async (req, res) => {
  try {
    const { lon, lat } = req.query;

    if (!lon || !lat) {
      return res.status(400).json({ error: "lon and lat are required" });
    }

    const { data, error } = await supabase
      .rpc("get_closest_map_item", {
        point_long: parseFloat(lon),
        point_lat: parseFloat(lat),
      });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error("Error fetching nearest location:", error.message);
    res.status(500).json({ error: "Failed to fetch nearest location" });
  }
});

// GET /api/cooling-centres/location/:id
// Returns lat/lon for a specific cooling centre using get_map_item_location
router.get("/location/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .rpc("get_map_item_location", { p_map_item_id: parseInt(id) });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error("Error fetching location coordinates:", error.message);
    res.status(500).json({ error: "Failed to fetch location coordinates" });
  }
});

// GET /api/cooling-centres/:id
// Returns a single cooling centre by map_item_id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("cooling_center")
      .select(`
        map_item_id,
        address,
        type,
        name
      `)
      .eq("map_item_id", id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: "Cooling centre not found" });
    }

    res.json(data);
  } catch (error) {
    console.error("Error fetching cooling centre:", error.message);
    res.status(500).json({ error: "Failed to fetch cooling centre" });
  }
});

module.exports = router;