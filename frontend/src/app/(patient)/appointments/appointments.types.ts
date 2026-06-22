export type VisitType = "clinic" | "virtual"

/** Booking lifecycle status shown in the appointments list (not clinical report status). */
export type AppointmentBookingStatus =
  | "upcoming"
  | "completed"
  | "cancelled"
  | "no-show"
  | "rescheduled"

/** Who initiated cancellation (patient self-service vs clinical staff). */
export type AppointmentCancelledBy = "patient" | "doctor" | "clinic"

export type TimeSlot = {
  time: string
  available: boolean
  recommended?: boolean
  label?: string
}

export type DayOption = {
  day: string
  date: number
  fullDate: string
  disabled?: boolean
  label?: string
}

export type DoctorInfo = {
  id: string
  name: string
  title: string
  rating: number
  specialties: { icon: string; label: string; color: "primary" | "secondary" }[]
  experience: string
  avatarUrl?: string
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
  reason?: string
  clinician: string
  clinicianAvatarUrl?: string | null
  location: string
  locationDetail?: string
  status: AppointmentBookingStatus
  /** New slot after reschedule (shown when status is rescheduled). */
  rescheduledTo?: string
  cancellationReason?: string
  cancelledBy?: AppointmentCancelledBy
  cancelledAt?: string
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
  selectedDoctor: DoctorInfo | null
  days: DayOption[]
  timeSlotsByDate: Record<string, TimeSlot[]>
  appointments: Appointment[]
  upcoming: Appointment[]
  past: Appointment[]
  fees: FeeRow[]
  monthLabel: string
  aiTipTitle: string
  aiTipBody: string
}
