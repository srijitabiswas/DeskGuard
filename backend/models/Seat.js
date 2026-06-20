const mongoose = require('mongoose');

const SeatSchema = new mongoose.Schema({
  seatCode:    { type: String, required: true, unique: true }, // 'f1-S01'
  label:       { type: String, required: true },               // 'S01'
  floorCode:   { type: String, required: true },
  floor:       { type: mongoose.Schema.Types.ObjectId, ref: 'Floor' },
  row:         { type: Number, required: true },
  col:         { type: Number, required: true },
  zone:        { type: String, required: true, enum: ['silent','group','window','charging','ac','bookshelf'] },
  features:    { type: [String], default: [] },                // ['charging','window','ac']
  status:      { type: String, default: 'available', enum: ['available','occupied','away','reserved','maintenance'] },
  occupiedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
  reservedAt:  { type: Date, default: null },
  checkInDeadline: { type: Date, default: null },
  sessionStart:{ type: Date, default: null },
  awayUntil:   { type: Date, default: null },
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

SeatSchema.index({ floorCode: 1, status: 1 });

module.exports = mongoose.model('Seat', SeatSchema);
