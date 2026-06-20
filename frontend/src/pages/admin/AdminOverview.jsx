import React from 'react';
import { useApp } from '../../context/AppContext';
import { Card, StatCard, SectionHeader, Badge } from '../../components/ui/index';
import { STUDENTS, FLOORS, WEEKLY_USAGE, HOURLY_FORECAST } from '../../data/mockData';
import { getOccupancyPct, fmtDuration, getTrustTier } from '../../utils/helpers';

function MiniBarChart({ data, valueKey, labelKey, color = '#2563EB' }) {
  const max = Math.max(...data.map(d => d[valueKey]));
  return (
    <div className="flex items-end gap-1.5 h-16">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
          <div className="w-full rounded-t-sm transition-all" style={{
            height: `${Math.max((d[valueKey] / max) * 56, 3)}px`,
            background: color,
            opacity: 0.7 + (i / data.length) * 0.3,
          }} />
          <p className="text-2xs text-t3">{d[labelKey]}</p>
        </div>
      ))}
    </div>
  );
}

export default function AdminOverview() {
  const { state } = useApp();

  const allSeats = state.seats;
  const totalAvail = allSeats.filter(s => s.status === 'available').length;
  const totalOcc   = allSeats.filter(s => ['occupied','away','reserved'].includes(s.status)).length;
  const pct        = getOccupancyPct(allSeats);
  const activeSessions = state.sessions.filter(s => s.status === 'active').length;
  const activeStudents = new Set(state.sessions.filter(s => s.status === 'active').map(s => s.studentId)).size;
  const activated  = STUDENTS.filter(s => s.activated).length;
  const avgTrust   = Math.round(STUDENTS.reduce((acc, s) => acc + s.trustScore, 0) / STUDENTS.length);

  const floorBreakdown = FLOORS.map(f => {
    const seats = allSeats.filter(s => s.floorId === f.id);
    return { ...f, pct: getOccupancyPct(seats), avail: seats.filter(s => s.status === 'available').length, total: seats.length };
  });

  const topZones = [
    { zone: 'Silent Zone',   sessions: 312, pct: 82 },
    { zone: 'Near Window',   sessions: 244, pct: 64 },
    { zone: 'Group Study',   sessions: 198, pct: 52 },
    { zone: 'Charging Zone', sessions: 167, pct: 44 },
  ];

  const tierDist = [
    { label: 'Elite (90+)',   count: STUDENTS.filter(s => s.trustScore >= 90).length,  color: '#2563EB' },
    { label: 'High (75–89)', count: STUDENTS.filter(s => s.trustScore >= 75 && s.trustScore < 90).length, color: '#059669' },
    { label: 'Mid (55–74)',  count: STUDENTS.filter(s => s.trustScore >= 55 && s.trustScore < 75).length, color: '#D97706' },
    { label: 'Low (<55)',    count: STUDENTS.filter(s => s.trustScore < 55).length,   color: '#DC2626' },
  ];

  return (
    <div className="p-5 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-t1">Overview</h1>
        <p className="text-sm text-t3 mt-0.5">Live snapshot of your library system</p>
      </div>

      {/* Live stats */}
      <div>
        <SectionHeader title="Live Status" className="mb-3"
          action={<div className="flex items-center gap-1.5 bg-safe-soft px-2.5 py-1 rounded-lg"><div className="w-2 h-2 bg-safe rounded-full animate-pulse" /><span className="text-xs font-medium text-safe">Live</span></div>}
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Occupancy"      value={`${pct}%`}          color="blue"   icon={<span>🏛️</span>} sub={`${totalOcc}/${allSeats.length} seats`} />
          <StatCard label="Available Now"  value={totalAvail}         color="green"  icon={<span>✅</span>} />
          <StatCard label="Active Sessions"value={activeSessions}     color="violet" icon={<span>📖</span>} />
          <StatCard label="Students In"    value={activeStudents}     color="yellow" icon={<span>👥</span>} />
        </div>
      </div>

      {/* Floor breakdown */}
      <div>
        <SectionHeader title="Floor Breakdown" className="mb-3" />
        <div className="space-y-2">
          {floorBreakdown.map(f => (
            <Card key={f.id} padding="md">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-s2 rounded-xl flex items-center justify-center text-sm font-bold text-t2">{f.shortName}</div>
                  <div>
                    <p className="text-sm font-semibold text-t1">{f.name}</p>
                    <p className="text-xs text-t3">{f.avail} of {f.total} available</p>
                  </div>
                </div>
                <p className="text-sm font-bold" style={{ color: f.pct > 80 ? '#DC2626' : f.pct > 55 ? '#D97706' : '#059669' }}>{f.pct}%</p>
              </div>
              <div className="w-full h-1.5 bg-s2 rounded-full overflow-hidden">
                <div className="h-1.5 rounded-full" style={{
                  width: `${f.pct}%`,
                  background: f.pct > 80 ? '#DC2626' : f.pct > 55 ? '#D97706' : '#059669'
                }} />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Weekly usage */}
      <Card padding="md">
        <SectionHeader title="Weekly Session Volume" subtitle="Total check-ins per day" className="mb-4" />
        <MiniBarChart data={WEEKLY_USAGE} valueKey="sessions" labelKey="day" color="#2563EB" />
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border text-xs text-t3">
          <span>Peak: Thursday (201 sessions)</span>
          <span className="text-safe font-medium">↑ 12% vs last week</span>
        </div>
      </Card>

      {/* Top zones */}
      <div>
        <SectionHeader title="Most Used Zones" className="mb-3" />
        <div className="space-y-2">
          {topZones.map((z, i) => (
            <Card key={z.zone} padding="sm">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-s2 flex items-center justify-center text-xs font-bold text-t2 flex-shrink-0">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-t1">{z.zone}</p>
                    <p className="text-sm font-bold text-t1">{z.sessions} sessions</p>
                  </div>
                  <div className="w-full h-1.5 bg-s2 rounded-full">
                    <div className="h-1.5 rounded-full bg-accent" style={{ width: `${z.pct}%` }} />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Trust score distribution */}
      <Card padding="md">
        <SectionHeader title="Trust Score Distribution" subtitle={`${STUDENTS.length} students · avg ${avgTrust}`} className="mb-4" />
        <div className="space-y-2.5">
          {tierDist.map(t => (
            <div key={t.label} className="flex items-center gap-3">
              <p className="text-xs text-t2 w-24 flex-shrink-0">{t.label}</p>
              <div className="flex-1 h-2 bg-s2 rounded-full overflow-hidden">
                <div className="h-2 rounded-full" style={{ width: `${(t.count / STUDENTS.length) * 100}%`, background: t.color }} />
              </div>
              <p className="text-xs font-semibold text-t1 w-4 text-right">{t.count}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Student stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Students"  value={STUDENTS.length} color="blue"   icon={<span>🎓</span>} />
        <StatCard label="Activated"       value={activated}       color="green"  icon={<span>✅</span>} sub={`${STUDENTS.length - activated} pending`} />
        <StatCard label="Avg Trust Score" value={avgTrust}        color="violet" icon={<span>⭐</span>} />
        <StatCard label="Total Sessions"  value={state.sessions.length} color="yellow" icon={<span>📋</span>} />
      </div>
    </div>
  );
}
