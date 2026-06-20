const jwt = require('jsonwebtoken');
const Student   = require('../models/Student');
const Librarian = require('../models/Librarian');
const Admin     = require('../models/Admin');

// Verify token and attach user to req
exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorised — no token.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Find user across all roles
    let user = await Admin.findById(decoded.id).select('-password');
    if (!user) user = await Librarian.findById(decoded.id).select('-password');
    if (!user) user = await Student.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ success: false, message: 'User no longer exists.' });

    req.user = user;
    req.role = decoded.role;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

// Role-based access control
exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.role)) {
    return res.status(403).json({
      success: false,
      message: `Role '${req.role}' is not authorised to access this route.`,
    });
  }
  next();
};
