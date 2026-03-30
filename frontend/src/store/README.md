# Global Store

This directory contains application-wide state management using Zustand. It's designed for **shared global state only** - feature-specific state should remain in feature folders.

## Structure

```
store/
├── index.ts          # Export all stores
├── types.ts          # TypeScript interfaces for stores
├── auth-store.ts     # Authentication state
├── app-store.ts      # General app state (theme, sidebar, notifications)
└── README.md         # This file
```

## Usage

### Import stores from the index file:

```typescript
import { useAuthStore, useAppStore } from '@/store';
```

### Using Auth Store:

```typescript
function LoginComponent() {
  const { user, isAuthenticated, login, logout, setLoading } = useAuthStore();

  const handleLogin = async (userData) => {
    setLoading(true);
    // ... login logic
    login(userData);
  };

  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user?.name}!</p>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

### Using App Store:

```typescript
function SettingsComponent() {
  const { theme, setTheme, addNotification } = useAppStore();

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    addNotification({
      type: 'success',
      title: 'Theme Updated',
      message: `Switched to ${newTheme} theme`
    });
  };

  return (
    <select value={theme} onChange={(e) => handleThemeChange(e.target.value)}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="system">System</option>
    </select>
  );
}
```

## Features

### Persistence
- **Auth Store**: Persists user data and authentication state
- **App Store**: Persists theme and sidebar preferences
- **Notifications**: Not persisted (cleared on refresh)

### Automatic Cleanup
- Notifications auto-remove after their duration (default: 5 seconds)
- Loading states are not persisted

## Guidelines

### ✅ DO use for:
- Authentication state
- User preferences (theme, language)
- Global UI state (sidebar, modals)
- App-wide notifications
- Cross-feature shared data

### ❌ DON'T use for:
- Feature-specific state (forms, lists, filters)
- Component-local state
- Temporary UI state
- API cache (use React Query/SWR instead)

## Adding New Stores

1. Create a new store file (e.g., `settings-store.ts`)
2. Define types in `types.ts`
3. Export from `index.ts`
4. Keep it focused on global concerns only

## Type Safety

All stores are fully typed with TypeScript. The store automatically infers types from the defined interfaces, providing excellent IDE support and compile-time safety.