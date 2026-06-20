const Seat    = require('../models/Seat');
const Session = require('../models/Session');
const Student = require('../models/Student');
const Notification = require('../models/Notification');

// ─── GET /api/seats?floorCode=f1 ──────────────────────────
exports.getSeats = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.floorCode) filter.floorCode = req.query.floorCode;
    if (req.query.status)    filter.status    = req.query.status;
    if (req.query.zone)      filter.zone       = req.query.zone;

    const seats = await Seat.find(filter)
      .populate('occupiedBy', 'name studentId avatar trustScore')
      .sort({ row: 1, col: 1 });

    // Auto-release expired away seats
    const now = new Date();
    const expiredAway = seats.filter(s => s.status === 'away' && s.awayUntil && s.awayUntil < now);
    for (const seat of expiredAway) {
      seat.status    = 'available';
      seat.occupiedBy  = null;
      seat.sessionStart= null;
      seat.awayUntil   = null;
      await seat.save();
      await Session.findOneAndUpdate(
        { seat: seat._id, status: 'active' },
        { status: 'released', end: now, trustGained: -20 }
      );
      await Notification.create({
        type: 'alert', title: 'Away timeout — seat released',
        body: `Seat ${seat.seatCode} was automatically released after away timeout.`,
        targetRole: 'librarian',
      });
    }

    // Auto-expire reservations that were never checked into in time
    const expiredReservations = seats.filter(s => s.status === 'reserved' && s.checkInDeadline && s.checkInDeadline < now);
    for (const seat of expiredReservations) {
      const studentId = seat.occupiedBy;
      seat.status         = 'available';
      seat.occupiedBy     = null;
      seat.reservedAt      = null;
      seat.checkInDeadline = null;
      await seat.save();
      await Session.findOneAndUpdate(
        { seat: seat._id, status: 'reserved' },
        { status: 'no-show', end: now, trustGained: -15 }
      );
      if (studentId) {
        await Notification.create({
          type: 'warn', title: 'Reservation expired',
          body: `You didn't check in to ${seat.seatCode} in time, so it was released.`,
          targetRole: 'student', targetUser: studentId,
        });
      }
    }

    res.json({ success: true, count: seats.length, data: seats });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/seats/recommend ─────────────────────────────
