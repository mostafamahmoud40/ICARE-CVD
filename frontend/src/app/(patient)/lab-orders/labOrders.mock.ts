import type { PatientLabOrder } from "./labOrders.types"

export const mockPatientLabOrders: PatientLabOrder[] = [
  {
    id: "lo-001",
    title: "Lipid panel & HbA1c",
    tests: ["Total Cholesterol", "LDL", "HDL", "Triglycerides", "HbA1c", "Fasting glucose"],
    orderedAt: "2026-06-17T10:00:00Z",
    dueAt: "2026-06-19T23:59:00Z",
    doctorName: "Dr. Mahmoud",
    status: "ordered",
    notes: "Fasting 8–12 hours before blood draw.",
    priority: "routine",
  },
  {
    id: "lo-002",
    title: "Renal function panel",
    tests: ["Serum creatinine", "BUN", "eGFR"],
    orderedAt: "2026-06-10T14:30:00Z",
    dueAt: "2026-06-15T23:59:00Z",
    doctorName: "Dr. Sarah Johnson",
    status: "missing",
    notes: "Complete before next cardiology dose adjustment.",
    priority: "urgent",
  },
  {
    id: "lo-003",
    title: "Thyroid panel",
    tests: ["TSH", "Free T4"],
    orderedAt: "2026-05-20T09:00:00Z",
    dueAt: "2026-05-28T23:59:00Z",
    doctorName: "Dr. Mahmoud",
    status: "uploaded",
    priority: "routine",
  },
]
