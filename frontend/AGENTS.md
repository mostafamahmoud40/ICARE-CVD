# Frontend Agent Guidelines

## Stack

- **Framework:** Next.js (App Router)
- **UI Components:** shadcn/ui
- **Styling:** Tailwind CSS

## Design

- Use **shadcn/ui** components exclusively — do not introduce other UI libraries.
- Style with **Tailwind CSS** utility classes only — no custom CSS files or inline styles unless absolutely necessary.
- Follow shadcn/ui theming conventions (CSS variables for colors, radius, etc.).

### Icons — no background tiles

**Default rule:** Lucide (and other inline) icons render **without a colored box, border, or shadow plate behind them**.

- ✅ Colored icon only: `className="size-4 text-[#1A5345]"` (or another semantic color).
- ✅ Icon-only actions: `Button` with `variant="ghost"`, `border-0`, `bg-transparent`, `shadow-none`; hover changes **icon color only** (`hover:bg-transparent hover:text-[#1A5345]`).
- ✅ Section / card headers: icon beside title — **no** `bg-[#1A5345]` tile, **no** rounded square wrapper unless the whole row is a clickable stat cell.
- ❌ Do **not** wrap icons in `bg-*` squares, `rounded-lg` icon wells, or `outline` icon buttons when the intent is a lightweight action or label.
- ❌ Do **not** add `hover:-translate-y-*` or lift animations on icon buttons — use `transition-colors` only.

```tsx
// ❌ Wrong — icon inside a fake “button tile”
<Button variant="outline" size="icon" className="border bg-white shadow-sm">
  <MessageSquareIcon className="size-4" />
</Button>

// ✅ Correct — icon only
<Button
  variant="ghost"
  size="icon"
  className="size-8 border-0 bg-transparent text-muted-foreground shadow-none hover:bg-transparent hover:text-[#1A5345]"
>
  <MessageSquareIcon className="size-4" />
</Button>

// ✅ Correct — header / label icon (no container)
<CalendarIcon className="size-5 text-emerald-600" aria-hidden />
```

**Documented exceptions** (do not copy these patterns elsewhere without good reason):