exports.recommendSeats = async (req, res, next) => {
  try {
    const { zones, features } = req.query;
    const filter = { status: 'available' };
    if (req.query.floorCode) filter.floorCode = req.query.floorCode;

    let seats = await Seat.find(filter).sort({ row: 1, col: 1 });

    // Score seats by preference match
    const zoneList    = zones    ? zones.split(',')    : [];
    const featureList = features ? features.split(',') : [];

    if (zoneList.length || featureList.length) {
      seats = seats
        .map(s => {
          let score = 0;
          if (zoneList.includes(s.zone)) score += 2;
          featureList.forEach(f => { if (s.features.includes(f)) score += 1; });
          return { ...s.toObject(), _score: score };
        })
        .sort((a, b) => b._score - a._score);
    }

    res.json({ success: true, count: seats.length, data: seats.slice(0, 10) });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/seats/:id/book ─────────────────────────────
// Reserves the seat (does NOT occupy it yet) — student must check in
// within the check-in window once they've physically arrived.
exports.bookSeat = async (req, res, next) => {
  try {
    const seat = await Seat.findById(req.params.id);
    if (!seat) return res.status(404).json({ success: false, message: 'Seat not found.' });
    if (seat.status !== 'available') {
      return res.status(400).json({ success: false, message: `Seat is currently ${seat.status}.` });
    }

    const existing = await Session.findOne({ student: req.user._id, status: { $in: ['active', 'reserved'] } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already have an active reservation or session. Check out first.' });
    }

    const now = new Date();
    const checkInDeadline = new Date(now.getTime() + 10 * 60 * 1000);

    seat.status      = 'reserved';
    seat.occupiedBy  = req.user._id;
    seat.reservedAt  = now;
    seat.checkInDeadline = checkInDeadline;
    seat.sessionStart = null;
    seat.lastUpdated = now;
    await seat.save();

    const session = await Session.create({
      student:   req.user._id,
      seat:      seat._id,
      seatCode:  seat.seatCode,
      floorCode: seat.floorCode,
      start:     now,
      status:    'reserved',
      checkInAt: null,
    });

    await Notification.create({
      type: 'success', title: 'Seat reserved!',
      body: `${seat.seatCode} is held for you. Check in within 10 minutes or it will be released.`,
      targetRole: 'student', targetUser: req.user._id,
    });

    res.status(201).json({ success: true, data: { session, seat } });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/seats/:id/check-in ─────────────────────────
// Student has physically arrived — converts the reservation into an
// active, timed study session.
exports.checkInSeat = async (req, res, next) => {
  try {
    const seat = await Seat.findById(req.params.id);
    if (!seat) return res.status(404).json({ success: false, message: 'Seat not found.' });
    if (seat.occupiedBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'This is not your reservation.' });
    }
    if (seat.status !== 'reserved') {
      return res.status(400).json({ success: false, message: `Seat cannot be checked into from status: ${seat.status}.` });
    }

    const now = new Date();
    seat.status        = 'occupied';
    seat.sessionStart   = now;
    seat.checkInDeadline = null;
    await seat.save();

    const session = await Session.findOneAndUpdate(
      { seat: seat._id, status: 'reserved' },
      { status: 'active', checkInAt: now },
      { new: true }
    );

    res.json({ success: true, message: 'Checked in successfully.', data: { seat, session } });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/seats/:id/cancel ────────────────────────────
// Student cancels their own reservation before checking in.
exports.cancelReservation = async (req, res, next) => {
  try {
    const seat = await Seat.findById(req.params.id);
    if (!seat) return res.status(404).json({ success: false, message: 'Seat not found.' });
    if (seat.occupiedBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'This is not your reservation.' });
    }
    if (seat.status !== 'reserved') {
      return res.status(400).json({ success: false, message: `Cannot cancel — seat status is '${seat.status}', not 'reserved'.` });
    }

    seat.status         = 'available';
    seat.occupiedBy     = null;
    seat.reservedAt      = null;
    seat.checkInDeadline = null;
    await seat.save();

    const session = await Session.findOneAndUpdate(
      { seat: seat._id, status: 'reserved' },
      { status: 'released', end: new Date() },
      { new: true }
    );

    res.json({ success: true, message: 'Reservation cancelled.', data: { seat, session } });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/seats/:id/away ─────────────────────────────
exports.setAway = async (req, res, next) => {
  try {
    const { minutes = 10 } = req.body;
    const seat = await Seat.findById(req.params.id);
    if (!seat) return res.status(404).json({ success: false, message: 'Seat not found.' });
    if (seat.occupiedBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'This is not your seat.' });
    }
    const until = new Date(Date.now() + minutes * 60 * 1000);
    seat.status    = 'away';
    seat.awayUntil = until;
    await seat.save();

    const session = await Session.findOne({ student: req.user._id, status: 'active' });
    if (session) {
      session.awayPeriods.push({ start: new Date() });
      await session.save();
    }

    res.json({ success: true, message: 'Away mode activated.', awayUntil: until, data: seat });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/seats/:id/return ──────────────────────────
exports.returnFromAway = async (req, res, next) => {
  try {
    const seat = await Seat.findById(req.params.id);
    if (!seat) return res.status(404).json({ success: false, message: 'Seat not found.' });
    if (seat.occupiedBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'This is not your seat.' });
    }
    seat.status    = 'occupied';
    seat.awayUntil = null;
    await seat.save();

    const session = await Session.findOne({ student: req.user._id, status: 'active' });
    if (session) {
      const last = session.awayPeriods[session.awayPeriods.length - 1];
      if (last && !last.end) { last.end = new Date(); await session.save(); }
    }

    res.json({ success: true, message: 'Welcome back!', data: seat });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/seats/:id/release  (librarian/admin) ──────
exports.releaseSeat = async (req, res, next) => {
  try {
    const seat = await Seat.findById(req.params.id);
    if (!seat) return res.status(404).json({ success: false, message: 'Seat not found.' });

    const session = await Session.findOne({ seat: seat._id, status: 'active' });
    if (session) {
      session.status = 'released';
      session.end    = new Date();
      session.trustGained = -20;
      await session.save();
      // Deduct trust
      await Student.findByIdAndUpdate(session.student, { $inc: { trustScore: -20 } });
    }

    seat.status      = 'available';
    seat.occupiedBy  = null;
    seat.sessionStart= null;
    seat.awayUntil   = null;
    await seat.save();

    res.json({ success: true, message: 'Seat released.', data: seat });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/seats/:id  (admin/librarian) ─────────────
exports.updateSeat = async (req, res, next) => {
  try {
    const { zone, features, status } = req.body;
    const update = {};
    if (zone)     update.zone     = zone;
    if (features) update.features = features;
    if (status)   update.status   = status;
    update.lastUpdated = new Date();

    const seat = await Seat.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!seat) return res.status(404).json({ success: false, message: 'Seat not found.' });

    res.json({ success: true, data: seat });
  } catch (err) {
    next(err);
  }
};
