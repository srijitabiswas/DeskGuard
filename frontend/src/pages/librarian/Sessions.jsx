import React, { useState, useMemo } from 'react';
import { Search, RefreshCw, Clock } from 'lucide-react';
import { useApp, matchSeat } from '../../context/AppContext';
import { Card, Badge, Button, Tabs, Input, EmptyState } from '../../components/ui/index';
import { STUDENTS, FLOORS } from '../../data/mockData';
import { fmtDuration, fmtTime, fmtDate, effectiveStart } from '../../utils/helpers';

export default function LibrarianSessions() {
  const { state, dispatch, toast, releaseSeatById } = useApp();
  const [tab, setTab] = useState('reserved');
  const [q, setQ] = useState('');

  const allSessions = useMemo(() =>
    [...state.sessions].sort((a, b) => b.start - a.start),
    [state.sessions]
  );

  const byStatus = useMemo(() => {
    const filtered = tab === 'all' ? allSessions : allSessions.filter(s => s.status === tab);
    if (!q.trim()) return filtered;
    const lower = q.toLowerCase();
    return filtered.filter(s => {
      const stu = STUDENTS.find(x => x.id === s.studentId);
      return (
        s.studentId.toLowerCase().includes(lower) ||
        s.seatId.toLowerCase().includes(lower) ||
        stu?.name.toLowerCase().includes(lower)
      );
    });
  }, [allSessions, tab, q]);

  async function handleRelease(session) {
    const seat = state.seats.find(s => s.id === session.seatId || s.seatCode === session.seatId) || { id: session.seatId };
    try {
      await releaseSeatById(seat.id);
      toast(`Session ended for seat ${session.seatId}.`, 'success');
    } catch (err) {
      toast(err.message || 'Could not end session.', 'error');
    }
  }

  const activeCnt   = allSessions.filter(s => s.status === 'active').length;
  const reservedCnt = allSessions.filter(s => s.status === 'reserved').length;

  return (
    <div className="px-4 py-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-t1">Sessions</h1>
          <p className="text-sm text-t3 mt-0.5">{activeCnt} active · {reservedCnt} awaiting check-in</p>
        </div>
        <div className="flex items-center gap-1.5 bg-s2 px-3 py-1.5 rounded-xl">
          <div className="w-2 h-2 bg-safe rounded-full animate-pulse-slow" />
          <span className="text-xs font-medium text-safe">Live</span>
        </div>
      </div>

      <Input
        placeholder="Search by student, seat, or ID…"
        value={q}
        onChange={e => setQ(e.target.value)}
        icon={<Search size={15} />}
      />

      <Tabs active={tab} onChange={setTab} tabs={[
        { id: 'reserved',  label: `Reserved (${reservedCnt})` },
        { id: 'active',    label: `Active (${activeCnt})` },
        { id: 'completed', label: 'Completed' },
        { id: 'no-show',   label: 'No-show' },
        { id: 'all',       label: 'All' },
      ]} />

      <div className="space-y-3">
        {byStatus.length === 0 ? (
          <EmptyState icon="📋" title="No sessions" body="Nothing matches your filter." />
        ) : (
          byStatus.map(s => {
            const stu   = STUDENTS.find(x => x.id === s.studentId);
            const floor = FLOORS.find(f => f.id === s.floorId);
            const studyStart = effectiveStart(s);
            const dur   = s.end ? s.end - studyStart : s.status === 'active' ? Date.now() - studyStart : 0;
            const seat  = state.seats.find(x => matchSeat(x, s.seatId));

            return (
              <Card key={s.id} padding="md">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-s2 flex items-center justify-center text-sm font-bold text-t2 flex-shrink-0">
                    {stu?.avatar || '??'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-t1 text-sm truncate">{stu?.name ?? s.studentId}</p>
                      <Badge
                        variant={s.status === 'active' ? 'blue' : s.status === 'completed' ? 'green' : s.status === 'no-show' ? 'red' : s.status === 'reserved' ? 'yellow' : 'default'}
                        size="xs" dot={s.status === 'active' || s.status === 'reserved'}
                      >
                        {s.status === 'active' ? 'Active' : s.status === 'completed' ? 'Done' : s.status === 'no-show' ? 'No-show' : s.status === 'reserved' ? 'Awaiting check-in' : s.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-t3 mt-0.5">{s.seatId} · {floor?.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-t3">{fmtDate(s.start)} {fmtTime(s.start)}–{s.end ? fmtTime(s.end) : 'now'}</p>
                      {dur > 0 && (
                        <div className="flex items-center gap-1 text-xs font-medium text-t2">
                          <Clock size={11} />
                          {fmtDuration(dur)}
                        </div>
                      )}
                    </div>
                    {/* Away warning */}
                    {seat?.status === 'away' && (
                      <p className="text-xs text-warn mt-1 font-medium">⏳ Student is away</p>
                    )}
                    {/* Long session warning */}
                    {s.status === 'active' && dur > 3 * 3600000 && (
                      <p className="text-xs text-alert mt-1 font-medium">⚠️ Session over 3 hours — possible abandonment</p>
                    )}
                  </div>
                </div>
                {(s.status === 'active' || s.status === 'reserved') && (
                  <div className="mt-3 pt-3 border-t border-border flex gap-2">
                    <Button variant="danger" size="xs" icon={<RefreshCw size={12} />}
                      onClick={() => handleRelease(s)} className="flex-1">
                      {s.status === 'reserved' ? 'Cancel Reservation' : 'Release Seat'}
                    </Button>
                    {s.status === 'active' && (
                      <Button variant="secondary" size="xs" className="flex-1">
                        Extend (30m)
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
