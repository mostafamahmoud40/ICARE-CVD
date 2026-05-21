import type { QueuePatient } from "../assistantQueue.types"
import { formatShortDate, formatShortTime } from "../assistantQueue.liveBoard"

export function exportPastVisitsCsv(patients: QueuePatient[], filename = "past-visits.csv") {
  const headers = [
    "Patient",
    "Status",
    "Doctor",
    "Department",
    "Scheduled date",
    "Scheduled time",
    "Completed at",
    "Visit type",
    "Condition",
    "Phone",
  ]
  const rows = patients.map((p) => [
    p.fullName,
    p.status,
    p.assignedDoctor,
    p.assignedDoctorDepartment,
    formatShortDate(p.scheduledTime),
    formatShortTime(p.scheduledTime),
    p.completedAt ? `${formatShortDate(p.completedAt)} ${formatShortTime(p.completedAt)}` : "",
    p.visitType,
    p.condition,
    p.phoneNumber,
  ])
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
