

// const express = require('express');
// const router = express.Router();
// const { blockSlots, getBlockedByDate } = require('../controllers/blockedSlotController');

// router.post('/block', blockSlots);
// router.get('/:date', getBlockedByDate);

// module.exports = router;

const express = require('express');
const router = express.Router();
const { blockSlots, getBlockedByDate, getAllBlockedDates } = require('../controllers/blockedSlotController');

router.post('/block', blockSlots);
router.get('/:date', getBlockedByDate);
router.get('/', getAllBlockedDates); // ✅ NEW

module.exports = router;


