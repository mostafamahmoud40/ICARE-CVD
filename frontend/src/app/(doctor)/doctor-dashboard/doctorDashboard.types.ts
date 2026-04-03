export type DoctorInfo = {
  id: string
  fullName: string
  department: string
}

export type DoctorPatient = {
  id: string
  fullName: string
  condition: string
  lastSeenAt: string
}

export type AppointmentStatus = "scheduled" | "confirmed" | "completed"

export type DoctorAppointment = {
  id: string
  scheduledAt: string
  department: string
  patientName: string
  location: string
  status: AppointmentStatus
}

export type VitalSeverity = "normal" | "high" | "critical"

export type VitalAlert = {
  id: string
  label: string
  value: string
  severity: VitalSeverity
  patientName: string
  at: string
}

export type DoctorDashboardData = {
  doctor: DoctorInfo
  assignedPatients: DoctorPatient[]
  upcomingAppointments: DoctorAppointment[]
  recentAlerts: VitalAlert[]
  workload: {
    patientsPerWeek: number
    hoursAvailable: number
  }
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
  ],
  upcomingAppointments: [
    {
      id: "appt-1",
      scheduledAt: "2026-04-12T14:30:00Z",
      department: "Cardiology",
      patientName: "Sara Ahmed",
      location: "ICARE-CVD Main Center (Room 2A)",
      status: "confirmed",
    },
    {
      id: "appt-2",
      scheduledAt: "2026-04-18T10:00:00Z",
      department: "Cardiology",
      patientName: "Omar Hassan",
      location: "ICARE-CVD Main Center (Room 2B)",
      status: "scheduled",
    },
    {
      id: "appt-3",
      scheduledAt: "2026-04-25T09:15:00Z",
      department: "Cardiology",
      patientName: "Laila Nasser",
      location: "ICARE-CVD Main Center (Room 2A)",
      status: "scheduled",
    },
  ],
  recentAlerts: [
    {
      id: "alert-1",
      label: "Blood Pressure",
      value: "138/88",
      severity: "high",
      patientName: "Sara Ahmed",
      at: "2026-04-02T09:30:00Z",
    },
    {
      id: "alert-2",
      label: "Heart Rate",
      value: "45",
      severity: "critical",
      patientName: "Omar Hassan",
      at: "2026-04-01T16:10:00Z",
    },
    {
      id: "alert-3",
      label: "SpO₂",
      value: "98",
      severity: "normal",
      patientName: "Laila Nasser",
      at: "2026-03-29T11:45:00Z",
    },
  ],
  workload: {
    patientsPerWeek: 42,
    hoursAvailable: 18,
  },
}

