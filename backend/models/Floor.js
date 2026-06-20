const mongoose = require('mongoose');

const FloorSchema = new mongoose.Schema({
  floorCode:  { type: String, required: true, unique: true }, // 'f1','f2','f3'
  name:       { type: String, required: true },               // 'Ground Floor'
  shortName:  { type: String, required: true },               // 'G'
  totalSeats: { type: Number, required: true },
  zones:      { type: [String], default: [] },
  isActive:   { type: Boolean, default: true },
  isEmergency:{ type: Boolean, default: false },
  emergencyMessage: { type: String, default: '' },
  order:      { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Floor', FloorSchema);
