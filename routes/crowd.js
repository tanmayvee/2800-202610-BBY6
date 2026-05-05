const express = require('express');
const router = express.Router();

// PLACEHOLDER DATA - Supabase integration pending
const placeholderReports = [
  {
    id: 1,
    location_id: '1',
    busyness_level: 3,
    user_id: null,
    created_at: new Date().toISOString(),
  },
];

// GET /api/crowd/:location_id
router.get('/:location_id', (req, res) => {
  const { location_id } = req.params;
  const reports = placeholderReports.filter(r => r.location_id === location_id);

  const averageBusyness = reports.length > 0
    ? Math.round(reports.reduce((sum, r) => sum + r.busyness_level, 0) / reports.length)
    : null;

  res.json({
    note: 'Placeholder data - Supabase integration in progress',
    location_id,
    averageBusyness,
    totalReports: reports.length,
    reports,
  });
});

// POST /api/crowd
router.post('/', (req, res) => {
  const { location_id, busyness_level, user_id } = req.body;

  if (!location_id || busyness_level === undefined) {
    return res.status(400).json({ error: 'location_id and busyness_level are required' });
  }

  if (busyness_level < 1 || busyness_level > 5) {
    return res.status(400).json({ error: 'busyness_level must be between 1 and 5' });
  }

  const newReport = {
    id: placeholderReports.length + 1,
    location_id,
    busyness_level,
    user_id: user_id || null,
    created_at: new Date().toISOString(),
  };

  // Add to placeholder array (resets when server restarts)
  placeholderReports.push(newReport);

  res.status(201).json({
    note: 'Placeholder data - Supabase integration in progress',
    message: 'Crowd report submitted',
    report: newReport,
  });
});

module.exports = router;