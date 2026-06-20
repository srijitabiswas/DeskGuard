const Session  = require('../models/Session');
const Seat     = require('../models/Seat');
const Student  = require('../models/Student');
const Notification = require('../models/Notification');

// ─── GET /api/sessions  (admin/librarian: all; student: own) ─
exports.getSessions = async (req, res, next) => {
  try {
    const filter = {};
    if (req.role === 'student') filter.student = req.user._id;
    if (req.query.status)  filter.status  = req.query.status;
    if (req.query.floorCode) filter.floorCode = req.query.floorCode;

    const sessions = await Session.find(filter)
      .populate('student', 'name studentId avatar dept trustScore')
      .populate('seat', 'seatCode label zone features')
      .sort({ start: -1 })
      .limit(parseInt(req.query.limit) || 100);

    res.json({ success: true, count: sessions.length, data: sessions });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/sessions/active ─────────────────────────────
exports.getActiveSession = async (req, res, next) => {
  try {
    const session = await Session.findOne({ student: req.user._id, status: 'active' })
      .populate('seat', 'seatCode label zone features floorCode');
    res.json({ success: true, data: session || null });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/sessions/:id/checkout ─────────────────────
exports.checkout = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id).populate('seat');
    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });
    if (session.student.toString() !== req.user._id.toString() && !['admin','librarian'].includes(req.role)) {
      return res.status(403).json({ success: false, message: 'Not your session.' });
    }
    if (session.status !== 'active') {
      return res.status(400).json({ success: false, message: `Cannot check out — session status is '${session.status}', not 'active'. Check in first.` });
    }

    const now = new Date();
    const studyStart = session.checkInAt || session.start;
    const durMs = now - studyStart;
    const minStudy = 5 * 60 * 1000; // 5 minutes minimum to earn full points

    let trustGained = durMs >= minStudy ? 20 : 5;
    session.status      = 'completed';
    session.end         = now;
    session.trustGained = trustGained;
    await session.save();

    // Release seat
    const seat = session.seat;
    seat.status       = 'available';
    seat.occupiedBy   = null;
    seat.sessionStart = null;
    seat.awayUntil    = null;
    await seat.save();

    // Update student stats
    const student = await Student.findById(session.student);
    const newScore = Math.min(100, (student.trustScore || 60) + trustGained);
    student.trustScore    = newScore;
    student.totalStudyMs += durMs;
    await student.save();

    // Notify
    await Notification.create({
      type: 'success',
      title: 'Session complete!',
      body: `Great session! You earned ${trustGained} trust points. Your score is now ${newScore}.`,
      targetRole: 'student',
      targetUser: session.student,
    });

    res.json({ success: true, message: 'Checked out successfully.', data: session, trustGained });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/sessions/stats  (student own stats) ────────
exports.getMyStats = async (req, res, next) => {
  try {
    const all = await Session.find({ student: req.user._id });
    const completed = all.filter(s => s.status === 'completed');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayMs   = completed.filter(s => s.start >= today).reduce((sum, s) => sum + (s.end - s.start), 0);
    const weekAgo   = new Date(Date.now() - 7 * 86400000);
    const weekMs    = completed.filter(s => s.start >= weekAgo).reduce((sum, s) => sum + (s.end - s.start), 0);

    // Streak
    let streak = 0;
    const days = new Set(completed.map(s => s.start.toDateString()));
    let d = new Date();
    while (days.has(d.toDateString())) { streak++; d.setDate(d.getDate() - 1); }

    res.json({
      success: true,
      data: {
        total: all.length,
        completed: completed.length,
        noShows: all.filter(s => s.status === 'no-show').length,
        todayMs, weekMs, streak,
      },
    });
  } catch (err) {
    next(err);
  }
};
