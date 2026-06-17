export type ProcedureOrderStatus = "pending" | "in-progress" | "completed"

export type ProcedurePriority = "normal" | "urgent" | "emergency"

export type ProcedureFilter = "all" | ProcedureOrderStatus

export type ProcedureRequirementKind = "standard" | "consent"

export type ConsentSignerType = "patient" | "guardian"

export type ConsentCollectionMethod = "signature" | "upload"

export type ProcedureConsent = {
  requirementId: string
  signerType: ConsentSignerType
  signerName: string
  guardianRelationship: string | null
  collectionMethod: ConsentCollectionMethod
  signatureDataUrl: string | null
  attachmentUrl: string | null
  attachmentName: string | null
  signedAt: string
}

export type ProcedureRequirement = {
  id: string
  title: string
  description: string | null
  kind?: ProcedureRequirementKind
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
  consent: ProcedureConsent | null
  createdAt: string
}

export type ProcedureStats = {
  total: number
  pending: number
  inProgress: number
  completed: number
}
