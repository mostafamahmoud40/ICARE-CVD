---
name: icare-cvd-project
description: Applies ICARE-CVD repository conventions for code, configuration, and structure. Use when working in this repository, on frontend or backend, or when the user mentions icare-cvd, ICARE, CVD, or the graduation project health app.
---

# ICARE-CVD project workflow

## Before any change

1. Decide the area: `frontend/` (Next.js) or `backend/` (NestJS).
2. **Frontend:** Read `frontend/AGENTS.md` first; it is the full, authoritative guide.
3. **Backend:** Follow NestJS patterns already in `backend/`; keep changes focused.

## Frontend essentials (details in AGENTS.md)

- App Router, TypeScript, Tailwind, shadcn/ui for UI; Zod for validation.
- Network: `apiClient` inside `useQuery` / `useMutation` only; do not add `src/services/` for HTTP.
- Co-locate route-specific files under `src/app/**`; reusable UI in `src/components/shared/`.
- SOLID-oriented split: presentational components vs `useXyz.ts` hooks vs schemas.

## General

- Match existing naming, imports, and file layout in the touched area.
- Do not introduce new UI libraries or alternate styling systems on the frontend.

For the complete rule set, always defer to `frontend/AGENTS.md` when working under `frontend/`.
