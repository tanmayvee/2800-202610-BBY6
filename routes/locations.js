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

// GET /api/locations/park-by-name?name=...
// Resolves Vancouver open-data park label to app park.map_item_id (must be registered before /:id).
router.get("/park-by-name", async (req, res) => {
  try {
    const name =
      typeof req.query.name === "string" ? req.query.name.trim() : "";
    if (!name) {
      return res.status(400).json({ error: "name is required" });
    }

    const { data, error } = await supabase
      .from("park")
      .select("map_item_id")
      .ilike("park_name", name)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }
    if (!data || data.map_item_id == null) {
      return res.status(404).json({ error: "Park not found" });
    }

    res.json({ map_item_id: data.map_item_id });
  } catch (error) {
    console.error("park-by-name:", error.message);
    res.status(500).json({ error: "Failed to resolve park" });
  }
});

// GET /api/locations/:id/crowding
// Uses get_location_crowding (SECURITY DEFINER) so counts are not hidden by RLS on current_location.
router.get("/:id/crowding", async (req, res) => {
  try {
    const idNum = parseInt(String(req.params.id), 10);
    if (Number.isNaN(idNum)) {
      return res.status(400).json({ error: "Invalid map item id" });
    }

    const { data, error } = await supabase.rpc("get_location_crowding", {
      target_map_item_id: idNum,
    });

    if (error) {
      throw error;
    }

    let count = 0;
    if (typeof data === "number" && Number.isFinite(data)) {
      count = data;
    } else if (typeof data === "string") {
      const parsed = parseInt(data, 10);
      count = Number.isNaN(parsed) ? 0 : parsed;
    } else if (Array.isArray(data) && data.length > 0) {
      const first = data[0];
      count =
        typeof first === "number"
          ? first
          : typeof first === "object" && first != null
            ? Number(Object.values(first)[0]) || 0
            : 0;
    } else if (data != null) {
      const n = Number(data);
      count = Number.isFinite(n) ? Math.trunc(n) : 0;
    }

    res.json({ count });
  } catch (error) {
    console.error("Error fetching location crowding:", error.message);
    res.status(500).json({ error: "Failed to fetch location crowding" });
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