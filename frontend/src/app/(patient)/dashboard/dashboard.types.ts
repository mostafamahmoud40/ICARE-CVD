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

export const mockPatientDashboard: PatientDashboardData = {
  patient: {
    id: "PT-1842",
    fullName: "Sara Ahmed",
    age: 29,
  },
  lastVitalsAt: "2026-04-02T09:30:00Z",
  vitals: [
    {
      id: "heart_rate",
      label: "Heart Rate",
      value: "78",
      unit: "bpm",
      reference: "60–100",
      lastMeasuredAt: "2026-04-02T09:30:00Z",
    },
    {
      id: "blood_pressure",
      label: "Blood Pressure",
      value: "118/76",
      reference: "< 120/80",
      lastMeasuredAt: "2026-04-02T09:30:00Z",
    },
    {
      id: "spo2",
      label: "SpO₂",
      value: "98",
      unit: "%",
      reference: "95–100",
      lastMeasuredAt: "2026-04-02T09:30:00Z",
    },
    {
      id: "temperature",
      label: "Temperature",
      value: "36.7",
      unit: "°C",
      reference: "36.1–37.2",
      lastMeasuredAt: "2026-04-02T09:30:00Z",
    },
  ],
  upcomingAppointments: [
    {
      id: "appt-1",
      scheduledAt: "2026-04-12T14:30:00Z",
      department: "Cardiology",
      clinician: "Dr. Hossam El-Sayed",
      location: "ICARE-CVD Main Center (Room 2A)",
      status: "confirmed",
    },
    {
      id: "appt-2",
      scheduledAt: "2026-04-25T09:00:00Z",
      department: "Nutrition Clinic",
      clinician: "Dr. Mai Ramadan",
      location: "ICARE-CVD Main Center (Room 4C)",
      status: "scheduled",
    },
    {
      id: "appt-3",
      scheduledAt: "2026-05-02T11:15:00Z",
      department: "General Follow-up",
      clinician: "Dr. Youssef Ibrahim",
      location: "ICARE-CVD Main Center (Room 1B)",
      status: "scheduled",
    },
  ],
  medications: [
    {
      id: "med-1",
      name: "Atorvastatin",
      dosage: "20 mg",
      frequency: "Once daily",
      lastTakenAt: "2026-04-02T20:10:00Z",
    },
    {
      id: "med-2",
      name: "Metformin",
      dosage: "500 mg",
      frequency: "Twice daily",
      lastTakenAt: "2026-04-02T20:10:00Z",
    },
    {
      id: "med-3",
      name: "Vitamin D3",
      dosage: "1000 IU",
      frequency: "Once weekly",
    },
  ],
  careSummary: {
    lastCheckUpAt: "2026-04-02T09:30:00Z",
    nextFollowUpAt: "2026-04-12T14:30:00Z",
    planNote:
      "Keep monitoring vitals at home. Bring recent measurements to your next appointment for better adjustments.",
  },
}

