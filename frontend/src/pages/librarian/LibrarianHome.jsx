import React, { useState, useMemo } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card, Button, Badge, Modal, StatCard } from '../../components/ui/index';
import LibraryMap from '../../components/map/LibraryMap';
import { FLOORS, STUDENTS } from '../../data/mockData';
import { getSeatStatusLabel, fmtDuration, getOccupancyPct } from '../../utils/helpers';

export default function LibrarianHome() {
  const { state, dispatch, toast, releaseSeatById, toggleSeatMaintenance, setFloorEmergency } = useApp();
  const [activeFloor, setActiveFloor] = useState('f1');
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [emergencyMsg, setEmergencyMsg] = useState('');

  const floorSeats = useMemo(() => state.seats.filter(s => s.floorId === activeFloor), [state.seats, activeFloor]);

  const totalStats = useMemo(() => {
    const all = state.seats;
    return {
      available:   all.filter(s => s.status === 'available').length,
      occupied:    all.filter(s => s.status === 'occupied').length,
      away:        all.filter(s => s.status === 'away').length,
      maintenance: all.filter(s => s.status === 'maintenance').length,
      abandoned:   all.filter(s => {
        if (s.status !== 'occupied') return false;
        const dur = Date.now() - s.sessionStart;
        return dur > 3 * 3600000;
      }).length,
    };
  }, [state.seats]);

  const floorStats = useMemo(() => {
    const pct = getOccupancyPct(floorSeats);
    return {
      pct,
      available: floorSeats.filter(s => s.status === 'available').length,
      occupied:  floorSeats.filter(s => s.status === 'occupied').length,
      away:      floorSeats.filter(s => s.status === 'away').length,
    };
  }, [floorSeats]);

  async function releaseSeat(seatId) {
    try {
      await releaseSeatById(seatId);
      toast('Seat released successfully.', 'success');
    } catch (err) {
      toast(err.message || 'Could not release seat.', 'error');
    }
    setSelectedSeat(null);
  }

  async function toggleMaintenance(seatId) {
    const seat = state.seats.find(s => s.id === seatId) || selectedSeat;
    try {
      await toggleSeatMaintenance(seat);
      toast('Seat status updated.', 'success');
    } catch (err) {
      toast(err.message || 'Could not update seat.', 'error');
    }
    setSelectedSeat(null);
  }

  async function triggerEmergency() {
    try {
      await setFloorEmergency(activeFloor, true, emergencyMsg || 'Emergency mode active. Please evacuate.');
      dispatch({ type: 'ADD_NOTIFICATION', notif: { type: 'alert', title: '🚨 Emergency Mode', body: emergencyMsg, targetRole: 'student' } });
      toast('Emergency mode activated.', 'error');
    } catch (err) {
      toast(err.message || 'Could not activate emergency mode.', 'error');
    }
    setEmergencyOpen(false);
  }

  async function clearEmergency() {
    try {
      await setFloorEmergency(activeFloor, false);
      toast('Emergency mode cleared.', 'success');
    } catch (err) {
      toast(err.message || 'Could not clear emergency mode.', 'error');
    }
  }

  const occupant = selectedSeat?.occupiedBy
    ? STUDENTS.find(s => s.id === selectedSeat.occupiedBy)
    : null;

  return (
    <div className="px-4 py-5 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-t1">Live Map</h1>
          <p className="text-sm text-t3 mt-0.5">Real-time seat overview</p>
        </div>
        <div className="flex gap-2">
          {state.emergencyMode ? (
            <Button variant="secondary" size="sm" onClick={clearEmergency}>Clear Emergency</Button>
          ) : (
            <Button variant="danger" size="sm" icon={<AlertTriangle size={14} />} onClick={() => setEmergencyOpen(true)}>
              Emergency
            </Button>
          )}
        </div>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Available"  value={totalStats.available}   color="green"  icon={<span className="text-base">✅</span>} />
        <StatCard label="Occupied"   value={totalStats.occupied}    color="red"    icon={<span className="text-base">🔴</span>} />
        <StatCard label="Away"       value={totalStats.away}        color="yellow" icon={<span className="text-base">⏳</span>} />
        <StatCard label="Abandoned"  value={totalStats.abandoned}   color="red"    icon={<span className="text-base">⚠️</span>}
          sub={totalStats.abandoned > 0 ? 'Needs attention' : 'All clear'} />
      </div>

      {/* Floor selector */}
      <div className="flex gap-2">
        {FLOORS.map(f => {
          const fs = state.seats.filter(s => s.floorId === f.id);
          const pct = getOccupancyPct(fs);
          return (
            <button key={f.id} onClick={() => { setActiveFloor(f.id); setSelectedSeat(null); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                activeFloor === f.id ? 'bg-violet text-white border-violet' : 'bg-surface text-t2 border-border hover:border-violet/30'
              }`}>
              <div>{f.shortName} Floor</div>
              <div className={`text-xs mt-0.5 ${activeFloor === f.id ? 'text-white/70' : pct > 80 ? 'text-alert' : 'text-safe'}`}>{pct}%</div>
            </button>
          );
        })}
      </div>

      {/* Floor stats bar */}
      <div className="bg-surface rounded-2xl border border-border px-4 py-3">
        <div className="flex justify-between text-xs mb-2">
          <span className="font-medium text-t2">{FLOORS.find(f => f.id === activeFloor)?.name} · {floorStats.pct}% full</span>
          <div className="flex gap-3">
            <span className="text-safe font-medium">{floorStats.available} free</span>
            <span className="text-alert font-medium">{floorStats.occupied} used</span>
            <span className="text-warn font-medium">{floorStats.away} away</span>
          </div>
        </div>
        <div className="w-full h-2 bg-s2 rounded-full overflow-hidden">
          <div className="h-2 rounded-full" style={{
            width: `${floorStats.pct}%`,
            background: floorStats.pct > 80 ? '#DC2626' : floorStats.pct > 55 ? '#D97706' : '#059669'
          }} />
        </div>
      </div>

      {/* Map */}
      <Card padding="md">
        <LibraryMap
          seats={floorSeats}
          selectedSeat={selectedSeat}
          onSelectSeat={setSelectedSeat}
          readonly={false}
        />
      </Card>

      {/* Seat detail panel */}
      {selectedSeat && (
        <Card padding="md" className="border-2 border-violet/20 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <p className="font-bold text-t1">{selectedSeat.label}</p>
              <Badge variant={
                selectedSeat.status === 'available' ? 'green' :
                selectedSeat.status === 'occupied'  ? 'red' :
                selectedSeat.status === 'away'      ? 'yellow' :
                selectedSeat.status === 'reserved'  ? 'violet' : 'default'
              }>
                {getSeatStatusLabel(selectedSeat.status)}
              </Badge>
            </div>
            <button onClick={() => setSelectedSeat(null)} className="text-t3 hover:text-t1">
              <X size={16} />
            </button>
          </div>

          {occupant && (
            <div className="bg-s2 rounded-xl p-3 mb-3">
              <p className="text-xs text-t3 mb-1">Occupied by</p>
              <p className="text-sm font-semibold text-t1">{occupant.name}</p>
              <p className="text-xs text-t3">{occupant.id} · {occupant.dept}</p>
              {selectedSeat.sessionStart && (
                <p className="text-xs text-t2 mt-1">Duration: {fmtDuration(Date.now() - selectedSeat.sessionStart)}</p>
              )}
            </div>
          )}

          {selectedSeat.status === 'away' && selectedSeat.awayUntil && (
            <div className="bg-warn-soft rounded-xl p-3 mb-3">
              <p className="text-xs font-medium text-warn">⏳ Away — expires {new Date(selectedSeat.awayUntil).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          )}

          <div className="flex gap-2">
            {(selectedSeat.status === 'occupied' || selectedSeat.status === 'away' || selectedSeat.status === 'reserved') && (
              <Button variant="danger" size="sm" icon={<RefreshCw size={13} />}
                onClick={() => releaseSeat(selectedSeat.id)} className="flex-1">
                {selectedSeat.status === 'reserved' ? 'Cancel Reservation' : 'Release Seat'}
              </Button>
            )}
            <Button variant="secondary" size="sm"
              onClick={() => toggleMaintenance(selectedSeat.id)} className="flex-1">
              {selectedSeat.status === 'maintenance' ? 'Mark Available' : 'Maintenance'}
            </Button>
          </div>
        </Card>
      )}

      {/* Emergency Modal */}
      <Modal open={emergencyOpen} onClose={() => setEmergencyOpen(false)} title="Emergency Mode" size="sm">
        <div className="space-y-4">
          <div className="bg-alert-soft border border-alert/20 rounded-xl p-3">
            <p className="text-sm font-medium text-alert">⚠️ This will mark all seats on this floor as unavailable and broadcast an alert to all students.</p>
          </div>
          <div>
            <label className="text-sm font-medium text-t1 block mb-1.5">Broadcast message</label>
            <textarea
              value={emergencyMsg}
              onChange={e => setEmergencyMsg(e.target.value)}
              placeholder="e.g. Floor closed for safety inspection..."
              rows={3}
              className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm text-t1 focus:outline-none focus:ring-2 focus:ring-alert resize-none"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setEmergencyOpen(false)} className="flex-1">Cancel</Button>
            <Button variant="danger" onClick={triggerEmergency} className="flex-1">Activate Emergency</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
