import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, User, Mail, Lock } from 'lucide-react';
import { STUDENTS } from '../../data/mockData';
import { useAuth, useApp } from '../../context/AppContext';
import { Button, Input, Badge } from '../../components/ui/index';

const STEPS = ['Verify Identity', 'Set Password', 'All Set!'];

export default function ActivatePage() {
  const { login } = useAuth();
  const { toast } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [foundStudent, setFoundStudent] = useState(null);

  async function handleVerify() {
    setError('');
    if (!studentId || !email) { setError('Both fields are required.'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    const stu = STUDENTS.find(s => s.id === studentId && s.email === email);
    if (!stu) {
      setError('No student record found. Check your Student ID and email.');
      setLoading(false);
      return;
    }
    if (stu.activated) {
      setError('This account is already activated. Please sign in.');
      setLoading(false);
      return;
    }
    setFoundStudent(stu);
    setStep(1);
    setLoading(false);
  }

  async function handleSetPassword() {
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    // In real app: API call. Here we update the in-memory record.
    foundStudent.activated = true;
    foundStudent.password = password;
    setStep(2);
    setLoading(false);
  }

  function handleGoDashboard() {
    login({ ...foundStudent, role: 'student' });
    navigate('/student');
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center p-5">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center">
        <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center shadow-card-md mb-4">
          <span className="text-white text-2xl font-bold">DG</span>
        </div>
        <h1 className="text-2xl font-bold text-t1">Activate Account</h1>
        <p className="text-t3 text-sm mt-1">DeskGuard · Student Portal</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-6 w-full max-w-sm">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex items-center gap-1.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors
                ${i < step ? 'bg-safe text-white' : i === step ? 'bg-accent text-white' : 'bg-border-2 text-t3'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-t1' : 'text-t3'}`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 rounded-full ${i < step ? 'bg-safe' : 'bg-border'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-surface rounded-2xl shadow-card-md border border-border p-6 w-full max-w-sm">
        {/* Step 0: Verify */}
        {step === 0 && (
          <>
            <h2 className="text-lg font-semibold text-t1 mb-1">Verify your identity</h2>
            <p className="text-sm text-t3 mb-6">Enter the Student ID and email provided by your institution.</p>
            <div className="space-y-4">
              <Input
                label="Student ID"
                placeholder="e.g. STU2024004"
                value={studentId}
                onChange={e => setStudentId(e.target.value.toUpperCase())}
                icon={<User size={16} />}
              />
              <Input
                label="University Email"
                type="email"
                placeholder="you@uni.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                icon={<Mail size={16} />}
              />
              {error && <p className="text-sm text-alert bg-alert-soft px-3 py-2.5 rounded-xl">{error}</p>}
              <Button fullWidth loading={loading} onClick={handleVerify} size="lg">
                Verify Identity
              </Button>
            </div>
            <p className="text-xs text-t3 text-center mt-4">
              Try: ID <span className="font-mono font-semibold">STU2024004</span> · email <span className="font-mono font-semibold">sneha.reddy@uni.edu</span>
            </p>
          </>
        )}

        {/* Step 1: Set password */}
        {step === 1 && foundStudent && (
          <>
            <div className="flex items-center gap-3 mb-5 p-3 bg-safe-soft rounded-xl border border-safe/20">
              <ShieldCheck size={20} className="text-safe flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-t1">{foundStudent.name}</p>
                <p className="text-xs text-t3">{foundStudent.dept} · Year {foundStudent.year}</p>
              </div>
            </div>
            <h2 className="text-lg font-semibold text-t1 mb-1">Create a password</h2>
            <p className="text-sm text-t3 mb-5">Choose a strong password to secure your account.</p>
            <div className="space-y-4">
              <Input
                label="Password"
                type={showPw ? 'text' : 'password'}
                placeholder="Min. 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                icon={<Lock size={16} />}
                iconRight={
                  <button type="button" onClick={() => setShowPw(v => !v)}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Repeat password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                icon={<Lock size={16} />}
                onKeyDown={e => e.key === 'Enter' && handleSetPassword()}
              />
              {error && <p className="text-sm text-alert bg-alert-soft px-3 py-2.5 rounded-xl">{error}</p>}
              <Button fullWidth loading={loading} onClick={handleSetPassword} size="lg">
                Activate Account
              </Button>
            </div>
          </>
        )}

        {/* Step 2: Success */}
        {step === 2 && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 bg-safe-soft rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">🎉</span>
            </div>
            <h2 className="text-xl font-bold text-t1 mb-1">You're all set!</h2>
            <p className="text-sm text-t3 mb-2">Your DeskGuard account is active.</p>
            {foundStudent && (
              <div className="flex flex-col gap-1 mt-1 mb-6">
                <Badge variant="green">Responsible Study Score: {foundStudent.trustScore}</Badge>
              </div>
            )}
            <Button fullWidth onClick={handleGoDashboard} size="lg">
              Go to Dashboard
            </Button>
          </div>
        )}
      </div>

      {step === 0 && (
        <p className="mt-4 text-sm text-t3">
          Already activated?{' '}
          <Link to="/login" className="text-accent font-medium hover:underline">Sign in</Link>
        </p>
      )}
    </div>
  );
}
