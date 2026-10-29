# FoodRescue — Intelligent Food Waste Rescue & Redistribution System
### B.Tech CSE494 – Intelligent NoSQL Databases Academic Assignment

A modern full-stack web application connecting food donors, verified volunteer couriers, and charitable shelters/NGOs. Built with **React 18 + Vite**, **Tailwind CSS**, **Python Flask**, and a real **MongoDB 8.0** database using **PyMongo**, strict `$jsonSchema` database validation, atomic concurrency control, and six multi-stage analytical aggregation pipelines.

---

## 🌟 Key Features

1. **Four Role-Based Portals**:
   - **Food Donors**: Create, edit, track, and cancel food donation batches with category, weight (kg), dietary tags, and collection deadlines.
   - **NGOs & Shelters**: Browse and search available surplus food, submit requests with atomic reservations, track inbound courier progress, and **confirm delivery receipt**.
   - **Volunteer Couriers**: Browse available delivery tasks, claim tasks with concurrency protection, update pickup status, view earned badges, and print an **official volunteer certificate**.
   - **Administrators**: Monitor live KPI impact statistics, visualize 6 aggregation pipelines with **Recharts**, audit donation listings, and approve/verify pending NGO accounts.
2. **1-Click Academic Demo Switcher**: Instant switcher in the top navigation bar allowing examiners to test Admin, Donor, NGO, and Volunteer workflows in one click without manual credential entry.
3. **Strict MongoDB Database Validation**: Enforces database-level `$jsonSchema` rules on all collections (`minimum: 0.1` on quantity, enum checking on roles and statuses).
4. **Concurrency Safety**: Atomic `find_one_and_update` operations prevent duplicate donation claims and duplicate task acceptances.
5. **Idempotent Rewards**: Volunteer points and milestone badges are awarded exactly once upon confirmed delivery receipt.
6. **Six Multi-Stage Aggregation Pipelines**: Real MongoDB analytics computing rescued food trends over time, top donors, courier rankings, and NGO fulfillment rates.

---

## 🏗️ Project Architecture

```
Food Waste Rescue and Redistribution System/
├── backend/
│   ├── app.py                      # Flask Application entrypoint & CORS
│   ├── config.py                   # Environment configuration
│   ├── requirements.txt            # Python dependencies
│   ├── .env.example                # Sample environment variables
│   ├── database/
│   │   ├── connection.py           # PyMongo client & document serializer
│   │   ├── init_db.py              # MongoDB $jsonSchema & index setup script
│   │   ├── seed_data.py            # Sample data seeding script
│   │   └── validators.py           # Schema definitions & input validators
│   ├── middleware/
│   │   └── auth.py                 # JWT token & role-based route decorators
│   ├── routes/
│   │   ├── auth_routes.py          # /api/auth (register, login, me)
│   │   ├── donation_routes.py      # /api/donations (CRUD, available listings)
│   │   ├── request_routes.py       # /api/requests (NGO claims & donor review)
│   │   ├── delivery_routes.py      # /api/deliveries (Volunteer accept, pickup, receipt)
│   │   ├── analytics_routes.py     # /api/analytics (6+ aggregation pipelines)
│   │   ├── admin_routes.py         # /api/admin (NGO verification, user audit)
│   │   └── user_routes.py          # /api/users (profile & vehicle telemetry)
│   ├── services/
│   │   ├── aggregations.py         # PyMongo aggregation pipeline implementations
│   │   └── reward_service.py       # Atomic reward points and badge evaluations
│   └── tests/
│       ├── conftest.py             # Pytest fixtures & test setup
│       ├── test_validation.py      # Tests for strict $jsonSchema & Flask validation
│       ├── test_crud_and_auth.py   # Tests for CRUD operations & role protection
│       ├── test_concurrency_and_workflow.py # Tests for atomic claims & idempotency
│       └── test_aggregations.py    # Tests for the 6+ aggregation pipelines
├── frontend/
│   ├── package.json                # React, Vite, Recharts, Tailwind CSS
│   ├── vite.config.js              # Vite config with backend API proxy
│   ├── tailwind.config.js          # Tailwind theme configuration
│   ├── src/
│   │   ├── main.jsx                # React root
│   │   ├── App.jsx                 # View router and modal controller
│   │   ├── index.css               # Styling and print styles for certificates
│   │   ├── api/
│   │   │   └── client.js           # API fetch wrapper with JWT bearer injection
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Authentication state & 1-click demo switcher
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Top navigation with demo dropdown
│   │   │   ├── Footer.jsx          # Academic context and food safety notice
│   │   │   └── StatusBadge.jsx     # Semantic colored state pills
│   │   └── pages/
│   │       ├── LandingPage.jsx     # Impact counters & workflow visualizer
│   │       ├── BrowseDonations.jsx # Search & filter available food + request modal
│   │       ├── DonorDashboard.jsx  # Donor listing CRUD & request approval
│   │       ├── NgoDashboard.jsx    # NGO requests & receipt confirmation
│   │       ├── VolunteerDashboard.jsx # Courier task board & pickup tracker
│   │       ├── LeaderboardPage.jsx # Top courier rankings & milestone badges
│   │       ├── CertificatePage.jsx # Printable official courier certificate
│   │       ├── AdminDashboard.jsx  # Recharts analytics & NGO verification
│   │       ├── ProfilePage.jsx     # User settings & vehicle specifications
│   │       └── AuthModal.jsx       # Login & registration modal
└── DOCUMENTATION/
    ├── ACADEMIC_REPORT.md          # Comprehensive academic project report
    └── VIVA_QUESTIONS.md           # 25+ detailed Viva questions and model answers
```

