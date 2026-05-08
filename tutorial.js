const express = require('express');
const router = express.Router();

const steps = [
  { title: 'Welcome', text: 'This app helps you find shade in the city.' },
  { title: 'Parks', text: 'Click the map to explore nearby parks.' },
  { title: 'UV Index', text: 'See real-time UV levels in your area.' },
  { title: 'Cooling Centres', text: 'Find air-conditioned spaces near you.' },
  { title: 'Done!', text: 'You\'re ready to go!' }
];

module.exports = router;