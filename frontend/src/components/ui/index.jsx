import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

// ─── Button ──────────────────────────────────────────────
export function Button({
  children, onClick, variant = 'primary', size = 'md',
  disabled, loading, fullWidth, icon, className = '', type = 'button'
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 select-none';
  const variants = {
    primary:  'bg-accent text-white hover:bg-accent-hover focus-visible:ring-accent disabled:opacity-50',
    secondary:'bg-s2 text-t1 hover:bg-border focus-visible:ring-border-2',
    ghost:    'bg-transparent text-t2 hover:bg-s2 focus-visible:ring-border',
    danger:   'bg-alert text-white hover:bg-red-700 focus-visible:ring-alert',
    success:  'bg-safe text-white hover:bg-emerald-700 focus-visible:ring-safe',
    outline:  'border border-border-2 text-t1 hover:bg-s2 focus-visible:ring-border',
  };
  const sizes = {
    xs: 'text-xs px-2.5 py-1.5 h-7',
    sm: 'text-sm px-3.5 py-2 h-9',
    md: 'text-sm px-4 py-2.5 h-10',
    lg: 'text-base px-5 py-3 h-12',
    xl: 'text-base px-6 py-3.5 h-14',
  };
  return (
    <button
      type={type} onClick={onClick} disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {loading ? <Spinner size="sm" color={variant === 'primary' ? 'white' : 'blue'} /> : icon}
      {children}
    </button>
  );
}

// ─── Badge ───────────────────────────────────────────────
export function Badge({ children, variant = 'default', size = 'sm', dot, className = '' }) {
  const base = 'inline-flex items-center gap-1 font-medium rounded-full';
  const variants = {
    default: 'bg-s2 text-t2',
    blue:    'bg-accent-soft text-accent',
    green:   'bg-safe-soft text-safe',
    yellow:  'bg-warn-soft text-warn',
    red:     'bg-alert-soft text-alert',
    violet:  'bg-violet-soft text-violet',
    outline: 'border border-border-2 text-t2 bg-white',
  };
  const sizes = { xs: 'text-2xs px-2 py-0.5', sm: 'text-xs px-2.5 py-1', md: 'text-sm px-3 py-1.5' };
  return (
    <span className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

// ─── Card ────────────────────────────────────────────────
export function Card({ children, className = '', onClick, hover = false, padding = 'md' }) {
  const paddings = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' };
  return (
    <div
      onClick={onClick}
      className={`bg-surface rounded-2xl shadow-card border border-border ${paddings[padding]}
        ${onClick || hover ? 'cursor-pointer hover:shadow-card-md hover:border-border-2 transition-all duration-200' : ''}
        ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Input ───────────────────────────────────────────────
export function Input({
  label, placeholder, value, onChange, type = 'text',
  error, hint, icon, iconRight, disabled, className = '',
  ...props
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-sm font-medium text-t1">{label}</label>}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-t3">{icon}</span>
        )}
        <input
          type={type} value={value} onChange={onChange} disabled={disabled}
          placeholder={placeholder}
          className={`w-full h-10 rounded-xl border text-sm text-t1 placeholder-t3 bg-surface
            focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
            transition-all duration-150
            ${icon ? 'pl-9' : 'pl-3.5'} ${iconRight ? 'pr-9' : 'pr-3.5'}
            ${error ? 'border-alert focus:ring-alert' : 'border-border hover:border-border-2'}
            ${disabled ? 'opacity-50 cursor-not-allowed bg-s2' : ''}`}
          {...props}
        />
        {iconRight && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-t3">{iconRight}</span>
        )}
      </div>
      {error && <p className="text-xs text-alert">{error}</p>}
      {hint && !error && <p className="text-xs text-t3">{hint}</p>}
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md', hideClose }) {
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', full: 'max-w-3xl' };

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      style={{ background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className={`bg-surface w-full ${sizes[size]} rounded-t-3xl sm:rounded-2xl shadow-overlay
        max-h-[90dvh] overflow-y-auto animate-slide-up`}>
        {(title || !hideClose) && (
          <div className="flex items-center justify-between px-6 pt-6 pb-0">
            {title && <h2 className="text-lg font-semibold text-t1">{title}</h2>}
            {!hideClose && (
              <button
                onClick={onClose}
                className="ml-auto -mr-1 p-2 rounded-xl text-t3 hover:text-t1 hover:bg-s2 transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}
        <div className="px-6 pb-8 pt-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Avatar ──────────────────────────────────────────────
const AVATAR_COLORS = [
  '#2563EB','#7C3AED','#059669','#D97706','#DC2626','#0891B2','#92400E','#1D4ED8',
];
export function Avatar({ name, initials, size = 'md', src, color, className = '' }) {
  const sizes = { xs: 'w-6 h-6 text-2xs', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-lg' };
  const letters = initials || (name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??');
  const bg = color || AVATAR_COLORS[(letters.charCodeAt(0) + (letters.charCodeAt(1) || 0)) % AVATAR_COLORS.length];
  if (src) return <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover ${className}`} />;
  return (
    <div className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 ${className}`}
      style={{ background: bg }}>
      {letters}
    </div>
  );
}

// ─── Spinner ─────────────────────────────────────────────
export function Spinner({ size = 'md', color = 'blue' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-7 h-7' };
  const colors = { blue: 'border-accent', white: 'border-white', gray: 'border-t3' };
  return (
    <div className={`${sizes[size]} rounded-full border-2 border-t-transparent animate-spin ${colors[color]}`} />
  );
}

// ─── Progress ────────────────────────────────────────────
export function ProgressBar({ value, max = 100, color = 'blue', size = 'md', showLabel, className = '' }) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  const heights = { xs: 'h-1', sm: 'h-1.5', md: 'h-2', lg: 'h-3' };
  const colors = { blue: 'bg-accent', green: 'bg-safe', yellow: 'bg-warn', red: 'bg-alert', violet: 'bg-violet' };
  return (
    <div className={className}>
      <div className={`w-full bg-s2 rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className={`${heights[size]} ${colors[color]} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && <p className="text-xs text-t3 mt-1">{Math.round(pct)}%</p>}
    </div>
  );
}

// ─── Tabs ────────────────────────────────────────────────
export function Tabs({ tabs, active, onChange, className = '' }) {
  return (
    <div className={`flex gap-1 bg-s2 rounded-xl p-1 ${className}`}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 text-sm font-medium px-3 py-2 rounded-lg transition-all duration-150
            ${active === tab.id ? 'bg-white text-t1 shadow-card' : 'text-t2 hover:text-t1'}`}
        >
          {tab.icon && <span className="mr-1.5">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─── Select ──────────────────────────────────────────────
export function Select({ label, value, onChange, options, placeholder, disabled, error, className = '' }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-sm font-medium text-t1">{label}</label>}
      <select
        value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
        className={`w-full h-10 rounded-xl border px-3.5 text-sm text-t1 bg-surface
          focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
          transition-all duration-150 appearance-none
          ${error ? 'border-alert' : 'border-border hover:border-border-2'}
          ${disabled ? 'opacity-50 cursor-not-allowed bg-s2' : ''}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-alert">{error}</p>}
    </div>
  );
}

// ─── Toggle ──────────────────────────────────────────────
export function Toggle({ checked, onChange, label, hint, size = 'md' }) {
  const sizes = { sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 'translate-x-4' }, md: { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: 'translate-x-5' } };
  const sz = sizes[size];
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-start gap-3 w-full text-left"
    >
      <div className={`relative flex-shrink-0 ${sz.track} rounded-full transition-colors duration-200 ${checked ? 'bg-accent' : 'bg-border-2'}`}>
        <span className={`absolute top-0.5 left-0.5 ${sz.thumb} bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? sz.translate : 'translate-x-0'}`} />
      </div>
      {(label || hint) && (
        <div>
          {label && <p className="text-sm font-medium text-t1 leading-tight">{label}</p>}
          {hint && <p className="text-xs text-t3 mt-0.5">{hint}</p>}
        </div>
      )}
    </button>
  );
}

// ─── Empty State ─────────────────────────────────────────
export function EmptyState({ icon, title, body, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {icon && <div className="text-4xl mb-3">{icon}</div>}
      <p className="font-semibold text-t1 text-base mb-1">{title}</p>
      {body && <p className="text-sm text-t3 max-w-xs">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────
export function StatCard({ label, value, sub, icon, color = 'blue', trend, className = '' }) {
  const colors = {
    blue:   { bg: '#EFF6FF', icon: '#2563EB', text: '#1D4ED8' },
    green:  { bg: '#ECFDF5', icon: '#059669', text: '#065F46' },
    yellow: { bg: '#FFFBEB', icon: '#D97706', text: '#92400E' },
    red:    { bg: '#FEF2F2', icon: '#DC2626', text: '#991B1B' },
    violet: { bg: '#F5F3FF', icon: '#7C3AED', text: '#5B21B6' },
  };
  const c = colors[color];
  return (
    <Card className={className} padding="md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-t3 uppercase tracking-wide mb-1">{label}</p>
          <p className="text-2xl font-bold text-t1">{value}</p>
          {sub && <p className="text-xs text-t3 mt-0.5">{sub}</p>}
          {trend !== undefined && (
            <p className={`text-xs mt-1 font-medium ${trend >= 0 ? 'text-safe' : 'text-alert'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last week
            </p>
          )}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: c.bg }}>
            <span style={{ color: c.icon }}>{icon}</span>
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Section Header ──────────────────────────────────────
export function SectionHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-3 ${className}`}>
      <div>
        <h2 className="text-base font-semibold text-t1">{title}</h2>
        {subtitle && <p className="text-sm text-t3 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

// ─── Toast Container ─────────────────────────────────────
export function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className="flex items-center gap-3 bg-t1 text-white text-sm font-medium px-4 py-3
            rounded-2xl shadow-overlay animate-slide-up pointer-events-auto"
        >
          <span>{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : t.type === 'warn' ? '⚠️' : 'ℹ️'}</span>
          <span className="flex-1">{t.msg}</span>
          <button onClick={() => onRemove(t.id)} className="opacity-60 hover:opacity-100 transition-opacity">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
