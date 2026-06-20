import React from 'react';
import { AlertTriangle, Clock, X, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card, Badge, Button, EmptyState } from '../../components/ui/index';
import { STUDENTS, FLOORS } from '../../data/mockData';
import { fmtDuration, fmtRelative } from '../../utils/helpers';

export default function LibrarianAlerts() {
  const { state, dispatch, toast, releaseSeatById, setFloorEmergency, markRead } = useApp();

  // Compute abandoned seats (occupied > 3h or away > timeout)
  const abandoned = state.seats.filter(s => {
    if (s.status === 'occupied' && s.sessionStart) return Date.now() - s.sessionStart > 3 * 3600000;
    if (s.status === 'away' && s.awayUntil) return Date.now() > s.awayUntil;
    return false;
  });

  const libNotifs = state.notifications.filter(n => n.targetRole === 'librarian');

  async function resolveAbandoned(seatId) {
    try {
      await releaseSeatById(seatId);
      toast('Seat released and marked available.', 'success');
    } catch (err) {
      toast(err.message || 'Could not release seat.', 'error');
    }
  }

  function dismissNotif(id) {
    markRead(id);
  }

  function clearAll() {
    markRead('all');
    toast('All alerts cleared.', 'success');
  }

  return (
    <div className="px-4 py-5 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-t1">Alerts</h1>
        <p className="text-sm text-t3 mt-0.5">Abandoned seats and system notifications</p>
      </div>

      {/* Emergency banner */}
      {state.emergencyMode && (
        <div className="bg-alert text-white rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} />
            <p className="font-bold">Emergency Mode Active</p>
          </div>
          <p className="text-sm opacity-90 mb-3">{state.emergencyMessage || 'Library in emergency mode.'}</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setFloorEmergency(state.seats[0]?.floorId, false)
                .then(() => toast('Emergency mode cleared.', 'success'))
                .catch(err => toast(err.message || 'Could not clear emergency mode.', 'error'));
            }}
          >Clear Emergency Mode</Button>
        </div>
      )}

      {/* Abandoned seats */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-semibold text-t1">Abandoned Seats</p>
            <p className="text-xs text-t3">{abandoned.length} seat{abandoned.length !== 1 ? 's' : ''} need attention</p>
          </div>
          {abandoned.length > 0 && (
            <Button variant="danger" size="xs"
              onClick={() => {
                Promise.all(abandoned.map(s => releaseSeatById(s.id)))
                  .then(() => toast(`Released ${abandoned.length} seat(s).`, 'success'))
                  .catch(err => toast(err.message || 'Could not release all seats.', 'error'));
              }}>
              Release All
            </Button>
          )}
        </div>

        {abandoned.length === 0 ? (
          <Card padding="md" className="text-center">
            <CheckCircle size={24} className="text-safe mx-auto mb-2" />
            <p className="font-semibold text-t1">All clear</p>
            <p className="text-sm text-t3 mt-0.5">No abandoned seats detected.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {abandoned.map(seat => {
              const stu   = STUDENTS.find(s => s.id === seat.occupiedBy);
              const floor = FLOORS.find(f => f.id === seat.floorId);
              const dur   = seat.sessionStart ? Date.now() - seat.sessionStart : 0;
              return (
                <Card key={seat.id} padding="md" className="border-alert/20 border-2">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-alert-soft flex items-center justify-center flex-shrink-0">
                      <AlertTriangle size={18} className="text-alert" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-t1 text-sm">{seat.label}</p>
                        <Badge variant="red" size="xs">{seat.status === 'away' ? 'Timeout' : 'Abandoned'}</Badge>
                      </div>
                      <p className="text-xs text-t3 mt-0.5">{floor?.name}</p>
                      {stu && <p className="text-xs text-t3">Assigned to: {stu.name} ({stu.id})</p>}
                      {dur > 0 && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-alert font-medium">
                          <Clock size={11} /> {fmtDuration(dur)} elapsed
                        </div>
                      )}
                    </div>
                    <Button variant="danger" size="xs" onClick={() => resolveAbandoned(seat.id)}>
                      Release
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Notifications */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-t1">System Notifications</p>
          {libNotifs.some(n => !n.read) && (
            <Button variant="ghost" size="xs" onClick={clearAll}>Clear all</Button>
          )}
        </div>
        {libNotifs.length === 0 ? (
          <EmptyState icon="🔔" title="No notifications" body="You're all caught up." />
        ) : (
          <div className="space-y-2">
            {libNotifs.map(n => (
              <Card key={n.id} padding="md" className={!n.read ? 'border-warn/30 border-2 bg-warn-soft/20' : ''}>
                <div className="flex items-start gap-3">
                  <span className="text-lg flex-shrink-0">
                    {n.type === 'alert' ? '🚨' : n.type === 'warn' ? '⚠️' : 'ℹ️'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-t1">{n.title}</p>
                    <p className="text-xs text-t3 mt-0.5">{n.body}</p>
                    <p className="text-xs text-t3 mt-1">{fmtRelative(n.time)}</p>
                  </div>
                  <button onClick={() => dismissNotif(n.id)} className="text-t3 hover:text-t1 flex-shrink-0">
                    <X size={15} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
