const express = require("express");
const router = express.Router();
const supabase = require("../db/supabase");
const requireAuth = require("../middleware/auth");
 
// GET /api/user-preferences
// Returns the logged in user's preferences
router.get("/", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("user_preference")
      .select("*")
      .eq("uid", req.user.id)
      .single();
 
    if (error && error.code !== "PGRST116") throw error;
 
    // If no preferences exist yet, return defaults
    if (!data) {
      return res.json({
        uid: req.user.id,
        theme_preference: null,
        show_tutorials: true,
      });
    }
 
    res.json(data);
  } catch (error) {
    console.error("Error fetching user preferences:", error.message);
    res.status(500).json({ error: "Failed to fetch user preferences" });
  }
});
 
// POST /api/user-preferences
// Creates or updates user preferences
// Body: { theme_preference, show_tutorials }
router.post("/", requireAuth, async (req, res) => {
  try {
    const { theme_preference, show_tutorials } = req.body;
 
    const { data, error } = await supabase
      .from("user_preference")
      .upsert({
        uid: req.user.id,
        theme_preference: theme_preference ?? null,
        show_tutorials: show_tutorials ?? true,
      })
      .select();
 
    if (error) throw error;
 
    res.json({
      message: "Preferences saved",
      preferences: data[0],
    });
  } catch (error) {
    console.error("Error saving user preferences:", error.message);
    res.status(500).json({ error: "Failed to save user preferences" });
  }
});
 
module.exports = router;