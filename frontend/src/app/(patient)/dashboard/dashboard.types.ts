export type PatientInfo = {
  id: string
  fullName: string
  age?: number
}

export type Vital = {
  id: string
  label: string
  value: string
  unit?: string
  reference?: string
  lastMeasuredAt: string
}

export type AppointmentStatus = "scheduled" | "confirmed" | "completed"

export type Appointment = {
  id: string
  scheduledAt: string
  department: string
  clinician: string
  location: string
  status: AppointmentStatus
}

export type Medication = {
  id: string
  name: string
  dosage: string
  frequency: string
  lastTakenAt?: string
}

export type PatientDashboardData = {
  patient: PatientInfo
  lastVitalsAt: string
  vitals: Vital[]
  upcomingAppointments: Appointment[]
  medications: Medication[]
  careSummary: {
    lastCheckUpAt: string
    nextFollowUpAt: string
    planNote: string
  }
}
