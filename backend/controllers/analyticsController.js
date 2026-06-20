const Session  = require('../models/Session');
const Seat     = require('../models/Seat');
const Student  = require('../models/Student');
const Floor    = require('../models/Floor');

// GET /api/analytics/overview
exports.getOverview = async (req, res, next) => {
  try {
    const [totalSessions, activeSessions, students, seats] = await Promise.all([
      Session.countDocuments(),
      Session.countDocuments({ status: 'active' }),
      Student.find().select('trustScore activated'),
      Seat.find().select('status floorCode'),
    ]);

    const completed = await Session.countDocuments({ status: 'completed' });
    const noShows   = await Session.countDocuments({ status: 'no-show' });
    const avgTrust  = students.length
      ? Math.round(students.reduce((s, u) => s + u.trustScore, 0) / students.length)
      : 0;

    const seatsByStatus = seats.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {});

    const completionRate = totalSessions
      ? Math.round((completed / totalSessions) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        totalSessions, activeSessions, completed, noShows,
        completionRate, avgTrust,
        students: { total: students.length, activated: students.filter(s => s.activated).length },
        seats: { total: seats.length, ...seatsByStatus },
        occupancyPct: seats.length
          ? Math.round(((seatsByStatus.occupied || 0) + (seatsByStatus.away || 0)) / seats.length * 100)
          : 0,
      },
    });
  } catch (err) { next(err); }
};

// GET /api/analytics/weekly
exports.getWeekly = async (req, res, next) => {
  try {
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    const sessions = await Session.find({ start: { $gte: weekAgo }, status: 'completed' })
      .select('start end');

    const days = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toLocaleDateString('en-US', { weekday: 'short' });
      days[key] = { sessions: 0, totalMs: 0 };
    }

    sessions.forEach(s => {
      const key = s.start.toLocaleDateString('en-US', { weekday: 'short' });
      if (days[key]) {
        days[key].sessions++;
        days[key].totalMs += (s.end - s.start);
      }
    });

    const data = Object.entries(days).map(([day, v]) => ({
      day,
      sessions: v.sessions,
      avgDuration: v.sessions ? Math.round(v.totalMs / v.sessions / 60000) : 0,
    }));

    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// GET /api/analytics/floor-stats
exports.getFloorStats = async (req, res, next) => {
  try {
    const floors = await Floor.find().sort({ order: 1 });
    const seats  = await Seat.find().select('status floorCode');

    const data = floors.map(f => {
      const flSeats = seats.filter(s => s.floorCode === f.floorCode);
      const occ = flSeats.filter(s => ['occupied','away'].includes(s.status)).length;
      return {
        floorCode: f.floorCode,
        name: f.name,
        total: flSeats.length,
        available: flSeats.filter(s => s.status === 'available').length,
        occupied: flSeats.filter(s => s.status === 'occupied').length,
        away: flSeats.filter(s => s.status === 'away').length,
        occupancyPct: flSeats.length ? Math.round((occ / flSeats.length) * 100) : 0,
      };
    });

    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// GET /api/analytics/trust-distribution
exports.getTrustDistribution = async (req, res, next) => {
  try {
    const students = await Student.find().select('trustScore');
    const dist = {
      elite:  students.filter(s => s.trustScore >= 90).length,
      high:   students.filter(s => s.trustScore >= 75 && s.trustScore < 90).length,
      medium: students.filter(s => s.trustScore >= 55 && s.trustScore < 75).length,
      low:    students.filter(s => s.trustScore < 55).length,
      avg:    students.length ? Math.round(students.reduce((a, s) => a + s.trustScore, 0) / students.length) : 0,
    };
    res.json({ success: true, data: dist });
  } catch (err) { next(err); }
};

// GET /api/analytics/zone-usage
exports.getZoneUsage = async (req, res, next) => {
  try {
    const sessions = await Session.find({ status: 'completed' }).populate('seat', 'zone');
    const zones = {};
    sessions.forEach(s => {
      const z = s.seat?.zone || 'unknown';
      zones[z] = (zones[z] || 0) + 1;
    });
    const data = Object.entries(zones)
      .map(([zone, count]) => ({ zone, sessions: count }))
      .sort((a, b) => b.sessions - a.sessions);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
