// ─── Floors ───────────────────────────────────────────────
export const FLOORS = [
  { id: 'f1', name: 'Ground Floor', shortName: 'G', totalSeats: 40, zones: ['Silent Zone', 'Group Study'] },
  { id: 'f2', name: 'First Floor',  shortName: '1', totalSeats: 50, zones: ['Silent Zone', 'Near Window', 'Charging Zone'] },
  { id: 'f3', name: 'Second Floor', shortName: '2', totalSeats: 36, zones: ['Silent Zone', 'Group Study', 'Near Bookshelves'] },
];

// ─── Zone types ──────────────────────────────────────────
export const ZONE_TYPES = [
  { id: 'silent',     label: 'Silent Zone',         icon: '🔇', color: '#2563EB' },
  { id: 'group',      label: 'Group Study Zone',    icon: '👥', color: '#7C3AED' },
  { id: 'window',     label: 'Near Window',         icon: '🌤️', color: '#0891B2' },
  { id: 'charging',   label: 'Charging Port',       icon: '⚡', color: '#D97706' },
  { id: 'ac',         label: 'Air Conditioned',     icon: '❄️', color: '#059669' },
  { id: 'bookshelf',  label: 'Near Bookshelves',    icon: '📚', color: '#92400E' },
];

// ─── Generate seats for a floor ─────────────────────────
function generateSeats(floorId, count, floorIdx) {
  const statuses = ['available','available','available','occupied','occupied','away','reserved','maintenance'];
  const zones = ['silent','group','window','charging','ac','bookshelf'];
  const features = ['charging','window','ac'];
  const seats = [];
  const cols = 8;
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const statusSeed = (i * 7 + floorIdx * 3) % statuses.length;
    const zoneSeed   = (i * 3 + floorIdx)     % zones.length;
    const seatFeats  = [];
    if ((i + floorIdx) % 3 === 0) seatFeats.push('charging');
    if ((i + floorIdx) % 5 === 0) seatFeats.push('window');
    if ((i + floorIdx) % 4 === 0) seatFeats.push('ac');
    seats.push({
      id:      `${floorId}-S${String(i+1).padStart(2,'0')}`,
      label:   `S${String(i+1).padStart(2,'0')}`,
      floorId,
      row, col,
      status:  statuses[statusSeed],
      zone:    zones[zoneSeed],
      features: seatFeats,
      occupiedBy: statuses[statusSeed] === 'occupied' ? `STU${1000 + i}` : null,
      sessionStart: statuses[statusSeed] === 'occupied' ? Date.now() - (i % 4) * 3600000 : null,
      awayUntil:   statuses[statusSeed] === 'away'     ? Date.now() + 600000 : null,
    });
  }
  return seats;
}

export const ALL_SEATS = [
  ...generateSeats('f1', 40, 0),
  ...generateSeats('f2', 50, 1),
  ...generateSeats('f3', 36, 2),
];

// ─── Students ────────────────────────────────────────────
export const STUDENTS = [
  { id: 'STU2024001', name: 'Arjun Sharma',    email: 'arjun.sharma@uni.edu',    dept: 'Computer Science',    year: 3, avatar: 'AS', trustScore: 92, activated: true,  password: 'pass123' },
  { id: 'STU2024002', name: 'Priya Nair',       email: 'priya.nair@uni.edu',       dept: 'Electronics',         year: 2, avatar: 'PN', trustScore: 78, activated: true,  password: 'pass123' },
  { id: 'STU2024003', name: 'Rohan Mehta',      email: 'rohan.mehta@uni.edu',      dept: 'Mechanical',          year: 4, avatar: 'RM', trustScore: 65, activated: true,  password: 'pass123' },
  { id: 'STU2024004', name: 'Sneha Reddy',      email: 'sneha.reddy@uni.edu',      dept: 'Computer Science',    year: 1, avatar: 'SR', trustScore: 88, activated: false, password: null },
  { id: 'STU2024005', name: 'Kabir Singh',      email: 'kabir.singh@uni.edu',      dept: 'Civil',               year: 3, avatar: 'KS', trustScore: 55, activated: true,  password: 'pass123' },
  { id: 'STU2024006', name: 'Ananya Iyer',      email: 'ananya.iyer@uni.edu',      dept: 'Mathematics',         year: 2, avatar: 'AI', trustScore: 95, activated: true,  password: 'pass123' },
  { id: 'STU2024007', name: 'Vikram Patel',     email: 'vikram.patel@uni.edu',     dept: 'Physics',             year: 4, avatar: 'VP', trustScore: 72, activated: true,  password: 'pass123' },
  { id: 'STU2024008', name: 'Meera Das',        email: 'meera.das@uni.edu',        dept: 'Chemistry',           year: 1, avatar: 'MD', trustScore: 81, activated: false, password: null },
  { id: 'STU2024009', name: 'Srijita Biswas',   email: 'srijita.biswas@uni.edu',   dept: 'Computer Science',    year: 3, avatar: 'SB', trustScore: 90, activated: true,  password: 'pass123' },
  { id: 'STU2024010', name: 'Ravi Krishnan',    email: 'ravi.krishnan@uni.edu',    dept: 'Electronics',         year: 2, avatar: 'RK', trustScore: 47, activated: true,  password: 'pass123' },
  { id: 'STU2024011', name: 'Tanya Ghosh',      email: 'tanya.ghosh@uni.edu',      dept: 'Biotechnology',       year: 3, avatar: 'TG', trustScore: 83, activated: true,  password: 'pass123' },
  { id: 'STU2024012', name: 'Aarav Joshi',      email: 'aarav.joshi@uni.edu',      dept: 'Computer Science',    year: 4, avatar: 'AJ', trustScore: 76, activated: true,  password: 'pass123' },
];

