const express = require("express");
const router = express.Router();
const supabase = require("../db/supabase");
const requireAuth = require("../middleware/auth");

// POST /api/current-location
// Body: { map_item_id } — user_id comes from the verified session only.
router.post("/", requireAuth, async (req, res) => {
  try {
    const { map_item_id } = req.body;

    if (map_item_id === undefined || map_item_id === null) {
      return res.status(400).json({ error: "map_item_id is required" });
    }

    const idNum = parseInt(String(map_item_id), 10);
    if (Number.isNaN(idNum)) {
      return res.status(400).json({ error: "map_item_id must be a number" });
    }

    const { data, error } = await supabase
      .from("current_location")
      .insert({
        user_id: req.user.id,
        map_item_id: idNum,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json(data);
  } catch (error) {
    console.error("current_location insert:", error.message);
    res.status(500).json({ error: "Failed to save current location" });
  }
});

module.exports = router;
