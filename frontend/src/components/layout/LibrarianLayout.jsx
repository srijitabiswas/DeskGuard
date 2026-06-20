import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Map, Clock, Layout, AlertTriangle, Bell, LogOut } from 'lucide-react';
import { useAuth, useApp } from '../../context/AppContext';
import { Avatar, ToastContainer } from '../ui/index';

const NAV = [
  { to: '/librarian',             label: 'Live Map',    icon: Map,           end: true },
  { to: '/librarian/sessions',    label: 'Sessions',    icon: Clock },
  { to: '/librarian/desks',       label: 'Desks',       icon: Layout },
  { to: '/librarian/alerts',      label: 'Alerts',      icon: AlertTriangle },
];

export default function LibrarianLayout() {
  const { auth, logout } = useAuth();
  const { state, dispatch, toast, markRead } = useApp();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const unread = state.notifications.filter(n => !n.read && n.targetRole === 'librarian').length;

  function handleLogout() { logout(); navigate('/login'); }

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      <header className="bg-surface border-b border-border sticky top-0 z-40">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-violet rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">DG</span>
            </div>
            <div>
              <span className="font-semibold text-t1 text-sm">DeskGuard</span>
              <span className="ml-2 text-2xs font-medium text-violet bg-violet-soft px-2 py-0.5 rounded-full">Librarian</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMenu(v => !v)}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center text-t2 hover:bg-s2"
            >
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-alert text-white text-2xs rounded-full flex items-center justify-center font-bold">
                  {unread}
                </span>
              )}
            </button>
            <Avatar name={auth?.name} initials={auth?.avatar} size="sm" />
          </div>
        </div>
      </header>

      {showMenu && (
        <div className="fixed inset-0 z-50" onClick={() => setShowMenu(false)}>
          <div
            className="absolute top-14 right-4 left-4 sm:left-auto sm:w-80 bg-surface rounded-2xl shadow-overlay border border-border overflow-hidden animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="font-semibold text-sm text-t1">Alerts</p>
              <button onClick={() => markRead('all')} className="text-xs text-accent font-medium">Clear all</button>
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-border">
              {state.notifications.filter(n => n.targetRole === 'librarian').map(n => (
                <div key={n.id} className={`px-4 py-3 ${!n.read ? 'bg-warn-soft/40' : ''}`}>
                  <p className="text-sm font-medium text-t1">{n.title}</p>
                  <p className="text-xs text-t3 mt-0.5">{n.body}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-border">
              <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-alert hover:bg-alert-soft">
                <LogOut size={15} /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {state.emergencyMode && (
        <div className="bg-alert text-white px-4 py-2.5 text-sm font-medium text-center">
          🚨 Emergency Mode Active — {state.emergencyMessage}
        </div>
      )}

      <main className="flex-1 overflow-y-auto pb-safe">
        <div className="max-w-2xl mx-auto">
          <Outlet />
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border">
        <div className="max-w-2xl mx-auto flex items-center px-2">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors ${isActive ? 'text-violet' : 'text-t3 hover:text-t2'}`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1 rounded-xl ${isActive ? 'bg-violet-soft' : ''}`}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  </div>
                  <span className="text-2xs font-medium">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
        <div className="h-safe-bottom bg-surface" />
      </nav>

      <ToastContainer toasts={state.toasts} onRemove={id => dispatch({ type: 'REMOVE_TOAST', id })} />
    </div>
  );
}
