const jwt      = require('jsonwebtoken');
const Student  = require('../models/Student');
const Librarian= require('../models/Librarian');
const Admin    = require('../models/Admin');

// Generate signed JWT
function signToken(id, role) {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
}

function sendToken(user, role, statusCode, res) {
  const token = signToken(user._id, role);
  const { password, ...userData } = user.toObject ? user.toObject() : user;
  res.status(statusCode).json({
    success: true,
    token,
    user: { ...userData, role },
  });
}

// ─── POST /api/auth/login ─────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Check Admin
    const admin = await Admin.findOne({ email }).select('+password');
    if (admin && await admin.matchPassword(password)) {
      return sendToken(admin, 'admin', 200, res);
    }

    // Check Librarian
    const lib = await Librarian.findOne({ email }).select('+password');
    if (lib && await lib.matchPassword(password)) {
      return sendToken(lib, 'librarian', 200, res);
    }

    // Check Student
    const student = await Student.findOne({ email }).select('+password');
    if (student) {
      if (!student.activated) {
        return res.status(403).json({ success: false, message: 'Account not activated.', studentId: student.studentId });
      }
      if (!student.password) {
        return res.status(403).json({ success: false, message: 'Account not activated. Please set your password.' });
      }
      if (await student.matchPassword(password)) {
        return sendToken(student, 'student', 200, res);
      }
    }

    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/auth/verify-student ────────────────────────
// Step 1 of student activation: verify ID + email exist
exports.verifyStudent = async (req, res, next) => {
  try {
    const { studentId, email } = req.body;
    if (!studentId || !email) {
      return res.status(400).json({ success: false, message: 'Student ID and email required.' });
    }
    const student = await Student.findOne({ studentId, email });
    if (!student) {
      return res.status(404).json({ success: false, message: 'No student record found. Check your Student ID and email.' });
    }
    if (student.activated) {
      return res.status(400).json({ success: false, message: 'Account already activated. Please sign in.' });
    }
    res.json({
      success: true,
      message: 'Identity verified.',
      student: { name: student.name, dept: student.dept, year: student.year, avatar: student.avatar },
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/auth/activate ──────────────────────────────
// Step 2: set password and activate
exports.activateAccount = async (req, res, next) => {
  try {
    const { studentId, email, password } = req.body;
    if (!studentId || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }
    const student = await Student.findOne({ studentId, email });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }
    if (student.activated) {
      return res.status(400).json({ success: false, message: 'Already activated.' });
    }
    student.password  = password;
    student.activated = true;
    await student.save();

    sendToken(student, 'student', 201, res);
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/auth/me ─────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    res.json({ success: true, user: { ...req.user.toObject(), role: req.role } });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/auth/change-password ───────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const student = await Student.findById(req.user._id).select('+password');
    if (!student) return res.status(404).json({ success: false, message: 'User not found.' });
    if (!await student.matchPassword(currentPassword)) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }
    student.password = newPassword;
    await student.save();
    res.json({ success: true, message: 'Password updated.' });
  } catch (err) {
    next(err);
  }
};
