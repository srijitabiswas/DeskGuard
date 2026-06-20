import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, GraduationCap, BookOpen, ShieldCheck, ArrowLeft } from 'lucide-react';
import { ADMINS, LIBRARIANS, DEPARTMENTS } from '../../data/mockData';
import { useAuth, useApp } from '../../context/AppContext';
import { Button, Input } from '../../components/ui/index';
import { deriveNameFromEmail, pickRandom, getInitials } from '../../utils/helpers';

const ROLE_OPTIONS = [
  { role: 'student',   label: 'Student',   icon: GraduationCap, desc: 'Find seats & track sessions',  email: 'srijita.biswas@uni.edu', pw: 'pass123' },
  { role: 'librarian', label: 'Librarian', icon: BookOpen,       desc: 'Manage the live floor map',    email: 'kavitha.rao@uni.edu',    pw: 'lib123'  },
  { role: 'admin',     label: 'Admin',     icon: ShieldCheck,    desc: 'Configure the whole system',   email: 'admin@uni.edu',          pw: 'admin123' },
];

export default function LoginPage() {
  const { login, apiMode } = useAuth();
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingRole, setLoadingRole] = useState(null);

  async function doLogin(loginEmail, loginPassword) {
    setError('');

    // Always try the real backend first — don't rely on the apiMode flag's
    // timing, since it's set asynchronously on mount and can still be false
    // even when the backend is reachable. Only fall back to mock-data
    // accounts if the backend is genuinely unreachable (a network error),
    // not if it responds with "invalid credentials".
    try {
      const result = await login(loginEmail, loginPassword);
      if (result.role === 'admin') navigate('/admin');
      else if (result.role === 'librarian') navigate('/librarian');
      else navigate('/student');
      return;
    } catch (err) {
      if (err.status) {
        // Backend responded — this is a real auth rejection, surface it.
        throw err;
      }
      // No err.status means the request never reached the server
      // (network error) — fall through to mock-data login below.
    }

    await new Promise(r => setTimeout(r, 450));

    // Staff roles stay fixed-list — no auto-provisioning for admin/librarian.
    const admin = ADMINS.find(a => a.email === loginEmail && a.password === loginPassword);
    if (admin) { login({ ...admin, role: 'admin' }); navigate('/admin'); return; }
    const lib = LIBRARIANS.find(l => l.email === loginEmail && l.password === loginPassword);
    if (lib) { login({ ...lib, role: 'librarian' }); navigate('/librarian'); return; }

    // Student — fully frictionless: any email/password works.
    const stu = state.students.find(s => s.email === loginEmail);
    if (stu) {
      if (stu.activated && stu.password) {
        if (stu.password === loginPassword) { login({ ...stu, role: 'student' }); navigate('/student'); return; }
        throw new Error('Incorrect email or password.');
      }
      // Pre-loaded but never claimed — auto-activate right now instead of
      // bouncing to a separate Activate page.
      const activated = { ...stu, activated: true, password: loginPassword };
      dispatch({ type: 'UPDATE_STUDENT_INFO', studentId: stu.id, updates: { activated: true, password: loginPassword } });
      login({ ...activated, role: 'student' });
      navigate('/student');
      return;
    }

    // No record anywhere for this email — create a brand-new student
    // account on the spot, exactly like the real backend now does.
    const name = deriveNameFromEmail(loginEmail);
    const newStudent = {
      id: 'STU' + Date.now().toString().slice(-8),
      name,
      email: loginEmail,
      dept: pickRandom(DEPARTMENTS),
      year: 1 + Math.floor(Math.random() * 4),
      avatar: getInitials(name),
      trustScore: 60,
      activated: true,
      password: loginPassword,
    };
    dispatch({ type: 'ADD_STUDENT', student: newStudent });
    login({ ...newStudent, role: 'student' });
    navigate('/student');
  }

  async function handleLogin() {
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    try { await doLogin(email, password); }
    catch (err) { setError(err.message || 'Login failed. Please try again.'); }
    finally { setLoading(false); }
  }

  async function handleQuickLogin(option) {
    setError('');
    setLoadingRole(option.role);
    try { await doLogin(option.email, option.pw); }
    catch (err) { setError(err.message || 'Login failed. Please try again.'); }
    finally { setLoadingRole(null); }
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center p-5">
      <Link to="/" className="absolute top-5 left-5 flex items-center gap-1.5 text-sm font-medium text-t3 hover:text-t1 transition-colors">
        <ArrowLeft size={15} /> Home
      </Link>

      <div className="mb-8 flex flex-col items-center">
        <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center shadow-card-md mb-4">
          <span className="text-white text-2xl font-bold">DG</span>
        </div>
        <h1 className="text-2xl font-bold text-t1">DeskGuard</h1>
        <p className="text-t3 text-sm mt-1">Fair Seats. Smarter Study Spaces.</p>
        {apiMode && (
          <div className="flex items-center gap-1.5 mt-2 bg-safe-soft px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-safe rounded-full animate-pulse" />
            <span className="text-xs font-medium text-safe">Connected to live backend</span>
          </div>
        )}
      </div>

      <div className="bg-surface rounded-2xl shadow-card-md border border-border p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold text-t1 mb-1">Sign in</h2>
        <p className="text-sm text-t3 mb-6">Enter your university credentials</p>
        <div className="space-y-4">
          <Input label="Email address" type="email" placeholder="you@uni.edu" value={email}
            onChange={e => setEmail(e.target.value)} icon={<Mail size={16} />} />
          <Input label="Password" type={showPw ? 'text' : 'password'} placeholder="Enter your password"
            value={password} onChange={e => setPassword(e.target.value)}
            icon={<Lock size={16} />}
            iconRight={<button type="button" onClick={() => setShowPw(v => !v)} className="text-t3 hover:text-t1">{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>}
            onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          {error && <div className="bg-alert-soft border border-alert/20 rounded-xl px-4 py-3 text-sm text-alert">{error}</div>}
          <Button fullWidth loading={loading} onClick={handleLogin} size="lg">Sign in</Button>
        </div>
        <p className="text-xs text-t3 text-center mt-3">
          No account yet? Any email + password creates a student account instantly.
        </p>
        <p className="text-center text-sm text-t3 mt-3">
          Prefer a guided setup? <Link to="/activate" className="text-accent font-medium hover:underline">Activate account</Link>
        </p>
      </div>

      {/* Quick sign-in as a role — single tap, no credentials shown */}
      <div className="mt-6 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-px bg-border" />
          <p className="text-xs text-t3 font-medium">or sign in as</p>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {ROLE_OPTIONS.map(opt => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.role}
                onClick={() => handleQuickLogin(opt)}
                disabled={loadingRole !== null}
                className="bg-surface border border-border rounded-xl p-3 text-center hover:border-accent hover:shadow-card transition-all disabled:opacity-60"
              >
                <div className="w-8 h-8 mx-auto mb-1.5 rounded-lg bg-accent-soft flex items-center justify-center">
                  <Icon size={15} className="text-accent" />
                </div>
                <p className="text-xs font-semibold text-t1">{loadingRole === opt.role ? 'Signing in…' : opt.label}</p>
                <p className="text-2xs text-t3 mt-0.5 leading-tight">{opt.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
