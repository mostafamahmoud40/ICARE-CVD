<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
When writing code for this project, always follow the SOLID principles:

- **S**ingle Responsibility: Each module, class, or function should have one responsibility and reason to change.
- **O**pen/Closed: Software entities should be open for extension, but closed for modification. Enhance functionality via new code, not by altering existing code.
- **L**iskov Substitution: Subtypes must be substitutable for their base types without altering the correctness of the program.
- **I**nterface Segregation: Prefer several small, specific interfaces over large, general-purpose ones.
- **D**ependency Inversion: Depend on abstractions, not concrete implementations. Use dependency injection when possible.

Adhering to these principles ensures the codebase remains maintainable, robust, and adaptable to future requirements.

## What this file is (Frontend Guide)

This file is the **frontend-only guide** for ICARE-CVD.
It defines the **UI system**, **folder conventions**, and **coding standards** for the Next.js app under `frontend/`.

If you are working on backend/API/DB, this file is not enough; keep backend rules in backend docs.

## Tech Stack

- **Next.js** (App Router only)
- **TypeScript**
- **Tailwind CSS** (ONLY for styling)
- **shadcn/ui** (ONLY component library)

## Current Phase: Frontend-Only

At this stage, the project is frontend-first.
Backend contracts are not finalized yet.

### Scope focus now

- Build and polish UI/UX flows.
- Implement route-level features with co-located files.
- Validate forms with Zod.
- Use TanStack Query patterns ready for future API integration.
- Keep components reusable and easy to refactor.

### What to avoid for now

- Do not hard-code backend assumptions as final truth.
- Do not over-engineer backend-specific abstractions in frontend.
- Do not block UI work waiting for real backend endpoints.

### Temporary data strategy

- Prefer mock data and local fixtures for screens under development.
- Keep mock data near the feature route unless reused across many routes.
- Replace mocks incrementally when backend endpoints are available.

### API readiness rule

- Keep API calls behind `src/lib/api-client.ts` + TanStack Query hooks.
- Keep query keys and response mapping explicit and easy to update.
- Treat endpoint paths and payloads as provisional until backend is confirmed.

## Where things live (quick map)

- **Routes / Pages (App Router)**: `src/app/**`
  - Use route groups like `src/app/(auth)/**` and `src/app/(patient)/**`
  - Put route-specific UI + hooks next to the route when it’s not reusable.
- **Reusable components**
  - `src/components/ui/**`: shadcn/ui base components (Button, Input, Card, Dialog, …)
  - `src/components/shared/**`: project-specific reusable building blocks (Navbar, PatientCard, …)
- **Cross-cutting utilities**: `src/lib/**` (example: `cn()` utility)
- **HTTP client**: `src/lib/api-client.ts` (single shared API client)
- **State**: `src/store/**` (Zustand is installed; use it when global state is truly needed)

## Route folder pattern (the “way we organize files”)

For most features, we follow a **route-local feature folder** pattern under `src/app/**`.

Example (auth login):

```txt
src/app/(auth)/login/
├── page.tsx            # route entry (Server Component by default)
├── LoginForm.tsx       # UI component(s) for the route (Client Component if needed)
├── useLogin.ts         # route-specific state/effects (Client)
├── login.schema.ts     # Zod schema(s) + inferred types
└── login.types.ts      # shared TS types for the route (DTOs, UI models)
```

Example (patient dashboard):

```txt
src/app/(patient)/dashboard/
├── page.tsx
├── PatientDashboard.tsx
├── HealthSummaryCard.tsx
├── UpcomingReminders.tsx
├── usePatientDashboard.ts
└── dashboard.types.ts
```

Rules:
- Prefer **co-locating** files that only belong to a single route.
- Move truly reusable components to `src/components/shared/**`.
- Naming:
  - `page.tsx` stays `page.tsx`
  - Components use **PascalCase** (e.g., `LoginForm.tsx`, `ChatWindow.tsx`)
  - Hooks use `useXyz.ts` (e.g., `useLogin.ts`)
  - Types use `*.types.ts` (e.g., `login.types.ts`)
  - Zod schemas use `*.schema.ts` (e.g., `login.schema.ts`)

## Zod usage (schemas + type inference)

We use **Zod** for validating user input and deriving TypeScript types.

