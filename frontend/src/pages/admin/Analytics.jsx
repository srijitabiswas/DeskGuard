import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, Tabs, SectionHeader, Badge } from '../../components/ui/index';
import { WEEKLY_USAGE, HOURLY_FORECAST, STUDENTS, FLOORS } from '../../data/mockData';
import { getOccupancyPct, fmtDuration } from '../../utils/helpers';

function HBar({ label, value, max, color = '#2563EB', suffix = '' }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-3">
      <p className="text-xs text-t2 w-28 flex-shrink-0 truncate">{label}</p>
      <div className="flex-1 h-5 bg-s2 rounded-full overflow-hidden relative">
        <div className="h-5 rounded-full flex items-center justify-end pr-2 transition-all duration-700"
          style={{ width: `${Math.max(pct, 6)}%`, background: color }}>
          <span className="text-2xs text-white font-bold">{value}{suffix}</span>
        </div>
      </div>
    </div>
  );
}

function VBar({ hour, pct, highlight }) {
  const color = pct > 80 ? '#DC2626' : pct > 55 ? '#D97706' : '#059669';
  return (
    <div className={`flex flex-col items-center gap-1 flex-1 ${highlight ? 'opacity-100' : 'opacity-50'}`}>
      <p className="text-2xs font-bold text-t1 hidden sm:block">{pct > 55 ? pct + '%' : ''}</p>
      <div className="w-full flex flex-col justify-end" style={{ height: 64 }}>
        <div className="w-full rounded-t" style={{ height: `${Math.max(pct * 0.64, 3)}px`, background: color }} />
      </div>
      <p className="text-2xs text-t3 truncate w-full text-center">{hour.replace(' ', '')}</p>
    </div>
  );
}

