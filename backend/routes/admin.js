const router   = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const Librarian = require('../models/Librarian');
const Admin     = require('../models/Admin');
const Student   = require('../models/Student');

// GET /api/admin/librarians
router.get('/librarians', protect, authorize('admin'), async (req, res, next) => {
  try {
    const libs = await Librarian.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: libs });
  } catch (err) { next(err); }
});

// POST /api/admin/librarians
router.post('/librarians', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { name, email, password, floor } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password required.' });
    }
    const librarianId = `LIB${Date.now().toString().slice(-6)}`;
    const lib = await Librarian.create({ librarianId, name, email, password, floor: floor || 'All Floors' });
    const { password: _pw, ...safeLib } = lib.toObject();
    res.status(201).json({ success: true, data: safeLib });
  } catch (err) { next(err); }
});

// DELETE /api/admin/librarians/:id
router.delete('/librarians/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const lib = await Librarian.findByIdAndDelete(req.params.id);
    if (!lib) return res.status(404).json({ success: false, message: 'Librarian not found.' });
    res.json({ success: true, message: 'Librarian removed.' });
  } catch (err) { next(err); }
});

// GET /api/admin/dashboard-summary
router.get('/dashboard-summary', protect, authorize('admin'), async (req, res, next) => {
  try {
    const Session = require('../models/Session');
    const Seat    = require('../models/Seat');
    const [totalStudents, activatedStudents, totalSessions, activeNow, totalSeats] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ activated: true }),
      Session.countDocuments(),
      Session.countDocuments({ status: 'active' }),
      Seat.countDocuments(),
    ]);
    const availableSeats = await Seat.countDocuments({ status: 'available' });
    res.json({
      success: true,
      data: {
        totalStudents, activatedStudents, totalSessions,
        activeNow, totalSeats, availableSeats,
        occupancyPct: Math.round(((totalSeats - availableSeats) / totalSeats) * 100),
      },
    });
  } catch (err) { next(err); }
});

module.exports = router;
