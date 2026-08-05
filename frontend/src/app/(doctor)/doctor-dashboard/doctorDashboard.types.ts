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
