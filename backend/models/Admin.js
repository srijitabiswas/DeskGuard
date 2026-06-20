const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const AdminSchema = new mongoose.Schema({
  adminId: { type: String, required: true, unique: true },
  name:    { type: String, required: true },
  email:   { type: String, required: true, unique: true, lowercase: true },
  password:{ type: String, required: true, select: false },
  avatar:  { type: String },
  title:   { type: String, default: 'Library Administrator' },
  role:    { type: String, default: 'admin' },
}, { timestamps: true });

AdminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

AdminSchema.pre('save', function (next) {
  if (!this.avatar && this.name) {
    this.avatar = this.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }
  next();
});

AdminSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('Admin', AdminSchema);