Recommended pattern:
- Define schemas in `*.schema.ts`
- Infer types from schemas using `z.infer<>`
- Keep runtime validation inside hooks/query functions (not inside presentational components)

Example:

```ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginValues = z.infer<typeof loginSchema>;
```

Then in a hook, validate before submitting:
- `const values = loginSchema.parse(rawValues)` (throws) or
- `const result = loginSchema.safeParse(rawValues)` (no throw)

## API access pattern (required)

### Why `api-client + TanStack Query` instead of `src/services/`

Do **NOT** create a `src/services/` folder for HTTP calls.
Use `src/lib/api-client.ts` directly inside route hooks with TanStack Query.

Problems with old service-style + manual state:
- Repeating `useState` for `loading`, `error`, and `data` in every feature.
- No caching by default, so navigation can trigger unnecessary re-fetches.
- No automatic background refetch or invalidation workflow.
- Extra abstraction files that often only wrap one `fetch` call.

Benefits of the new pattern:
- `isLoading`, `error`, `data` come from React Query (no manual state boilerplate).
- Query caching improves UX and avoids duplicate requests.
- `invalidateQueries` keeps lists fresh after mutations.
- Hooks own feature behavior while `apiClient` centralizes transport config.

### Required rule

- Always use `apiClient.get()` / `apiClient.post()` (and peers) **inside** `useQuery` / `useMutation`.
- Never use raw `fetch()` in feature hooks.
- Never use raw `axios()` in feature hooks.
- Never create a `src/services/` folder.

### Reference implementation

```ts
// src/lib/api-client.ts
import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});
```

```ts
// useMeasurements.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Measurement, MeasurementFormValues } from "./measurement.types";

export function useMeasurements() {
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["measurements"],
    queryFn: () =>
      apiClient.get<Measurement[]>("/patient/measurements").then((r) => r.data),
  });

  const { mutate: submit, isPending } = useMutation({
    mutationFn: (values: MeasurementFormValues) =>
      apiClient.post("/patient/measurements", values),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["measurements"] }),
  });

  return { measurements: data ?? [], isLoading, error, submit, isPending };
}
```

## Design Rules

- Use Tailwind CSS classes for all styling
- Do **NOT** use custom CSS files unless absolutely necessary
- Do **NOT** use other UI libraries (no Material UI, Bootstrap, etc.)
- Always prefer **shadcn/ui** components (Button, Card, Input, etc.)
- Keep design clean, modern, and minimal


## Component Guidelines

- **Reusability:**  
  Build all components with reusability in mind. Accept props to customize appearance and behavior.

- **Separation of Concerns:**  
  Keep UI and business logic separate. Place business logic in hooks (`useXyz()`) or controller modules, not inside components.

- **Functional Components Only:**  
  Write all components as functional components. Do not use class components.

- **State Management:**  
  Manage state using React hooks (`useState`, `useReducer`, `useContext`, etc.). Avoid legacy state APIs.

- **Hooks Usage:**  
  Extract reusable stateful or effectful logic into custom hooks.

- **Props:**  
  Define clear, type-safe props (using TypeScript interfaces or types) for every component.

- **Naming:**  
  Use PascalCase for component and hook names (e.g., `ProfileCard`, `useUserProfile`).

- **UI Libraries:**  
  Combine only **shadcn/ui** components and **Tailwind CSS** classes for layout and style.

- **No Side Effects in Render:**  
  Side effects go inside `useEffect` or custom hooks, **never** directly in component bodies.

- **Testing:**  
  Design components to be easily testable and mockable.

- **Accessibility:**  
  Ensure all interactive components are accessible (use semantic HTML, ARIA where appropriate).

## SOLID in React/Next (practical examples)

These examples show how SOLID maps to modern frontend code.
Use these patterns when implementing new features.

### S — Single Responsibility Principle (SRP)

Do: split UI, form state, and side-effects into separate units.

Example structure:
- `LoginForm.tsx`: renders inputs/buttons only
- `useLogin.ts`: owns form state + validation + submit handler
- React Query query/mutation functions: own network calls via `apiClient`

Rule of thumb: if a component is doing rendering + fetching + validation + mapping API DTOs, it’s too much.

### O — Open/Closed Principle (OCP)

Do: extend behavior via composition/props instead of editing shared components repeatedly.

Example pattern:
- Create a generic `AuthFormCard` in `components/shared/`.
- Add new auth pages by composing it with different children/props (register/otp/reset), rather than duplicating layout.

