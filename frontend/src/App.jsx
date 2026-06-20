import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AppProvider, useAuth } from './context/AppContext';

// Marketing
import LandingPage   from './pages/LandingPage';

// Auth
import LoginPage    from './pages/auth/LoginPage';
import ActivatePage from './pages/auth/ActivatePage';

// Layouts
import StudentLayout  from './components/layout/StudentLayout';
import LibrarianLayout from './components/layout/LibrarianLayout';
import AdminLayout    from './components/layout/AdminLayout';

// Student pages
import StudentHome    from './pages/student/StudentHome';
import FindSeat       from './pages/student/FindSeat';
import StudentMap     from './pages/student/StudentMap';
import MySessions     from './pages/student/MySessions';
import StudentProfile from './pages/student/StudentProfile';

// Librarian pages
import LibrarianHome     from './pages/librarian/LibrarianHome';
import LibrarianSessions from './pages/librarian/Sessions';
import DeskManagement    from './pages/librarian/DeskManagement';
import LibrarianAlerts   from './pages/librarian/Alerts';

// Admin pages
import AdminOverview  from './pages/admin/AdminOverview';
import AdminStudents  from './pages/admin/Students';
import LibraryLayout  from './pages/admin/LibraryLayout';
import Analytics      from './pages/admin/Analytics';
import AdminSettings  from './pages/admin/Settings';

// ─── Route guard ─────────────────────────────────────────
function RequireAuth({ role, children }) {
  const { auth } = useAuth();
  const location = useLocation();
  if (!auth) return <Navigate to="/login" state={{ from: location }} replace />;
  if (role && auth.role !== role) return <Navigate to="/login" replace />;
  return children;
}

function RootRedirect() {
  // Kept for any legacy links pointing elsewhere; landing page now owns "/".
  const { auth } = useAuth();
  if (auth?.role === 'admin')     return <Navigate to="/admin"     replace />;
  if (auth?.role === 'librarian') return <Navigate to="/librarian" replace />;
  if (auth?.role === 'student')   return <Navigate to="/student"   replace />;
  return <Navigate to="/" replace />;
}

// ─── App ─────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <Routes>
            {/* Public */}
            <Route path="/"          element={<LandingPage />} />
            <Route path="/login"     element={<LoginPage />} />
            <Route path="/activate"  element={<ActivatePage />} />
            <Route path="/dashboard" element={<RootRedirect />} />

            {/* Student */}
            <Route path="/student" element={
              <RequireAuth role="student"><StudentLayout /></RequireAuth>
            }>
              <Route index          element={<StudentHome />} />
              <Route path="find"    element={<FindSeat />} />
              <Route path="map"     element={<StudentMap />} />
              <Route path="sessions"element={<MySessions />} />
              <Route path="profile" element={<StudentProfile />} />
            </Route>

            {/* Librarian */}
            <Route path="/librarian" element={
              <RequireAuth role="librarian"><LibrarianLayout /></RequireAuth>
            }>
              <Route index           element={<LibrarianHome />} />
              <Route path="sessions" element={<LibrarianSessions />} />
              <Route path="desks"    element={<DeskManagement />} />
              <Route path="alerts"   element={<LibrarianAlerts />} />
            </Route>

            {/* Admin */}
            <Route path="/admin" element={
              <RequireAuth role="admin"><AdminLayout /></RequireAuth>
            }>
              <Route index            element={<AdminOverview />} />
              <Route path="students"  element={<AdminStudents />} />
              <Route path="layout"    element={<LibraryLayout />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings"  element={<AdminSettings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
