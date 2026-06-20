import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useApp } from '../../context/AppContext';
import { Card, Badge, Button } from '../../components/ui/index';
import LibraryMap from '../../components/map/LibraryMap';
import { FLOORS, ZONE_TYPES } from '../../data/mockData';
import { getSeatStatusLabel, generateId, getOccupancyPct } from '../../utils/helpers';

export default function StudentMap() {
  const { auth } = useAuth();
  const { state, dispatch, toast, bookSeat } = useApp();
  const navigate = useNavigate();
  const [activeFloor, setActiveFloor] = useState('f1');
  const [selectedSeat, setSelectedSeat] = useState(null);

  const myActiveSession = state.sessions.find(s => s.studentId === auth?.id && s.status === 'active');

  const floorSeats = useMemo(() =>
    state.seats.filter(s => s.floorId === activeFloor),
    [state.seats, activeFloor]
  );

  const stats = useMemo(() => {
    const total = floorSeats.length;
    const available = floorSeats.filter(s => s.status === 'available').length;
    const occupied = floorSeats.filter(s => s.status === 'occupied').length;
    const away = floorSeats.filter(s => s.status === 'away').length;
    return { total, available, occupied, away, pct: getOccupancyPct(floorSeats) };
  }, [floorSeats]);

  async function handleBook() {
    if (!selectedSeat || selectedSeat.status !== 'available') return;
    if (myActiveSession) { toast('You already have an active session.', 'error'); return; }
    try {
      await bookSeat(selectedSeat);
      toast(`${selectedSeat.label} reserved — check in within 10 minutes`, 'success');
      setSelectedSeat(null);
      navigate('/student');
    } catch (err) {
      toast(err.message || 'Could not reserve that seat.', 'error');
    }
  }

  const zone = selectedSeat ? ZONE_TYPES.find(z => z.id === selectedSeat.zone) : null;

  return (
    <div className="px-4 py-5 space-y-4 pb-safe">
      <div>
        <h1 className="text-xl font-bold text-t1">Library Map</h1>
        <p className="text-sm text-t3 mt-0.5">Tap an available seat to reserve it</p>
      </div>

      {/* Floor selector */}
      <div className="flex gap-2">
        {FLOORS.map(f => {
          const flSeats = state.seats.filter(s => s.floorId === f.id);
          const avail = flSeats.filter(s => s.status === 'available').length;
          return (
            <button
              key={f.id}
              onClick={() => { setActiveFloor(f.id); setSelectedSeat(null); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                activeFloor === f.id
                  ? 'bg-accent text-white border-accent'
                  : 'bg-surface text-t2 border-border hover:border-accent/30'
              }`}
            >
              <div>{f.shortName} Floor</div>
              <div className={`text-xs mt-0.5 ${activeFloor === f.id ? 'text-white/70' : 'text-safe'}`}>{avail} free</div>
            </button>
          );
        })}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Available', val: stats.available, color: 'bg-safe' },
          { label: 'Occupied',  val: stats.occupied,  color: 'bg-alert' },
          { label: 'Away',      val: stats.away,       color: 'bg-warn' },
        ].map(({ label, val, color }) => (
          <Card key={label} padding="sm" className="text-center">
            <div className="flex items-center justify-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${color}`} />
              <p className="text-base font-bold text-t1">{val}</p>
            </div>
            <p className="text-2xs text-t3">{label}</p>
          </Card>
        ))}
      </div>

      {/* Occupancy bar */}
      <div className="bg-surface rounded-2xl border border-border px-4 py-3">
        <div className="flex justify-between mb-1.5">
          <p className="text-xs font-medium text-t2">{FLOORS.find(f => f.id === activeFloor)?.name} Occupancy</p>
          <p className="text-xs font-bold text-t1">{stats.pct}%</p>
        </div>
        <div className="w-full h-2 bg-s2 rounded-full overflow-hidden">
          <div className="h-2 rounded-full transition-all duration-700"
            style={{ width: `${stats.pct}%`, background: stats.pct > 80 ? '#DC2626' : stats.pct > 55 ? '#D97706' : '#059669' }} />
        </div>
      </div>

      {/* Map */}
      <Card padding="md">
        <LibraryMap
          seats={floorSeats}
          selectedSeat={selectedSeat}
          onSelectSeat={seat => seat.status === 'available' && setSelectedSeat(seat)}
        />
      </Card>

      {/* Seat detail */}
      {selectedSeat && (
        <Card padding="md" className="border-2 border-accent/20 animate-slide-up">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-t1">{selectedSeat.label}</p>
                <Badge variant={selectedSeat.status === 'available' ? 'green' : 'yellow'}>
                  {getSeatStatusLabel(selectedSeat.status)}
                </Badge>
              </div>
              <p className="text-sm text-t3 mt-0.5">
                {FLOORS.find(f => f.id === selectedSeat.floorId)?.name} · {zone?.icon} {zone?.label}
              </p>
              {selectedSeat.features?.length > 0 && (
                <div className="flex gap-1.5 mt-2">
                  {selectedSeat.features.map(f => (
                    <span key={f} className="text-xs bg-s2 px-2 py-1 rounded-lg text-t2">
                      {f === 'charging' ? '⚡ Charging' : f === 'window' ? '🌤️ Window' : '❄️ AC'}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setSelectedSeat(null)} className="text-t3 hover:text-t1 text-lg leading-none">✕</button>
          </div>
          {selectedSeat.status === 'available' && !myActiveSession && (
            <Button fullWidth onClick={handleBook} className="mt-4">Reserve This Seat</Button>
          )}
          {myActiveSession && <p className="text-xs text-warn mt-3">⚠️ Check out of your current session first.</p>}
          {selectedSeat.status !== 'available' && (
            <p className="text-xs text-t3 mt-3 bg-s2 px-3 py-2 rounded-xl">This seat is currently {getSeatStatusLabel(selectedSeat.status).toLowerCase()}.</p>
          )}
        </Card>
      )}
    </div>
  );
}
