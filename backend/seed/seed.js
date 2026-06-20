require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const Student   = require('../models/Student');
const Librarian = require('../models/Librarian');
const Admin     = require('../models/Admin');
const Floor     = require('../models/Floor');
const Seat      = require('../models/Seat');
const Session   = require('../models/Session');
const Notification = require('../models/Notification');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/deskguard');
  console.log('Connected to MongoDB...');

  // Clear all
  await Promise.all([
    Student.deleteMany(),
    Librarian.deleteMany(),
    Admin.deleteMany(),
    Floor.deleteMany(),
    Seat.deleteMany(),
    Session.deleteMany(),
    Notification.deleteMany(),
  ]);
  console.log('Cleared existing data.');

  // ── Admin ───────────────────────────────────────────────
  const admin = await Admin.create({
    adminId: 'ADM001',
    name: 'Dr. Ramesh Verma',
    email: 'admin@uni.edu',
    password: 'admin123',
    title: 'Library Administrator',
  });
  console.log('✅ Admin created');

  // ── Librarians ──────────────────────────────────────────
  await Librarian.insertMany([
    { librarianId: 'LIB001', name: 'Ms. Kavitha Rao',  email: 'kavitha.rao@uni.edu',  password: 'lib123', floor: 'All Floors' },
    { librarianId: 'LIB002', name: 'Mr. Suresh Kumar', email: 'suresh.kumar@uni.edu', password: 'lib123', floor: 'Ground Floor' },
  ]);
  // manually hash passwords since insertMany skips hooks
  const lib1 = await Librarian.findOne({ librarianId: 'LIB001' });
  const lib2 = await Librarian.findOne({ librarianId: 'LIB002' });
  const salt = await bcrypt.genSalt(10);
  lib1.password = await bcrypt.hash('lib123', salt);
  lib2.password = await bcrypt.hash('lib123', salt);
  await lib1.save(); await lib2.save();
  console.log('✅ Librarians created');

  // ── Students ────────────────────────────────────────────
  const studentData = [
    { studentId: 'STU2024001', name: 'Arjun Sharma',   email: 'arjun.sharma@uni.edu',   dept: 'Computer Science', year: 3, trustScore: 92, activated: true,  password: 'pass123' },
    { studentId: 'STU2024002', name: 'Priya Nair',      email: 'priya.nair@uni.edu',      dept: 'Electronics',      year: 2, trustScore: 78, activated: true,  password: 'pass123' },
    { studentId: 'STU2024003', name: 'Rohan Mehta',     email: 'rohan.mehta@uni.edu',     dept: 'Mechanical',       year: 4, trustScore: 65, activated: true,  password: 'pass123' },
    { studentId: 'STU2024004', name: 'Sneha Reddy',     email: 'sneha.reddy@uni.edu',     dept: 'Computer Science', year: 1, trustScore: 60, activated: false, password: null },
    { studentId: 'STU2024005', name: 'Kabir Singh',     email: 'kabir.singh@uni.edu',     dept: 'Civil',            year: 3, trustScore: 55, activated: true,  password: 'pass123' },
    { studentId: 'STU2024006', name: 'Ananya Iyer',     email: 'ananya.iyer@uni.edu',     dept: 'Mathematics',      year: 2, trustScore: 95, activated: true,  password: 'pass123' },
    { studentId: 'STU2024007', name: 'Vikram Patel',    email: 'vikram.patel@uni.edu',    dept: 'Physics',          year: 4, trustScore: 72, activated: true,  password: 'pass123' },
    { studentId: 'STU2024008', name: 'Meera Das',       email: 'meera.das@uni.edu',       dept: 'Chemistry',        year: 1, trustScore: 60, activated: false, password: null },
    { studentId: 'STU2024009', name: 'Srijita Biswas',  email: 'srijita.biswas@uni.edu',  dept: 'Computer Science', year: 3, trustScore: 90, activated: true,  password: 'pass123' },
    { studentId: 'STU2024010', name: 'Ravi Krishnan',   email: 'ravi.krishnan@uni.edu',   dept: 'Electronics',      year: 2, trustScore: 47, activated: true,  password: 'pass123' },
    { studentId: 'STU2024011', name: 'Tanya Ghosh',     email: 'tanya.ghosh@uni.edu',     dept: 'Biotechnology',    year: 3, trustScore: 83, activated: true,  password: 'pass123' },
    { studentId: 'STU2024012', name: 'Aarav Joshi',     email: 'aarav.joshi@uni.edu',     dept: 'Computer Science', year: 4, trustScore: 76, activated: true,  password: 'pass123' },
  ];

  for (const s of studentData) {
    const { password, ...rest } = s;
    const stu = new Student(rest);
    if (password) stu.password = password;
    await stu.save();
  }
  console.log(`✅ ${studentData.length} students created`);

  // ── Floors ──────────────────────────────────────────────
  const floors = await Floor.insertMany([
    { floorCode: 'f1', name: 'Ground Floor', shortName: 'G', totalSeats: 40, zones: ['silent','group'],           order: 0 },
    { floorCode: 'f2', name: 'First Floor',  shortName: '1', totalSeats: 50, zones: ['silent','window','charging'], order: 1 },
    { floorCode: 'f3', name: 'Second Floor', shortName: '2', totalSeats: 36, zones: ['silent','group','bookshelf'], order: 2 },
  ]);
  console.log('✅ Floors created');

  // ── Seats ───────────────────────────────────────────────
  const floorMap = { f1: floors[0]._id, f2: floors[1]._id, f3: floors[2]._id };
  const STATUSES  = ['available','available','available','occupied','occupied','away','reserved','maintenance'];
  const ZONES     = { f1: ['silent','group'], f2: ['silent','window','charging'], f3: ['silent','group','bookshelf'] };
  const COUNTS    = { f1: 40, f2: 50, f3: 36 };
  const COLS      = 8;

  const seatsToInsert = [];
  for (const [fc, count] of Object.entries(COUNTS)) {
    const zones = ZONES[fc];
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / COLS);
      const col = i % COLS;
      const statusIdx = (i * 7 + Object.keys(COUNTS).indexOf(fc) * 3) % STATUSES.length;
      const zoneIdx   = (i * 3 + Object.keys(COUNTS).indexOf(fc)) % zones.length;
      const feats = [];
      if ((i + Object.keys(COUNTS).indexOf(fc)) % 3 === 0) feats.push('charging');
      if ((i + Object.keys(COUNTS).indexOf(fc)) % 5 === 0) feats.push('window');
      if ((i + Object.keys(COUNTS).indexOf(fc)) % 4 === 0) feats.push('ac');
      seatsToInsert.push({
        seatCode:  `${fc}-S${String(i + 1).padStart(2, '0')}`,
        label:     `S${String(i + 1).padStart(2, '0')}`,
        floorCode: fc,
        floor:     floorMap[fc],
        row, col,
        status:   STATUSES[statusIdx],
        zone:     zones[zoneIdx],
        features: feats,
      });
    }
  }
  await Seat.insertMany(seatsToInsert);
  console.log(`✅ ${seatsToInsert.length} seats created`);

  // ── Sample notifications ─────────────────────────────────
  await Notification.insertMany([
    { type: 'info',    title: 'Welcome to DeskGuard!',        body: 'Book your first seat using the Find Seat page.',            targetRole: 'student' },
    { type: 'success', title: 'System seeded successfully',    body: 'All floors, seats, and user accounts are ready.',           targetRole: 'admin' },
    { type: 'warn',    title: 'Abandoned seat check reminder', body: 'Please check for abandoned seats every hour during peak.',  targetRole: 'librarian' },
  ]);
  console.log('✅ Notifications created');

  console.log('\n🎉 Database seeded successfully!\n');
  console.log('Demo credentials:');
  console.log('  Admin:     admin@uni.edu       / admin123');
  console.log('  Librarian: kavitha.rao@uni.edu  / lib123');
  console.log('  Student:   srijita.biswas@uni.edu / pass123');
  console.log('  Activate:  STU2024004 + sneha.reddy@uni.edu\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
