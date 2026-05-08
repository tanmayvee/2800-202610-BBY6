const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const requireAuth = require('../middleware/auth');

// GET /api/crowd/:location_id
router.get('/:location_id', async (req, res) => {
  try {
    const { location_id } = req.params;

    const { data, error } = await supabase
      .from('crowd_reports')
      .select('*')
      .eq('location_id', location_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    const averageBusyness = data.length > 0
      ? Math.round(data.reduce((sum, r) => sum + r.busyness_level, 0) / data.length)
      : null;

    res.json({
      location_id,
      averageBusyness,
      totalReports: data.length,
      reports: data,
    });
  } catch (error) {
    console.error('Error fetching crowd reports:', error.message);
    res.status(500).json({ error: 'Failed to fetch crowd reports' });
  }
});

// POST /api/crowd - protected, login required
router.post('/', requireAuth, async (req, res) => {
  try {
    const { location_id, busyness_level } = req.body;

    if (!location_id || busyness_level === undefined) {
      return res.status(400).json({ error: 'location_id and busyness_level are required' });
    }

    if (busyness_level < 1 || busyness_level > 5) {
      return res.status(400).json({ error: 'busyness_level must be between 1 and 5' });
    }

    const { data, error } = await supabase
      .from('crowd_reports')
      .insert([{
        location_id,
        busyness_level,
        user_id: req.user.id,
        created_at: new Date().toISOString(),
      }])
      .select();

    if (error) throw error;

    res.status(201).json({
      message: 'Crowd report submitted',
      report: data[0],
    });
  } catch (error) {
    console.error('Error submitting crowd report:', error.message);
    res.status(500).json({ error: 'Failed to submit crowd report' });
  }
});

module.exports = router;