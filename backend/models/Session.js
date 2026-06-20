const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  student:      { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  seat:         { type: mongoose.Schema.Types.ObjectId, ref: 'Seat',    required: true },
  seatCode:     { type: String, required: true },
  floorCode:    { type: String, required: true },
  start:        { type: Date, required: true, default: Date.now },
  end:          { type: Date, default: null },
  status:       { type: String, default: 'reserved', enum: ['reserved','active','completed','no-show','released'] },
  trustGained:  { type: Number, default: 0 },
  awayPeriods:  [{ start: Date, end: Date }],
  checkInAt:    { type: Date, default: null },
  isBuddySession:{ type: Boolean, default: false },
  buddyGroup:   { type: String, default: null }, // shared group ID
}, { timestamps: true });

SessionSchema.index({ student: 1, status: 1 });
SessionSchema.index({ start: -1 });

// Auto-compute duration
SessionSchema.virtual('durationMs').get(function () {
  if (!this.end) return Date.now() - this.start;
  return this.end - this.start;
});

module.exports = mongoose.model('Session', SessionSchema);