// ─── Librarians ──────────────────────────────────────────
export const LIBRARIANS = [
  { id: 'LIB001', name: 'Ms. Kavitha Rao',  email: 'kavitha.rao@uni.edu',  avatar: 'KR', floor: 'All Floors', password: 'lib123' },
  { id: 'LIB002', name: 'Mr. Suresh Kumar', email: 'suresh.kumar@uni.edu', avatar: 'SK', floor: 'Ground Floor', password: 'lib123' },
];

// ─── Admin ──────────────────────────────────────────────
export const ADMINS = [
  { id: 'ADM001', name: 'Dr. Ramesh Verma', email: 'admin@uni.edu', avatar: 'RV', title: 'Library Administrator', password: 'admin123' },
];

// ─── Sessions ────────────────────────────────────────────
const now = Date.now();
export const SESSIONS = [
  { id: 'SES001', studentId: 'STU2024001', seatId: 'f2-S05', floorId: 'f2', start: now - 5400000,  end: null,         status: 'active',    trustGained: 10 },
  { id: 'SES002', studentId: 'STU2024009', seatId: 'f1-S12', floorId: 'f1', start: now - 7200000,  end: null,         status: 'active',    trustGained: 15 },
  { id: 'SES003', studentId: 'STU2024002', seatId: 'f3-S08', floorId: 'f3', start: now - 86400000, end: now - 79200000, status: 'completed', trustGained: 20 },
  { id: 'SES004', studentId: 'STU2024009', seatId: 'f2-S20', floorId: 'f2', start: now - 172800000,end: now - 165600000,status: 'completed', trustGained: 20 },
  { id: 'SES005', studentId: 'STU2024009', seatId: 'f1-S03', floorId: 'f1', start: now - 259200000,end: now - 252000000,status: 'completed', trustGained: 20 },
  { id: 'SES006', studentId: 'STU2024009', seatId: 'f3-S15', floorId: 'f3', start: now - 345600000,end: now - 338400000,status: 'completed', trustGained: 15 },
  { id: 'SES007', studentId: 'STU2024009', seatId: 'f2-S07', floorId: 'f2', start: now - 432000000,end: now - 424800000,status: 'completed', trustGained: 20 },
  { id: 'SES008', studentId: 'STU2024001', seatId: 'f1-S09', floorId: 'f1', start: now - 86400000, end: now - 79200000, status: 'completed', trustGained: 20 },
  { id: 'SES009', studentId: 'STU2024001', seatId: 'f2-S14', floorId: 'f2', start: now - 172800000,end: now - 172000000,status: 'no-show',   trustGained: -15 },
];

// ─── Notifications ──────────────────────────────────────
export const NOTIFICATIONS = [
  { id: 'N1', type: 'info',    title: 'Silent Zone is quiet now',      body: 'Low occupancy on Floor 2 Silent Zone — great time to study!', time: now - 600000,  read: false, targetRole: 'student' },
  { id: 'N2', type: 'success', title: 'You earned 10 trust points',    body: 'Great session! Your Responsible Study Score increased.',      time: now - 1800000, read: false, targetRole: 'student' },
  { id: 'N3', type: 'warn',    title: 'Seat expires in 5 minutes',     body: 'Your seat F2-S05 reservation will expire soon.',             time: now - 300000,  read: true,  targetRole: 'student' },
  { id: 'N4', type: 'alert',   title: 'Abandoned seat detected',       body: 'Seat F1-S22 appears abandoned for 45 minutes.',              time: now - 900000,  read: false, targetRole: 'librarian' },
  { id: 'N5', type: 'info',    title: 'Peak hours approaching',        body: 'Library usually fills up between 2–5 PM. Plan accordingly.', time: now - 3600000, read: true,  targetRole: 'student' },
];

