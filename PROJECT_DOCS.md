# ICARE-CVD — Project Documentation

> Cardiovascular Disease Patient Management Platform
> Fullstack: NestJS (Backend) + Next.js (Frontend)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Database Schema](#3-database-schema)
4. [API Reference](#4-api-reference)
5. [Frontend Structure](#5-frontend-structure)
6. [Strengths](#6-strengths)
7. [Weaknesses & Gaps](#7-weaknesses--gaps)
8. [Needs & Requirements](#8-needs--requirements)
9. [Where to Start — Roadmap](#9-where-to-start--roadmap)

---

## 1. Project Overview

ICARE-CVD is a web-based cardiovascular disease (CVD) patient management system designed as a graduation project. It connects **patients**, **doctors**, **assistants**, and **admins** through a role-based portal system.

### Core Capabilities

| Capability | Status |
|---|---|
| Multi-step patient registration (5 steps) | Done |
| JWT authentication (access + refresh tokens) | Done |
| Patient demographics & lifestyle profiling | Done |
| Medical history with 13 chief complaint types | Done |
| S3 document uploads (presigned URLs) | Done |
| Patient dashboard (vitals, appointments, medications) | Mock |
| Doctor dashboard (patients, alerts, appointments) | Mock |
| Admin staff creation | Mock |
| Login page | Missing |
| AI assistant features | Missing |
| Real-time notifications | Missing |
| Teleconsultation | Missing |
| Prescription management | Missing |

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| UI Components | shadcn/ui + Radix UI |
| Styling | Tailwind CSS 4 |
| State Management | Zustand (wizard), TanStack Query (server state) |
| Forms | react-hook-form + Zod |
| Charts | Recharts |
| Backend | NestJS 11, TypeScript |
| Database | PostgreSQL 18 + Drizzle ORM |
| Auth | JWT (access + refresh), Argon2id password hashing |
| Storage | AWS S3 (presigned URL uploads) |
| Email | Nodemailer (SMTP) |
| Containerization | Docker + Docker Compose |

---

## 2. System Architecture

### High-Level Data Flow

```
┌──────────────────────────┐       ┌──────────────────────────┐       ┌──────────┐
│     Frontend (Next.js)   │       │     Backend (NestJS)     │       │ Storage  │
│                          │       │                          │       │          │
│  Pages (Server Comps)    │       │  Controllers             │       │ ┌──────┐ │
│       ↓                  │       │   ├─ AuthController      │       │ │  PG  │ │
│  PageContainer (Client)  │──────▶│   ├─ DocumentsController │──────▶│ │  18  │ │
│       ↓                  │ HTTP  │                          │       │ └──────┘ │
│  Presentational Comps    │+JWT   │  Services                │       │ ┌──────┐ │
│       ↓                  │       │   ├─ AuthService         │──────▶│ │  S3  │ │
│  useXxx Hooks            │       │   ├─ AuthJwtService      │       │ │      │ │
│  (TanStack Query/Store)  │       │   └─ DocumentService     │       │ └──────┘ │
│                          │       │                          │       │ ┌──────┐ │
│  apiClient (axios)       │       │  Shared                  │       │ │ SMTP │ │
│  + auth-tokens (localStorage)    │   ├─ MailService         │──────▶│ │      │ │
│                          │       │   └─ S3Service           │       │ └──────┘ │
└──────────────────────────┘       └──────────────────────────┘       └──────────┘
```

### Module Dependency Graph

```
AppModule
 ├── DrizzleModule (global) ─── Database (Drizzle ORM + pg.Pool)
 ├── S3Module ──────────────── S3Service (presigned URLs, delete)
 └── AuthModule
      ├── imports: MailModule, S3Module, JwtModule
      ├── controllers:
      │   ├── AuthController        (/auth/*)
      │   └── DocumentsController   (/documents/*)
      └── providers:
           ├── AuthService     (registration, login, multi-step onboarding)
           ├── AuthJwtService  (JWT signing/verification)
           └── DocumentService (document metadata + S3 orchestration)
```

### Frontend Architecture Pattern

Every page follows the **Container/Presenter** pattern with SOLID enforcement:

```
page.tsx (Server Component)
  → XxxPageContainer.tsx ("use client", orchestrates hook + component)
        ├── useXxx.ts         (data fetching via TanStack Query)
        ├── xxx.types.ts      (TypeScript interfaces)
        ├── xxx.schema.ts     (Zod validation)
        └── XxxComponent.tsx  (presentational, receives all data via props)
```

---

## 3. Database Schema

### Entity-Relationship Diagram

```
┌─────────────────┐
│      user       │
│─────────────────│
│ id (PK, serial) │
│ name            │
│ email (unique)  │
│ phone           │
│ role (enum)     │──┐
│ password (hash) │  │
│ isActive        │  │
│ refreshTokenHash│  │
└─────────────────┘  │
                     │ 1:1
        ┌────────────┼─────────────────────────────────┐
        │            │                                  │
        ▼            ▼                                  ▼
┌──────────────┐ ┌─────────────────┐          ┌──────────────────────┐
│   patient    │ │ patient_history │          │ patient_document_    │
│──────────────│ │─────────────────│          │      notes           │
│ id (PK,uuid) │ │ id (PK,uuid)    │          │──────────────────────│
│ userId (FK)  │ │ userId (FK,unique)│        │ userId (PK,FK)       │
│ dateOfBirth  │ │ chiefComplaint  │          │ notes                │
│ gender       │ │ hpiData (jsonb) │          │ updatedAt            │
│ bloodType    │ │ pastCardiac...  │          └──────────────────────┘
│ heightCm     │ │ pastNonCardiac..│
│ weightKg     │ │ cardiovascular..│
│ bmi (gen)    │ └─────────────────┘
│ smoking..    │
│ alcohol..    │
│ stressLevel  │          ┌─────────────────┐
│ ...          │          │  family_history │
└──────────────┘          │─────────────────│
                          │ id (PK,uuid)    │
                          │ userId (FK)     │
                          │ relationship    │
                          │ condition       │
                          └─────────────────┘

         ┌──────────────┐          ┌─────────────────┐
         │  medication  │          │     allergy     │
         │──────────────│          │─────────────────│
         │ id (PK,uuid) │          │ id (PK,uuid)    │
         │ userId (FK)  │          │ userId (FK)     │
         │ name         │          │ category (enum) │
         │ dose         │          │ allergen        │
         │ type (enum)  │          │ reaction        │
         │ compliance   │          └─────────────────┘
         └──────────────┘

         ┌──────────────────────┐
         │  patient_document    │
         │──────────────────────│
         │ id (PK,uuid)         │
         │ userId (FK)          │
         │ s3Key                │
         │ fileName             │
         │ contentType          │
         │ sizeBytes            │
         │ category (enum)      │
         └──────────────────────┘
```

### Enums

| Enum | Values |
|---|---|
| `user_role` | `admin`, `patient`, `assistant`, `doctor` |
| `patient_gender` | `male`, `female`, `other` |
| `patient_blood_type` | `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-` |
| `patient_smoking_status` | `never`, `former`, `current` |
| `patient_alcohol_consumption` | `none`, `occasional`, `moderate`, `heavy` |
| `patient_exercise_frequency` | `sedentary`, `1-2/week`, `3-4/week`, `5+/week` |
| `chief_complaint` | 14 types: `chest-pain`, `dyspnea`, `palpitations`, `syncope`, `edema`, `fatigue`, `constitutional`, `peripheral-vascular`, `hepatic-congestion`, `jaundice`, `cyanosis`, `systemic-embolization`, `neurological`, `other` |
| `medication_type` | `antihypertensives`, `antiplatelets`, `anticoagulants`, `statins`, `antiarrhythmics`, `diuretics`, `diabetes_medications` |
| `allergy_category` | `drug`, `food`, `other` |
| `document_category` | `lab_report`, `imaging`, `ecg`, `prescription`, `other` |

### Generated Columns

| Column | Table | Computation |
|---|---|---|
| `bmi` | `patient` | `(weightKg / ((heightCm / 100) ^ 2))` |
| `highSaltDiet` | `patient` | Derived from `dietaryHabits` |
| `highFatDiet` | `patient` | Derived from `dietaryHabits` |

---

## 4. API Reference

### Authentication Endpoints

#### `POST /auth/register` — Step 1: Create Account

```json
// Request
{
  "fullName": "Sara Ahmed",
  "email": "sara@example.com",
  "phoneNumber": "+201012345678",
  "password": "securePassword123"
}

// Response
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": { "id": 1, "name": "Sara Ahmed", "email": "sara@example.com", "phone": "...", "role": "patient" }
}
```

#### `POST /auth/login` — Login

```json
// Request
{ "email": "sara@example.com", "password": "securePassword123" }

// Response
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": { "id": 1, "name": "Sara Ahmed", "email": "sara@example.com", "phone": "...", "role": "patient" }
}
```

#### `POST /auth/register/step-2` — Patient Profile (Auth Required)

```json
{
  "dateOfBirth": "1995-06-15",
  "gender": "female",
  "bloodType": "A+",
  "heightCm": 165,
  "weightKg": 60,
  "smokingStatus": "never",
  "alcoholConsumption": "none",
  "exerciseFrequency": "3-4/week",
  "stressLevel": "moderate"
}
```

#### `POST /auth/register/step-3` — Medical History (Auth Required)

```json
{
  "chiefComplaint": "chest-pain",
  "hpiData": { "chestPainLocation": "retrosternal", "chestPainDuration": "30min" },
  "pastCardiacHistory": { "mi": true, "hypertension": false },
  "hasFamilyHistory": true,
  "familyHistory": [{ "relationship": "father", "condition": "MI", "details": "At age 55" }],
  "medications": [{ "name": "Aspirin", "dose": "81mg", "frequency": "daily", "type": "antiplatelets" }],
  "drugAllergies": [{ "allergen": "Penicillin", "reaction": "rash" }]
}
```

#### `POST /auth/register/step-4` — Documents (Auth Required)

```json
{
  "files": [
    { "fileName": "blood_test.pdf", "s3Key": "documents/lab-reports/uuid.pdf", "sizeBytes": 1024, "category": "lab_report" }
  ],
  "notes": "Additional context about uploaded documents"
}
```

### Document Endpoints

#### `POST /documents/upload-intent` — Get S3 Presigned URL (Auth Required)

```json
// Request
{ "fileName": "blood_test.pdf", "contentType": "application/pdf", "category": "lab_report" }

// Response
{ "key": "documents/lab-reports/uuid.pdf", "uploadUrl": "https://s3...presigned...", "expiresIn": 900 }
```

---

## 5. Frontend Structure

### Route Groups

```
src/app/
├── page.tsx                          # Landing page
├── layout.tsx                        # Root layout (Geist font, Providers)
├── providers.tsx                     # QueryClientProvider wrapper
├── globals.css                       # Tailwind + shadcn theme (oklch colors)
│
├── (auth)/                           # Auth route group
│   ├── layout.tsx                    # Centered card layout with gradient bg
│   ├── register/                     # 5-step registration wizard (~3000 lines)
│   │   ├── page.tsx
│   │   ├── RegisterForm.tsx          # Wizard orchestrator
│   │   ├── Step1Account.tsx          # Email, password, phone
│   │   ├── Step2Profile.tsx          # Demographics, BMI calculator, lifestyle
│   │   ├── Step4MedicalHistory.tsx   # 13 chief complaints, HPI blocks, history
│   │   ├── StepDocumentsUpload.tsx   # S3 presigned URL uploads
│   │   ├── StepReview.tsx            # Summary & submit
│   │   ├── useRegisterStore.ts       # Zustand store (696 lines)
│   │   └── ... (types, schemas, hooks, UI primitives)
│   ├── forgot-password/
│   ├── reset-password/
│   └── otp/
│
├── (patient)/                        # Patient portal
│   ├── layout.tsx                    # Sidebar navigation (collapsible)
│   └── dashboard/
│       ├── PatientDashboard.tsx      # Vitals grid, appointments, medications
│       └── dashboard.mock.ts         # Mock data (Sara Ahmed)
│
├── (doctor)/                         # Doctor portal
│   ├── layout.tsx                    # Sidebar navigation (collapsible)
│   └── doctor-dashboard/
│       ├── DoctorDashboard.tsx       # Patients, alerts, appointments
│       └── doctorDashboard.mock.ts   # Mock data (Dr. Mahmoud Ali)
│
├── (admin)/                          # Admin portal
│   └── add-staff/
│       ├── AddStaff.tsx              # Staff creation form
│       └── useAddStaff.ts            # Mock mutation
│
└── (assistant)/                      # AI assistant (placeholder)
```

### Key Frontend Files by Feature

| Feature | Components | Hooks/State | Types | Schema |
|---|---|---|---|---|
| Registration (5-step) | `RegisterForm`, `Step1Account`, `Step2Profile`, `Step4MedicalHistory`, `StepDocumentsUpload`, `StepReview` | `useRegisterStore` (Zustand), `useDocumentUpload` | `register.types.ts` | `register.schema.ts` |
| Forgot Password | `ForgotPasswordForm` | `useForgotPassword` | `forgot-password.types.ts` | `forgot-password.schema.ts` |
| Reset Password | `ResetPasswordForm` | `useResetPassword` | `reset-password.types.ts` | `reset-password.schema.ts` |
| OTP Verification | `OtpCodeForm` | `useOtpVerification` | `otp.types.ts` | `otp.schema.ts` |
| Patient Dashboard | `PatientDashboard` | `usePatientDashboard` | `dashboard.types.ts` | — |
| Doctor Dashboard | `DoctorDashboard` | `useDoctorDashboard` | `doctorDashboard.types.ts` | — |
| Add Staff | `AddStaff` | `useAddStaff` | `addStaff.types.ts` | `addStaff.schema.ts` |

---

## 6. Strengths

### 6.1 Architecture & Code Quality

- **SOLID principles enforced** — Strict separation between presentational components, data-fetching hooks, and state management. Components receive data via props, never fetch directly.
- **Clean Container/Presenter pattern** — Every page follows: `page.tsx` → `PageContainer` → `PresentationalComponent`. This makes testing and refactoring straightforward.
- **Co-located file structure** — Each route keeps its types, schemas, hooks, and components together, making features self-contained and easy to navigate.
- **Well-designed Zustand store** — The registration wizard store uses ISP-compliant selectors so components only subscribe to the state slice they need.

### 6.2 Registration Flow

- **Comprehensive medical data capture** — 13 chief complaint types, each with specialized HPI blocks covering OPQRST assessment for chest pain, NYHA classification for dyspnea, severity scales, pillow orthopnea, and more.
- **Multi-step API persistence** — Each registration step saves independently to the backend, so progress isn't lost if a step fails.
- **S3 presigned URL uploads** — Client uploads directly to S3, reducing backend load and enabling progress tracking.

### 6.3 Database Design

- **Generated columns** — BMI, high-salt, and high-fat diet flags are computed at the database level, ensuring consistency.
- **Comprehensive enums** — Smoking status, alcohol consumption, exercise frequency, blood type, chief complaints, medication types, and allergy categories are all constrained at the DB level.
- **Cascade deletes** — All patient-related records cascade on user deletion, preventing orphaned data.
- **Drizzle ORM** — Type-safe schema definitions that serve as both migration source and TypeScript types.

### 6.4 UI/UX

- **Professional shadcn/ui design system** — Consistent theming with oklch color values, light/dark mode support, and accessible Radix primitives.
- **Responsive sidebar layouts** — Collapsible sidebar with icon-only mode, mobile sheet fallback, and rail toggle.
- **Live BMI calculator** — Real-time height/weight → BMI with color-coded category badges.
- **Medical UI primitives** — Custom components like severity dot scales (0-10), NYHA segmented controls, pillow stepper, and chip multi-select fields.

### 6.5 DevOps & AI Tooling

- **Docker Compose** — PostgreSQL + backend in a single `docker-compose up`.
- **Drizzle migrations** — Auto-applied on container startup via `docker-entrypoint.sh`.
- **AI assistant configurations** — Cursor rules, Copilot instructions, and AGENTS.md files ensure consistent AI-assisted development.

---

## 7. Weaknesses & Gaps

### 7.1 Critical Missing Features

| Gap | Impact | Severity |
|---|---|---|
| **No Login page** | Users cannot log in after registration. The entire auth flow is broken for returning users. | Critical |
| **No auth guards/middleware** | No frontend route protection. Any user can access patient/doctor/admin dashboards without authentication. | Critical |
| **No backend auth guards** | Controllers manually extract JWT from headers instead of using NestJS guards. Inconsistent and error-prone. | High |
| **Mock dashboard data** | Both patient and doctor dashboards return hardcoded mock data, not connected to real API. | High |
| **No prescription management** | Referenced in README and sidebar nav but fully missing. | Medium |
| **No teleconsultation** | Referenced in README but fully missing. | Medium |
| **No AI assistant** | `(assistant)` route group is an empty placeholder. | Medium |

### 7.2 Security Concerns

- **No NestJS auth guards** — JWT verification is done manually in each controller method. Should use `@UseGuards(JwtAuthGuard)` globally.
- **No refresh token rotation** — Refresh tokens are stored and re-used but not rotated on use, making token theft more dangerous.
- **No rate limiting** — No protection against brute-force attacks on login/register endpoints.
- **No CORS restriction** — S3 CORS policy allows `*` as an allowed origin alongside localhost.
- **Token in localStorage** — Access tokens in localStorage are vulnerable to XSS attacks. Consider httpOnly cookies for refresh tokens.
- **No input sanitization** — While DTOs validate structure, there's no HTML sanitization for free-text fields (could lead to stored XSS if rendered unsafely).

### 7.3 Code & Architecture Issues

- **Inconsistent auth patterns** — `useRegister.ts` uses TanStack Query mutation while `useRegisterStore.ts` (Zustand) also does the same API calls differently. Two competing implementations for the same feature.
- **Validation disabled** — `REGISTER_VALIDATION_ENABLED` is set to `false` in the register schema, meaning Zod validation is skipped client-side.
- **Giant Zustand store** — `useRegisterStore.ts` is 696 lines with 30+ actions. It violates SRP by handling step navigation, validation, API calls, field updates, and UI toggles all in one store.
- **Step4MedicalHistory.tsx is 1497 lines** — The largest single component file. It handles chief complaints, HPI blocks, past cardiac/non-cardiac history, interventions, risk factors, family history, medications, and allergies. Should be decomposed.
- **No backend tests** — Only the default NestJS `getHello()` test exists. No tests for auth, registration, or documents.
- **No frontend tests** — Zero test files in the frontend.
- **Hardcoded user data in layouts** — Patient layout shows "Sara Ahmed", doctor layout shows "Dr. Mahmoud Ali". Should come from authenticated user context.
- **Many nav items point to same route** — In both patient and doctor sidebars, most nav items link to the dashboard route as placeholders.

### 7.4 Data & Schema Issues

- **No appointment table** — Frontend displays appointments but no DB schema or API exists for them.
- **No vitals table** — Dashboard shows heart rate, blood pressure, SpO2, temperature but no schema for storing these.
- **No notification system** — No schema, API, or real-time mechanism for alerts/notifications.
- **No doctor-patient relationship table** — No way to assign patients to specific doctors.
- **No audit/log table** — No tracking of who did what and when.
- **patient_history.hpiData is untyped jsonb** — Flexible but loses type safety at the DB level.

### 7.5 Missing Infrastructure

- **No CI/CD pipeline** — No GitHub Actions or similar automation.
- **No environment-based configs** — Frontend `next.config.ts` is minimal; no staging/production config differentiation.
- **No API documentation** — No Swagger/OpenAPI integration on the backend.
- **No error monitoring** — No Sentry, LogRocket, or similar observability.
- **No logging strategy** — Backend has no structured logging (Winston/Pino).

---

## 8. Needs & Requirements

### 8.1 Must-Have (MVP)

These are essential for a functional graduation project demo:

1. **Login Page** — Users need to log in after registration. The page should call `POST /auth/login` and store tokens.
2. **Route Protection (Frontend)** — Auth middleware that redirects unauthenticated users away from protected routes (patient, doctor, admin portals).
3. **NestJS Auth Guards** — Replace manual JWT extraction with `@UseGuards(AuthGuard)` on protected endpoints.
4. **Real Dashboard Data** — Connect patient and doctor dashboards to actual API endpoints with real database queries.
5. **Appointments CRUD** — Database table + API + frontend for booking, viewing, and managing appointments.
6. **Vitals/Readings Table** — Store and display actual patient vitals (HR, BP, SpO2, temperature) with timestamps.
7. **Authenticated User Context** — Replace hardcoded names in sidebars with data from the current user's JWT/session.

### 8.2 Should-Have (Strong MVP)

These significantly strengthen the project for a graduation defense:

8. **Prescription Management** — Doctor writes prescriptions, patient views them. Table + API + UI.
9. **Doctor-Patient Assignment** — A relationship table so doctors see only their patients.
10. **Patient List for Doctors** — A searchable/filterable list of assigned patients with basic info.
11. **Refresh Token Rotation** — On refresh, issue a new refresh token and invalidate the old one.
12. **Rate Limiting** — Throttle login, register, and OTP endpoints.
13. **Swagger API Documentation** — Add `@nestjs/swagger` for auto-generated API docs.
14. **Basic Tests** — At minimum, integration tests for the auth flow (register + login + step 2-4).

### 8.3 Nice-to-Have (Impressive Additions)

These make the project stand out:

15. **AI Assistant Chat** — LLM-powered chat for patients to ask health questions or for doctors to get clinical decision support.
16. **Teleconsultation** — Video call integration (WebRTC) between doctor and patient.
17. **Real-time Notifications** — WebSocket-based alerts for appointments, vital anomalies, etc.
18. **Vitals Trend Charts** — Historical chart views for patient vitals over time.
19. **Dark Mode Toggle** — Already have theme variables, just need a toggle switch.
20. **Admin Dashboard** — Analytics: total patients, doctors, appointments per day, etc.

---

## 9. Where to Start — Roadmap

### Priority Order (Recommended Sequence)

```
Phase 1: Core Auth (Critical Path)           Week 1
──────────────────────────────────
  1. Build the Login page
  2. Add frontend auth middleware (route protection)
  3. Add NestJS auth guards (replace manual JWT extraction)
  4. Create authenticated user context (replace hardcoded names)

Phase 2: Core Data (MVP Features)            Week 2-3
──────────────────────────────────
  5. Create appointments table + CRUD API
  6. Create vitals/readings table + API
  7. Connect dashboards to real APIs (replace mock data)
  8. Create doctor-patient assignment table + API

Phase 3: Clinical Features                   Week 3-4
──────────────────────────────────
  9. Prescription management (table + API + UI)
  10. Patient list view for doctors
  11. Vitals trend charts (Recharts integration)
  12. Document viewing/downloading (not just upload)

Phase 4: Polish & Security                   Week 4-5
──────────────────────────────────
  13. Refresh token rotation
  14. Rate limiting on auth endpoints
  15. Swagger/OpenAPI documentation
  16. Basic test suite (auth flow integration tests)
  17. Dark mode toggle

Phase 5: Advanced Features                   Week 5-6
──────────────────────────────────
  18. AI assistant chat integration
  19. Real-time notifications (WebSocket)
  20. Admin analytics dashboard
  21. Teleconsultation (if time allows)
```

### Recommended Starting Point

**Start with the Login page** — it is the single highest-impact missing feature. Without it, returning users cannot access the system at all. The backend already has `POST /auth/login` fully implemented. You only need to build the frontend page following the established pattern:

```
src/app/(auth)/login/
├── page.tsx                  (Server Component, metadata)
├── LoginPageContainer.tsx    (Client, calls hook)
├── LoginForm.tsx             (Presentational form)
├── useLogin.ts               (useMutation → POST /auth/login)
├── login.types.ts            (LoginPayload, LoginResponse)
└── login.schema.ts           (Zod: email + password)
```

The login should:
1. Call `POST /auth/login` via `apiClient`
2. Store tokens via `setAuthTokens()` from `@/lib/auth-tokens`
3. Redirect to the appropriate dashboard based on `user.role` (`/dashboard` for patients, `/doctor-dashboard` for doctors, `/add-staff` for admins)

After login, immediately build the **auth middleware** to protect routes. Create a Next.js middleware file (`src/middleware.ts`) that checks for the access token in localStorage (or cookies) and redirects unauthenticated users to `/login`.

---

## Appendix: File Count Summary

| Area | Files | Lines (approx.) |
|---|---|---|
| Backend source (`src/`) | 35 | ~2,800 |
| Frontend source (`src/`) | 90+ | ~9,500 |
| Frontend UI components (`ui/`) | 24 | ~2,800 |
| Registration wizard | 17 | ~3,800 |
| Config & Docker | 10 | ~300 |
| **Total** | **~170** | **~16,400** |
