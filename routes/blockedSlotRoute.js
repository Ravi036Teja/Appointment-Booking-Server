
const express = require('express');
const router = express.Router();
const { blockSlots, getBlockedByDate, getAllBlockedDates, deleteBlockedDate /*, blockDateRange */ } = require('../controllers/blockedSlotController'); // Make sure deleteBlockedDate is imported

router.post('/block', blockSlots);
router.get('/:date', getBlockedByDate);
router.get('/', getAllBlockedDates);
router.delete('/:date', deleteBlockedDate); // Add delete route
// router.post('/block-range', blockDateRange); // If you plan to use this
module.exports = router;