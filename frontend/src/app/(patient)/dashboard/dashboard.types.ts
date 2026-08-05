export type CareTimelineItemKind = "follow_up" | "lab_order" | "appointment" | "test_order"

export type CareTimelineTestType =
  | "blood"
  | "imaging"
  | "ecg"
  | "echocardiogram"
  | "holter_monitor"
  | "stress_test"
  | "nuclear_stress_test"
  | "ct_coronary_angiography"
  | "cardiac_mri"
  | "cardiac_catheterization"
  | "carotid_doppler"
  | "tilt_table_test"
  | "pulmonary_function"
  | "sleep_study"
  | "urinalysis"
  | "other"

export type CareTimelineItemStatus = "pending" | "scheduled" | "completed" | "missing"

export type CareTimelineItem = {
  id: string
  kind: CareTimelineItemKind
  testType?: CareTimelineTestType
  title: string
  detail: string
  dueAt: string
  status: CareTimelineItemStatus
  doctorName?: string
  href?: string
  urgent?: boolean
}

export type PatientInfo = {
  id: string
  fullName: string
  age?: number
}

export type VitalRangeStatus = "normal" | "warning" | "critical"

export type Vital = {
  id: string
  label: string
  value: string
  unit?: string
  reference?: string
  status?: VitalRangeStatus
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

export type MedicationStatus = "taken" | "due" | "missed"

export type MedicationTime = "Morning" | "Afternoon" | "Evening" | "Night"

export type MedicationAdherenceDay = {
  date: string
  taken: boolean
}

export type Medication = {
  id: string
  name: string
  dosage: string
  frequency: string
  timeOfDay: MedicationTime
  lastTakenAt?: string
  status: MedicationStatus
  adherenceHistory: boolean[] // last 7 days
  dueAt?: string
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
  careTimeline: CareTimelineItem[]
}