// ─── Occupancy Forecast ──────────────────────────────────
export const HOURLY_FORECAST = [
  { hour: '7 AM',  pct: 5  }, { hour: '8 AM',  pct: 15 }, { hour: '9 AM',  pct: 40 },
  { hour: '10 AM', pct: 65 }, { hour: '11 AM', pct: 72 }, { hour: '12 PM', pct: 85 },
  { hour: '1 PM',  pct: 90 }, { hour: '2 PM',  pct: 95 }, { hour: '3 PM',  pct: 88 },
  { hour: '4 PM',  pct: 80 }, { hour: '5 PM',  pct: 60 }, { hour: '6 PM',  pct: 40 },
  { hour: '7 PM',  pct: 55 }, { hour: '8 PM',  pct: 70 }, { hour: '9 PM',  pct: 45 },
];

// ─── Weekly Analytics ────────────────────────────────────
export const WEEKLY_USAGE = [
  { day: 'Mon', sessions: 142, avgDuration: 95 },
  { day: 'Tue', sessions: 168, avgDuration: 102 },
  { day: 'Wed', sessions: 185, avgDuration: 115 },
  { day: 'Thu', sessions: 201, avgDuration: 108 },
  { day: 'Fri', sessions: 177, avgDuration: 98  },
  { day: 'Sat', sessions: 94,  avgDuration: 120 },
  { day: 'Sun', sessions: 61,  avgDuration: 85  },
];

// ─── Departments ─────────────────────────────────────────
export const DEPARTMENTS = [
  'Computer Science', 'Electronics', 'Mechanical', 'Civil',
  'Mathematics', 'Physics', 'Chemistry', 'Biotechnology',
  'Management', 'Law', 'Architecture',
];

// ─── Trust score tiers ──────────────────────────────────
export const TRUST_TIERS = [
  { min: 90, label: 'Elite Scholar',     color: '#2563EB', bg: '#EFF6FF', badge: '🏆' },
  { min: 75, label: 'Responsible',       color: '#059669', bg: '#ECFDF5', badge: '⭐' },
  { min: 55, label: 'Regular',           color: '#D97706', bg: '#FFFBEB', badge: '📖' },
  { min:  0, label: 'Needs Improvement', color: '#DC2626', bg: '#FEF2F2', badge: '⚠️' },
];

// ─── Study zone preference tags ─────────────────────────
export const PREFERENCE_TAGS = [
  { id: 'silent',    label: 'Silent Zone',      icon: '🔇' },
  { id: 'group',     label: 'Group Study',      icon: '👥' },
  { id: 'window',    label: 'Near Window',      icon: '🌤️' },
  { id: 'charging',  label: 'Charging Port',    icon: '⚡' },
  { id: 'ac',        label: 'Air Conditioned',  icon: '❄️' },
  { id: 'bookshelf', label: 'Near Bookshelves', icon: '📚' },
];

// ─── FAQs ────────────────────────────────────────────────
export const FAQS = [
  {
    q: 'How do I reserve a seat?',
    a: "Go to Find Seat or the Map tab, pick an available seat, and confirm. Your seat is held as 'Reserved' for 10 minutes — check in once you're physically at the desk to start your study session.",
  },
  {
    q: "What happens if I don't check in?",
    a: "If you don't check in within 10 minutes of booking, your reservation expires automatically and the seat becomes available again for other students. This keeps the library fair for everyone.",
  },
  {
    q: 'What is Away Mode?',
    a: "Away Mode lets you step out for up to 10 minutes (e.g. a bathroom break) without losing your seat. Your desk shows as 'Away' to others. If you don't return in time, the seat is released automatically.",
  },
  {
    q: 'How does the Responsible Study Score work?',
    a: 'It is a trust score from 0–100 based on your study habits. You gain points for completing sessions and respecting timers, and lose points for no-shows or abandoning a seat. Higher scores unlock priority access during peak hours.',
  },
  {
    q: 'Can I study with friends?',
    a: 'Yes — enable Buddy Study Mode on the Find Seat page to reserve adjacent seats for groups of 2–6 people.',
  },
  {
    q: 'How is occupancy forecast calculated?',
    a: 'DeskGuard analyses historical usage patterns to predict busy and quiet hours, so you can plan when to arrive for the best chance of finding a seat.',
  },
  {
    q: 'Can I change my Department or Year?',
    a: 'These fields are managed by your library administrator. Contact the front desk if you need a correction.',
  },
  {
    q: 'What happens during Emergency Mode?',
    a: 'If a librarian activates Emergency Mode, the affected floor is marked unavailable and all students receive a broadcast notice. Please follow posted instructions and library staff guidance.',
  },
];

