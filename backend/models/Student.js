const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const StudentSchema = new mongoose.Schema({
  studentId:  { type: String, required: true, unique: true, uppercase: true, trim: true },
  name:       { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:   { type: String, select: false },
  dept:       { type: String, required: true },
  year:       { type: Number, required: true, min: 1, max: 6 },
  avatar:     { type: String }, // initials e.g. "AS"
  activated:  { type: Boolean, default: false },
  trustScore: { type: Number, default: 60, min: 0, max: 100 },
  preferences:{ type: [String], default: [] }, // zone preferences
  studyStreak:{ type: Number, default: 0 },
  totalStudyMs:{ type: Number, default: 0 },
  badges:     { type: [String], default: [] },
  role:       { type: String, default: 'student' },
}, { timestamps: true });

// Hash password before save
StudentSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
StudentSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

// Set avatar from name
StudentSchema.pre('save', function (next) {
  if (!this.avatar && this.name) {
    this.avatar = this.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Student', StudentSchema);
