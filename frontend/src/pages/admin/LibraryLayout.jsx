import React, { useState } from 'react';
import { Plus, Trash2, Settings } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card, Button, Badge, Modal, Input, StatCard, SectionHeader } from '../../components/ui/index';
import LibraryMap from '../../components/map/LibraryMap';
import { FLOORS, ZONE_TYPES } from '../../data/mockData';
import { getSeatStatusLabel, getOccupancyPct } from '../../utils/helpers';
import { seatsAPI } from '../../utils/api';

export default function LibraryLayout() {
  const { state, dispatch, toast, apiMode, toggleSeatMaintenance } = useApp();
  const [activeFloor, setActiveFloor] = useState('f1');
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [editSeat, setEditSeat] = useState(null);
  const [editZone, setEditZone] = useState('');
  const [editFeatures, setEditFeatures] = useState([]);

  const floorSeats = state.seats.filter(s => s.floorId === activeFloor);
  const floor = FLOORS.find(f => f.id === activeFloor);

  const stats = {
    total: floorSeats.length,
    available: floorSeats.filter(s => s.status === 'available').length,
    maintenance: floorSeats.filter(s => s.status === 'maintenance').length,
    pct: getOccupancyPct(floorSeats),
  };

  const zoneCounts = ZONE_TYPES.map(z => ({
    ...z,
    count: floorSeats.filter(s => s.zone === z.id).length,
  }));

  function openEdit(seat) {
    setEditSeat(seat);
    setEditZone(seat.zone);
    setEditFeatures([...seat.features]);
    setSelectedSeat(null);
  }

  async function saveEdit() {
    if (apiMode) {
      try {
        const res = await seatsAPI.update(editSeat.id, { zone: editZone, features: editFeatures });
        dispatch({ type: 'UPDATE_SEAT', seatId: editSeat.id, updates: { ...res.data, id: editSeat.id, floorId: editSeat.floorId } });
        toast('Seat updated successfully.', 'success');
      } catch (err) {
        toast(err.message || 'Could not update seat.', 'error');
      }
      setEditSeat(null);
      return;
    }
    dispatch({ type: 'UPDATE_SEAT', seatId: editSeat.id, updates: { zone: editZone, features: editFeatures } });
    toast('Seat updated successfully.', 'success');
    setEditSeat(null);
  }

  function toggleFeature(f) {
    setEditFeatures(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  }

  async function toggleMaint(seat) {
    try {
      await toggleSeatMaintenance(seat);
      toast(`Seat ${seat.label} ${seat.status === 'maintenance' ? 'restored' : 'set to maintenance'}.`, 'success');
    } catch (err) {
      toast(err.message || 'Could not update seat.', 'error');
    }
    setSelectedSeat(null);
  }

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-t1">Library Layout</h1>
          <p className="text-sm text-t3 mt-0.5">Manage floors, zones, and desk configuration</p>
        </div>
        <Button size="sm" icon={<Plus size={14} />} variant="secondary">Add Floor</Button>
      </div>

      {/* Floor stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Seats"    value={stats.total}       color="blue"   icon={<span>🪑</span>} />
        <StatCard label="Available"      value={stats.available}   color="green"  icon={<span>✅</span>} />
        <StatCard label="Maintenance"    value={stats.maintenance} color="yellow" icon={<span>🔧</span>} />
        <StatCard label="Occupancy"      value={`${stats.pct}%`}  color="violet" icon={<span>📊</span>} />
      </div>

      {/* Floor selector */}
      <div className="flex gap-2">
        {FLOORS.map(f => (
          <button key={f.id} onClick={() => { setActiveFloor(f.id); setSelectedSeat(null); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              activeFloor === f.id ? 'bg-t1 text-white border-t1' : 'bg-surface text-t2 border-border hover:border-t1/30'
            }`}>
            {f.name}
          </button>
        ))}
      </div>

      {/* Zone breakdown */}
      <Card padding="md">
        <SectionHeader title="Zone Distribution" subtitle={floor?.name} className="mb-3" />
        <div className="grid grid-cols-2 gap-2">
          {zoneCounts.filter(z => z.count > 0).map(z => (
            <div key={z.id} className="flex items-center gap-2 py-2 px-3 bg-s2 rounded-xl">
              <span className="text-base">{z.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-t1 truncate">{z.label}</p>
                <p className="text-2xs text-t3">{z.count} seat{z.count !== 1 ? 's' : ''}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Map */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-t1">{floor?.name} Map</p>
          <p className="text-xs text-t3">Click a seat to manage it</p>
        </div>
        <LibraryMap
          seats={floorSeats}
          selectedSeat={selectedSeat}
          onSelectSeat={setSelectedSeat}
          readonly={false}
        />
      </Card>

      {/* Seat management panel */}
      {selectedSeat && (
        <Card padding="md" className="border-2 border-accent/20 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <p className="font-bold text-t1">{selectedSeat.label}</p>
              <Badge variant={selectedSeat.status === 'available' ? 'green' : selectedSeat.status === 'maintenance' ? 'default' : 'red'}>
                {getSeatStatusLabel(selectedSeat.status)}
              </Badge>
            </div>
            <button onClick={() => setSelectedSeat(null)} className="text-t3 hover:text-t1 text-lg">✕</button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div><p className="text-t3">Zone</p><p className="font-medium text-t1">{ZONE_TYPES.find(z => z.id === selectedSeat.zone)?.label}</p></div>
            <div><p className="text-t3">Features</p><p className="font-medium text-t1">{selectedSeat.features?.join(', ') || 'None'}</p></div>
            <div><p className="text-t3">Row / Col</p><p className="font-medium text-t1">{selectedSeat.row} / {selectedSeat.col}</p></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" icon={<Settings size={13} />} onClick={() => openEdit(selectedSeat)} className="flex-1">Edit Seat</Button>
            <Button size="sm" variant={selectedSeat.status === 'maintenance' ? 'success' : 'secondary'}
              icon={<span>🔧</span>} onClick={() => toggleMaint(selectedSeat)} className="flex-1">
              {selectedSeat.status === 'maintenance' ? 'Restore' : 'Maintenance'}
            </Button>
          </div>
        </Card>
      )}

      {/* Edit modal */}
      <Modal open={!!editSeat} onClose={() => setEditSeat(null)} title={`Edit Seat ${editSeat?.label}`} size="sm">
        {editSeat && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-t1 mb-2">Zone</p>
              <div className="grid grid-cols-2 gap-2">
                {ZONE_TYPES.map(z => (
                  <button key={z.id} onClick={() => setEditZone(z.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border transition-all ${
                      editZone === z.id ? 'bg-accent text-white border-accent' : 'bg-surface text-t2 border-border hover:border-accent/30'
                    }`}>
                    <span>{z.icon}</span>
                    <span className="text-xs font-medium">{z.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-t1 mb-2">Features</p>
              <div className="flex gap-2">
                {['charging','window','ac'].map(f => (
                  <button key={f} onClick={() => toggleFeature(f)}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                      editFeatures.includes(f) ? 'bg-accent text-white border-accent' : 'bg-surface text-t2 border-border'
                    }`}>
                    {f === 'charging' ? '⚡ Charging' : f === 'window' ? '🌤️ Window' : '❄️ AC'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setEditSeat(null)} className="flex-1">Cancel</Button>
              <Button onClick={saveEdit} className="flex-1">Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
