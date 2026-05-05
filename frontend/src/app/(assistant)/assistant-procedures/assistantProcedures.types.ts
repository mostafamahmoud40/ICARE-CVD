export type ProcedureOrderStatus = "pending" | "in-progress" | "completed"

export type ProcedurePriority = "normal" | "urgent" | "emergency"

export type ProcedureFilter = "all" | ProcedureOrderStatus

export type ProcedureRequirement = {
  id: string
  title: string
  description: string | null
  allowsAttachment: boolean
  dueAt?: string | null
  isDone: boolean
  completedAt: string | null
  attachmentUrl: string | null
  attachmentName: string | null
}

export type ProcedureOrder = {
  id: string
  patientId: string
  patientName: string
  patientAge: number
  patientPhone: string | null
  doctorName: string
  department: string
  procedureName: string
  scheduledAt: string | null
  status: ProcedureOrderStatus
  priority: ProcedurePriority
  notes: string | null
  requirements: ProcedureRequirement[]
  createdAt: string
}

export type ProcedureStats = {
  total: number
  pending: number
  inProgress: number
  completed: number
}
