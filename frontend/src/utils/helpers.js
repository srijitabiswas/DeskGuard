import { TRUST_TIERS } from '../data/mockData';

// ─── Format helpers ──────────────────────────────────────
export function fmtDuration(ms) {
  if (!ms || ms < 0) return '0m';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function fmtTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmtRelative(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return fmtDate(ts);
}

export function fmtCountdown(ms) {
  if (!ms || ms <= 0) return '0:00';
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ─── Trust helpers ───────────────────────────────────────
export function getTrustTier(score) {
  return TRUST_TIERS.find(t => score >= t.min) || TRUST_TIERS[TRUST_TIERS.length - 1];
}

export function getTrustColor(score) {
  return getTrustTier(score).color;
}

export function calcTrustDelta(event) {
  const events = {
    'session_complete': +20,
    'early_checkin': +5,
    'break_respected': +5,
    'no_show': -15,
    'overstay': -10,
    'seat_abandoned': -20,
    'buddy_complete': +10,
  };
  return events[event] || 0;
}

// ─── Seat helpers ────────────────────────────────────────
export function getSeatStatusColor(status) {
  const map = {
    available: '#059669',
    occupied:  '#DC2626',
    away:      '#D97706',
    reserved:  '#7C3AED',
    maintenance: '#94A3B8',
  };
  return map[status] || '#94A3B8';
}

export function getSeatStatusLabel(status) {
  const map = {
    available: 'Available',
    occupied:  'Occupied',
    away:      'Away',
    reserved:  'Reserved',
    maintenance: 'Maintenance',
  };
  return map[status] || status;
}

export function getSeatStatusBg(status) {
  const map = {
    available: '#ECFDF5',
    occupied:  '#FEF2F2',
    away:      '#FFFBEB',
    reserved:  '#F5F3FF',
    maintenance: '#F8FAFC',
  };
  return map[status] || '#F8FAFC';
}

export function filterSeatsByPreferences(seats, prefs) {
  if (!prefs || prefs.length === 0) return seats;
  return seats.filter(seat => {
    const matchZone = prefs.some(p => seat.zone === p);
    const matchFeature = prefs.some(p => seat.features.includes(p));
    return matchZone || matchFeature;
  });
}

export function getOccupancyPct(seats) {
  if (!seats.length) return 0;
  const occupied = seats.filter(s => s.status === 'occupied' || s.status === 'away' || s.status === 'reserved').length;
  return Math.round((occupied / seats.length) * 100);
}

// ─── Forecast helpers ────────────────────────────────────
export function getBestStudyTime(forecast) {
  const lowest = [...forecast].sort((a, b) => a.pct - b.pct);
  const best = lowest.find(h => {
    const hourNum = parseInt(h.hour);
    const isPM = h.hour.includes('PM');
    const hour24 = isPM && hourNum !== 12 ? hourNum + 12 : hourNum;
    return hour24 >= 8 && hour24 <= 20;
  });
  return best?.hour || '7 AM';
}

// ─── Misc ────────────────────────────────────────────────
export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

// ─── Live forecast (changes gently over time instead of being static) ──
export function getLiveForecast(baseForecast) {
  const t = Date.now() / 1000;
  return baseForecast.map((h, i) => {
    const wobble = Math.round(Math.sin(t / 240 + i * 0.7) * 6 + Math.sin(t / 53 + i) * 2);
    return { ...h, pct: clamp(h.pct + wobble, 3, 99) };
  });
}

// ─── Two-phase session helpers (reserved -> checked-in -> active) ──────
// A session is "reserved" from booking until the student checks in.
// effectiveStart() returns the timestamp that should count toward study time.
export function effectiveStart(session) {
  return session?.checkInAt || session?.start;
}

export function isAwaitingCheckIn(session) {
  return session?.status === 'reserved' && !session?.checkInAt;
}

export function generateId(prefix = 'ID') {
  return `${prefix}${Date.now().toString(36).toUpperCase()}`;
}

export function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function getStudyStreak(sessions) {
  if (!sessions.length) return 0;
  const days = new Set(sessions.filter(s => s.status === 'completed').map(s =>
    new Date(s.start).toDateString()
  ));
  let streak = 0;
  let d = new Date();
  while (days.has(d.toDateString())) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function getTodayStudyMs(sessions) {
  const today = new Date().toDateString();
  return sessions
    .filter(s => new Date(s.start).toDateString() === today && s.status === 'completed')
    .reduce((sum, s) => sum + ((s.end || Date.now()) - s.start), 0);
}

export function getWeekStudyMs(sessions) {
  const weekAgo = Date.now() - 7 * 86400000;
  return sessions
    .filter(s => s.start >= weekAgo && s.status === 'completed')
    .reduce((sum, s) => sum + ((s.end || Date.now()) - s.start), 0);
}