export default function Analytics() {
  const { state } = useApp();
  const [range, setRange] = useState('week');

  const sessions = state.sessions;
  const completed = sessions.filter(s => s.status === 'completed');
  const noShows   = sessions.filter(s => s.status === 'no-show');
  const avgDur    = completed.length
    ? completed.reduce((acc, s) => acc + ((s.end || 0) - s.start), 0) / completed.length
    : 0;

  const peakHour = HOURLY_FORECAST.reduce((a, b) => a.pct > b.pct ? a : b);
  const quietHour = [...HOURLY_FORECAST].filter(h => {
    const n = parseInt(h.hour); const pm = h.hour.includes('PM');
    const h24 = pm && n !== 12 ? n + 12 : n;
    return h24 >= 8 && h24 <= 20;
  }).reduce((a, b) => a.pct < b.pct ? a : b);

  const floorUsage = FLOORS.map(f => ({
    name: f.name,
    sessions: sessions.filter(s => s.floorId === f.id).length,
    pct: getOccupancyPct(state.seats.filter(s => s.floorId === f.id)),
  }));

  const maxDaySessions = Math.max(...WEEKLY_USAGE.map(d => d.sessions));

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-t1">Analytics</h1>
          <p className="text-sm text-t3 mt-0.5">Meaningful insights, not random charts</p>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Sessions',  val: sessions.length,     sub: 'All time',             color: 'bg-accent-soft text-accent' },
          { label: 'Completion Rate', val: sessions.length ? `${Math.round((completed.length/sessions.length)*100)}%` : '–', sub: `${completed.length} completed`, color: 'bg-safe-soft text-safe' },
          { label: 'Avg Duration',    val: fmtDuration(avgDur), sub: 'Per session',           color: 'bg-violet-soft text-violet' },
          { label: 'No-show Rate',    val: sessions.length ? `${Math.round((noShows.length/sessions.length)*100)}%` : '–', sub: `${noShows.length} no-shows`, color: 'bg-warn-soft text-warn' },
        ].map(({ label, val, sub, color }) => (
          <Card key={label} padding="md">
            <p className="text-xs font-medium text-t3 uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-t1 mt-1">{val}</p>
            <p className="text-xs text-t3 mt-0.5">{sub}</p>
          </Card>
        ))}
      </div>

      {/* Hourly forecast */}
      <Card padding="md">
        <SectionHeader title="Daily Occupancy Pattern" subtitle="Average busyness throughout the day" className="mb-4" />
        <div className="flex items-end gap-1">
          {HOURLY_FORECAST.map(h => (
            <VBar key={h.hour} hour={h.hour} pct={h.pct} highlight={h.pct > 60} />
          ))}
        </div>
        <div className="flex gap-4 mt-4 pt-3 border-t border-border">
          <div className="flex-1 bg-alert-soft rounded-xl p-3 text-center">
            <p className="text-xs text-t3">Peak Hour</p>
            <p className="text-base font-bold text-alert mt-0.5">{peakHour.hour}</p>
            <p className="text-xs text-alert">{peakHour.pct}% full</p>
          </div>
          <div className="flex-1 bg-safe-soft rounded-xl p-3 text-center">
            <p className="text-xs text-t3">Quietest Hour</p>
            <p className="text-base font-bold text-safe mt-0.5">{quietHour.hour}</p>
            <p className="text-xs text-safe">{quietHour.pct}% full</p>
          </div>
        </div>
      </Card>

      {/* Weekly sessions */}
      <Card padding="md">
        <SectionHeader title="Sessions by Day of Week" subtitle="This week's check-in volume" className="mb-4" />
        <div className="space-y-2.5">
          {WEEKLY_USAGE.map(d => (
            <HBar key={d.day} label={d.day} value={d.sessions} max={maxDaySessions} color="#2563EB" />
          ))}
        </div>
        <p className="text-xs text-t3 mt-3 text-center">
          Total this week: <span className="font-semibold text-t1">{WEEKLY_USAGE.reduce((a, b) => a + b.sessions, 0)} sessions</span>
        </p>
      </Card>

      {/* Floor utilisation */}
      <Card padding="md">
        <SectionHeader title="Floor Utilisation" subtitle="Current live occupancy by floor" className="mb-4" />
        <div className="space-y-2.5">
          {floorUsage.map(f => (
            <HBar key={f.name} label={f.name.replace(' Floor','')} value={f.pct} max={100} suffix="%" color={f.pct > 80 ? '#DC2626' : f.pct > 55 ? '#D97706' : '#059669'} />
          ))}
        </div>
      </Card>

      {/* Trust score distribution */}
      <Card padding="md">
        <SectionHeader title="Trust Score Distribution" subtitle={`${STUDENTS.length} registered students`} className="mb-4" />
        <div className="space-y-2">
          {[
            { label: 'Elite (90–100)',  students: STUDENTS.filter(s => s.trustScore >= 90),              color: '#2563EB' },
            { label: 'High (75–89)',    students: STUDENTS.filter(s => s.trustScore >= 75 && s.trustScore < 90), color: '#059669' },
            { label: 'Mid (55–74)',     students: STUDENTS.filter(s => s.trustScore >= 55 && s.trustScore < 75), color: '#D97706' },
            { label: 'Low (0–54)',      students: STUDENTS.filter(s => s.trustScore < 55),               color: '#DC2626' },
          ].map(({ label, students: stus, color }) => (
            <div key={label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-t2 font-medium">{label}</span>
                <span className="font-semibold text-t1">{stus.length} students ({Math.round((stus.length / STUDENTS.length) * 100)}%)</span>
              </div>
              <div className="w-full h-2 bg-s2 rounded-full overflow-hidden">
                <div className="h-2 rounded-full" style={{ width: `${(stus.length / STUDENTS.length) * 100}%`, background: color }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Avg session by day */}
      <Card padding="md">
        <SectionHeader title="Avg Session Duration by Day" subtitle="How long students study each day" className="mb-4" />
        <div className="space-y-2.5">
          {WEEKLY_USAGE.map(d => (
            <HBar key={d.day} label={d.day} value={d.avgDuration} max={Math.max(...WEEKLY_USAGE.map(x => x.avgDuration))} color="#7C3AED" suffix=" min" />
          ))}
        </div>
        <p className="text-xs text-t3 mt-3 text-center">
          Avg across week: <span className="font-semibold text-t1">{Math.round(WEEKLY_USAGE.reduce((a, b) => a + b.avgDuration, 0) / WEEKLY_USAGE.length)} min</span>
        </p>
      </Card>
    </div>
  );
}
