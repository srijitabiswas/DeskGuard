import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ChevronRight, Pencil, HelpCircle, Settings as SettingsIcon, Shield, Mail, Phone, User as UserIcon } from 'lucide-react';
import { useAuth, useApp } from '../../context/AppContext';
import { Card, Badge, Button, Toggle, Avatar, ProgressBar, SectionHeader, Modal, Input } from '../../components/ui/index';
import { getTrustTier, getStudyStreak, fmtDuration, getWeekStudyMs } from '../../utils/helpers';
import { FAQS } from '../../data/mockData';

const BADGES = [
  { id: 'b1', emoji: '🔥', name: 'Streak Starter',   desc: 'Study 3 days in a row',         earned: true  },
  { id: 'b2', emoji: '⭐', name: 'Responsible',       desc: 'Score above 75',                 earned: true  },
  { id: 'b3', emoji: '🌅', name: 'Early Bird',        desc: 'Start a session before 8 AM',   earned: true  },
  { id: 'b4', emoji: '🏆', name: 'Elite Scholar',     desc: 'Score above 90',                 earned: true  },
  { id: 'b5', emoji: '🤝', name: 'Team Player',       desc: 'Complete a Buddy Study session', earned: false },
  { id: 'b6', emoji: '💯', name: 'Perfect Week',      desc: 'Study every day for 7 days',     earned: false },
  { id: 'b7', emoji: '⚡', name: 'Speed Booker',      desc: 'Book within 2 minutes of peak',  earned: false },
  { id: 'b8', emoji: '📚', name: 'Knowledge Seeker',  desc: '50+ completed sessions',         earned: false },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between gap-3 py-3 text-left">
        <p className="text-sm font-medium text-t1">{q}</p>
        <ChevronRight size={15} className={`text-t3 flex-shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && <p className="text-sm text-t3 pb-3 leading-relaxed">{a}</p>}
    </div>
  );
}

export default function StudentProfile() {
  const { auth, logout, updateAuth } = useAuth();
  const { state, dispatch, toast } = useApp();
  const navigate = useNavigate();

  const [notifs, setNotifs]   = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText]       = useState(false);
  const [colorBlind, setColorBlind]     = useState(false);

  const [editOpen, setEditOpen]     = useState(false);
  const [faqOpen, setFaqOpen]       = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editForm, setEditForm]     = useState({ name: auth?.name || '', email: auth?.email || '', phone: auth?.phone || '' });
  const [editErrors, setEditErrors] = useState({});

  const mine    = state.sessions.filter(s => s.studentId === auth?.id);
  const tier    = getTrustTier(auth?.trustScore ?? 0);
  const streak  = getStudyStreak(mine);
  const weekMs  = getWeekStudyMs(mine);
  const earned  = BADGES.filter(b => b.earned);

  function handleLogout() { logout(); navigate('/login'); }

  function openEdit() {
    setEditForm({ name: auth?.name || '', email: auth?.email || '', phone: auth?.phone || '' });
    setEditErrors({});
    setEditOpen(true);
  }

  function saveEdit() {
    const errs = {};
    if (!editForm.name.trim()) errs.name = 'Name is required.';
    if (!editForm.email.trim() || !editForm.email.includes('@')) errs.email = 'Enter a valid email.';
    if (editForm.phone && !/^[\d+\-\s]{7,15}$/.test(editForm.phone)) errs.phone = 'Enter a valid phone number.';
    setEditErrors(errs);
    if (Object.keys(errs).length) return;

    const avatar = editForm.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    updateAuth({ name: editForm.name, email: editForm.email, phone: editForm.phone, avatar });
    dispatch({ type: 'UPDATE_STUDENT_INFO', studentId: auth.id, updates: { name: editForm.name, email: editForm.email, phone: editForm.phone, avatar } });
    toast('Profile updated successfully.', 'success');
    setEditOpen(false);
  }

  return (
    <div className="px-4 py-5 space-y-5 pb-safe">
      {/* Profile header */}
      <Card padding="lg">
        <div className="flex items-center gap-4">
          <Avatar name={auth?.name} initials={auth?.avatar} size="xl" />
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-t1 truncate">{auth?.name}</p>
            <p className="text-sm text-t3 truncate">{auth?.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant="outline" size="xs">{auth?.dept}</Badge>
              <Badge variant="outline" size="xs">Year {auth?.year}</Badge>
            </div>
          </div>
          <button onClick={openEdit} className="flex-shrink-0 w-9 h-9 rounded-xl bg-s2 flex items-center justify-center text-t2 hover:bg-border transition-colors">
            <Pencil size={15} />
          </button>
        </div>
      </Card>

      {/* Trust score */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-t3 uppercase tracking-wide font-medium">Responsible Study Score</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <p className="text-3xl font-black text-t1">{auth?.trustScore ?? 0}</p>
              <p className="text-sm text-t3 font-normal">/ 100</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-3xl">{tier.badge}</p>
            <p className="text-xs font-semibold mt-0.5" style={{ color: tier.color }}>{tier.label}</p>
          </div>
        </div>
        <ProgressBar value={auth?.trustScore ?? 0} max={100} color={
          auth?.trustScore >= 90 ? 'blue' : auth?.trustScore >= 75 ? 'green' : auth?.trustScore >= 55 ? 'yellow' : 'red'
        } size="lg" />
        <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-border">
          <div className="text-center">
            <p className="text-base font-bold text-t1">{streak}</p>
            <p className="text-2xs text-t3">Day Streak</p>
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-t1">{mine.filter(s => s.status === 'completed').length}</p>
            <p className="text-2xs text-t3">Sessions</p>
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-t1">{fmtDuration(weekMs)}</p>
            <p className="text-2xs text-t3">This Week</p>
          </div>
        </div>
      </Card>

      {/* Badges */}
      <div>
        <SectionHeader title="Badges" subtitle={`${earned.length} of ${BADGES.length} earned`} className="mb-3" />
        <div className="grid grid-cols-4 gap-2">
          {BADGES.map(b => (
            <div key={b.id} className={`rounded-xl p-2.5 text-center transition-all ${b.earned ? 'bg-surface border border-border shadow-card' : 'bg-s2 opacity-40'}`}>
              <p className="text-2xl">{b.emoji}</p>
              <p className="text-2xs font-medium text-t1 mt-1 leading-tight">{b.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Account menu */}
      <Card padding="none" className="overflow-hidden">
        <button onClick={openEdit} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-s2 transition-colors border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-accent-soft flex items-center justify-center"><Pencil size={15} className="text-accent" /></div>
          <span className="flex-1 text-left text-sm font-medium text-t1">Edit Profile</span>
          <ChevronRight size={16} className="text-t3" />
        </button>
        <button onClick={() => setSettingsOpen(true)} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-s2 transition-colors border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-violet-soft flex items-center justify-center"><SettingsIcon size={15} className="text-violet" /></div>
          <span className="flex-1 text-left text-sm font-medium text-t1">Settings</span>
          <ChevronRight size={16} className="text-t3" />
        </button>
        <button onClick={() => setFaqOpen(true)} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-s2 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-safe-soft flex items-center justify-center"><HelpCircle size={15} className="text-safe" /></div>
          <span className="flex-1 text-left text-sm font-medium text-t1">Help &amp; FAQs</span>
          <ChevronRight size={16} className="text-t3" />
        </button>
      </Card>

      {/* Account info */}
      <Card padding="md">
        <p className="text-sm font-semibold text-t1 mb-3">Account</p>
        <div className="space-y-1">
          {[
            { label: 'Student ID',  val: auth?.id },
            { label: 'Department',  val: auth?.dept },
            { label: 'Year',        val: `Year ${auth?.year}` },
            { label: 'Phone',       val: auth?.phone || 'Not added' },
          ].map(row => (
            <div key={row.label} className="flex justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm text-t3">{row.label}</span>
              <span className="text-sm font-medium text-t1">{row.val}</span>
            </div>
          ))}
        </div>
      </Card>

      <Button variant="danger" fullWidth icon={<LogOut size={16} />} onClick={handleLogout}>
        Sign out
      </Button>

      {/* Edit Profile Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile" size="sm">
        <div className="space-y-4">
          <Input label="Full Name" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
            icon={<UserIcon size={15} />} error={editErrors.name} />
          <Input label="Email" type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
            icon={<Mail size={15} />} error={editErrors.email} />
          <Input label="Phone (optional)" type="tel" placeholder="e.g. +91 98765 43210" value={editForm.phone}
            onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
            icon={<Phone size={15} />} error={editErrors.phone} />
          <div className="bg-s2 rounded-xl p-3 text-xs text-t3">
            <Shield size={13} className="inline mr-1 -mt-0.5" />
            Student ID, Department, and Year are managed by your library administrator.
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={saveEdit} className="flex-1">Save Changes</Button>
          </div>
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Settings" size="md">
        <div className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-t1 mb-3">Notifications</p>
            <div className="space-y-4">
              <Toggle checked={notifs} onChange={setNotifs} label="Study reminders" hint="Get notified when your session is about to expire" />
              <Toggle checked={true} onChange={() => {}} label="Seat availability alerts" hint="Notify when preferred zones become available" />
              <Toggle checked={true} onChange={() => {}} label="Trust score updates" hint="Get notified when your score changes" />
            </div>
          </div>
          <div className="pt-4 border-t border-border">
            <p className="text-sm font-semibold text-t1 mb-3">Accessibility</p>
            <div className="space-y-4">
              <Toggle checked={highContrast} onChange={setHighContrast} label="High contrast mode" hint="Increase contrast for better visibility" />
              <Toggle checked={largeText} onChange={setLargeText} label="Large text mode" hint="Increase text size across the app" />
              <Toggle checked={colorBlind} onChange={setColorBlind} label="Colourblind-friendly indicators" hint="Use patterns and icons instead of colour alone" />
            </div>
          </div>
          <Button fullWidth onClick={() => { toast('Settings saved.', 'success'); setSettingsOpen(false); }}>Save Settings</Button>
        </div>
      </Modal>

      {/* FAQ Modal */}
      <Modal open={faqOpen} onClose={() => setFaqOpen(false)} title="Help & FAQs" size="md">
        <div>
          {FAQS.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}
        </div>
      </Modal>
    </div>
  );
}
