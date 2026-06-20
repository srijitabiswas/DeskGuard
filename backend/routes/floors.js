const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { getFloors, createFloor, updateFloor, toggleEmergency, getFloorStats } = require('../controllers/floorController');

router.get('/',                 protect, getFloors);
router.post('/',                protect, authorize('admin'), createFloor);
router.put('/:id',              protect, authorize('admin'), updateFloor);
router.post('/:id/emergency',   protect, authorize('admin','librarian'), toggleEmergency);
router.get('/:id/stats',        protect, authorize('admin','librarian'), getFloorStats);

module.exports = router;
