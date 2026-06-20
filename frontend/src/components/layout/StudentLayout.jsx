import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, Search, Map, BookOpen, User, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AppContext';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../ui/index';
import { ToastContainer } from '../ui/index';

const NAV = [
  { to: '/student',          label: 'Home',     icon: Home,     end: true },
  { to: '/student/find',     label: 'Find Seat',icon: Search },
  { to: '/student/map',      label: 'Map',      icon: Map },
  { to: '/student/sessions', label: 'Sessions', icon: BookOpen },
  { to: '/student/profile',  label: 'Profile',  icon: User },
];

export default function StudentLayout() {
  const { auth, logout } = useAuth();
  const { state, dispatch, markRead } = useApp();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);

  const unread = state.notifications.filter(n => !n.read && n.targetRole === 'student').length;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      {/* Top bar */}
      <header className="bg-surface border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">DG</span>
            </div>
            <span className="font-semibold text-t1 text-sm">DeskGuard</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Bell */}
            <button
              onClick={() => setNotifOpen(v => !v)}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center text-t2 hover:bg-s2 transition-colors"
            >
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-alert text-white text-2xs rounded-full flex items-center justify-center font-bold">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
            <Avatar name={auth?.name} initials={auth?.avatar} size="sm" />
          </div>
        </div>
      </header>

      {/* Notification drawer */}
      {notifOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setNotifOpen(false)}>
          <div
            className="absolute top-14 right-4 left-4 sm:left-auto sm:w-80 bg-surface rounded-2xl shadow-overlay border border-border overflow-hidden animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="font-semibold text-sm text-t1">Notifications</p>
              <button
                onClick={() => { markRead('all'); }}
                className="text-xs text-accent font-medium hover:underline"
              >Mark all read</button>
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-border">
              {state.notifications.filter(n => n.targetRole === 'student').length === 0 ? (
                <p className="text-sm text-t3 p-4 text-center">No notifications</p>
              ) : (
                state.notifications.filter(n => n.targetRole === 'student').map(n => (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`px-4 py-3 cursor-pointer hover:bg-s2 transition-colors ${!n.read ? 'bg-accent-soft/40' : ''}`}
                  >
                    <p className={`text-sm font-medium ${!n.read ? 'text-t1' : 'text-t2'}`}>{n.title}</p>
                    <p className="text-xs text-t3 mt-0.5 line-clamp-2">{n.body}</p>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-border">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-alert hover:bg-alert-soft transition-colors"
              >
                <LogOut size={15} /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency banner */}
      {state.emergencyMode && (
        <div className="bg-alert text-white px-4 py-2.5 text-sm font-medium text-center">
          ⚠️ {state.emergencyMessage || 'Emergency mode active. Please check with library staff.'}
        </div>
      )}

      {/* Page content */}
      <main className="flex-1 overflow-y-auto pb-safe">
        <div className="max-w-lg mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border">
        <div className="max-w-lg mx-auto flex items-center px-2">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors ${
                  isActive ? 'text-accent' : 'text-t3 hover:text-t2'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-accent-soft' : ''}`}>
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

      {/* Toast */}
      <ToastContainer
        toasts={state.toasts}
        onRemove={id => dispatch({ type: 'REMOVE_TOAST', id })}
      />
    </div>
  );
}
