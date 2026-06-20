import React, { useState } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, Hourglass } from 'lucide-react';
import { useAuth, useApp, matchSeat } from '../../context/AppContext';
import { Card, Badge, Tabs, EmptyState, SectionHeader } from '../../components/ui/index';
import { FLOORS, ZONE_TYPES } from '../../data/mockData';
import { fmtDuration, fmtTime, fmtDate, getWeekStudyMs, getTodayStudyMs, effectiveStart } from '../../utils/helpers';

const STATUS_META = {
  reserved:  { label: 'Reserved',   variant: 'yellow', icon: Hourglass },
  active:    { label: 'Active',     variant: 'blue',   icon: Clock },
  completed: { label: 'Completed',  variant: 'green',  icon: CheckCircle },
  'no-show': { label: 'No-show',    variant: 'red',    icon: XCircle },
  released:  { label: 'Released',   variant: 'default',icon: AlertCircle },
};

export default function MySessions() {
  const { auth } = useAuth();
  const { state } = useApp();
  const [tab, setTab] = useState('all');

  const mine = state.sessions
    .filter(s => s.studentId === auth?.id)
    .sort((a, b) => b.start - a.start);

  const filtered = tab === 'all' ? mine : mine.filter(s => s.status === tab);

  const todayMs  = getTodayStudyMs(mine);
  const weekMs   = getWeekStudyMs(mine);
  const totalSessions = mine.filter(s => s.status === 'completed').length;
  const noShows  = mine.filter(s => s.status === 'no-show').length;

  return (
    <div className="px-4 py-5 space-y-5 pb-safe">
      <div>
        <h1 className="text-xl font-bold text-t1">My Sessions</h1>
        <p className="text-sm text-t3 mt-0.5">Your complete study history</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card padding="sm">
          <p className="text-2xs text-t3 uppercase tracking-wide">Today</p>
          <p className="text-xl font-bold text-t1 mt-0.5">{fmtDuration(todayMs) || '0m'}</p>
        </Card>
        <Card padding="sm">
          <p className="text-2xs text-t3 uppercase tracking-wide">This Week</p>
          <p className="text-xl font-bold text-t1 mt-0.5">{fmtDuration(weekMs) || '0m'}</p>
        </Card>
        <Card padding="sm">
          <p className="text-2xs text-t3 uppercase tracking-wide">Total Sessions</p>
          <p className="text-xl font-bold text-t1 mt-0.5">{totalSessions}</p>
        </Card>
        <Card padding="sm">
          <p className="text-2xs text-t3 uppercase tracking-wide">No-shows</p>
          <p className={`text-xl font-bold mt-0.5 ${noShows > 0 ? 'text-alert' : 'text-t1'}`}>{noShows}</p>
        </Card>
      </div>

      {/* Filter tabs */}
      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'all',       label: 'All' },
          { id: 'reserved',  label: 'Reserved' },
          { id: 'active',    label: 'Active' },
          { id: 'completed', label: 'Done' },
          { id: 'no-show',   label: 'No-show' },
        ]}
      />

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <EmptyState icon="📚" title="No sessions yet" body="Book a seat to start your first study session." />
        ) : (
          filtered.map(s => {
            const seat  = state.seats.find(x => matchSeat(x, s.seatId));
            const floor = FLOORS.find(f => f.id === s.floorId);
            const studyStart = effectiveStart(s);
            const dur   = s.end ? s.end - studyStart : s.status === 'active' ? Date.now() - studyStart : 0;
            const meta  = STATUS_META[s.status] || STATUS_META.completed;
            const Icon  = meta.icon;

            return (
              <Card key={s.id} padding="md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-s2 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon size={18} className={
                        s.status === 'completed' ? 'text-safe' :
                        s.status === 'active'    ? 'text-accent' :
                        s.status === 'no-show'   ? 'text-alert' : 'text-warn'
                      } />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-t1 text-sm">{seat?.label ?? s.seatId}</p>
                        <Badge variant={meta.variant} size="xs">{meta.label}</Badge>
                      </div>
                      <p className="text-xs text-t3 mt-0.5">{floor?.name ?? s.floorId}</p>
                      <p className="text-xs text-t3">{fmtDate(s.start)} · {fmtTime(s.start)}–{s.end ? fmtTime(s.end) : 'ongoing'}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {dur > 0 && <p className="text-sm font-bold text-t1">{fmtDuration(dur)}</p>}
                    {s.trustGained !== 0 && (
                      <p className={`text-xs font-medium ${s.trustGained > 0 ? 'text-safe' : 'text-alert'}`}>
                        {s.trustGained > 0 ? '+' : ''}{s.trustGained} pts
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
