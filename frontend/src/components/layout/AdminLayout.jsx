import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Grid, BarChart2, Settings, LogOut, Menu, X } from 'lucide-react';
import { useAuth, useApp } from '../../context/AppContext';
import { Avatar, ToastContainer } from '../ui/index';

const NAV = [
  { to: '/admin',           label: 'Overview',       icon: LayoutDashboard, end: true },
  { to: '/admin/students',  label: 'Students',       icon: Users },
  { to: '/admin/layout',    label: 'Library Layout', icon: Grid },
  { to: '/admin/analytics', label: 'Analytics',      icon: BarChart2 },
  { to: '/admin/settings',  label: 'Settings',       icon: Settings },
];

export default function AdminLayout() {
  const { auth, logout } = useAuth();
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() { logout(); navigate('/login'); }

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-t1 w-60">
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">DG</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">DeskGuard</p>
            <p className="text-white/40 text-2xs">Admin Portal</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/8'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <Avatar name={auth?.name} initials={auth?.avatar} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{auth?.name}</p>
            <p className="text-white/40 text-2xs truncate">{auth?.title}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-white/60 hover:text-alert hover:bg-alert-soft/10 rounded-xl transition-colors"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-dvh flex bg-bg">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile overlay sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 animate-slide-up">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="md:hidden bg-surface border-b border-border sticky top-0 z-40 flex items-center justify-between px-4 h-14">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl text-t2 hover:bg-s2">
            <Menu size={20} />
          </button>
          <span className="font-semibold text-t1 text-sm">DeskGuard Admin</span>
          <Avatar name={auth?.name} initials={auth?.avatar} size="sm" />
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <ToastContainer toasts={state.toasts} onRemove={id => dispatch({ type: 'REMOVE_TOAST', id })} />
    </div>
  );
}
