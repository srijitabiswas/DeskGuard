const Notification = require('../models/Notification');

// GET /api/notifications
exports.getNotifications = async (req, res, next) => {
  try {
    const filter = {
      $or: [
        { targetRole: req.role },
        { targetRole: 'all' },
        { targetUser: req.user._id },
      ],
    };
    if (req.query.unread === 'true') {
      filter.readBy = { $ne: req.user._id };
    }
    const notifs = await Notification.find(filter).sort({ createdAt: -1 }).limit(50);
    const withRead = notifs.map(n => ({
      ...n.toObject(),
      read: n.readBy.some(id => id.toString() === req.user._id.toString()),
    }));
    res.json({ success: true, count: notifs.length, data: withRead });
  } catch (err) { next(err); }
};

// POST /api/notifications (admin/librarian broadcast)
exports.createNotification = async (req, res, next) => {
  try {
    const notif = await Notification.create(req.body);
    res.status(201).json({ success: true, data: notif });
  } catch (err) { next(err); }
};

// PATCH /api/notifications/:id/read
exports.markRead = async (req, res, next) => {
  try {
    const notif = await Notification.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { readBy: req.user._id } },
      { new: true }
    );
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found.' });
    res.json({ success: true, data: notif });
  } catch (err) { next(err); }
};

// PATCH /api/notifications/read-all
exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { $or: [{ targetRole: req.role }, { targetRole: 'all' }, { targetUser: req.user._id }] },
      { $addToSet: { readBy: req.user._id } }
    );
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) { next(err); }
};
