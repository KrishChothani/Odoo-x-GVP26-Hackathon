# 🚛 FleetFlow — Modular Fleet & Logistics Management System

<div align="center">

![FleetFlow Banner](https://img.shields.io/badge/FleetFlow-Logistics%20Management-blue?style=for-the-badge&logo=truck&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-v20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-v18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white)

**A centralized, rule-based digital hub that optimizes the lifecycle of a delivery fleet, monitors driver safety, and tracks financial performance.**

[Features](#-features) • [Architecture](#-architecture) • [Getting Started](#-getting-started) • [API Reference](#-api-reference) • [Project Structure](#-project-structure)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Target Users & Roles](#-target-users--roles)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
- [Business Logic & Workflows](#-business-logic--workflows)
- [Frontend Pages & Routing](#-frontend-pages--routing)

---

## 🌟 Overview

FleetFlow replaces inefficient, manual logbooks with a **centralized digital fleet management platform**. It provides real-time state management for vehicle and driver availability, relational expense tracking, safety compliance monitoring, and operational analytics — all governed by a strict role-based access control system.

**Key Value Propositions:**
- ✅ Eliminate manual paperwork with digital records for every trip, fuel log, and service event
- ✅ Enforce cargo capacity validation to prevent overloading
- ✅ Block assignment of drivers with expired licences
- ✅ Auto-remove vehicles from the dispatch pool when sent to maintenance
- ✅ Real-time KPI dashboard with fleet utilization metrics
- ✅ One-click CSV/PDF export for audits and payroll

---

## 👥 Target Users & Roles

| Role | Responsibilities | Dashboard |
|------|-----------------|-----------|
| **FLEET_MANAGER** | Oversee vehicle health, asset lifecycle, and scheduling. Full administrative access. | `/dashboard` |
| **DISPATCHER** | Create trips, assign drivers, validate cargo loads, manage maintenance | `/dispatcher-portal` |
| **SAFETY_OFFICER** | Monitor driver compliance, licence expirations, and safety scores | `/safety-officer-portal` |
| **FINANCIAL_ANALYST** | Audit fuel spend, maintenance ROI, and operational costs | `/financial-analyst-portal` |
| **DRIVER** | Accept trips, complete trips, toggle duty status | `/driver-portal` |

---

## ✨ Features

### 🔐 Page 1 — Login & Authentication
- Secure JWT-based email/password authentication
- Role-Based Access Control (RBAC) with 5 distinct roles
- Email verification flow with re-send capability
- Password reset via secure email token
- Refresh token rotation for persistent sessions
- Account activation/deactivation by Manager

### 📊 Page 2 — Command Center (Main Dashboard)
- **KPIs at-a-glance:** Active Fleet, Maintenance Alerts, Utilization Rate, Pending Cargo
- **Fleet stats:** Total Vehicles, Active/Completed Trips, overall status breakdown
- **Smart Filters:** Filter by Vehicle Type (Truck, Van, Bike), Status, and Region
- Real-time data aggregation from all system modules

### 🚗 Page 3 — Vehicle Registry (Asset Management)
- Full CRUD operations for fleet assets
- Tracks: Name/Model, License Plate (unique ID), Max Load Capacity (kg), Odometer (km)
- Vehicle types: TRUCK, VAN, BIKE — each with appropriate licence matching
- Status management: `AVAILABLE` → `ON_TRIP` → `IN_SHOP` → `OUT_OF_SERVICE`
- Manual "Out of Service" toggle to retire assets
- Region-based vehicle assignment
- Insurance expiry & maintenance schedule tracking

### 🗺️ Page 4 — Trip Dispatcher & Management
- Workflow from cargo pickup to delivery
- **Creation Form:** Select Available Vehicle + Available Driver (real-time filtered lists)
- **Capacity Validation:** System blocks trip creation if `CargoWeight > MaxCapacity`
- **Licence Validation:** Blocks driver assignment if licence is expired
- **Trip Lifecycle:** `DRAFT` → `DISPATCHED` → `COMPLETED` | `CANCELLED`
- Auto-generated trip numbers (e.g., `TRP000001`)
- Tracks origin, destination, scheduled time, distance, fuel, and revenue

### 🔧 Page 5 — Maintenance & Service Logs
- Preventative and reactive vehicle health tracking
- **Auto-Logic:** Adding a service log automatically sets vehicle status to `IN_SHOP`, removing it from the Dispatcher's selection pool
- **Service Lifecycle:** `NEW` → `IN_PROGRESS` → `COMPLETED` (vehicle returns to `AVAILABLE`)
- Service types: `PREVENTATIVE`, `REPAIR`, `INSPECTION`, `EMERGENCY`
- Parts replaced tracking, service provider, mechanic name
- Auto-generated log numbers (e.g., `SL000001`)

### 💰 Page 6 — Expense & Fuel Logging
- Per-trip and per-vehicle expense tracking
- Log fuel: Type (Diesel/Petrol/CNG/Electric), Liters, Cost-per-Liter, Date, Station
- Log miscellaneous expenses: Toll, Parking, Cleaning, Permits, Fines, Other
- **Automated Calculation:** Total Operational Cost = Fuel + Maintenance per Vehicle ID
- Fuel efficiency auto-calculation (km/L) from odometer readings
- Receipt image upload via Cloudinary
- Payment method tracking (Cash, Card, UPI, Company Card, Fuel Card)

### 👨‍✈️ Page 7 — Driver Performance & Safety Profiles
- **Compliance:** Licence expiry tracking — blocks driver assignment if expired
- **Performance:** Trip completion rates, cancellation rates, overall stats
- **Status Management:** Toggle between `ON_DUTY`, `OFF_DUTY`, `ON_TRIP`
- Driver suspension/unsuspension with reason tracking
- Safety profile with licence type, number, image, and expiry
- Completion rate calculation: `completedTrips / totalTrips × 100`

### 📈 Page 8 — Operational Analytics & Financial Reports
- **Fuel Efficiency Report:** km / L per vehicle
- **Vehicle ROI:** `(Revenue - (Maintenance + Fuel)) / Acquisition Cost`
- **Cost-per-km** breakdown per vehicle
- Monthly report with data filtering by date range and vehicle
- **Export:** One-click CSV/PDF for monthly payroll and health audits
- Aggregated KPIs across full fleet

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | v20.x | Runtime environment |
| **Express.js** | ^4.21 | REST API framework |
| **MongoDB Atlas** | Latest | Primary database (NoSQL) |
| **Mongoose** | ^8.9 | ODM for MongoDB |
| **JWT (jsonwebtoken)** | ^9.0 | Authentication tokens |
| **bcryptjs** | ^2.4 | Password hashing |
| **Cloudinary** | ^2.5 | Image/file storage (licence images, receipts) |
| **Nodemailer** | ^6.10 | Email verification & password reset |
| **Multer** | ^1.4 | File upload handling |
| **express-validator** | ^7.2 | Input validation |
| **PDFKit** | ^0.16 | PDF report generation |
| **Google Gemini AI** | ^1.3 | AI-powered features |
| **Serverless Framework** | ^3.40 | AWS Lambda deployment |

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | ^18.2 | UI framework |
| **TypeScript** | ^5.3 | Type safety |
| **Vite** | ^5.1 | Build tool & dev server |
| **React Router DOM** | ^6.22 | Client-side routing |
| **Axios** | ^1.13 | HTTP client with interceptors |
| **Tailwind CSS** | ^3.4 | Utility-first styling |
| **Radix UI** | Latest | Accessible UI primitives (Dialog, Slot) |
| **Lucide React** | ^0.330 | Icon library |
| **clsx + tailwind-merge** | Latest | Conditional class utilities |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FleetFlow Platform                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌─────────────────┐         ┌──────────────────────────────┐  │
│   │   FRONTEND       │  HTTP   │          BACKEND             │  │
│   │  React + TS      │◄───────►│     Express.js + Node        │  │
│   │  Vite Build      │   API   │     Port: 2590               │  │
│   │  Port: 5173      │         │                              │  │
│   └─────────────────┘         └──────────────┬───────────────┘  │
│                                               │                   │
│                                       ┌──────────┐             │
│                                       │          │             │
│                           ┌───────────▼──┐  ┌────▼──────────┐ │
│                           │  MongoDB      │  │  Cloudinary   │ │
│                           │  Atlas        │  │  (Images)     │ │
│                           └──────────────┘  └───────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Backend Architecture Pattern

```
Request → Routes → Middlewares → Controllers → Models → MongoDB
                     ↓
              1. verifyJWT (Auth)
              2. requireAnyRole (RBAC)
```

The backend follows a clean **MVC architecture**:
- **Routes** — Define endpoints and apply middleware chains
- **Middlewares** — JWT verification + role-based access control
- **Controllers** — Business logic handlers (AsyncHandler wrapped)
- **Models** — Mongoose schemas with auto-hooks and indexes
- **Utils** — Shared utilities (ApiError, ApiResponse, AsyncHandler, Cloudinary)

---

## 📁 Project Structure

```
oddooddo/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   ├── Models/
│   │   ├── Controllers/
│   │   ├── Routes/
│   │   ├── Middlewares/
│   │   └── Utils/
│   ├── .env
│   ├── package.json
│   └── serverless.yml
│
└── frontend/
    └── src/
        ├── pages/
        ├── components/
        │   └── ui/
        ├── services/
        └── lib/
```

---



## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ ([nodejs.org](https://nodejs.org))
- **npm** v9+
- **MongoDB Atlas** account
- **Cloudinary** account (for licence image & receipt uploads)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd oddooddo
```

### 2. Setup the Backend

```bash
cd backend

# Install dependencies
npm install

# Create your environment file
cp .env.example .env   # Edit .env with your credentials (see Environment Variables)

# Start development server (runs on port 2590)
npm run dev
```

### 3. Setup the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server (runs on port 5173)
npm run dev
```

### 4. Seed Database (Optional — for development)

```bash
cd backend
node src/seedDatabase.js
```

---

## 🔧 Environment Variables

### Backend (`backend/.env`)

```env
# Server
PORT=2590                           # API server port

# Database
MONGODB_URI=mongodb+srv://...       # MongoDB Atlas connection string
CORS_ORIGIN=http://localhost:5173   # Allowed frontend origin

# JWT Authentication
JWT_SECRET=your_jwt_secret
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d

# URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:2590

# Cloudinary (Image uploads — licence images, receipts)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Verification & Password Reset via Nodemailer)
EMAIL_ID_FOR_VERIFICATION=your@gmail.com
EMAIL_PASSWORD_FOR_VERIFICATION=your_app_password

# AI Features
GEMINI_API_KEY=your_gemini_api_key
```

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:2590/api/v1
VITE_AUTH_TOKEN_KEY=fleetflow_auth_token
VITE_ENV=development
```

---

## 📡 API Reference

**Base URL:** `http://localhost:2590/api/v1`

### Authentication (`/api/v1/users`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/register` | Public | Register new user (with licence image upload for DRIVER) |
| `POST` | `/login` | Public | Login and receive JWT tokens |
| `POST` | `/logout` | Auth | Logout and invalidate refresh token |
| `POST` | `/refresh-token` | Public | Get new access token using refresh token |
| `GET` | `/verify-email` | Public | Verify email with token |
| `POST` | `/resend-email-verification` | Public | Resend verification email |
| `POST` | `/send-reset-password-link` | Public | Send password reset email |
| `POST` | `/reset-password` | Public | Reset password with token |
| `GET` | `/current-user` | Auth | Get currently authenticated user |
| `PATCH` | `/update-account` | Auth | Update account details |
| `GET` | `/available-drivers` | Auth | Get drivers with ON_DUTY status (for trip assignment) |
| `GET` | `/all-drivers` | Auth + Role | Get all active drivers |
| `PATCH` | `/toggle-duty-status` | Auth (DRIVER) | Toggle own duty status |
| `GET` | `/driver-performance` | Auth + Role | Get driver compliance & performance data |
| `PATCH` | `/suspend-driver/:id` | FLEET_MANAGER | Suspend a driver |
| `PATCH` | `/unsuspend-driver/:id` | FLEET_MANAGER | Unsuspend a driver |
| `GET` | `/all` | FLEET_MANAGER | Get all users |
| `GET` | `/by-role/:role` | FLEET_MANAGER | Get users by role |
| `PATCH` | `/update-role/:id` | FLEET_MANAGER | Change user role |
| `PATCH` | `/deactivate/:id` | FLEET_MANAGER | Deactivate user account |
| `PATCH` | `/activate/:id` | FLEET_MANAGER | Activate user account |

### Vehicles (`/api/v1/vehicles`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/` | FLEET_MANAGER | Create new vehicle |
| `GET` | `/` | FLEET_MANAGER, DISPATCHER | Get all vehicles (filterable) |
| `GET` | `/stats` | FLEET_MANAGER | Get vehicle statistics |
| `GET` | `/:id` | FLEET_MANAGER, DISPATCHER | Get vehicle by ID |
| `PUT` | `/:id` | FLEET_MANAGER | Update vehicle details |
| `DELETE` | `/:id` | FLEET_MANAGER | Delete vehicle |
| `PATCH` | `/:id/toggle-service` | FLEET_MANAGER | Toggle AVAILABLE ↔ OUT_OF_SERVICE |

### Trips (`/api/v1/trips`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/` | FLEET_MANAGER, DISPATCHER | Create trip (validates cargo weight vs capacity) |
| `GET` | `/` | FLEET_MANAGER, DISPATCHER, DRIVER | Get all trips (filterable) |
| `GET` | `/stats` | FLEET_MANAGER, DISPATCHER | Get trip statistics |
| `GET` | `/:id` | FLEET_MANAGER, DISPATCHER, DRIVER | Get trip by ID |
| `PUT` | `/:id` | FLEET_MANAGER, DISPATCHER | Update trip (DRAFT only) |
| `DELETE` | `/:id` | FLEET_MANAGER, DISPATCHER | Delete trip (DRAFT only) |
| `PATCH` | `/:id/dispatch` | FLEET_MANAGER, DISPATCHER | DRAFT → DISPATCHED |
| `PATCH` | `/:id/complete` | All authenticated | DISPATCHED → COMPLETED |
| `PATCH` | `/:id/cancel` | FLEET_MANAGER, DISPATCHER | Any → CANCELLED |

### Maintenance (`/api/v1/maintenance`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/` | FLEET_MANAGER, DISPATCHER | Create service log (auto sets vehicle to IN_SHOP) |
| `GET` | `/` | FLEET_MANAGER, DISPATCHER, SAFETY_OFFICER | Get all service logs |
| `GET` | `/stats` | FLEET_MANAGER, FINANCIAL_ANALYST | Get maintenance statistics |
| `GET` | `/:id` | FLEET_MANAGER, DISPATCHER, SAFETY_OFFICER | Get service log by ID |
| `PUT` | `/:id` | FLEET_MANAGER, DISPATCHER | Update service log |
| `PATCH` | `/:id/start` | FLEET_MANAGER, DISPATCHER | NEW → IN_PROGRESS |
| `PATCH` | `/:id/complete` | FLEET_MANAGER, DISPATCHER | IN_PROGRESS → COMPLETED (vehicle → AVAILABLE) |
| `PATCH` | `/:id/cancel` | FLEET_MANAGER, DISPATCHER | Any → CANCELLED (vehicle → AVAILABLE) |
| `DELETE` | `/:id` | FLEET_MANAGER | Delete log (NEW status only) |

### Expenses (`/api/v1/expenses`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/fuel` | FLEET_MANAGER, DISPATCHER, DRIVER | Create fuel/expense log |
| `GET` | `/fuel` | FLEET_MANAGER, DISPATCHER, FINANCIAL_ANALYST | Get all fuel logs |
| `GET` | `/fuel/:id` | All authenticated | Get fuel log by ID |
| `PUT` | `/fuel/:id` | FLEET_MANAGER, DISPATCHER | Update fuel log |
| `DELETE` | `/fuel/:id` | FLEET_MANAGER | Delete fuel log |
| `GET` | `/vehicles/all-costs` | FLEET_MANAGER, DISPATCHER, FINANCIAL_ANALYST | All vehicles aggregated costs |
| `GET` | `/vehicle/:id/costs` | FLEET_MANAGER, FINANCIAL_ANALYST | Vehicle operational costs |
| `GET` | `/vehicle/:id/analytics` | FLEET_MANAGER, FINANCIAL_ANALYST | Vehicle analytics + trends |
| `GET` | `/trip/:id/summary` | FLEET_MANAGER, DISPATCHER, FINANCIAL_ANALYST | Trip expense summary |
| `GET` | `/stats` | FLEET_MANAGER, FINANCIAL_ANALYST | Overall expense statistics |

### Dashboard (`/api/v1/dashboard`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/kpis` | Auth | Get main KPIs (activeFleet, alerts, utilization, pending) |
| `GET` | `/table` | Auth | Get paginated trip data for dashboard table |
| `GET` | `/filters` | Auth | Get available filter options |

### Analytics (`/api/v1/analytics`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/operational` | FLEET_MANAGER, FINANCIAL_ANALYST | Full operational analytics & financial metrics |
| `GET` | `/monthly-report` | FLEET_MANAGER, FINANCIAL_ANALYST | Monthly report data (CSV/PDF export) |

---

## 🔒 Role-Based Access Control (RBAC)

FleetFlow uses a layered middleware approach:

```javascript
// Middleware chain: verifyJWT → requireAnyRole([...roles])
router.get('/sensitive', verifyJWT, requireAnyRole(['FLEET_MANAGER', 'DISPATCHER']), handler);
```

**Access Matrix:**

| Feature | FLEET_MANAGER | DISPATCHER | SAFETY_OFFICER | FINANCIAL_ANALYST | DRIVER |
|---------|:-------------:|:----------:|:--------------:|:-----------------:|:------:|
| Create/Edit Vehicles | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Vehicles | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create/Dispatch Trips | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Trips | ✅ | ✅ | ❌ | ❌ | ✅ |
| Complete Trips | ✅ | ✅ | ❌ | ❌ | ✅ |
| Create Maintenance Log | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Maintenance | ✅ | ✅ | ✅ | ❌ | ❌ |
| Log Expenses | ✅ | ✅ | ❌ | ❌ | ✅ |
| View Expenses | ✅ | ✅ | ❌ | ✅ | ❌ |
| Driver Performance | ✅ | ❌ | ✅ | ❌ | ❌ |
| Suspend Drivers | ✅ | ❌ | ❌ | ❌ | ❌ |
| Analytics & Reports | ✅ | ❌ | ❌ | ✅ | ❌ |
| User Management | ✅ | ❌ | ❌ | ❌ | ❌ |
| Toggle Duty Status | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## ⚙️ Business Logic & Workflows

### 1. Vehicle Intake Workflow
```
Add Vehicle (e.g., "Van-05", 500kg capacity)
  └─► Status: AVAILABLE
  └─► Appears in Dispatcher's Available Vehicle list
```

### 2. Driver Compliance Workflow
```
Register Driver "Alex"
  └─► System stores: licenceType, licenceNumber, licenceExpiry
  └─► On trip creation: checks if licenceExpiry > today
  └─► If EXPIRED: Assignment blocked ✋
  └─► If VALID: Driver available for assignment ✅
```

### 3. Trip Dispatching Workflow
```
Create Trip: "Alex" → "Van-05" for 450kg cargo
  ├─► Validation: 450 < maxCapacity(500) → PASS ✅
  ├─► Validation: licenceExpiry > today → PASS ✅
  ├─► Trip created with status: DRAFT
  ├─► Dispatch: DRAFT → DISPATCHED
  │     └─► Vehicle status: AVAILABLE → ON_TRIP
  │     └─► Driver dutyStatus: ON_DUTY → ON_TRIP
  └─► Complete: DISPATCHED → COMPLETED
        └─► Vehicle status: ON_TRIP → AVAILABLE
        └─► Driver dutyStatus: ON_TRIP → ON_DUTY
        └─► tripStats.completedTrips++
```

### 4. Maintenance Workflow
```
Manager logs "Oil Change" for Van-05
  ├─► ServiceLog created (status: NEW)
  ├─► AUTO-LOGIC: Vehicle status → IN_SHOP
  ├─► Vehicle REMOVED from Dispatcher's available pool
  ├─► Start Service: NEW → IN_PROGRESS
  └─► Complete Service: IN_PROGRESS → COMPLETED
        └─► Vehicle status: IN_SHOP → AVAILABLE
        └─► Vehicle RE-ADDED to Dispatcher's available pool
```

### 5. Cost Analytics Workflow
```
After trip completion:
  ├─► Log Fuel: 50L @ ₹100/L = ₹5,000
  ├─► Fuel Efficiency: distance(500km) / 50L = 10 km/L
  ├─► Total Operational Cost = Fuel + Maintenance costs
  └─► Vehicle ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost
```

---

## 🖥️ Frontend Pages & Routing

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `LandingPage` | Public landing page |
| `/login` | `LoginPage` | User authentication |
| `/signup` | `SignUpPage` | New user registration |
| `/email-verified` | `EmailVerifiedPage` | Email confirmation |
| `/dashboard` | `DashboardPage` | Fleet Manager main layout |
| `/dashboard` (index) | `FleetFlow` | Command Center / KPI Dashboard |
| `/dashboard/vehicle-registry` | `VehicleRegistry` | Asset management |
| `/dashboard/trip-dispatcher` | `TripDispatcher` | Trip management |
| `/dashboard/maintenance` | `MaintenancePage` | Service logs |
| `/dashboard/trip-expense` | `ExpenseTrackingPage` | Fuel & expense tracking |
| `/dashboard/driver-performance` | `DriverPerformancePage` | Driver safety profiles |
| `/dashboard/analytics` | `AnalyticsPage` | Financial reports |
| `/dispatcher-portal` | `DispatcherDashboard` | Dispatcher-specific view |
| `/driver-portal` | `DriverDashboard` | Driver-specific view |
| `/safety-officer-portal` | `SafetyOfficerDashboard` | Safety compliance view |
| `/financial-analyst-portal` | `FinancialAnalystDashboard` | Cost analysis view |
| `/maintenance-portal` | `MaintenancePage` | Maintenance standalone view |
| `/expense-portal` | `ExpenseTrackingPage` | Expense standalone view |
| `/driver-performance-portal` | `DriverPerformancePage` | Performance standalone view |
| `/analytics-portal` | `AnalyticsPage` | Analytics standalone view |

---

## 📦 Available Scripts

### Backend
```bash
npm run dev      # Start dev server with nodemon (port 2590)
npm run start    # Start production server
npm run server   # Start with Serverless Offline
npm run deploy   # Deploy to AWS Lambda via Serverless
```

### Frontend
```bash
npm run dev      # Start Vite dev server (port 5173)
npm run build    # Build TypeScript + Vite production bundle
npm run preview  # Preview production build locally
npm run lint     # Run ESLint checks
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/YourFeatureName`
3. Commit your changes using conventional commits: `git commit -m "feat: add expense filtering"`
4. Push to your branch: `git push origin feature/YourFeatureName`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **ISC License**. See the `package.json` for details.

---

## 👨‍💻 Team

<div align="center">

### 🚀 Deep Drillers

| Name | Role |
|------|------|
| **Mihir Jan** | Team Leader |
| **Krish Chothani** | Team Member |
| **Luv Patel** | Team Member |
| **Nand Koradiya** | Team Member |

</div>

---

<div align="center">

Built with ❤️ for the **GVP26 Hackathon** | **Team Deep Drillers**

</div>
