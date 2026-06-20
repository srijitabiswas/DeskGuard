const Student  = require('../models/Student');
const multer   = require('multer');
const XLSX     = require('xlsx');

// GET /api/students
exports.getStudents = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.dept)      filter.dept      = req.query.dept;
    if (req.query.year)      filter.year      = parseInt(req.query.year);
    if (req.query.activated) filter.activated = req.query.activated === 'true';
    if (req.query.q) {
      const re = new RegExp(req.query.q, 'i');
      filter.$or = [{ name: re }, { studentId: re }, { email: re }];
    }

    const students = await Student.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit) || 200);

    res.json({ success: true, count: students.length, data: students });
  } catch (err) { next(err); }
};

// GET /api/students/:id
exports.getStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id).select('-password');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
    res.json({ success: true, data: student });
  } catch (err) { next(err); }
};

// POST /api/students  (admin only)
exports.createStudent = async (req, res, next) => {
  try {
    const { studentId, name, email, dept, year } = req.body;
    if (!studentId || !name || !email || !dept || !year) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    const student = await Student.create({ studentId, name, email, dept, year });
    res.status(201).json({ success: true, data: student });
  } catch (err) { next(err); }
};

// PUT /api/students/:id  (admin only)
exports.updateStudent = async (req, res, next) => {
  try {
    const { name, email, dept, year, trustScore } = req.body;
    const update = {};
    if (name)       update.name       = name;
    if (email)      update.email      = email;
    if (dept)       update.dept       = dept;
    if (year)       update.year       = year;
    if (trustScore !== undefined) update.trustScore = Math.min(100, Math.max(0, trustScore));

    const student = await Student.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).select('-password');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
    res.json({ success: true, data: student });
  } catch (err) { next(err); }
};

// DELETE /api/students/:id  (admin only)
exports.deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
    res.json({ success: true, message: 'Student deleted.' });
  } catch (err) { next(err); }
};

// POST /api/students/import  (admin only) — Excel/CSV upload
const upload = multer({ storage: multer.memoryStorage() });
exports.uploadMiddleware = upload.single('file');

exports.importStudents = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet    = workbook.Sheets[workbook.SheetNames[0]];
    const rows     = XLSX.utils.sheet_to_json(sheet);

    const results = { created: 0, skipped: 0, errors: [] };

    for (const row of rows) {
      try {
        const studentId = String(row.StudentID || row.studentId || '').trim().toUpperCase();
        const name      = String(row.Name || row.name || '').trim();
        const email     = String(row.Email || row.email || '').trim().toLowerCase();
        const dept      = String(row.Department || row.dept || '').trim();
        const year      = parseInt(row.Year || row.year || 1);

        if (!studentId || !name || !email || !dept) {
          results.errors.push({ row: JSON.stringify(row), reason: 'Missing required fields' });
          continue;
        }

        const exists = await Student.findOne({ $or: [{ studentId }, { email }] });
        if (exists) { results.skipped++; continue; }

        await Student.create({ studentId, name, email, dept, year });
        results.created++;
      } catch (rowErr) {
        results.errors.push({ row: JSON.stringify(row), reason: rowErr.message });
      }
    }

    res.json({ success: true, message: `Import complete. ${results.created} created, ${results.skipped} skipped.`, data: results });
  } catch (err) { next(err); }
};

// PATCH /api/students/:id/trust  (admin only)
exports.adjustTrust = async (req, res, next) => {
  try {
    const { delta, reason } = req.body;
    if (delta === undefined) return res.status(400).json({ success: false, message: 'delta required.' });

    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    student.trustScore = Math.min(100, Math.max(0, student.trustScore + delta));
    await student.save();

    res.json({ success: true, data: { trustScore: student.trustScore }, message: `Trust score adjusted by ${delta}. Reason: ${reason || 'Admin action.'}` });
  } catch (err) { next(err); }
};
