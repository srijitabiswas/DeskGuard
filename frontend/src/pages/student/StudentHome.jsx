import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Coffee, CheckCircle, LogIn, X, Flame } from 'lucide-react';
import { useAuth, useApp, matchSeat } from '../../context/AppContext';
import { Card, Badge, Button, SectionHeader } from '../../components/ui/index';
import { getTrustTier, fmtDuration, fmtCountdown, getBestStudyTime, getStudyStreak, getTodayStudyMs, getWeekStudyMs, getLiveForecast } from '../../utils/helpers';
import { HOURLY_FORECAST, FLOORS } from '../../data/mockData';

function OccupancyBar({ pct }) {
  const color = pct > 80 ? '#DC2626' : pct > 55 ? '#D97706' : '#059669';
  return (
    <div className="w-full h-2 bg-s2 rounded-full overflow-hidden">
      <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function ForecastBar({ hour, pct, isCurrent }) {
  const color = pct > 80 ? '#FEE2E2' : pct > 55 ? '#FEF3C7' : '#D1FAE5';
  const textColor = pct > 80 ? '#DC2626' : pct > 55 ? '#D97706' : '#059669';
  return (
    <div className={`flex flex-col items-center gap-1 flex-1 min-w-0 transition-opacity duration-500 ${isCurrent ? 'opacity-100' : 'opacity-60'}`}>
      <div className="w-full flex flex-col items-center justify-end" style={{ height: 48 }}>
        <div className="w-full rounded-t-sm transition-all duration-700" style={{ height: `${Math.max(pct * 0.48, 3)}px`, background: isCurrent ? textColor : color }} />
      </div>
      <p className="text-2xs text-t3 truncate w-full text-center">{hour.replace(' ', '')}</p>
      {isCurrent && <p className="text-2xs font-bold" style={{ color: textColor }}>{pct}%</p>}
    </div>
  );
}

export default function StudentHome() {
  const { auth } = useAuth();
  const { state, dispatch, toast, checkInSeat, cancelReservation, checkoutSession, setAwayMode, returnFromAwayMode } = useApp();
  const navigate = useNavigate();
  const [now, setNow] = useState(Date.now());
  const [forecast, setForecast] = useState(() => getLiveForecast(HOURLY_FORECAST));

  const mySessions = state.sessions.filter(s => s.studentId === auth?.id);
  const activeSession = state.activeSession;
  const activeSeat = activeSession ? state.seats.find(s => matchSeat(s, activeSession.seatId)) : null;

  const todayMs = getTodayStudyMs(mySessions);
  const weekMs = getWeekStudyMs(mySessions);
  const streak = getStudyStreak(mySessions);
  const tier = getTrustTier(auth?.trustScore || 0);

  const currentHour = new Date().getHours();
  const currentHourLabel = currentHour < 12 ? `${currentHour} AM` : currentHour === 12 ? '12 PM' : `${currentHour - 12} PM`;
  const bestTime = getBestStudyTime(forecast);

  // Tick every second — drives session timer, countdowns, and away timer
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Refresh forecast gently every 30s so it visibly shifts over time
  useEffect(() => {
    const id = setInterval(() => setForecast(getLiveForecast(HOURLY_FORECAST)), 30000);
    return () => clearInterval(id);
  }, []);

  const elapsed = activeSession?.status === 'active' && activeSession.checkInAt ? now - activeSession.checkInAt : 0;
  const checkInRemaining = activeSession?.status === 'reserved' ? Math.max(0, (activeSession.checkInDeadline || 0) - now) : 0;
  const awayRemaining = state.awayMode ? Math.max(0, state.awayMode.until - now) : 0;

  async function handleCheckIn() {
    if (!activeSession || !activeSeat) return;
    try {
      await checkInSeat(activeSeat, activeSession);
      toast(`Checked in to ${activeSeat.label}. Enjoy your study session!`, 'success');
    } catch (err) {
      toast(err.message || 'Could not check in.', 'error');
    }
  }

  async function handleCancelReservation() {
    if (!activeSession || !activeSeat) return;
    try {
      await cancelReservation(activeSeat, activeSession);
      toast('Reservation cancelled.', 'info');
    } catch (err) {
      toast(err.message || 'Could not cancel reservation.', 'error');
    }
  }

  async function handleCheckOut() {
    if (!activeSession) return;
    try {
      const trustGained = await checkoutSession(activeSession);
      dispatch({ type: 'ADD_NOTIFICATION', notif: { type: 'success', title: 'Session complete!', body: `You earned ${trustGained} trust points. Great study session!`, targetRole: 'student' } });
      toast(`Session ended. +${trustGained} trust points!`, 'success');
    } catch (err) {
      toast(err.message || 'Could not check out.', 'error');
    }
  }

  async function handleAway() {
    if (!activeSeat) return;
    try {
      await setAwayMode(activeSeat, 10);
      toast('Away mode activated. Return within 10 minutes.', 'warn');
    } catch (err) {
      toast(err.message || 'Could not activate away mode.', 'error');
    }
  }

  async function handleReturn() {
    if (!activeSeat) return;
    try {
      await returnFromAwayMode(activeSeat);
      toast('Welcome back!', 'success');
    } catch (err) {
      toast(err.message || 'Could not return from away mode.', 'error');
    }
  }

  const floorOccupancy = FLOORS.map(f => {
    const floorSeats = state.seats.filter(s => s.floorId === f.id);
    const occupied = floorSeats.filter(s => ['occupied', 'away', 'reserved'].includes(s.status)).length;
    return { ...f, pct: Math.round((occupied / floorSeats.length) * 100), available: floorSeats.filter(s => s.status === 'available').length };
  });

  return (
    <div className="px-4 py-5 space-y-5 pb-safe">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold text-t1">Hi, {auth?.name?.split(' ')[0]} 👋</h1>
        <p className="text-sm text-t3 mt-0.5">Ready to study today?</p>
      </div>

      {/* Reserved — awaiting check-in */}
      {activeSession?.status === 'reserved' && activeSeat && (
        <Card padding="none" className="overflow-hidden border-2 border-warn/30">
          <div className="bg-warn px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <p className="text-white font-semibold text-sm">Seat Reserved</p>
            </div>
            <Badge variant="outline" className="text-white border-white/40 text-xs">{fmtCountdown(checkInRemaining)} left</Badge>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-t1">{activeSeat.label}</p>
                <p className="text-sm text-t3">{FLOORS.find(f => f.id === activeSeat.floorId)?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-t3">Check in within</p>
                <p className="text-xl font-bold text-warn">{fmtCountdown(checkInRemaining)}</p>
              </div>
            </div>
            <p className="text-xs text-t3 bg-s2 px-3 py-2 rounded-xl">
              📍 Walk to {activeSeat.label} and tap Check In once you're seated. Your reservation expires automatically if you don't check in.
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" icon={<X size={14} />} onClick={handleCancelReservation} className="flex-1">Cancel</Button>
              <Button variant="success" size="sm" icon={<LogIn size={14} />} onClick={handleCheckIn} className="flex-1">Check In</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Active session */}
      {activeSession?.status === 'active' && activeSeat && (
        <Card padding="none" className="overflow-hidden border-2 border-accent/20">
          <div className="bg-accent px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <p className="text-white font-semibold text-sm">Active Session</p>
            </div>
            <Badge variant="outline" className="text-white border-white/40 text-xs">{fmtDuration(elapsed)}</Badge>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-t1">{activeSeat.label}</p>
                <p className="text-sm text-t3">{FLOORS.find(f => f.id === activeSeat.floorId)?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-t3">Time studied</p>
                <p className="text-xl font-bold text-accent">{fmtDuration(elapsed)}</p>
              </div>
            </div>
            {state.awayMode ? (
              <div className="bg-warn-soft rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-warn">⏳ Away Mode</p>
                  <p className="text-xs text-t3">Seat held for {fmtCountdown(awayRemaining)}</p>
                </div>
                <Button variant="success" size="sm" onClick={handleReturn}>I'm Back</Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" icon={<Coffee size={14} />} onClick={handleAway} className="flex-1">Away (10m)</Button>
                <Button variant="danger" size="sm" icon={<CheckCircle size={14} />} onClick={handleCheckOut} className="flex-1">Check Out</Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* No session at all */}
      {!activeSession && (
        <Card className="bg-accent-soft border-accent/20 border-2" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-accent text-base">No active session</p>
              <p className="text-sm text-accent/70 mt-0.5">Find a seat to start studying</p>
            </div>
            <Button size="sm" onClick={() => navigate('/student/find')} icon={<MapPin size={14} />}>Find a Seat</Button>
          </div>
        </Card>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Card padding="sm" className="text-center">
          <p className="text-lg font-bold text-t1">{fmtDuration(todayMs) || '0m'}</p>
          <p className="text-2xs text-t3 mt-0.5">Today</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-lg font-bold text-t1">{fmtDuration(weekMs) || '0m'}</p>
          <p className="text-2xs text-t3 mt-0.5">This week</p>
        </Card>
        <Card padding="sm" className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Flame size={14} className="text-warn" />
            <p className="text-lg font-bold text-t1">{streak}</p>
          </div>
          <p className="text-2xs text-t3 mt-0.5">Day streak</p>
        </Card>
      </div>

      {/* Trust score */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-medium text-t3 uppercase tracking-wide">Responsible Study Score</p>
            <p className="text-2xl font-bold text-t1 mt-0.5">{auth?.trustScore ?? 0}<span className="text-sm text-t3 font-normal">/100</span></p>
          </div>
          <div className="text-right">
            <p className="text-xl">{tier.badge}</p>
            <p className="text-xs font-medium mt-0.5" style={{ color: tier.color }}>{tier.label}</p>
          </div>
        </div>
        <div className="w-full h-2.5 bg-s2 rounded-full overflow-hidden">
          <div className="h-2.5 rounded-full transition-all duration-700" style={{ width: `${auth?.trustScore ?? 0}%`, background: tier.color }} />
        </div>
        <p className="text-xs text-t3 mt-2">
          {auth?.trustScore >= 90 ? '🏆 Priority access to seats during peak hours!' :
           auth?.trustScore >= 75 ? '⭐ Complete more sessions to reach Elite status.' :
           '📖 Study consistently to improve your score.'}
        </p>
      </Card>

      {/* Floor availability — updates live as seats change */}
      <div>
        <SectionHeader title="Floor Availability" action={
          <Button variant="ghost" size="xs" onClick={() => navigate('/student/map')}>View Map</Button>
        } className="mb-3" />
        <div className="space-y-2">
          {floorOccupancy.map(f => (
            <Card key={f.id} padding="sm" hover onClick={() => navigate('/student/map')}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-s2 rounded-lg flex items-center justify-center text-sm font-bold text-t2">{f.shortName}</div>
                  <p className="text-sm font-medium text-t1">{f.name}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full transition-colors duration-700" style={{ background: f.pct > 80 ? '#DC2626' : f.pct > 55 ? '#D97706' : '#059669' }} />
                  <p className="text-sm font-semibold text-t1">{f.available} free</p>
                </div>
              </div>
              <OccupancyBar pct={f.pct} />
            </Card>
          ))}
        </div>
      </div>

      {/* Forecast — drifts gently over time, not static */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-semibold text-t1">Occupancy Forecast</p>
          <Badge variant="green" dot>Best: {bestTime}</Badge>
        </div>
        <p className="text-xs text-t3 mb-3">Predicted busyness throughout the day</p>
        <div className="flex items-end gap-1">
          {forecast.map(h => (
            <ForecastBar key={h.hour} hour={h.hour} pct={h.pct} isCurrent={h.hour === currentHourLabel} />
          ))}
        </div>
        <p className="text-xs text-t3 mt-3 text-center">
          💡 Come at <span className="font-semibold text-safe">{bestTime}</span> for highest seat availability
        </p>
      </Card>
    </div>
  );
}
