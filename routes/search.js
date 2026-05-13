const express = require("express");
const path = require("path");
const ejs = require("ejs");
const router = express.Router();
const supabase = require("../db/supabase");

const searchResultTemplate = path.join(
  __dirname,
  "..",
  "views",
  "templates",
  "search-result.ejs"
);

/**
 * @param {object} row
 * @param {"cooling" | "park"} kind
 */
function rowToTemplateLocals(row, kind) {
  const mapItemId = row.map_item_id ?? row.id;
  const name =
    row.name ??
    row.park_name ??
    row.item_name ??
    "Unknown";
  const itemType =
    kind === "cooling"
      ? row.type || "Cooling centre"
      : "Park";
  return {
    map_item_id: mapItemId != null ? String(mapItemId) : "",
    item_name: name,
    item_type: itemType,
    item_link: `/location/${mapItemId}`,
  };
}

function renderSearchResultHtml(locals) {
  return new Promise((resolve, reject) => {
    ejs.renderFile(searchResultTemplate, locals, (err, html) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(html);
    });
  });
}

// GET /api/search/map?q=...
// Runs get_cooling_center_search and get_park_search; returns HTML list items from search-result.ejs
router.get("/map", async (req, res) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

    if (!q) {
      return res.json({ html: "" });
    }

    const [{ data: coolingRows, error: coolingError }, { data: parkRows, error: parkError }] =
      await Promise.all([
        supabase.rpc("get_cooling_center_search", { search: q }),
        supabase.rpc("get_park_search", { search: q }),
      ]);

    if (coolingError) {
      console.error("get_cooling_center_search:", coolingError.message);
      throw coolingError;
    }
    if (parkError) {
      console.error("get_park_search:", parkError.message);
      throw parkError;
    }

    const cooling = Array.isArray(coolingRows) ? coolingRows : [];
    const parks = Array.isArray(parkRows) ? parkRows : [];

    const localsList = [
      ...cooling.map((row) => rowToTemplateLocals(row, "cooling")),
      ...parks.map((row) => rowToTemplateLocals(row, "park")),
    ];

    const fragments = await Promise.all(
      localsList.map((locals) => renderSearchResultHtml(locals))
    );

    res.json({ html: fragments.join("") });
  } catch (error) {
    console.error("Error in map search:", error.message);
    res.status(500).json({ error: "Search failed" });
  }
});

module.exports = router;
