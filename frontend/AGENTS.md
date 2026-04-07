# Frontend Agent Guidelines

## Stack

- **Framework:** Next.js (App Router)
- **UI Components:** shadcn/ui
- **Styling:** Tailwind CSS

## Design

- Use **shadcn/ui** components exclusively — do not introduce other UI libraries.
- Style with **Tailwind CSS** utility classes only — no custom CSS files or inline styles unless absolutely necessary.
- Follow shadcn/ui theming conventions (CSS variables for colors, radius, etc.).

## Data Fetching

- Use **TanStack Query** for all client-side data fetching and server state management.
- Define query/mutation logic in dedicated files (e.g., `queries/`, `mutations/`) — not inside components.
- Use `queryKey` factories to keep keys consistent and easy to invalidate.
- Prefer `useQuery` for reads and `useMutation` for writes — handle loading/error states explicitly.
- Do not mix TanStack Query with direct `fetch` calls inside components.

## Code Principles (SOLID)

> ⚠️ **SOLID principles are non-negotiable. Every piece of code written MUST follow all five principles without exception. Violating any of them is not acceptable.**

---

### 1. Single Responsibility Principle (SRP)
**Every module, component, or hook must have one — and only one — reason to change.**

- ✅ A component renders UI. Nothing else.
- ✅ A custom hook handles logic. Nothing else.
- ✅ A query file handles data fetching. Nothing else.
- ❌ Never mix data fetching, business logic, and rendering inside the same component.
- ❌ Never write a component that does "a bit of everything".

```tsx
// ❌ Wrong
export function UserCard() {
  const [user, setUser] = useState(null);
  useEffect(() => { fetch("/api/user").then(...) }, []);
  // + formats data + renders UI all in one place
}

// ✅ Correct
export function UserCard({ user }: { user: User }) {
  return <Card>...</Card>; // rendering only
}
// data fetching lives in useUserQuery()
```

---

### 2. Open/Closed Principle (OCP)
**Components must be open for extension, closed for modification.**

- ✅ Accept `className` and spread extra props to allow external customization.
- ✅ Use `cn()` from shadcn to merge classes without touching the component internals.
- ❌ Never force a consumer to edit the component source to change its appearance or behavior.

```tsx
// ✅ Correct
function Badge({ className, ...props }: BadgeProps) {
  return <span className={cn("base-styles", className)} {...props} />;
}
```

---

### 3. Liskov Substitution Principle (LSP)
**Any component variant must be safely substitutable for another without breaking behavior.**

- ✅ Variants (e.g., `Button` sizes/colors) must share the same prop contract.
- ✅ A specialized component must honor all behavior of its base.
- ❌ Never build a variant that secretly requires a different parent or extra hidden context.

---

### 4. Interface Segregation Principle (ISP)
**No component should be forced to depend on props it doesn't use.**

- ✅ Keep prop interfaces small and specific to what the component actually needs.
- ✅ If two components share a prop type, split it — don't merge into one fat interface.
- ❌ Never pass a whole object (e.g., the full `user`) when only `user.name` is needed.

```tsx
// ❌ Wrong
function Avatar({ user }: { user: User }) { // only needs user.avatarUrl }

// ✅ Correct
function Avatar({ avatarUrl }: { avatarUrl: string }) { ... }
```

---

### 5. Dependency Inversion Principle (DIP)
**Components depend on abstractions (props/interfaces), not concrete implementations.**

- ✅ Pass data and callbacks in via props — components must not reach out for their own data.
- ✅ Business logic and data fetching live in hooks or server components, never inside UI components.
- ❌ Never import a query, API call, or store directly inside a presentational component.

```tsx
// ❌ Wrong
function UserList() {
  const { data } = useUsersQuery(); // coupled to a specific data source
}

// ✅ Correct
function UserList({ users }: { users: User[] }) { ... }
// the parent/page is responsible for fetching and passing data down
```

## General Rules

- Prefer **Server Components** by default; add `"use client"` only when interactivity is required.
- Co-locate component-specific hooks and helpers next to the component file.
- No direct DOM manipulation — let React and shadcn handle it.
- Keep pages thin — delegate rendering to feature components.