---

## ⚡ Quick Start Instructions

### Prerequisites
- Python 3.10+ (Tested on Python 3.14)
- Node.js 18+ & npm
- MongoDB Community Server running on `localhost:27017`

### 1. Database Initialization & Seeding
From the project root:
```bash
# 1. Initialize Python virtual environment
python3 -m venv backend/venv
backend/venv/bin/pip install -r backend/requirements.txt

# 2. Initialize collections with strict $jsonSchema validators and indexes
backend/venv/bin/python backend/database/init_db.py

# 3. Seed realistic sample data
backend/venv/bin/python backend/database/seed_data.py
```

### 2. Start the Backend Server
```bash
backend/venv/bin/python backend/app.py
```
*Backend runs on `http://localhost:5001` (Health check: `http://localhost:5001/api/health`)*

### 3. Start the Frontend Application
In a separate terminal:
```bash
npm --prefix frontend run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 🔑 Pre-Configured Demo Accounts (Password: `password123`)

| Role | Name | Email | Initial Key Activities |
| :--- | :--- | :--- | :--- |
| **Admin** | Vikram Malhotra | `admin@foodrescue.org` | Access Recharts analytics, verify pending NGOs, audit users |
| **Donor** | Annapurna Grand Restaurant | `donor1@annapurna.in` | Post surplus food, edit/cancel listings, view donated totals |
| **NGO** | Roti Bank Seva Trust | `ngo1@rotibank.org` | Browse food, submit requests, confirm receipt of safe deliveries |
| **Volunteer** | Aarav Sharma | `volunteer1@foodrescue.org` | Accept open rescue tasks, mark picked up, print certificate |

*(Tip: Click the **"Demo Switcher"** button in the top navigation bar to switch accounts instantly!)*

---

## 📊 The Six PyMongo Aggregation Pipelines

All analytics endpoints use PyMongo's native `aggregate()` method on real MongoDB records:

1. **`get_rescued_food_trend(groupBy='day')`**: Total food rescued (kg) grouped chronologically. Strict filter: `status: "delivered"`, `pointsAwarded: True`.
2. **`get_food_donated_by_donor()`**: Aggregates kilograms and batch counts per donor using `$group`, `$lookup` (users), and `$unwind`.
3. **`get_top_volunteers(limit=10)`**: Ranks volunteers by verified completed deliveries, total points, and awarded badges using `$sort: {totalPoints: -1}`.
4. **`get_volunteer_delivery_stats()`**: Sums verified food volume directly from completed `delivery_tasks`.
5. **`get_donations_by_category_and_status()`**: Multi-field grouping on `{category, status}` for inventory monitoring.
6. **`get_ngo_fulfillment_stats()`**: Calculates NGO request fulfillment percentages using `$cond` and `$multiply`.

---

## 🧪 Running Automated Tests

Run the full automated test suite covering schema validation, concurrency protection, idempotency, and aggregation pipelines:

```bash
backend/venv/bin/pytest backend/tests/ -v
```

All 21 tests pass with 100% compliance.

---

## 🛡️ Food Safety & Regulatory Notice

FoodRescue coordinates food donations under the Good Samaritan Food Donation framework. All donors provide shelf-life expiry times and storage requirements. Recipient organizations inspect all food upon handoff. The platform provides automated expiration tracking but does not replace physical inspection.

---

## 📚 Academic Documentation

- Detailed report: [DOCUMENTATION/ACADEMIC_REPORT.md](file:///Users/bandinagacharan/Documents/Food%20Waste%20Rescue%20and%20Redistribution%20System/DOCUMENTATION/ACADEMIC_REPORT.md)
- Viva examination preparation: [DOCUMENTATION/VIVA_QUESTIONS.md](file:///Users/bandinagacharan/Documents/Food%20Waste%20Rescue%20and%20Redistribution%20System/DOCUMENTATION/VIVA_QUESTIONS.md)
