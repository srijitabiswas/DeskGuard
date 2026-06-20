import React, { createContext, useContext, useReducer, useEffect, useCallback, useState, useRef } from 'react';
import { ALL_SEATS, SESSIONS, NOTIFICATIONS, STUDENTS, LIBRARIANS, ADMINS } from '../data/mockData';
import { generateId } from '../utils/helpers';
import { authAPI, seatsAPI, sessionsAPI, notificationsAPI, floorsAPI, studentsAPI, saveToken, clearToken } from '../utils/api';

const CHECK_IN_WINDOW_MS = 10 * 60 * 1000; // 10 minutes to check in after reserving
const AWAY_WINDOW_MS     = 10 * 60 * 1000; // 10 minutes away mode

// ─── Auth Context ─────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dg_auth')) || null; }
    catch { return null; }
  });
  const [apiMode, setApiMode] = useState(false);

  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || '') + '/api/health')
      .then(r => r.ok ? setApiMode(true) : null)
      .catch(() => setApiMode(false));
  }, []);

  const login = useCallback(async (emailOrUser, password) => {
    if (typeof emailOrUser === 'object') {
      const payload = { ...emailOrUser, loginAt: Date.now() };
      localStorage.setItem('dg_auth', JSON.stringify(payload));
      setAuth(payload);
      return payload;
    }
    const data = await authAPI.login(emailOrUser, password);
    saveToken(data.token);
    const payload = { ...data.user, id: data.user.id || data.user._id, loginAt: Date.now() };
    localStorage.setItem('dg_auth', JSON.stringify(payload));
    setAuth(payload);
    return payload;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    localStorage.removeItem('dg_auth');
    setAuth(null);
  }, []);

  const updateAuth = useCallback((updates) => {
    setAuth(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem('dg_auth', JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ auth, login, logout, updateAuth, apiMode }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() { return useContext(AuthContext); }

// ─── App Context ─────────────────────────────────────────
const AppContext = createContext(null);

const initialState = {
  seats: ALL_SEATS,
  sessions: SESSIONS,
  students: STUDENTS,
  notifications: NOTIFICATIONS,
  toasts: [],
  activeSession: null,
  emergencyMode: false,
  emergencyMessage: '',
  awayMode: null,
  selectedFloor: 'f1',
  seatPreferences: [],
  floors: [],
};

export function matchSeat(s, id) { return s.id === id || s._id === id || s.seatCode === id; }
export function matchSession(s, id) { return s.id === id || s._id === id; }

function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, ...action.payload };

    case 'RESET_FOR_USER':
      // Called on login/logout — strips any session/away state that doesn't belong
      // to the now-current user, so a fresh login never inherits a stale session.
      return {
        ...state,
        activeSession: action.session || null,
        awayMode: action.awayMode || null,
      };

    case 'ADD_SESSION':
      return { ...state, sessions: [action.session, ...state.sessions], activeSession: action.session };

    case 'UPDATE_SESSION': {
      const sessions = state.sessions.map(s => matchSession(s, action.session.id) ? { ...s, ...action.session } : s);
      const activeSession = action.clearActive
        ? null
        : (state.activeSession && matchSession(state.activeSession, action.session.id)
            ? { ...state.activeSession, ...action.session }
            : state.activeSession);
      return { ...state, sessions, activeSession };
    }

    case 'SET_FLOORS':
      return { ...state, floors: action.floors };

    case 'SET_FLOOR':
      return { ...state, selectedFloor: action.floor };

    case 'UPDATE_SEAT': {
      const seats = state.seats.map(s => matchSeat(s, action.seatId) ? { ...s, ...action.updates } : s);
      return { ...state, seats };
    }

    // ── Step 1: Reserve a seat (NOT occupied yet — student hasn't arrived) ──
    case 'RESERVE_SEAT': {
      const { seatId, studentId, sessionId } = action;
      const now = Date.now();
      const deadline = now + CHECK_IN_WINDOW_MS;
      const seats = state.seats.map(s =>
        matchSeat(s, seatId)
          ? { ...s, status: 'reserved', occupiedBy: studentId, reservedAt: now, checkInDeadline: deadline, sessionStart: null }
          : s
      );
      const newSession = {
        id: sessionId, studentId, seatId,
        floorId: seatId.split('-')[0],
        start: now,            // booking time (used for sorting/listing)
        checkInAt: null,       // set once student checks in
        checkInDeadline: deadline,
        end: null,
        status: 'reserved',
        trustGained: 0,
      };
      return { ...state, seats, sessions: [newSession, ...state.sessions], activeSession: newSession };
    }

    // ── Step 2: Check in (student has physically arrived) ──
    case 'CHECK_IN': {
      const now = Date.now();
      const seats = state.seats.map(s =>
        matchSeat(s, action.seatId) ? { ...s, status: 'occupied', sessionStart: now, checkInDeadline: null } : s
      );
      const sessions = state.sessions.map(s =>
        matchSession(s, action.sessionId) ? { ...s, status: 'active', checkInAt: now } : s
      );
      const activeSession = state.activeSession && matchSession(state.activeSession, action.sessionId)
        ? { ...state.activeSession, status: 'active', checkInAt: now }
        : state.activeSession;
      return { ...state, seats, sessions, activeSession };
    }

    // ── No-show: reservation expired before check-in ──
    case 'EXPIRE_RESERVATION': {
      const seats = state.seats.map(s =>
        matchSeat(s, action.seatId)
          ? { ...s, status: 'available', occupiedBy: null, reservedAt: null, checkInDeadline: null }
          : s
      );
      const sessions = state.sessions.map(s =>
        matchSession(s, action.sessionId) ? { ...s, status: 'no-show', end: Date.now(), trustGained: -15 } : s
      );
      return { ...state, seats, sessions, activeSession: null };
    }

    // ── Checkout: end an active (checked-in) session ──
    case 'END_SESSION': {
      const sessions = state.sessions.map(s =>
        matchSession(s, action.sessionId) ? { ...s, status: 'completed', end: Date.now(), trustGained: action.trustGained } : s
      );
      const session = sessions.find(s => matchSession(s, action.sessionId));
      const seats = session
        ? state.seats.map(s => matchSeat(s, session.seatId) ? { ...s, status: 'available', occupiedBy: null, sessionStart: null, reservedAt: null, checkInDeadline: null } : s)
        : state.seats;
      return { ...state, sessions, seats, activeSession: null, awayMode: null };
    }

    // ── Cancel a reservation before checking in ──
    case 'CANCEL_RESERVATION': {
      const seats = state.seats.map(s =>
        matchSeat(s, action.seatId) ? { ...s, status: 'available', occupiedBy: null, reservedAt: null, checkInDeadline: null } : s
      );
      const sessions = state.sessions.map(s =>
        matchSession(s, action.sessionId) ? { ...s, status: 'released', end: Date.now() } : s
      );
      return { ...state, seats, sessions, activeSession: null };
    }

    case 'SET_AWAY': {
      const seats = state.seats.map(s => matchSeat(s, action.seatId) ? { ...s, status: 'away', awayUntil: action.until } : s);
      return { ...state, seats, awayMode: { seatId: action.seatId, until: action.until } };
    }
    case 'RETURN_FROM_AWAY': {
      const seats = state.seats.map(s => matchSeat(s, action.seatId) ? { ...s, status: 'occupied', awayUntil: null } : s);
      return { ...state, seats, awayMode: null };
    }
    case 'RELEASE_SEAT': {
      const seats = state.seats.map(s =>
        matchSeat(s, action.seatId)
          ? { ...s, status: 'available', occupiedBy: null, sessionStart: null, awayUntil: null, reservedAt: null, checkInDeadline: null }
          : s
      );
      const sessions = state.sessions.map(s =>
        (s.seatId === action.seatId) && (s.status === 'active' || s.status === 'reserved')
          ? { ...s, status: 'released', end: Date.now() }
          : s
      );
      return { ...state, seats, sessions, activeSession: state.activeSession?.seatId === action.seatId ? null : state.activeSession };
    }

    case 'SET_PREFERENCES':
      return { ...state, seatPreferences: action.prefs };

    case 'EMERGENCY_MODE': {
      const seats = action.enabled
        ? state.seats.map(s => s.floorId === action.floorId ? { ...s, status: 'maintenance' } : s)
        : state.seats.map(s => s.floorId === action.floorId ? { ...s, status: 'available' } : s);
      return { ...state, seats, emergencyMode: action.enabled, emergencyMessage: action.message || '' };
    }

    case 'ADD_NOTIFICATION': {
      const notif = { id: generateId('N'), ...action.notif, time: Date.now(), read: false };
      return { ...state, notifications: [notif, ...state.notifications] };
    }
    case 'MARK_READ': {
      const notifications = state.notifications.map(n =>
        action.id === 'all' ? { ...n, read: true } : (n.id === action.id ? { ...n, read: true } : n)
      );
      return { ...state, notifications };
    }
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, { id: generateId('T'), ...action.toast }] };
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.id) };

    case 'ADD_STUDENT':
      return { ...state, students: [action.student, ...state.students] };

    case 'UPDATE_STUDENT_INFO': {
      const students = state.students.map(s => s.id === action.studentId ? { ...s, ...action.updates } : s);
      return { ...state, students };
    }

    case 'SET_ACTIVE_SESSION':
      return { ...state, activeSession: action.session };

    case 'MAINTENANCE_TOGGLE': {
      const seats = state.seats.map(s =>
        matchSeat(s, action.seatId) ? { ...s, status: s.status === 'maintenance' ? 'available' : 'maintenance' } : s
      );
      return { ...state, seats };
    }

    // ── Live simulation tick: a handful of seats change state over time ──
    case 'SIMULATE_TICK': {
      const protectedIds = new Set([state.activeSession?.seatId].filter(Boolean));
      const candidates = state.seats.filter(s =>
        !protectedIds.has(s.id) && (s.status === 'available' || s.status === 'occupied')
      );
      if (candidates.length === 0) return state;

      const flips = Math.min(action.count || 2, candidates.length);
      const chosen = new Set();
      while (chosen.size < flips) {
        chosen.add(candidates[Math.floor(Math.random() * candidates.length)].id);
      }
      const now = Date.now();
      const seats = state.seats.map(s => {
        if (!chosen.has(s.id)) return s;
        if (s.status === 'available') {
          return { ...s, status: 'occupied', occupiedBy: 'SIM', sessionStart: now };
        }
        // currently occupied (and not protected) -> someone leaves
        return { ...s, status: 'available', occupiedBy: null, sessionStart: null };
      });
      return { ...state, seats };
    }

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { auth, apiMode } = useAuth();
  const prevAuthId = useRef(undefined);

  // ── Whenever the logged-in user changes, load ONLY that user's session ──
  // This is what prevents a freshly-activated or newly-logged-in student
  // from ever seeing someone else's reserved/active seat.
  useEffect(() => {
    const currentId = auth?.id || auth?._id || null;
    if (prevAuthId.current === currentId) return;
    prevAuthId.current = currentId;

    if (!currentId) {
      dispatch({ type: 'RESET_FOR_USER', session: null, awayMode: null });
      return;
    }
    let restoredSession = null;
    let restoredAway = null;
    try {
      const raw = localStorage.getItem(`dg_session_${currentId}`);
      if (raw) restoredSession = JSON.parse(raw);
    } catch {}
    if (restoredSession?.seatId) {
      try {
        const rawAway = localStorage.getItem(`dg_away_${currentId}`);
        if (rawAway) restoredAway = JSON.parse(rawAway);
      } catch {}
    }
    dispatch({ type: 'RESET_FOR_USER', session: restoredSession, awayMode: restoredAway });
  }, [auth?.id, auth?._id]);

  // ── Persist the active session under THIS user's key only ──
  useEffect(() => {
    const currentId = auth?.id || auth?._id;
    if (!currentId) return;
    if (state.activeSession) {
      localStorage.setItem(`dg_session_${currentId}`, JSON.stringify(state.activeSession));
    } else {
      localStorage.removeItem(`dg_session_${currentId}`);
    }
  }, [state.activeSession, auth?.id, auth?._id]);

  useEffect(() => {
    const currentId = auth?.id || auth?._id;
    if (!currentId) return;
    if (state.awayMode) localStorage.setItem(`dg_away_${currentId}`, JSON.stringify(state.awayMode));
    else localStorage.removeItem(`dg_away_${currentId}`);
  }, [state.awayMode, auth?.id, auth?._id]);

  // ── Auto-expire reservations that missed the check-in window ──
  useEffect(() => {
    const id = setInterval(() => {
      if (!state.activeSession) return;
      const s = state.activeSession;
      if (s.status === 'reserved' && s.checkInDeadline && Date.now() > s.checkInDeadline) {
        dispatch({ type: 'EXPIRE_RESERVATION', seatId: s.seatId, sessionId: s.id });
        dispatch({ type: 'ADD_NOTIFICATION', notif: {
          type: 'warn', title: 'Reservation expired',
          body: `You didn't check in to ${s.seatId} in time, so it was released.`,
          targetRole: 'student',
        }});
      }
    }, 5000);
    return () => clearInterval(id);
  }, [state.activeSession]);

  // ── Auto-release away seats that exceeded their window ──
  useEffect(() => {
    const id = setInterval(() => {
      if (!state.awayMode) return;
      if (Date.now() > state.awayMode.until) {
        const seatId = state.awayMode.seatId;
        dispatch({ type: 'RELEASE_SEAT', seatId });
        dispatch({ type: 'ADD_NOTIFICATION', notif: {
          type: 'alert', title: 'Seat released — away timeout',
          body: `Your seat ${seatId} was released after the away window expired.`,
          targetRole: 'student',
        }});
      }
    }, 5000);
    return () => clearInterval(id);
  }, [state.awayMode]);

  // ── Live simulation: a couple of seats change every ~20s so the map,
  //    floor availability, and forecast never look frozen.
  //    Only runs in mock/demo mode — real backend data should never be
  //    randomly overwritten. ──
  useEffect(() => {
    if (apiMode) return;
    const id = setInterval(() => {
      dispatch({ type: 'SIMULATE_TICK', count: 1 + Math.floor(Math.random() * 2) });
    }, 20000);
    return () => clearInterval(id);
  }, [apiMode]);

  // ── Hydrate from real API when connected ───────────────
  useEffect(() => {
    if (!apiMode || !auth) return;
    (async () => {
      try {
        const [seatsRes, sessionsRes, notifsRes, floorsRes, studentsRes] = await Promise.all([
          seatsAPI.list(), sessionsAPI.list(), notificationsAPI.list(), floorsAPI.list(),
          (auth.role === 'admin' || auth.role === 'librarian') ? studentsAPI.list() : Promise.resolve({ data: null }),
        ]);
        const seats = (seatsRes.data || []).map(s => ({
          ...s, id: s._id || s.seatCode, floorId: s.floorCode,
          sessionStart: s.sessionStart ? new Date(s.sessionStart).getTime() : null,
          awayUntil: s.awayUntil ? new Date(s.awayUntil).getTime() : null,
        }));
        const sessions = (sessionsRes.data || []).map(s => ({
          ...s, id: s._id, studentId: s.student?._id || s.student, seatId: s.seatCode, floorId: s.floorCode,
          start: new Date(s.start).getTime(), end: s.end ? new Date(s.end).getTime() : null,
        }));
        const notifications = (notifsRes.data || []).map(n => ({
          ...n, id: n._id, time: new Date(n.createdAt).getTime(),
          targetRole: n.targetRole === 'all' ? auth.role : n.targetRole,
        }));
        dispatch({ type: 'HYDRATE', payload: { seats, sessions, notifications } });
        dispatch({ type: 'SET_FLOORS', floors: floorsRes.data || [] });
        if (studentsRes.data) {
          const students = studentsRes.data.map(s => ({ ...s, id: s.studentId, avatar: s.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() }));
          dispatch({ type: 'HYDRATE', payload: { students } });
        }
      } catch (err) {
        console.warn('API hydration failed, using mock data:', err.message);
      }
    })();
  }, [apiMode, auth]);

  const toast = useCallback((msg, type = 'info', duration = 3500) => {
    const id = generateId('T');
    dispatch({ type: 'ADD_TOAST', toast: { id, msg, type } });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', id }), duration);
  }, []);

  // ── Normalizers: convert Mongo/API documents into the shape the
  //    reducer and UI already expect (matches the HYDRATE mapping above) ──
  function normSeat(s) {
    if (!s) return s;
    return {
      ...s,
      id: s._id || s.id || s.seatCode,
      floorId: s.floorCode || s.floorId,
      occupiedBy: (s.occupiedBy && s.occupiedBy._id) || s.occupiedBy || null,
      reservedAt: s.reservedAt ? new Date(s.reservedAt).getTime() : null,
      checkInDeadline: s.checkInDeadline ? new Date(s.checkInDeadline).getTime() : null,
      sessionStart: s.sessionStart ? new Date(s.sessionStart).getTime() : null,
      awayUntil: s.awayUntil ? new Date(s.awayUntil).getTime() : null,
    };
  }
  function normSession(s) {
    if (!s) return s;
    return {
      ...s,
      id: s._id || s.id,
      studentId: (s.student && s.student._id) || s.student || s.studentId,
      seatId: s.seatCode || s.seatId,
      floorId: s.floorCode || s.floorId,
      start: s.start ? new Date(s.start).getTime() : null,
      end: s.end ? new Date(s.end).getTime() : null,
      checkInAt: s.checkInAt ? new Date(s.checkInAt).getTime() : null,
      checkInDeadline: s.checkInDeadline ? new Date(s.checkInDeadline).getTime() : null,
    };
  }

  // ── Write actions: talk to the real API when connected (apiMode),
  //    otherwise fall back to the original local-only reducer actions
  //    so the app keeps working perfectly offline / in demo mode. ──
  const bookSeat = useCallback(async (seat) => {
    if (apiMode) {
      const res = await seatsAPI.book(seat.id);
      const seatN = normSeat(res.data.seat);
      const sessN = normSession(res.data.session);
      dispatch({ type: 'UPDATE_SEAT', seatId: seatN.id, updates: seatN });
      dispatch({ type: 'ADD_SESSION', session: sessN });
      return sessN;
    }
    const sessionId = generateId('SES');
    dispatch({ type: 'RESERVE_SEAT', seatId: seat.id, studentId: auth?.id, sessionId });
    return null;
  }, [apiMode, auth]);

  const checkInSeat = useCallback(async (seat, session) => {
    if (apiMode) {
      const res = await seatsAPI.checkIn(seat.id);
      const seatN = normSeat(res.data.seat);
      const sessN = normSession(res.data.session);
      dispatch({ type: 'UPDATE_SEAT', seatId: seatN.id, updates: seatN });
      dispatch({ type: 'UPDATE_SESSION', session: sessN });
      return;
    }
    dispatch({ type: 'CHECK_IN', seatId: seat.id, sessionId: session.id });
  }, [apiMode]);

  const cancelReservation = useCallback(async (seat, session) => {
    if (apiMode) {
      const res = await seatsAPI.cancel(seat.id);
      const seatN = normSeat(res.data.seat);
      dispatch({ type: 'UPDATE_SEAT', seatId: seatN.id, updates: seatN });
      dispatch({ type: 'UPDATE_SESSION', session: { id: session.id, status: 'released' }, clearActive: true });
      return;
    }
    dispatch({ type: 'CANCEL_RESERVATION', seatId: seat.id, sessionId: session.id });
  }, [apiMode]);

  const checkoutSession = useCallback(async (session) => {
    if (apiMode) {
      const res = await sessionsAPI.checkout(session.id);
      const sessN = normSession(res.data);
      dispatch({ type: 'UPDATE_SEAT', seatId: sessN.seatId, updates: {
        status: 'available', occupiedBy: null, sessionStart: null, awayUntil: null, reservedAt: null, checkInDeadline: null,
      }});
      dispatch({ type: 'UPDATE_SESSION', session: sessN, clearActive: true });
      return res.trustGained ?? sessN.trustGained ?? 0;
    }
    dispatch({ type: 'END_SESSION', sessionId: session.id, trustGained: 20 });
    return 20;
  }, [apiMode]);

  const setAwayMode = useCallback(async (seat, minutes = 10) => {
    if (apiMode) {
      const res = await seatsAPI.setAway(seat.id, minutes);
      const seatN = normSeat(res.data);
      dispatch({ type: 'UPDATE_SEAT', seatId: seatN.id, updates: seatN });
      dispatch({ type: 'SET_AWAY', seatId: seatN.id, until: seatN.awayUntil });
      return;
    }
    const until = Date.now() + minutes * 60 * 1000;
    dispatch({ type: 'SET_AWAY', seatId: seat.id, until });
  }, [apiMode]);

  const returnFromAwayMode = useCallback(async (seat) => {
    if (apiMode) {
      const res = await seatsAPI.returnAway(seat.id);
      const seatN = normSeat(res.data);
      dispatch({ type: 'UPDATE_SEAT', seatId: seatN.id, updates: seatN });
      dispatch({ type: 'RETURN_FROM_AWAY', seatId: seatN.id });
      return;
    }
    dispatch({ type: 'RETURN_FROM_AWAY', seatId: seat.id });
  }, [apiMode]);

  const releaseSeatById = useCallback(async (seatId) => {
    if (apiMode) {
      const res = await seatsAPI.release(seatId);
      const seatN = normSeat(res.data);
      dispatch({ type: 'UPDATE_SEAT', seatId: seatN.id, updates: seatN });
      return;
    }
    dispatch({ type: 'RELEASE_SEAT', seatId });
  }, [apiMode]);

  const toggleSeatMaintenance = useCallback(async (seat) => {
    if (apiMode) {
      const next = seat.status === 'maintenance' ? 'available' : 'maintenance';
      const res = await seatsAPI.update(seat.id, { status: next });
      const seatN = normSeat(res.data);
      dispatch({ type: 'UPDATE_SEAT', seatId: seatN.id, updates: seatN });
      return;
    }
    dispatch({ type: 'MAINTENANCE_TOGGLE', seatId: seat.id });
  }, [apiMode]);

  const setFloorEmergency = useCallback(async (floorId, enabled, message) => {
    if (apiMode) {
      const floorRec = state.floors.find(f => f.floorCode === floorId);
      if (floorRec) await floorsAPI.emergency(floorRec._id, { enabled, message });
      const seats = state.seats.map(s => s.floorId === floorId ? { ...s, status: enabled ? 'maintenance' : 'available' } : s);
      dispatch({ type: 'HYDRATE', payload: { seats, emergencyMode: enabled, emergencyMessage: message || '' } });
      return;
    }
    dispatch({ type: 'EMERGENCY_MODE', enabled, floorId, message });
  }, [apiMode, state.floors, state.seats]);

  const markRead = useCallback(async (id) => {
    if (apiMode) {
      try {
        if (id === 'all') await notificationsAPI.markAllRead();
        else await notificationsAPI.markRead(id);
      } catch { /* non-fatal — still reflect read state locally */ }
    }
    dispatch({ type: 'MARK_READ', id });
  }, [apiMode]);

  return (
    <AppContext.Provider value={{
      state, dispatch, toast, apiMode,
      bookSeat, checkInSeat, cancelReservation, checkoutSession,
      setAwayMode, returnFromAwayMode, releaseSeatById, toggleSeatMaintenance,
      setFloorEmergency, markRead,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() { return useContext(AppContext); }
export { CHECK_IN_WINDOW_MS, AWAY_WINDOW_MS };
