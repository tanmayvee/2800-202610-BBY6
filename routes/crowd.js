const express = require("express");
const router = express.Router();

// PLACEHOLDER DATA - crowd_reports table not yet created in database
// Once the table is created, replace this with real Supabase queries
const placeholderReports = [
  {
    id: 1,
    map_item_id: "1",
    busyness_level: 3,
    user_id: null,
    created_at: new Date().toISOString(),
  },
];

// GET /api/crowd/:location_id
router.get("/:location_id", (req, res) => {
  const { location_id } = req.params;
  const reports = placeholderReports.filter(
    (r) => r.map_item_id === location_id
  );

  const averageBusyness =
    reports.length > 0
      ? Math.round(
          reports.reduce((sum, r) => sum + r.busyness_level, 0) / reports.length
        )
      : null;

  res.json({
    note: "Placeholder data - crowd_reports table pending",
    location_id,
    averageBusyness,
    totalReports: reports.length,
    reports,
  });
});

// POST /api/crowd
router.post("/", (req, res) => {
  const { location_id, busyness_level, user_id } = req.body;

  if (!location_id || busyness_level === undefined) {
    return res
      .status(400)
      .json({ error: "location_id and busyness_level are required" });
  }

  if (busyness_level < 1 || busyness_level > 5) {
    return res
      .status(400)
      .json({ error: "busyness_level must be between 1 and 5" });
  }

  const newReport = {
    id: placeholderReports.length + 1,
    map_item_id: location_id,
    busyness_level,
    user_id: user_id || null,
    created_at: new Date().toISOString(),
  };

  placeholderReports.push(newReport);

  res.status(201).json({
    note: "Placeholder data - crowd_reports table pending",
    message: "Crowd report submitted",
    report: newReport,
  });
});

module.exports = router;