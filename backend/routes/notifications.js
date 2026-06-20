// routes/notifications.js
const nRouter = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { getNotifications, createNotification, markRead, markAllRead } = require('../controllers/notificationController');

nRouter.get('/',              protect, getNotifications);
nRouter.post('/',             protect, authorize('admin','librarian'), createNotification);
nRouter.patch('/read-all',    protect, markAllRead);
nRouter.patch('/:id/read',   protect, markRead);

module.exports = nRouter;
