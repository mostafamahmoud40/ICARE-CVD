import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, Notification } from './types';

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      sidebarOpen: true,
      notifications: [],

      setTheme: (theme: 'light' | 'dark' | 'system') => {
        set({ theme });
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setSidebarOpen: (open: boolean) => {
        set({ sidebarOpen: open });
      },

      addNotification: (notification: Omit<Notification, 'id'>) => {
        const id = crypto.randomUUID();
        const newNotification: Notification = {
          id,
          duration: 5000, // Default 5 seconds
          ...notification
        };

        set((state) => ({
          notifications: [...state.notifications, newNotification]
        }));

        // Auto-remove notification after duration
        if (newNotification.duration && newNotification.duration > 0) {
          setTimeout(() => {
            get().removeNotification(id);
          }, newNotification.duration);
        }
      },

      removeNotification: (id: string) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id)
        }));
      },

      clearNotifications: () => {
        set({ notifications: [] });
      },
    }),
    {
      name: 'app-store', // Key for localStorage
      // Only persist theme and sidebarOpen, not notifications
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen
      }),
    }
  )
);