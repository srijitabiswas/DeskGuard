# DeskGuard — Fair Seats. Smarter Study Spaces.

> The Operating System of the University Library.

A full-stack university library seat management system built with **React + Vite + Tailwind CSS** (frontend) and **Node.js + Express + MongoDB** (backend).

---

## ✨ Features

### Student
- 🗺️ **Smart Library Map** — Live SVG floor map showing seat status in real time
- 🔍 **Find Me a Seat** — Preference-based seat recommendations (zone, charging, window, AC…)
- 🪪 **Reserve → Check In → Study** — Book a seat (held 10 minutes), check in once you arrive, then check out when you leave. No-shows are released automatically.
- 📖 **Active Session** — Live timer from check-in, away mode (10-min hold), one-tap checkout
- ⭐ **Responsible Study Score** — Trust score system with tier badges
- 📊 **Personal Dashboard** — Today/week study time, streak, occupancy forecast
- 🤝 **Buddy Study** — Reserve adjacent seats for 2–6 person groups

### Librarian
- 🖥️ **Live Command Center** — Real-time floor map with seat drill-down
- 🔴 **Abandoned Seat Detection** — Auto-flags sessions over 3 hours
- 🚨 **Emergency Mode** — One tap closes a floor and broadcasts an alert
- 📋 **Session Management** — Search, filter, force-release any session
- 🔧 **Desk Management** — Per-seat zone edit, maintenance toggle

### Admin
- 📈 **Analytics** — Weekly sessions, hourly patterns, zone usage, trust distribution
- 👥 **Student Roster** — Add, search, import via Excel/CSV, adjust trust scores
- 🏛️ **Library Layout** — Visual floor editor, zone and feature assignment
- ⚙️ **Settings** — Library policy, trust rules, librarian accounts, academic session

---

## 🗂️ Project Structure

```
DeskGuard/
├── backend/                   ← Node.js + Express + MongoDB API
│   ├── server.js              ← Entry point, middleware, route registration
│   ├── .env.example           ← Copy to .env and fill in values
│   ├── config/
│   │   └── db.js              ← MongoDB connection
│   ├── middleware/
│   │   ├── auth.js            ← JWT verify + role guard
│   │   └── errorHandler.js    ← Global error handler
│   ├── models/
│   │   ├── Student.js
│   │   ├── Librarian.js
│   │   ├── Admin.js
│   │   ├── Floor.js
│   │   ├── Seat.js
│   │   ├── Session.js
│   │   └── Notification.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── seatController.js
│   │   ├── sessionController.js
│   │   ├── floorController.js
│   │   ├── notificationController.js
│   │   ├── analyticsController.js
│   │   └── studentController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── seats.js
│   │   ├── sessions.js
│   │   ├── floors.js
│   │   ├── notifications.js
│   │   ├── analytics.js
│   │   ├── students.js
│   │   └── admin.js
│   └── seed/
│       └── seed.js            ← Populate DB with demo data
│
├── src/                       ← React frontend
│   ├── App.jsx                ← Router + auth guards
│   ├── main.jsx
│   ├── index.css              ← Design tokens + Tailwind
│   ├── context/
│   │   └── AppContext.jsx     ← Auth + App state (API-first, mock fallback)
│   ├── data/
│   │   └── mockData.js        ← Offline demo data
│   ├── utils/
│   │   ├── api.js             ← Fetch wrapper for all backend endpoints
│   │   └── helpers.js         ← Format, trust, seat utilities
│   ├── components/
│   │   ├── ui/index.jsx       ← Button, Card, Modal, Input, Badge, Avatar…
│   │   ├── layout/
│   │   │   ├── StudentLayout.jsx
│   │   │   ├── LibrarianLayout.jsx
│   │   │   └── AdminLayout.jsx
│   │   └── map/
│   │       └── LibraryMap.jsx ← SVG interactive seat map
│   └── pages/
│       ├── auth/
│       │   ├── LoginPage.jsx
│       │   └── ActivatePage.jsx
│       ├── student/
│       │   ├── StudentHome.jsx
│       │   ├── FindSeat.jsx
│       │   ├── StudentMap.jsx
│       │   ├── MySessions.jsx
│       │   └── StudentProfile.jsx
│       ├── librarian/
│       │   ├── LibrarianHome.jsx
│       │   ├── Sessions.jsx
│       │   ├── DeskManagement.jsx
│       │   └── Alerts.jsx
│       └── admin/
│           ├── AdminOverview.jsx
│           ├── Students.jsx
│           ├── LibraryLayout.jsx
│           ├── Analytics.jsx
│           └── Settings.jsx
│
├── index.html
├── package.json               ← Frontend deps
├── tailwind.config.js
├── vite.config.js
└── .env.local                 ← VITE_API_URL=http://localhost:5000
```

---

## 🔑 Demo Credentials

| Role      | Email                       | Password   |
|-----------|-----------------------------|------------|
| Admin     | `admin@uni.edu`             | `admin123` |
| Librarian | `kavitha.rao@uni.edu`       | `lib123`   |
| Student   | `srijita.biswas@uni.edu`    | `pass123`  |
| Student   | `arjun.sharma@uni.edu`      | `pass123`  |

**Account activation demo:**
- Student ID: `STU2024004`
- Email: `sneha.reddy@uni.edu`
- (Not yet activated — use the Activate Account flow)

---

## 🎨 Design System

| Token         | Value     | Usage                        |
|---------------|-----------|------------------------------|
| Background    | `#F7F8FA` | App background               |
| Surface       | `#FFFFFF` | Cards, modals                |
| Accent        | `#2563EB` | Primary buttons, active nav  |
| Available     | `#059669` | Seat available status        |
| Occupied      | `#DC2626` | Seat occupied status         |
| Away          | `#D97706` | Away mode / warnings         |
| Reserved      | `#7C3AED` | Reserved / librarian accent  |
| Text primary  | `#0F172A` | Headings, body               |
| Text secondary| `#475569` | Labels, captions             |
| Border        | `#E2E8F0` | Card borders                 |

Font: **Inter** — single typeface, weight variation for hierarchy.

---

## 📦 Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS 3
- Framer Motion
- React Router DOM 6
- Lucide React icons

### Backend
- Node.js + Express 4
- MongoDB + Mongoose 8
- JWT authentication (jsonwebtoken)
- bcryptjs password hashing
- XLSX for Excel import
- Multer for file uploads
- Helmet + CORS + Rate limiting

---

*Built with ❤️ for university libraries everywhere.*
