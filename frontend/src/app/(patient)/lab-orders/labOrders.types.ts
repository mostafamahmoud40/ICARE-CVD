export type PatientLabOrderStatus = "ordered" | "uploaded" | "missing" | "cancelled"

export type PatientLabOrder = {
  id: string
  title: string
  tests: string[]
  orderedAt: string
  dueAt: string
  doctorName: string
  status: PatientLabOrderStatus
  notes?: string
  priority: "routine" | "urgent" | "stat"
}