- **Toasts** — circular icon badge is defined in [Toast Icon Container](#toast-icon-container) below.
- **Empty states** — large centered illustration circle in [Empty States](#empty-states) below.
- **Stat / snapshot cells** — the whole cell is the surface; the icon sits on white/card bg with **no extra icon-only tile** inside the cell.

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

## Responsive Design

All pages and components must be fully responsive across screen sizes. Use Tailwind's breakpoint prefixes (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`) to adapt layouts and content.

### Breakpoints

| Prefix | Min width | Typical device |
|--------|-----------|----------------|
| (default) | 0px | Mobile phones |
| `sm:` | 640px | Large phones / small tablets |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Laptops |
| `xl:` | 1280px | Desktops |
| `2xl:` | 1536px | Wide screens |

### Layout

- **Page containers**: Use `p-3 sm:p-4 lg:p-5` for outer padding. Remove fixed `max-w-[...]` wrappers — let content fill available space, using grid columns to control card width instead.
- **Stat card grids**: Use `grid-cols-2` on mobile, scale up with content: `sm:grid-cols-3`, `lg:grid-cols-4`, etc. Never start at `grid-cols-5` — it overflows on small screens.
- **Content card grids**: `grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4`. Adjust based on card density.
- **Filter / tab bars**: Wrap with `overflow-x-auto` on the container. Use short labels on mobile, full labels on `sm:+`:
  ```tsx
  <span className="sm:hidden">Short</span>
  <span className="hidden sm:inline">Full Label Text</span>
  ```
- **Search + filter rows**: Stack vertically on mobile (`flex-col`), horizontal on `sm:+` (`sm:flex-row`).
- **Action buttons in cards**: Stack vertically on mobile (`flex-col gap-1.5`), horizontal on `sm:+` (`sm:flex-row sm:gap-2`).

### Typography Scaling

| Element | Mobile (default) | `sm:` and up |
|---------|-------------------|---------------|
| Page title | `text-[13px]` | `sm:text-[15px]` |
| Card heading | `text-[12px]` | `sm:text-[14px]` |
| Body text | `text-[10px]` | `sm:text-[11px]` |
| Badge text | `text-[9px]` | `sm:text-[10px]` |
| Stat value | `text-lg` | `sm:text-xl` |
| Stat label | `text-[9px]` | `sm:text-[11px]` |

### Spacing Scaling

| Element | Mobile (default) | `sm:` and up |
|---------|-------------------|---------------|
| Card padding | `p-3` | `sm:p-4` |
| Section gap | `space-y-4` | `sm:space-y-5` |
| Card gap (grid) | `gap-3` | `sm:gap-4` |
| Inner element gap | `gap-1.5` | `sm:gap-2` |
| Separator margin | `my-2` | `sm:my-3` |

### Icon & Avatar Scaling

| Element | Mobile (default) | `sm:` and up |
|---------|-------------------|---------------|
| Page header icon (Lucide, no tile) | `size-4` | `sm:size-5` |
| Stat card icon (Lucide, no tile) | `size-4` | `sm:size-5` |
| Card avatar | `size-9` | `sm:size-11` |
| Inline / toolbar icons | `size-3.5` | `sm:size-4` |
| Icons in badges | `size-2.5` | (same — badges are compact at all sizes) |

> **Note:** Do not add separate “icon container” sizes with backgrounds — see [Icons — no background tiles](#icons--no-background-tiles).

### Text Truncation

- Condition/description text in cards: use `truncate max-w-[160px] sm:max-w-[280px]`.
- Date badges on mobile: use short format (`"17 Apr"`), full format on `sm:+` (`"Apr 17, 2026"`).

### Color Palette

The app uses a consistent medical-themed palette. Use these Tailwind values:

| Role | Value |
|------|-------|
| Primary (dark green) | `bg-[#1A5345]`, `text-[#1A5345]`, `hover:bg-[#0F3D32]` |
| Light green surface | `bg-[#E8F0EE]`, `bg-[#EEF5F3]`, `bg-[#F6FBF9]` |
| Page background | `bg-[#F9F8F5]` |
| Card background | `bg-white` or `bg-[#FBFDFC]` |
| Border | `border-[#E5EEEA]`, `border-[#E8E6E0]` |
| Header background | `bg-[#FAFAF8]` |
| Text primary | `text-[#102F27]`, `text-[#1A1F1E]` |
| Text secondary | `text-muted-foreground` |
| Amber warning | `bg-amber-50 text-amber-600` |
| Red danger / allergy | `bg-red-50 text-red-600` |
| Emerald success | `bg-emerald-50 text-emerald-700` |
| Violet AI / new | `bg-violet-50 text-violet-600` |

## Toast / Notification Design

All toast notifications across the app must use a **consistent card-style design** via the global `Toaster` (`@/components/ui/sonner`). Do not use `sonner`'s built-in `richColors`.

### Toast Card Style (applied globally to ALL toast types)

```
rounded-2xl border border-[#E8E6E0]/80 bg-white px-5 py-4
shadow-[0_12px_40px_-8px_rgba(26,83,69,0.12)] ring-1 ring-[#1A5345]/5
w-[min(460px,calc(100vw-2rem))] max-w-[460px]
flex-row items-start gap-3.5
```

- **Title:** `text-[14.5px] font-bold tracking-tight text-[#1A1F1E]`
- **Description:** `text-[13px] font-medium leading-[1.6] text-muted-foreground`
- **Background:** Always white (`bg-white`) for all variants (success, error, info, warning, loading)
- **Border:** Always `border-[#E8E6E0]/80`

### Toast Icon Container

All built-in toast icons are rendered inside a circular badge:
```
flex size-10 shrink-0 items-center justify-center rounded-full ring-4 mt-0.5
bg-[#1A5345]/10 text-[#1A5345] ring-[#1A5345]/5
```
- Icon size: `size-[18px]` with `strokeWidth={2.5}`
- **Error variant** uses: `bg-red-50 text-red-600 ring-red-500/10`

### Usage

- Use `toast.success()`, `toast.error()`, `toast.info()`, `toast.warning()`, `toast.loading()` directly — the card style is applied automatically.
- For custom toasts, use `showIcareToast()` / `showIcareSuccessToast()` / `showIcareErrorToast()` from `@/components/shared/icare-toast`.
- Do **not** wrap custom toast content in its own card wrapper — render only the inner layout (icon + text) because the `Toaster` root already provides the card.

### Empty States

Center empty state content with:
```
rounded-xl border-2 border-dashed border-[#E5EEEA] bg-white py-8 sm:py-12
```
Icon container: `size-12 sm:size-14 rounded-full bg-[#F5F5F3]`.

## Specific Badge Colors

For maintaining consistency across queue and status indicators, use the following exact Tailwind classes:

- **Walk-in (Visit Type):** `bg-orange-50 text-orange-700 border-orange-200/60`
- **No Show (Status):** `bg-red-50 text-red-600`
- **New (Status/Badge):** `bg-violet-50 text-violet-700 border-violet-200/60`

### Solid Badges for Status & Risk
When rendering Status, Risk, or similar important category badges, **always use the "Solid Design"** matching the medication pages. DO NOT use transparent backgrounds, thin borders, or colored dots.
- **Background:** Solid color matching the semantic meaning (e.g., `bg-[#1A5345]`, `bg-rose-500`, `bg-amber-500`, `bg-[#3B82F6]`).
- **Text:** White (`text-white`).
- **Shape:** `rounded-lg` with `px-2 py-0.5`.
- **Typography:** `text-[10px] font-bold` — **sentence case** labels (e.g. `In treatment`, `Discharged`). Do **not** use `uppercase` or `tracking-wider` on status badges.
- **Example Usage:**
  ```tsx
  <span className="inline-flex items-center justify-center rounded-lg px-2 py-0.5 text-[10px] font-bold bg-rose-500 text-white">
    High risk
  </span>
  ```