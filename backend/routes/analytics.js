const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { getOverview, getWeekly, getFloorStats, getTrustDistribution, getZoneUsage } = require('../controllers/analyticsController');

router.get('/overview',           protect, authorize('admin','librarian'), getOverview);
router.get('/weekly',             protect, authorize('admin','librarian'), getWeekly);
router.get('/floor-stats',        protect, getFloorStats);
router.get('/trust-distribution', protect, authorize('admin'), getTrustDistribution);
router.get('/zone-usage',         protect, authorize('admin','librarian'), getZoneUsage);

module.exports = router;
