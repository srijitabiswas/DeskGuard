import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Users, ChevronRight, Check, Zap } from 'lucide-react';
import { useAuth, useApp } from '../../context/AppContext';
import { Card, Button, Badge, Modal, Toggle, SectionHeader } from '../../components/ui/index';
import { PREFERENCE_TAGS, ZONE_TYPES, FLOORS, STUDENTS } from '../../data/mockData';
import { filterSeatsByPreferences, getSeatStatusColor, generateId } from '../../utils/helpers';

function SeatCard({ seat, onBook, floor }) {
  const featureIcons = { charging: '⚡', window: '🌤️', ac: '❄️' };
  return (
    <Card padding="md" hover onClick={() => onBook(seat)} className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
        style={{ background: getSeatStatusColor(seat.status) }}>
        {seat.label.replace('S', '')}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-t1 text-sm">{seat.label}</p>
          <Badge variant="green" size="xs">Available</Badge>
        </div>
        <p className="text-xs text-t3 mt-0.5">{floor?.name} · {ZONE_TYPES.find(z => z.id === seat.zone)?.label}</p>
        {seat.features?.length > 0 && (
          <p className="text-xs text-t3 mt-0.5">{seat.features.map(f => featureIcons[f] || '').join(' ')}</p>
        )}
      </div>
      <ChevronRight size={16} className="text-t3 flex-shrink-0" />
    </Card>
  );
}

