export type VisitType = "clinic" | "virtual"

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled"

export type TimeSlot = {
  time: string
  available: boolean
  recommended?: boolean
  label?: string
}

export type DayOption = {
  day: string
  date: number
  disabled?: boolean
}

export type DoctorInfo = {
  id: string
  name: string
  title: string
  rating: number
  specialties: { icon: string; label: string; color: "primary" | "secondary" }[]
  experience: string
}

export type Attachment = {
  id: string
  name: string
  url: string
  type: string
}

export type Appointment = {
  id: string
  confirmationCode: string
  scheduledAt: string
  department: string
  clinician: string
  location: string
  locationDetail?: string
  status: AppointmentStatus
  notes?: string
  symptoms?: string
  attachments?: Attachment[]
  visitType: VisitType
}

export type FilterTab = "all" | "upcoming" | "past" | "cancelled"

export type FeeRow = {
  label: string
  amount: string
  highlight?: boolean
  icon?: string
}

export type AppointmentsPageData = {
  doctors: DoctorInfo[]
  selectedDoctor: DoctorInfo
  days: DayOption[]
  timeSlots: TimeSlot[]
  appointments: Appointment[]
  upcoming: Appointment[]
  past: Appointment[]
  fees: FeeRow[]
  monthLabel: string
  aiTipTitle: string
  aiTipBody: string
}
