// ═══════════════════════════════════════════════════════
// floorController.js
// ═══════════════════════════════════════════════════════
const Floor = require('../models/Floor');
const Seat  = require('../models/Seat');

exports.getFloors = async (req, res, next) => {
  try {
    const floors = await Floor.find().sort({ order: 1 });
    res.json({ success: true, data: floors });
  } catch (err) { next(err); }
};

exports.createFloor = async (req, res, next) => {
  try {
    const floor = await Floor.create(req.body);
    res.status(201).json({ success: true, data: floor });
  } catch (err) { next(err); }
};

exports.updateFloor = async (req, res, next) => {
  try {
    const floor = await Floor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!floor) return res.status(404).json({ success: false, message: 'Floor not found.' });
    res.json({ success: true, data: floor });
  } catch (err) { next(err); }
};

exports.toggleEmergency = async (req, res, next) => {
  try {
    const { enabled, message } = req.body;
    const floor = await Floor.findByIdAndUpdate(
      req.params.id,
      { isEmergency: enabled, emergencyMessage: message || '' },
      { new: true }
    );
    if (!floor) return res.status(404).json({ success: false, message: 'Floor not found.' });

    if (enabled) {
      await Seat.updateMany({ floorCode: floor.floorCode }, { status: 'maintenance' });
    } else {
      await Seat.updateMany({ floorCode: floor.floorCode, status: 'maintenance' }, { status: 'available' });
    }

    const Notification = require('../models/Notification');
    await Notification.create({
      type: enabled ? 'alert' : 'info',
      title: enabled ? `🚨 Emergency on ${floor.name}` : `${floor.name} reopened`,
      body: enabled ? (message || 'Emergency mode activated.') : `${floor.name} is now open.`,
      targetRole: 'all',
    });

    res.json({ success: true, data: floor });
  } catch (err) { next(err); }
};

exports.getFloorStats = async (req, res, next) => {
  try {
    const floor = await Floor.findById(req.params.id);
    if (!floor) return res.status(404).json({ success: false, message: 'Floor not found.' });
    const seats = await Seat.find({ floorCode: floor.floorCode });
    const stats = {
      total:       seats.length,
      available:   seats.filter(s => s.status === 'available').length,
      occupied:    seats.filter(s => s.status === 'occupied').length,
      away:        seats.filter(s => s.status === 'away').length,
      reserved:    seats.filter(s => s.status === 'reserved').length,
      maintenance: seats.filter(s => s.status === 'maintenance').length,
    };
    stats.occupancyPct = Math.round(((stats.occupied + stats.away + stats.reserved) / stats.total) * 100);
    res.json({ success: true, data: { floor, stats } });
  } catch (err) { next(err); }
};