export default function FindSeat() {
  const { auth } = useAuth();
  const { state, dispatch, toast, bookSeat: reserveSeat } = useApp();
  const navigate = useNavigate();

  const [selectedPrefs, setSelectedPrefs] = useState(state.seatPreferences || []);
  const [buddyMode, setBuddyMode] = useState(false);
  const [buddyCount, setBuddyCount] = useState(2);
  const [bookSeat, setBookSeat] = useState(null);
  const [searched, setSearched] = useState(false);
  const [compatMode, setCompatMode] = useState(false);

  const myActiveSession = state.sessions.find(s => s.studentId === auth?.id && s.status === 'active');

  const availableSeats = useMemo(() =>
    state.seats.filter(s => s.status === 'available'),
    [state.seats]
  );

  const recommended = useMemo(() => {
    let seats = filterSeatsByPreferences(availableSeats, selectedPrefs);
    if (seats.length === 0) seats = availableSeats;
    // In buddy mode, ensure groups of nearby seats
    return seats.slice(0, buddyMode ? 6 : 8);
  }, [availableSeats, selectedPrefs, buddyMode]);

  function togglePref(id) {
    setSelectedPrefs(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
    dispatch({ type: 'SET_PREFERENCES', prefs: selectedPrefs });
  }

  async function confirmBook(seat) {
    if (myActiveSession) {
      toast("You already have an active session. Check out first.", 'error');
      return;
    }
    try {
      await reserveSeat(seat);
      dispatch({ type: 'ADD_NOTIFICATION', notif: { type: 'success', title: 'Seat reserved!', body: `${seat.label} is held for you. Check in within 10 minutes.`, targetRole: 'student' } });
      toast(`${seat.label} reserved — check in within 10 minutes`, 'success');
      setBookSeat(null);
      navigate('/student');
    } catch (err) {
      toast(err.message || 'Could not reserve that seat.', 'error');
    }
  }

  return (
    <div className="px-4 py-5 space-y-5 pb-safe">
      <div>
        <h1 className="text-xl font-bold text-t1">Find a Seat</h1>
        <p className="text-sm text-t3 mt-0.5">Tell us what you need — we'll find the perfect spot.</p>
      </div>

      {myActiveSession && (
        <div className="bg-warn-soft border border-warn/20 rounded-2xl p-4 text-sm text-warn font-medium">
          ⚠️ You have an active session. Check out before booking a new seat.
        </div>
      )}

      {/* Preferences */}
      <Card padding="md">
        <p className="text-sm font-semibold text-t1 mb-3">What do you need?</p>
        <div className="flex flex-wrap gap-2">
          {PREFERENCE_TAGS.map(tag => {
            const active = selectedPrefs.includes(tag.id);
            return (
              <button
                key={tag.id}
                onClick={() => togglePref(tag.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                  active
                    ? 'bg-accent text-white border-accent shadow-sm'
                    : 'bg-surface text-t2 border-border hover:border-accent/40 hover:bg-accent-soft'
                }`}
              >
                <span>{tag.icon}</span>
                {tag.label}
                {active && <Check size={12} />}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Buddy Study */}
      <Card padding="md">
        <Toggle
          checked={buddyMode}
          onChange={setBuddyMode}
          label="Buddy Study Mode"
          hint="Reserve adjacent seats for your study group"
        />
        {buddyMode && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-t3 mb-2">How many people?</p>
            <div className="flex gap-2">
              {[2, 3, 4, 5, 6].map(n => (
                <button
                  key={n}
                  onClick={() => setBuddyCount(n)}
                  className={`w-10 h-10 rounded-xl text-sm font-semibold border transition-all ${
                    buddyCount === n ? 'bg-accent text-white border-accent' : 'bg-surface text-t2 border-border hover:border-accent/40'
                  }`}
                >{n}</button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Study Compatibility */}
      <Card padding="md">
        <Toggle
          checked={compatMode}
          onChange={setCompatMode}
          label="Study With Similar People"
          hint="Suggest zones where students from your course usually study"
        />
        {compatMode && (
          <div className="mt-3 bg-violet-soft rounded-xl p-3">
            <p className="text-xs font-medium text-violet">🧠 Based on Computer Science students, Floor 2 Silent Zone and Near Window are most popular right now.</p>
          </div>
        )}
      </Card>

      {/* Find Button */}
      <Button
        fullWidth size="lg"
        icon={<Sparkles size={16} />}
        onClick={() => setSearched(true)}
      >
        Find Me a Seat
      </Button>

      {/* Results */}
      {searched && (
        <div className="space-y-3">
          <SectionHeader
            title={`${recommended.length} Recommended Seats`}
            subtitle={selectedPrefs.length > 0 ? `Matching: ${selectedPrefs.map(p => PREFERENCE_TAGS.find(t => t.id === p)?.label).join(', ')}` : 'All available seats'}
          />
          {recommended.length === 0 ? (
            <Card padding="md" className="text-center">
              <p className="text-2xl mb-2">😔</p>
              <p className="font-semibold text-t1">No seats found</p>
              <p className="text-sm text-t3 mt-1">Try different preferences or check back later.</p>
            </Card>
          ) : (
            recommended.map(seat => (
              <SeatCard
                key={seat.id}
                seat={seat}
                floor={FLOORS.find(f => f.id === seat.floorId)}
                onBook={setBookSeat}
              />
            ))
          )}
        </div>
      )}

      {/* Confirm Modal */}
      <Modal open={!!bookSeat} onClose={() => setBookSeat(null)} title="Confirm Reservation" size="sm">
        {bookSeat && (
          <div className="space-y-4">
            <div className="bg-s2 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-t3">Seat</span>
                <span className="font-semibold text-t1">{bookSeat.label}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-t3">Floor</span>
                <span className="font-semibold text-t1">{FLOORS.find(f => f.id === bookSeat.floorId)?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-t3">Zone</span>
                <span className="font-semibold text-t1">{ZONE_TYPES.find(z => z.id === bookSeat.zone)?.label}</span>
              </div>
              {bookSeat.features?.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-t3">Features</span>
                  <span className="font-semibold text-t1">{bookSeat.features.join(', ')}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-t3 bg-warn-soft px-3 py-2 rounded-xl">
              ⏰ This seat will be held for 10 minutes. Check in once you arrive, or it will be released automatically.
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setBookSeat(null)} className="flex-1">Cancel</Button>
              <Button onClick={() => confirmBook(bookSeat)} className="flex-1">Reserve Seat</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
