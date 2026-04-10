import type { AdminDashboardData } from "./adminDashboard.types"

export const mockAdminDashboard: AdminDashboardData = {
  admin: {
    fullName: "Youssef Kamal",
    email: "admin@icare-cvd.example",
  },
  counts: {
    totalUsers: 1842,
    doctors: 48,
    patients: 1760,
    pendingVerifications: 12,
  },
  recentSignups: [
    {
      id: "USR-9102",
      fullName: "Nour El-Din",
      email: "nour.eldin@example.com",
      role: "patient",
      status: "pending",
      joinedAt: "2026-04-09T14:22:00Z",
    },
    {
      id: "USR-9101",
      fullName: "Dr. Hana Farid",
      email: "hana.farid@clinic.example",
      role: "doctor",
      status: "pending",
      joinedAt: "2026-04-09T11:05:00Z",
    },
    {
      id: "USR-9098",
      fullName: "Karim Saleh",
      email: "karim.saleh@example.com",
      role: "patient",
      status: "active",
      joinedAt: "2026-04-08T19:40:00Z",
    },
  ],
  recentActivity: [
    {
      id: "act-1",
      summary: "Doctor credential bundle uploaded for review",
      actor: "Dr. Hana Farid",
      at: "2026-04-09T11:08:00Z",
    },
    {
      id: "act-2",
      summary: "Patient profile completed after OTP verification",
      actor: "Nour El-Din",
      at: "2026-04-09T14:25:00Z",
    },
    {
      id: "act-3",
      summary: "Suspended account reinstated after support ticket",
      actor: "Admin (Youssef Kamal)",
      at: "2026-04-08T09:12:00Z",
    },
    {
      id: "act-4",
      summary: "Bulk export: monthly compliance report",
      actor: "Admin (Youssef Kamal)",
      at: "2026-04-07T07:00:00Z",
    },
  ],
}
