const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getSeats, recommendSeats, bookSeat, checkInSeat, setAway,
  returnFromAway, releaseSeat, updateSeat, cancelReservation,
} = require('../controllers/seatController');

router.get('/',           protect, getSeats);
router.get('/recommend',  protect, recommendSeats);
router.post('/:id/book',  protect, authorize('student'), bookSeat);
router.post('/:id/check-in', protect, authorize('student'), checkInSeat);
router.post('/:id/cancel', protect, authorize('student'), cancelReservation);
router.post('/:id/away',  protect, authorize('student'), setAway);
router.post('/:id/return',protect, authorize('student'), returnFromAway);
router.post('/:id/release', protect, authorize('librarian','admin'), releaseSeat);
router.patch('/:id',      protect, authorize('librarian','admin'), updateSeat);

module.exports = router;
