import type {
  DayOption,
  DoctorInfo,
  FeeRow,
  TimeSlot,
  VisitType,
} from "../appointments/appointments.types"
import type { Doctor, DoctorVisitChannels } from "./doctorDirectory.types"

export type DoctorBookingPageData = {
  doctor: Doctor
  selectedDoctor: DoctorInfo
  allowedVisitTypes: VisitType[]
  days: DayOption[]
  timeSlotsByDate: Record<string, TimeSlot[]>
  fees: FeeRow[]
  monthLabel: string
  aiTipTitle: string
  aiTipBody: string
}

export type { DoctorVisitChannels }
