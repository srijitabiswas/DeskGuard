const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  type:       { type: String, required: true, enum: ['info','success','warn','alert'] },
  title:      { type: String, required: true },
  body:       { type: String, required: true },
  targetRole: { type: String, required: true, enum: ['student','librarian','admin','all'] },
  targetUser: { type: mongoose.Schema.Types.ObjectId, default: null }, // null = broadcast
  read:       { type: Boolean, default: false },
  readBy:     [{ type: mongoose.Schema.Types.ObjectId }],
}, { timestamps: true });

NotificationSchema.index({ targetRole: 1, createdAt: -1 });
NotificationSchema.index({ targetUser: 1, read: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
