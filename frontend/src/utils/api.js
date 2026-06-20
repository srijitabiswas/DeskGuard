// Central API client — talks to the real Express/MongoDB backend.
// If VITE_API_URL is not set, falls back to mock data automatically.

const BASE = import.meta.env.VITE_API_URL || '';

// ── Token helpers ─────────────────────────────────────────
const getToken = () => localStorage.getItem('dg_token');

async function request(method, path, body, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    ...opts,
  });

  const data = await res.json().catch(() => ({ success: false, message: 'Invalid server response.' }));

  if (!res.ok) {
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data   = data;
    throw err;
  }
  return data;
}

const api = {
  get:    (path)         => request('GET',    path),
  post:   (path, body)   => request('POST',   path, body),
  put:    (path, body)   => request('PUT',    path, body),
  patch:  (path, body)   => request('PATCH',  path, body),
  delete: (path)         => request('DELETE', path),
};

// ── Auth ──────────────────────────────────────────────────
export const authAPI = {
  login:         (email, password)          => api.post('/auth/login', { email, password }),
  verifyStudent: (studentId, email)         => api.post('/auth/verify-student', { studentId, email }),
  activate:      (studentId, email, password) => api.post('/auth/activate', { studentId, email, password }),
  me:            ()                         => api.get('/auth/me'),
  changePassword:(currentPassword, newPassword) => api.put('/auth/change-password', { currentPassword, newPassword }),
};

// ── Seats ─────────────────────────────────────────────────
export const seatsAPI = {
  list:        (params = {}) => api.get(`/seats?${new URLSearchParams(params)}`),
  recommend:   (params = {}) => api.get(`/seats/recommend?${new URLSearchParams(params)}`),
  book:        (id)          => api.post(`/seats/${id}/book`, {}),
  checkIn:     (id)          => api.post(`/seats/${id}/check-in`, {}),
  cancel:      (id)          => api.post(`/seats/${id}/cancel`, {}),
  setAway:     (id, minutes) => api.post(`/seats/${id}/away`, { minutes }),
  returnAway:  (id)          => api.post(`/seats/${id}/return`, {}),
  release:     (id)          => api.post(`/seats/${id}/release`, {}),
  update:      (id, body)    => api.patch(`/seats/${id}`, body),
};

// ── Sessions ──────────────────────────────────────────────
export const sessionsAPI = {
  list:          (params = {}) => api.get(`/sessions?${new URLSearchParams(params)}`),
  active:        ()            => api.get('/sessions/active'),
  myStats:       ()            => api.get('/sessions/my-stats'),
  checkout:      (id)          => api.post(`/sessions/${id}/checkout`, {}),
};

// ── Floors ────────────────────────────────────────────────
export const floorsAPI = {
  list:           ()           => api.get('/floors'),
  create:         (body)       => api.post('/floors', body),
  update:         (id, body)   => api.put(`/floors/${id}`, body),
  emergency:      (id, body)   => api.post(`/floors/${id}/emergency`, body),
  stats:          (id)         => api.get(`/floors/${id}/stats`),
};

// ── Notifications ─────────────────────────────────────────
export const notificationsAPI = {
  list:       (params = {})  => api.get(`/notifications?${new URLSearchParams(params)}`),
  create:     (body)         => api.post('/notifications', body),
  markRead:   (id)           => api.patch(`/notifications/${id}/read`, {}),
  markAllRead:()             => api.patch('/notifications/read-all', {}),
};

// ── Students ──────────────────────────────────────────────
export const studentsAPI = {
  list:       (params = {})  => api.get(`/students?${new URLSearchParams(params)}`),
  get:        (id)           => api.get(`/students/${id}`),
  create:     (body)         => api.post('/students', body),
  update:     (id, body)     => api.put(`/students/${id}`, body),
  remove:     (id)           => api.delete(`/students/${id}`),
  adjustTrust:(id, delta, reason) => api.patch(`/students/${id}/trust`, { delta, reason }),
  import:     async (file)   => {
    const fd = new FormData();
    fd.append('file', file);
    const token = getToken();
    const res = await fetch(`${BASE}/api/students/import`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    return res.json();
  },
};

// ── Analytics ─────────────────────────────────────────────
export const analyticsAPI = {
  overview:         () => api.get('/analytics/overview'),
  weekly:           () => api.get('/analytics/weekly'),
  floorStats:       () => api.get('/analytics/floor-stats'),
  trustDistribution:() => api.get('/analytics/trust-distribution'),
  zoneUsage:        () => api.get('/analytics/zone-usage'),
};

// ── Admin ─────────────────────────────────────────────────
export const adminAPI = {
  summary:           ()     => api.get('/admin/dashboard-summary'),
  listLibrarians:    ()     => api.get('/admin/librarians'),
  createLibrarian:   (body) => api.post('/admin/librarians', body),
  removeLibrarian:   (id)   => api.delete(`/admin/librarians/${id}`),
};

// ── Token storage helpers ─────────────────────────────────
export function saveToken(token) { localStorage.setItem('dg_token', token); }
export function clearToken()     { localStorage.removeItem('dg_token'); }

export default api;
