const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { getSessions, getActiveSession, checkout, getMyStats } = require('../controllers/sessionController');

router.get('/',          protect, getSessions);
router.get('/active',    protect, authorize('student'), getActiveSession);
router.get('/my-stats',  protect, authorize('student'), getMyStats);
router.post('/:id/checkout', protect, checkout);

module.exports = router;
