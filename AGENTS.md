# ICARE-CVD — instructions for AI assistants

Human and automated contributors should use this map so behavior stays consistent across tools (Cursor, Copilot, CLI agents, etc.).

## Project overview

ICARE-CVD is a cardiovascular disease patient management platform built as a graduation project. It connects patients, doctors, assistants, and admins through role-based portals for registration, appointments, consultations, medical records, documents, vitals, medications, and AI-assisted clinical workflows.

The repository is organized as a fullstack system:

- **Frontend:** `frontend/` — Next.js App Router application for all user portals and dashboards.
- **Backend:** `backend/` — NestJS API with authentication, role-based access, PostgreSQL persistence, documents, appointments, consultations, chat, vitals, labs, diagnoses, and staff/patient management.
- **ML services:** `ml-service/` — Python medical AI services for CT segmentation, chest X-ray analysis, ECG analysis/RAG, echocardiogram analysis, cardiac MRI, and medical report OCR/analysis.

## Main architecture

### Architecture patterns

This project is built on a **Fullstack Modular Architecture**.

- **Frontend pattern:** `Container / Presenter Pattern`
  - `page.tsx` files should stay thin.
  - Page containers orchestrate state, hooks, and data flow.
  - Presentational components receive data and callbacks through props.
  - Hooks own reusable UI logic and TanStack Query calls.
  - Types and validation schemas live in dedicated files.
- **Backend pattern:** `Modular NestJS Architecture`
  - Each domain should be organized around NestJS modules.
  - Controllers handle HTTP boundaries.
  - Services contain business logic.
  - DTOs validate request/response contracts.
  - Drizzle schema files define database tables and relations.
- **AI/ML pattern:** `Microservices Architecture`
  - ML workloads live outside the main backend in `ml-service/`.
  - Each AI service exposes its own API and can be run/deployed separately.

### Code principles

The codebase should follow **SOLID Principles**:

- **Single Responsibility Principle (SRP):** each component, hook, service, module, or helper should have one clear reason to change.
- **Open/Closed Principle (OCP):** code should be easy to extend through props, variants, configuration, or new modules without rewriting existing behavior.
- **Liskov Substitution Principle (LSP):** variants and replacements should keep the same expected contract and behavior.
- **Interface Segregation Principle (ISP):** keep props, DTOs, and interfaces focused; do not force code to depend on fields it does not use.
- **Dependency Inversion Principle (DIP):** UI and high-level logic should depend on abstractions such as props, hooks, services, or interfaces instead of directly reaching into low-level implementation details.

The frontend talks to the backend API through the shared API client. The backend stores structured clinical and user data in PostgreSQL using Drizzle ORM, integrates with S3-compatible storage for uploaded documents, and connects to AI/ML services where clinical analysis is needed.

Typical flow:

1. A user interacts with a role-specific frontend page.
2. Client-side server state is handled with TanStack Query.
3. Requests go through `frontend/src/lib/api-client.ts`.
4. NestJS controllers receive the request and delegate to services.
5. Services use Drizzle schema/database modules and shared integrations such as S3, mail, auth, or AI services.
6. ML workloads are handled by the separate Python services under `ml-service/`.

## Key product areas

- **Authentication and onboarding:** patient registration, login, OTP/verification, password reset, JWT access/refresh token flow.
- **Patient portal:** dashboard, appointments, consultations, medications, vitals, documents, and AI chat.
- **Doctor portal:** dashboard, patient records, queue, consultations, diagnoses, prescriptions, lab materials, vitals, and AI-assisted review.
- **Assistant portal:** patient creation, appointment handling, queue support, and operational dashboard.
- **Admin portal:** staff management and administrative dashboard.
- **Medical AI:** registration analysis, document/lab analysis, CT/X-ray/ECG/echo/MRI workflows, and clinical support panels.

## Repository documentation

- `PROJECT_DOCS.md` contains the broad project documentation, architecture notes, schema overview, API reference, known gaps, and roadmap.
- `README.md` contains quick setup notes.
- `frontend/AGENTS.md` is the authoritative frontend coding guide.
- `backend/README.md` contains backend setup and scripts.
- `.cursor/rules/` contains always-on assistant rules.
- `.cursor/skills/` contains optional project workflows.

## Frontend (Next.js)

**Authoritative guide:** [frontend/AGENTS.md](frontend/AGENTS.md)

Read it before changing routes, components, styling, forms, or API usage under `frontend/`.

## Backend (NestJS)

Code lives under `backend/`. Follow existing NestJS module and TypeScript conventions; see [backend/README.md](backend/README.md) for scripts and setup. Add a dedicated backend agent guide here if the team later wants stricter norms.

## Cursor

- **Always-on rules:** `.cursor/rules/` (files with `alwaysApply: true` apply to every chat).
- **Optional skills:** `.cursor/skills/` (workflows the agent can load when relevant).
