import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, MapPin, Sparkles, Coffee, Shield, TrendingUp, Users,
  GraduationCap, BookOpen, ShieldCheck, Menu, X,
} from 'lucide-react';
import { useAuth } from '../context/AppContext';
import { useReveal } from '../hooks/useReveal';
import { ALL_SEATS } from '../data/mockData';
import LibraryMap from '../components/map/LibraryMap';

const SEAT_COLORS = ['#059669', '#DC2626', '#D97706', '#7C3AED'];

function SeatBoard() {
  // Stable pseudo-random board generated once — a diagonal "wave" of flips
  // through the same four states the real product uses (available, occupied,
  // away, reserved), so the hero visual IS the product, not an illustration.
  const cells = useMemo(() => {
    const rows = 4, cols = 7;
    const arr = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const seed = (r * 31 + c * 17) % SEAT_COLORS.length;
        const seed2 = (r * 13 + c * 29 + 2) % SEAT_COLORS.length;
        arr.push({
          c1: SEAT_COLORS[seed],
          c2: SEAT_COLORS[seed2 === seed ? (seed2 + 1) % SEAT_COLORS.length : seed2],
          delay: ((r * 0.35 + c * 0.22) % 6).toFixed(2),
        });
      }
    }
    return arr;
  }, []);

  return (
    <div className="grid grid-cols-7 gap-2 sm:gap-2.5 p-4 sm:p-5 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
      {cells.map((cell, i) => (
        <div
          key={i}
          className="seat-cell w-6 h-6 sm:w-8 sm:h-8 rounded-md"
          style={{ '--c1': cell.c1, '--c2': cell.c2, '--d': `${cell.delay}s` }}
        />
      ))}
    </div>
  );
}

