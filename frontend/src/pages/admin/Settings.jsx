import React, { useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card, Button, Input, Toggle, SectionHeader, Badge, Select, Modal, Avatar } from '../../components/ui/index';
import { LIBRARIANS } from '../../data/mockData';

const DEFAULT_POLICY = {
  maxSessionHours: 4,
  awayMinutes: 10,
  noShowWindowMins: 10,
  maxAdvanceBookingHours: 48,
  maxActiveSessions: 1,
  peakHoursStart: '12:00',
  peakHoursEnd: '17:00',
  allowBuddyStudy: true,
  maxBuddySize: 6,
  requireCheckIn: true,
};

const DEFAULT_TRUST = {
  sessionComplete: 20,
  earlyCheckIn: 5,
  breakRespected: 5,
  noShow: -15,
  overstay: -10,
  abandoned: -20,
  buddyComplete: 10,
};

export default function AdminSettings() {
  const { toast } = useApp();
  const [policy, setPolicy]         = useState(DEFAULT_POLICY);
  const [trust, setTrust]           = useState(DEFAULT_TRUST);
  const [activeTab, setActiveTab]   = useState('policy');
  const [addLibOpen, setAddLibOpen] = useState(false);
  const [libForm, setLibForm]       = useState({ name: '', email: '', floor: 'All Floors', password: '' });
  const [libList, setLibList]       = useState(LIBRARIANS);

  const [session, setSession] = useState({
    name: 'Academic Year 2024–25',
    start: '2024-07-01',
    end: '2025-05-31',
    semester: 'Odd Semester',
  });

  function save(section) {
    toast(`${section} settings saved successfully.`, 'success');
  }

  function pol(key) {
    return { value: policy[key], onChange: e => setPolicy(p => ({ ...p, [key]: e.target.value }) ) };
  }

  function addLibrarian() {
    if (!libForm.name || !libForm.email) { toast('Name and email required.', 'error'); return; }
    const newLib = { id: `LIB${Date.now()}`, ...libForm, avatar: libForm.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() };
    setLibList(l => [newLib, ...l]);
    toast(`${libForm.name} added as librarian.`, 'success');
    setLibForm({ name: '', email: '', floor: 'All Floors', password: '' });
    setAddLibOpen(false);
  }

  const TABS = [
    { id: 'policy',  label: 'Library Policy' },
    { id: 'trust',   label: 'Trust Rules' },
    { id: 'staff',   label: 'Staff' },
    { id: 'session', label: 'Academic Session' },
  ];

  return (
    <div className="p-5 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-t1">Settings</h1>
        <p className="text-sm text-t3 mt-0.5">Configure your library system policies</p>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 bg-s2 rounded-xl p-1 overflow-x-auto no-scrollbar">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-shrink-0 text-sm font-medium px-3 py-2 rounded-lg transition-all ${
              activeTab === t.id ? 'bg-white text-t1 shadow-card' : 'text-t2 hover:text-t1'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Policy tab */}
      {activeTab === 'policy' && (
        <div className="space-y-4">
          <Card padding="md">
            <SectionHeader title="Session Limits" className="mb-4" />
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Max session hours" type="number" {...pol('maxSessionHours')} />
                <Input label="Away mode (minutes)" type="number" {...pol('awayMinutes')} />
                <Input label="No-show window (min)" type="number" {...pol('noShowWindowMins')} />
                <Input label="Max advance booking (h)" type="number" {...pol('maxAdvanceBookingHours')} />
              </div>
              <Toggle
                checked={policy.requireCheckIn}
                onChange={v => setPolicy(p => ({ ...p, requireCheckIn: v }))}
                label="Require physical check-in"
                hint="Students must confirm at the desk within the no-show window"
              />
              <Toggle
                checked={policy.allowBuddyStudy}
                onChange={v => setPolicy(p => ({ ...p, allowBuddyStudy: v }))}
                label="Allow Buddy Study bookings"
                hint="Enable group seat reservations"
              />
              {policy.allowBuddyStudy && (
                <Input label="Max buddy group size" type="number"
                  value={policy.maxBuddySize}
                  onChange={e => setPolicy(p => ({ ...p, maxBuddySize: e.target.value }))} />
              )}
            </div>
          </Card>

          <Card padding="md">
            <SectionHeader title="Peak Hours" className="mb-4" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Peak starts" type="time" value={policy.peakHoursStart}
                onChange={e => setPolicy(p => ({ ...p, peakHoursStart: e.target.value }))} />
              <Input label="Peak ends" type="time" value={policy.peakHoursEnd}
                onChange={e => setPolicy(p => ({ ...p, peakHoursEnd: e.target.value }))} />
            </div>
            <p className="text-xs text-t3 mt-2">During peak hours, higher trust scores get priority access.</p>
          </Card>

          <Button fullWidth icon={<Save size={15} />} onClick={() => save('Policy')}>Save Policy Settings</Button>
        </div>
      )}

      {/* Trust tab */}
      {activeTab === 'trust' && (
        <div className="space-y-4">
          <Card padding="md">
            <SectionHeader title="Point Rewards" subtitle="Points added for positive behaviour" className="mb-4" />
            <div className="space-y-3">
              {[
                { key: 'sessionComplete', label: 'Session completed' },
                { key: 'earlyCheckIn',   label: 'Early check-in' },
                { key: 'breakRespected', label: 'Break respected' },
                { key: 'buddyComplete',  label: 'Buddy study completed' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <p className="flex-1 text-sm text-t1">{label}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-safe font-bold text-sm">+</span>
                    <input
                      type="number"
                      value={trust[key]}
                      onChange={e => setTrust(t => ({ ...t, [key]: parseInt(e.target.value) || 0 }))}
                      className="w-16 h-9 rounded-xl border border-border text-center text-sm font-semibold text-safe focus:outline-none focus:ring-2 focus:ring-safe"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="md">
            <SectionHeader title="Point Penalties" subtitle="Points deducted for negative behaviour" className="mb-4" />
            <div className="space-y-3">
              {[
                { key: 'noShow',    label: 'No-show' },
                { key: 'overstay',  label: 'Overstay' },
                { key: 'abandoned', label: 'Seat abandoned' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <p className="flex-1 text-sm text-t1">{label}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-alert font-bold text-sm">−</span>
                    <input
                      type="number"
                      value={Math.abs(trust[key])}
                      onChange={e => setTrust(t => ({ ...t, [key]: -(parseInt(e.target.value) || 0) }))}
                      className="w-16 h-9 rounded-xl border border-border text-center text-sm font-semibold text-alert focus:outline-none focus:ring-2 focus:ring-alert"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="bg-accent-soft rounded-2xl p-4 text-sm text-accent">
            <p className="font-semibold mb-1">💡 Trust Score Tiers</p>
            <div className="space-y-1 text-xs">
              <p>🏆 <strong>Elite (90+)</strong> — Priority access + VIP features</p>
              <p>⭐ <strong>Responsible (75–89)</strong> — Extended away mode</p>
              <p>📖 <strong>Regular (55–74)</strong> — Standard booking</p>
              <p>⚠️ <strong>Needs Improvement (&lt;55)</strong> — Restricted booking</p>
            </div>
          </div>

          <Button fullWidth icon={<Save size={15} />} onClick={() => save('Trust')}>Save Trust Rules</Button>
        </div>
      )}

      {/* Staff tab */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-t1">Librarians ({libList.length})</p>
            <Button size="sm" icon={<Plus size={14} />} onClick={() => setAddLibOpen(true)}>Add Librarian</Button>
          </div>
          <div className="space-y-2">
            {libList.map(lib => (
              <Card key={lib.id} padding="md">
                <div className="flex items-center gap-3">
                  <Avatar name={lib.name} initials={lib.avatar} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-t1 text-sm">{lib.name}</p>
                    <p className="text-xs text-t3 truncate">{lib.email}</p>
                    <Badge variant="outline" size="xs" className="mt-1">{lib.floor}</Badge>
                  </div>
                  <button
                    onClick={() => { setLibList(l => l.filter(x => x.id !== lib.id)); toast('Librarian removed.', 'success'); }}
                    className="text-t3 hover:text-alert transition-colors p-1"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </Card>
            ))}
          </div>

          <Modal open={addLibOpen} onClose={() => setAddLibOpen(false)} title="Add Librarian" size="sm">
            <div className="space-y-3">
              <Input label="Full Name" placeholder="Ms. Jane Smith" value={libForm.name} onChange={e => setLibForm(f => ({ ...f, name: e.target.value }))} />
              <Input label="Email" type="email" placeholder="jane@uni.edu" value={libForm.email} onChange={e => setLibForm(f => ({ ...f, email: e.target.value }))} />
              <Select label="Assigned Floor" value={libForm.floor} onChange={v => setLibForm(f => ({ ...f, floor: v }))}
                options={['All Floors', 'Ground Floor', 'First Floor', 'Second Floor'].map(x => ({ value: x, label: x }))} />
              <Input label="Temporary Password" type="password" placeholder="Min 6 characters" value={libForm.password} onChange={e => setLibForm(f => ({ ...f, password: e.target.value }))} />
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setAddLibOpen(false)} className="flex-1">Cancel</Button>
                <Button onClick={addLibrarian} className="flex-1">Add Librarian</Button>
              </div>
            </div>
          </Modal>
        </div>
      )}

      {/* Academic session tab */}
      {activeTab === 'session' && (
        <div className="space-y-4">
          <Card padding="md">
            <SectionHeader title="Current Academic Session" className="mb-4" />
            <div className="space-y-3">
              <Input label="Session Name" value={session.name} onChange={e => setSession(s => ({ ...s, name: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Start Date" type="date" value={session.start} onChange={e => setSession(s => ({ ...s, start: e.target.value }))} />
                <Input label="End Date" type="date" value={session.end} onChange={e => setSession(s => ({ ...s, end: e.target.value }))} />
              </div>
              <Select label="Semester" value={session.semester} onChange={v => setSession(s => ({ ...s, semester: v }))}
                options={['Odd Semester', 'Even Semester', 'Summer Term'].map(x => ({ value: x, label: x }))} />
            </div>
          </Card>
          <Button fullWidth icon={<Save size={15} />} onClick={() => save('Academic Session')}>Save Session</Button>
        </div>
      )}
    </div>
  );
}
