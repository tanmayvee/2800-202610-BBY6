const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

// GET /api/cooling-centres
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('cooling_centres')
      .select('*');

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error fetching cooling centres:', error.message);
    res.status(500).json({ error: 'Failed to fetch cooling centres' });
  }
});

// GET /api/cooling-centres/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('cooling_centres')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Cooling centre not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching cooling centre:', error.message);
    res.status(500).json({ error: 'Failed to fetch cooling centre' });
  }
});

module.exports = router;