function Reveal({ children, className = '', delay = 0 }) {
  const [ref, inView] = useReveal();
  return (
    <div ref={ref} className={`reveal ${inView ? 'in-view' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

const FEATURES = [
  { icon: MapPin,     title: 'Smart Library Map',  body: 'Every desk shows available, occupied, away, reserved, or under maintenance — instantly, on a live floor plan.' },
  { icon: Sparkles,   title: 'Find Me a Seat',      body: "Tell DeskGuard what you need — silent, near a window, charging — and it ranks the best matches for you." },
  { icon: Coffee,     title: 'Away Mode',           body: 'Step out for ten minutes without losing your seat. Return in time and pick up right where you left off.' },
  { icon: Shield,     title: 'Responsible Study Score', body: 'A trust score that rewards showing up and respecting your reservation — with real perks at higher tiers.' },
  { icon: TrendingUp, title: 'Occupancy Forecast',  body: 'See predicted busy and quiet hours before you even leave your room, so you arrive at the right time.' },
  { icon: Users,      title: 'Buddy Study',         body: 'Reserve seats next to your friends — two to six people, seated together, every time.' },
];

const ROLES = [
  { icon: GraduationCap, label: 'Student',  body: 'Reserve a seat, check in when you arrive, and build a study streak that actually means something.' },
  { icon: BookOpen,       label: 'Librarian', body: 'A live command center for the whole floor — release abandoned seats and broadcast notices in one tap.' },
  { icon: ShieldCheck,    label: 'Administrator', body: 'Onboard students, configure trust rules, and see exactly how every floor is being used.' },
];

export default function LandingPage() {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const dashboardPath = auth?.role === 'admin' ? '/admin' : auth?.role === 'librarian' ? '/librarian' : '/student';
  const previewSeats = ALL_SEATS.filter(s => s.floorId === 'f1').slice(0, 24);

  return (
    <div className="bg-bg text-t1">
      {/* ── Nav ─────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="bg-[#0F172A]/85 backdrop-blur-md border-b border-white/10">
          <div className="max-w-6xl mx-auto flex items-center justify-between px-5 h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">DG</span>
              </div>
              <span className="text-white font-semibold">DeskGuard</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-sm text-white/70 hover:text-white transition-colors">How it works</a>
              <a href="#features" className="text-sm text-white/70 hover:text-white transition-colors">Features</a>
              <a href="#roles" className="text-sm text-white/70 hover:text-white transition-colors">For your campus</a>
            </nav>

            <div className="hidden md:flex items-center gap-3">
              {auth ? (
                <button onClick={() => navigate(dashboardPath)} className="bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
                  Go to dashboard
                </button>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-medium text-white/80 hover:text-white transition-colors">Sign in</Link>
                  <Link to="/activate" className="bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
                    Get started
                  </Link>
                </>
              )}
            </div>

            <button onClick={() => setMenuOpen(v => !v)} className="md:hidden text-white p-2">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-[#0F172A] border-b border-white/10 px-5 py-4 space-y-3">
            <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="block text-sm text-white/80 py-1.5">How it works</a>
            <a href="#features" onClick={() => setMenuOpen(false)} className="block text-sm text-white/80 py-1.5">Features</a>
            <a href="#roles" onClick={() => setMenuOpen(false)} className="block text-sm text-white/80 py-1.5">For your campus</a>
            <div className="pt-2 flex flex-col gap-2">
              {auth ? (
                <button onClick={() => navigate(dashboardPath)} className="bg-accent text-white text-sm font-medium px-4 py-2.5 rounded-xl text-center">Go to dashboard</button>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-medium text-white/90 border border-white/20 rounded-xl px-4 py-2.5 text-center">Sign in</Link>
                  <Link to="/activate" className="bg-accent text-white text-sm font-medium px-4 py-2.5 rounded-xl text-center">Get started</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="relative bg-[#0F172A] pt-32 pb-20 sm:pb-28 px-5 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-accent/20 rounded-full blur-3xl drift-slow" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet/15 rounded-full blur-3xl drift-slow" style={{ animationDelay: '3s' }} />

        <div className="max-w-6xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="font-mono text-2xs tracking-widest text-accent/90 uppercase mb-5">DeskGuard · University Library OS</p>
              <h1 className="font-display text-white text-4xl sm:text-5xl lg:text-[3.4rem] leading-[1.08] font-medium">
                Walk in. See<br />every seat.<br /><span className="text-accent">Sit down.</span>
              </h1>
              <p className="text-white/60 text-base sm:text-lg mt-6 max-w-md leading-relaxed">
                DeskGuard shows which seats are free in real time, holds yours while you walk over, and keeps the library fair for everyone who needs a place to study.
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-8">
                <Link to="/activate" className="bg-accent hover:bg-accent-hover text-white font-medium px-6 py-3.5 rounded-xl flex items-center gap-2 transition-colors">
                  Get started <ArrowRight size={16} />
                </Link>
                <Link to="/login" className="text-white/90 hover:text-white border border-white/20 hover:border-white/40 font-medium px-6 py-3.5 rounded-xl transition-colors">
                  Sign in
                </Link>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <SeatBoard />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ─────────────────────────────────── */}
      <section className="bg-surface border-b border-border px-5">
        <div className="max-w-6xl mx-auto grid grid-cols-3 divide-x divide-border py-6">
          {[
            { val: '126', label: 'seats tracked live' },
            { val: '3',   label: 'floors mapped' },
            { val: '10s', label: 'seat status sync' },
          ].map(s => (
            <div key={s.label} className="text-center px-2">
              <p className="font-mono text-2xl sm:text-3xl font-bold text-t1">{s.val}</p>
              <p className="text-2xs sm:text-xs text-t3 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ────────────────────────────────── */}
      <section id="how-it-works" className="px-5 py-20 sm:py-28">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <p className="font-mono text-2xs tracking-widest text-accent uppercase mb-3">The process</p>
            <h2 className="font-display text-3xl sm:text-4xl font-medium text-t1 max-w-lg">Three steps between you and a seat.</h2>
          </Reveal>

          <div className="grid sm:grid-cols-3 gap-8 sm:gap-6 mt-14 relative">
            <div className="hidden sm:block absolute top-7 left-[16.5%] right-[16.5%] h-px bg-border" />
            {[
              { n: '01', title: 'Find',            body: 'Filter by zone, charging, quiet, or window. DeskGuard ranks the best matches for what you need right now.' },
              { n: '02', title: 'Reserve',          body: "Tap a seat. It's held for you for 10 minutes — plenty of time to walk over from anywhere on campus." },
              { n: '03', title: 'Check in & study', body: 'Arrive, check in, and your session timer starts. Step away without losing your seat using Away Mode.' },
            ].map((step, i) => (
              <Reveal key={step.n} delay={i * 120}>
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-t1 text-white font-mono text-sm flex items-center justify-center mb-5 relative z-10">{step.n}</div>
                  <h3 className="text-lg font-semibold text-t1 mb-2">{step.title}</h3>
                  <p className="text-sm text-t3 leading-relaxed">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live map preview ────────────────────────────── */}
      <section className="px-5 py-20 sm:py-28 bg-surface border-y border-border">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <p className="font-mono text-2xs tracking-widest text-violet uppercase mb-3">Live, not static</p>
            <h2 className="font-display text-3xl sm:text-4xl font-medium text-t1 mb-5">This is the actual map.</h2>
            <p className="text-t3 leading-relaxed mb-6">
              Not a mockup — the same live floor plan students, librarians, and administrators see inside DeskGuard, updating as seats are reserved, checked into, and released throughout the day.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { c: '#059669', l: 'Available' }, { c: '#DC2626', l: 'Occupied' },
                { c: '#D97706', l: 'Away' }, { c: '#7C3AED', l: 'Reserved' },
              ].map(d => (
                <div key={d.l} className="flex items-center gap-1.5 text-xs text-t2 bg-s2 px-2.5 py-1.5 rounded-lg">
                  <div className="w-2 h-2 rounded-full" style={{ background: d.c }} />
                  {d.l}
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={150}>
            <div className="bg-bg rounded-3xl p-5 shadow-card-lg border border-border">
              <LibraryMap seats={previewSeats} readonly compact />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section id="features" className="px-5 py-20 sm:py-28">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <p className="font-mono text-2xs tracking-widest text-accent uppercase mb-3">What it does</p>
            <h2 className="font-display text-3xl sm:text-4xl font-medium text-t1 max-w-lg">Built for real campus problems, not generic booking.</h2>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-14">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <Reveal key={f.title} delay={(i % 3) * 100}>
                  <div className="bg-surface border border-border rounded-2xl p-6 h-full hover:border-accent/30 hover:shadow-card-md transition-all duration-200">
                    <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center mb-4">
                      <Icon size={18} className="text-accent" />
                    </div>
                    <h3 className="font-semibold text-t1 mb-2">{f.title}</h3>
                    <p className="text-sm text-t3 leading-relaxed">{f.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Roles ────────────────────────────────────────── */}
      <section id="roles" className="px-5 py-20 sm:py-28 bg-surface border-y border-border">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <p className="font-mono text-2xs tracking-widest text-violet uppercase mb-3">For your campus</p>
            <h2 className="font-display text-3xl sm:text-4xl font-medium text-t1 max-w-lg">One system, three very different days.</h2>
          </Reveal>

          <div className="grid sm:grid-cols-3 gap-5 mt-14">
            {ROLES.map((r, i) => {
              const Icon = r.icon;
              return (
                <Reveal key={r.label} delay={i * 120}>
                  <div className="bg-bg rounded-2xl p-6 h-full border border-border">
                    <Icon size={22} className="text-t1 mb-4" />
                    <h3 className="font-semibold text-t1 mb-2">{r.label}</h3>
                    <p className="text-sm text-t3 leading-relaxed">{r.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────── */}
      <section className="relative bg-[#0F172A] px-5 py-20 sm:py-28 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-accent/15 rounded-full blur-3xl drift-slow" />
        <Reveal className="max-w-3xl mx-auto text-center relative">
          <h2 className="font-display text-3xl sm:text-4xl font-medium text-white mb-5">Ready to stop wandering the stacks?</h2>
          <p className="text-white/60 mb-8 max-w-md mx-auto">Join your campus library system and find your seat before you even arrive.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/activate" className="bg-accent hover:bg-accent-hover text-white font-medium px-7 py-3.5 rounded-xl flex items-center gap-2 transition-colors">
              Get started <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="text-white/90 hover:text-white border border-white/20 hover:border-white/40 font-medium px-7 py-3.5 rounded-xl transition-colors">
              Sign in
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="bg-[#0F172A] border-t border-white/10 px-5 py-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">DG</span>
            </div>
            <span className="text-white/80 text-sm font-medium">DeskGuard</span>
            <span className="text-white/30 text-sm hidden sm:inline">· Fair Seats. Smarter Study Spaces.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-sm text-white/50 hover:text-white/80 transition-colors">Sign in</Link>
            <span className="text-sm text-white/30">© {new Date().getFullYear()} DeskGuard</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
