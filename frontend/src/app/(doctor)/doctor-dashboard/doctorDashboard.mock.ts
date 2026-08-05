import type { DoctorDashboardData } from "./doctorDashboard.types"

function buildMockTodayISO(hour: number, minute: number) {
  const d = new Date()
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

export const mockDoctorDashboard: DoctorDashboardData = {
  doctor: {
    id: "DR-1007",
    fullName: "Mahmoud Ali",
    department: "Cardiology",
  },
  assignedPatients: [
    {
      id: "PT-1842",
      fullName: "Sara Ahmed",
      condition: "Hypertension (controlled)",
      lastSeenAt: "2026-04-02T09:30:00Z",
    },
    {
      id: "PT-2011",
      fullName: "Omar Hassan",
      condition: "Arrhythmia follow-up",
      lastSeenAt: "2026-04-01T16:10:00Z",
    },
    {
      id: "PT-3099",
      fullName: "Laila Nasser",
      condition: "Cholesterol management",
      lastSeenAt: "2026-03-29T11:45:00Z",
    },
    {
      id: "PT-4120",
      fullName: "Kamal Al-Fayed",
      condition: "Post-MI rehabilitation",
      lastSeenAt: "2026-03-28T14:20:00Z",
    },
  ],
  upcomingAppointments: [
    {
      id: "appt-1",
      scheduledAt: buildMockTodayISO(9, 0),
      department: "Cardiology",
      patientName: "Sara Ahmed",
      location: "Room 2A — Main Center",
      status: "confirmed",
    },
    {
      id: "appt-2",
      scheduledAt: buildMockTodayISO(10, 30),
      department: "Cardiology",
      patientName: "Omar Hassan",
      location: "Room 2B — Main Center",
      status: "scheduled",
    },
    {
      id: "appt-3",
      scheduledAt: buildMockTodayISO(11, 15),
      department: "Cardiology",
      patientName: "Laila Nasser",
      location: "Virtual consult",
      status: "scheduled",
    },
    {
      id: "appt-4",
      scheduledAt: buildMockTodayISO(14, 0),
      department: "Cardiology",
      patientName: "Kamal Al-Fayed",
      location: "Room 2A — Main Center",
      status: "scheduled",
    },
    {
      id: "appt-5",
      scheduledAt: buildMockTodayISO(15, 30),
      department: "Cardiology",
      patientName: "Fatima Hassan",
      location: "Room 2B — Main Center",
      status: "scheduled",
    },
  ],
  recentAlerts: [
    {
      id: "alert-2",
      label: "Heart Rate",
      value: "45 bpm",
      severity: "critical",
      patientName: "Omar Hassan",
      at: buildMockTodayISO(8, 45),
    },
    {
      id: "alert-1",
      label: "Blood Pressure",
      value: "138/88 mmHg",
      severity: "high",
      patientName: "Sara Ahmed",
      at: buildMockTodayISO(8, 30),
    },
    {
      id: "alert-4",
      label: "Medication interaction",
      value: "Amiodarone + Warfarin",
      severity: "high",
      patientName: "Fatima Hassan",
      at: buildMockTodayISO(7, 50),
    },
    {
      id: "alert-3",
      label: "SpO₂",
      value: "98%",
      severity: "normal",
      patientName: "Laila Nasser",
      at: buildMockTodayISO(7, 15),
    },
  ],
  workload: {
    patientsPerWeek: 42,
    hoursAvailable: 18,
  },
}