In other words: add new pages/features by adding new modules and composing existing primitives, not by special-casing shared components.

### L — Liskov Substitution Principle (LSP)

In TS/React this usually means: keep component contracts honest.

Do:
- If a component accepts a type like `User`, all implementations must handle any valid `User` without breaking.
- Prefer narrow, explicit props instead of “god props” that only work for one screen.

Guidance:
- Avoid props like `mode: "register" | "login" | "otp" | ...` on a single component that changes meaning wildly.
- Prefer separate components composed from shared primitives.

### I — Interface Segregation Principle (ISP)

Do: keep props and types small and specific.

Bad pattern:
- `PatientCardProps` includes 20 fields because 1 screen needs them.

Better pattern:
- `PatientCardProps` includes only what it renders.
- If another screen needs more fields, create a wrapper component or a different component rather than bloating the shared one.

Also applies to services:
- Prefer small, explicit hooks/query functions over one generic mega-hook with many modes.

### D — Dependency Inversion Principle (DIP)

Do: depend on abstractions and inject dependencies at boundaries.

In frontend, a practical DIP approach is:
- Define a small port (interface) like `AuthApi` with `login()` / `register()`.
- Provide a concrete implementation that uses `fetch`.
- In hooks/components, depend on the interface, not the concrete transport.

This makes testing easy (swap in a fake API) and keeps components independent from networking details.


## Public Folder Structure (Static Assets)

All static assets must follow this structure inside `/public`:

```
public/
├── images/
│   ├── logo/            # brand logos
│   ├── avatars/         # user profile images
│   ├── illustrations/   # empty states, onboarding, UI visuals
│   ├── icons/           # custom SVG icons used in UI
│   └── og/              # Open Graph images (1200x630)
├── fonts/               # custom fonts
├── icons/               # PWA & browser icons (favicon, apple-touch-icon, etc.)
├── manifest.json        # PWA manifest
└── robots.txt           # SEO rules
```

### Rules for Static Assets

- Always store images inside `/public/images`
- Use descriptive folder names (logo, avatars, etc.)
- Do **NOT** put images randomly in the root of `/public`
- Use **SVG** format for icons whenever possible
- **Optimize** images before adding (compression required)
- Open Graph images must be **1200x630** pixels
- Fonts must be stored in `/public/fonts`
- PWA icons must be inside `/public/icons`

### Usage Rules in Code

- Always reference assets like: `/images/...`
- Do **NOT** import from public folder using relative paths
- Prefer [`next/image`](https://nextjs.org/docs/app/api-reference/components/image) for image optimization


## Components Structure

All frontend components must follow this structure:

```txt
src/components/
├── ui/        # shadcn/ui components (base reusable UI)
└── shared/    # project-specific reusable components
```

### Folder Responsibilities

#### `ui/`

- Contains only [shadcn/ui](https://ui.shadcn.com/) components.
- Examples: `Button`, `Input`, `Card`, `Dialog`.
- **Do NOT** modify core shadcn/ui behavior unless necessary.
- Can extend or override styles using Tailwind CSS classes.

#### `shared/`

- Contains reusable components specific to the project.
- All components must be composed using `ui/` building blocks.
- Examples:
  - `Navbar`
  - `Sidebar`
  - `PatientCard`
  - `AppointmentItem`
  - Form wrappers (e.g., `FormSection`, `FieldGroup`)
- Should not reimplement logic found in `ui/`.

### Component Rules

- Always use components from `ui/` as building blocks for `shared/` components.
- **Do NOT** duplicate UI logic already implemented in `ui/`.
- Keep all components small, focused, and maximally reusable.
- **Separate logic from presentation** (use hooks and utility functions for logic).
- All components must use TypeScript with clear, well-defined props.

### Naming Conventions

- Use **PascalCase** for all component names and filenames (e.g., `PatientCard.tsx`).
- Each file should export only a single component by default.
- Group related components in folders when appropriate.

### Import Rules

- Use **absolute imports** for all internal modules if your project supports them.
  - Example:  
    ```ts
    import { Button } from "@/components/ui/button"
    import { PatientCard } from "@/components/shared/PatientCard"
    ```
- Prefer importing from the relevant folder over deep relative paths.
<!-- END:nextjs-agent-rules -->
