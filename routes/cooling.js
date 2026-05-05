const express = require('express');
const router = express.Router();

// PLACEHOLDER DATA - Supabase integration pending
const placeholderCoolingCentres = [
  {
    id: 1,
    name: 'Britannia Community Centre',
    address: '1661 Napier St, Vancouver',
    lat: 49.2769,
    lon: -123.0694,
    type: 'Community Centre',
    hours: 'Mon-Fri 9am-9pm, Sat-Sun 10am-5pm',
  },
  {
    id: 2,
    name: 'Vancouver Public Library - Central Branch',
    address: '350 W Georgia St, Vancouver',
    lat: 49.2802,
    lon: -123.1167,
    type: 'Library',
    hours: 'Mon-Thu 10am-8pm, Fri-Sat 10am-6pm, Sun 12pm-6pm',
  },
  {
    id: 3,
    name: 'Sunset Community Centre',
    address: '6810 Main St, Vancouver',
    lat: 49.2282,
    lon: -123.1013,
    type: 'Community Centre',
    hours: 'Mon-Fri 8:30am-10pm, Sat-Sun 9am-6pm',
  },
];

// GET /api/cooling-centres
router.get('/', (req, res) => {
  res.json({
    note: 'Placeholder data - Supabase integration in progress',
    data: placeholderCoolingCentres,
  });
});

// GET /api/cooling-centres/:id
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const centre = placeholderCoolingCentres.find(c => c.id === parseInt(id));

  if (!centre) {
    return res.status(404).json({ error: 'Cooling centre not found' });
  }

  res.json({
    note: 'Placeholder data - Supabase integration in progress',
    data: centre,
  });
});

module.exports = router;