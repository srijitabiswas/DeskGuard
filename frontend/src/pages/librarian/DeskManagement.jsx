import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card, Badge, Button, Tabs, Input } from '../../components/ui/index';
import { FLOORS, ZONE_TYPES } from '../../data/mockData';
import { getSeatStatusLabel, getSeatStatusColor } from '../../utils/helpers';

export default function DeskManagement() {
  const { state, dispatch, toast, toggleSeatMaintenance, releaseSeatById } = useApp();
  const [floor, setFloor] = useState('f1');
  const [statusFilter, setStatusFilter] = useState('all');
  const [q, setQ] = useState('');

  const floorSeats = useMemo(() => {
    let seats = state.seats.filter(s => s.floorId === floor);
    if (statusFilter !== 'all') seats = seats.filter(s => s.status === statusFilter);
    if (q.trim()) seats = seats.filter(s => s.label.toLowerCase().includes(q.toLowerCase()) || s.zone.includes(q.toLowerCase()));
    return seats;
  }, [state.seats, floor, statusFilter, q]);

  const counts = useMemo(() => {
    const fl = state.seats.filter(s => s.floorId === floor);
    return {
      available:   fl.filter(s => s.status === 'available').length,
      occupied:    fl.filter(s => s.status === 'occupied').length,
      maintenance: fl.filter(s => s.status === 'maintenance').length,
      away:        fl.filter(s => s.status === 'away').length,
    };
  }, [state.seats, floor]);

  async function toggleMaintenance(seat) {
    try {
      await toggleSeatMaintenance(seat);
      toast(`Seat ${seat.status === 'maintenance' ? 'returned to available' : 'set to maintenance'}.`, 'success');
    } catch (err) {
      toast(err.message || 'Could not update seat.', 'error');
    }
  }

  async function releaseIfNeeded(seat) {
    if (seat.status === 'occupied' || seat.status === 'away' || seat.status === 'reserved') {
      try {
        await releaseSeatById(seat.id);
        toast(seat.status === 'reserved' ? 'Reservation cancelled.' : 'Seat released.', 'success');
      } catch (err) {
        toast(err.message || 'Could not release seat.', 'error');
      }
    }
  }

  return (
    <div className="px-4 py-5 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-t1">Desk Management</h1>
        <p className="text-sm text-t3 mt-0.5">View and control individual desks</p>
      </div>

      {/* Floor tabs */}
      <div className="flex gap-2">
        {FLOORS.map(f => (
          <button key={f.id} onClick={() => setFloor(f.id)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
              floor === f.id ? 'bg-violet text-white border-violet' : 'bg-surface text-t2 border-border'
            }`}>
            {f.shortName} Floor
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { key: 'available',   label: 'Free',   color: 'text-safe' },
          { key: 'occupied',    label: 'Used',   color: 'text-alert' },
          { key: 'away',        label: 'Away',   color: 'text-warn' },
          { key: 'maintenance', label: 'Maint.', color: 'text-t3' },
        ].map(({ key, label, color }) => (
          <button key={key} onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
            className={`bg-surface border rounded-xl py-2 px-1 text-center transition-all ${
              statusFilter === key ? 'border-accent shadow-card' : 'border-border'
            }`}>
            <p className={`text-base font-bold ${color}`}>{counts[key]}</p>
            <p className="text-2xs text-t3">{label}</p>
          </button>
        ))}
      </div>

      <Input
        placeholder="Search seat or zone…"
        value={q} onChange={e => setQ(e.target.value)}
        icon={<Search size={15} />}
      />

      {/* Seat grid */}
      <div className="grid grid-cols-1 gap-2">
        {floorSeats.map(seat => {
          const zone = ZONE_TYPES.find(z => z.id === seat.zone);
          return (
            <Card key={seat.id} padding="sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: getSeatStatusColor(seat.status) }}>
                  {seat.label.replace('S', '')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-t1">{seat.label}</p>
                    <Badge
                      variant={seat.status === 'available' ? 'green' : seat.status === 'occupied' ? 'red' : seat.status === 'away' ? 'yellow' : seat.status === 'reserved' ? 'violet' : 'default'}
                      size="xs"
                    >
                      {getSeatStatusLabel(seat.status)}
                    </Badge>
                  </div>
                  <p className="text-xs text-t3">{zone?.icon} {zone?.label}</p>
                  {seat.features?.length > 0 && (
                    <p className="text-xs text-t3">{seat.features.map(f => f === 'charging' ? '⚡' : f === 'window' ? '🌤️' : '❄️').join(' ')}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {(seat.status === 'occupied' || seat.status === 'away' || seat.status === 'reserved') && (
                    <Button variant="danger" size="xs" onClick={() => releaseIfNeeded(seat)}>
                      {seat.status === 'reserved' ? 'Cancel' : 'Release'}
                    </Button>
                  )}
                  <Button
                    variant={seat.status === 'maintenance' ? 'success' : 'secondary'}
                    size="xs"
                    onClick={() => toggleMaintenance(seat)}
                  >
                    {seat.status === 'maintenance' ? 'Restore' : 'Maint.'}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
