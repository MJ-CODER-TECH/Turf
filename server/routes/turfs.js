// routes/turfs.js
const express = require('express');
const router = express.Router();
const turfController = require('../controllers/turfController');
const { protect, authorize } = require('../middleware/auth');

router.get('/',           turfController.getTurfs);
router.get('/featured',   turfController.getFeaturedTurfs);
router.get('/cities',     turfController.getCities);
router.get('/:id',        turfController.getTurf);
router.get('/:id/stats',  protect, authorize('owner', 'admin'), turfController.getTurfStats);
router.post('/',          protect, authorize('owner', 'admin'), turfController.createTurf);
router.put('/:id',        protect, authorize('owner', 'admin'), turfController.updateTurf);
router.delete('/:id',     protect, authorize('owner', 'admin'), turfController.deleteTurf);

module.exports = router;
