const express = require("express");
const router = express.Router();
const supabase = require("../db/supabase");
 
// GET /api/locations
// Returns all map items (parks and cooling centres)
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("map_item")
      .select("*");
 
    if (error) throw error;
 
    res.json(data);
  } catch (error) {
    console.error("Error fetching locations:", error.message);
    res.status(500).json({ error: "Failed to fetch locations" });
  }
});
 
// GET /api/locations/:id
// Returns a single map item with its cooling centre or park details
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
 
    // Try cooling centre first
    const { data: coolingData, error: coolingError } = await supabase
      .from("cooling_center")
      .select(`
        map_item_id,
        address,
        type,
        name,
        name_ts,
        map_item (
          map_item_id,
          location,
          is_park,
          is_cooling_center
        )
      `)
      .eq("map_item_id", id)
      .single();
 
    if (coolingData && !coolingError) {
      return res.json({ type: "cooling_centre", ...coolingData });
    }
 
    // Try park
    const { data: parkData, error: parkError } = await supabase
      .from("park")
      .select(`
        map_item_id,
        park_name,
        official,
        advisories,
        special_features,
        facilities,
        washrooms,
        street_number,
        street_name,
        ew_street_name,
        ns_street_name,
        neighbourhood_name,
        neighbourhood_url,
        hectare,
        map_item (
          map_item_id,
          location,
          is_park,
          is_cooling_center
        )
      `)
      .eq("map_item_id", id)
      .single();
 
    if (parkData && !parkError) {
      return res.json({ type: "park", ...parkData });
    }
 
    return res.status(404).json({ error: "Location not found" });
  } catch (error) {
    console.error("Error fetching location:", error.message);
    res.status(500).json({ error: "Failed to fetch location" });
  }
});
 
module.exports = router;