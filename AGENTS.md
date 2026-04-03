# ICARE-CVD — instructions for AI assistants

Human and automated contributors should use this map so behavior stays consistent across tools (Cursor, Copilot, CLI agents, etc.).

## Frontend (Next.js)

**Authoritative guide:** [frontend/AGENTS.md](frontend/AGENTS.md)

Read it before changing routes, components, styling, forms, or API usage under `frontend/`.

## Backend (NestJS)

Code lives under `backend/`. Follow existing NestJS module and TypeScript conventions; see [backend/README.md](backend/README.md) for scripts and setup. Add a dedicated backend agent guide here if the team later wants stricter norms.

## Cursor

- **Always-on rules:** `.cursor/rules/` (files with `alwaysApply: true` apply to every chat).
- **Optional skills:** `.cursor/skills/` (workflows the agent can load when relevant).
