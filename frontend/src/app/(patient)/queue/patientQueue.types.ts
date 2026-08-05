export type PatientQueueStatus =
  | "scheduled"
  | "arrived"
  | "waiting"
  | "in-consultation"
  | "completed"
  | "no-show"
  | "cancelled"

export type PatientVisitStageStatus = "done" | "in-progress" | "pending"

export type PatientVisitStage = {
  id: string
  title: string
  detail: string
  status: PatientVisitStageStatus
  timeLabel?: string
  locationLabel?: string
}

export type PatientQueueInstructionIcon = "shield" | "file" | "clock" | "heart"

export type PatientQueueInstruction = {
  id: string
  icon: PatientQueueInstructionIcon
  title: string
  body: string
}

export type PatientQueuePageContext = {
  clinicName: string
  departmentLabel: string
  fileNumber: string
  genderLabel: string
  age: number
}

export type PatientQueueVisit = {
  queueEntryId: string
  status: PatientQueueStatus
  scheduledTime: string
  doctorName: string
  doctorTitle: string | null
  department: string
  roomNumber: string | null
  doctorLocationDetail: string | null
  /** Ticket currently being served */
  nowCallingNumber: number | null
  /** Patient's ticket number */
  yourTurnNumber: number | null
  /** Approximate count of patients ahead */
  peopleAhead: number | null
  estimatedWaitMin: number | null
  averageExamMin: number | null
  estimatedFinishTime: string | null
  callingLocationLabel: string | null
  /** Ticket numbers removed from today's queue (e.g. cancelled visit). Strip shows them as "Cancelled". */
  cancelledTicketNumbers?: number[]
  arrivedAt: string | null
  waitingSince: string | null
  startedAt: string | null
  completedAt: string | null
  visitTypeLabel: string
  stages?: PatientVisitStage[]
  instructions?: PatientQueueInstruction[]
  alertsNote?: string | null
}

export type PatientQueueTodayResponse = {
  visit: PatientQueueVisit | null
  /** Header context; optional — UI falls back when missing */
  page?: PatientQueuePageContext | null
}
