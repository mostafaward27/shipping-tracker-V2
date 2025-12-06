const express = require('express');
const router = express.Router();
const TrackController = require('../controllers/trackController');

// Public route
router.get('/:id', TrackController.trackOrder);

module.exports = router;