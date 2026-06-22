import type { ProcedurePriority } from "./assistantProcedures.types"

export type ScheduledOperation = {
  id: string
  time?: string
  startTime: string
  endTime: string
  endTimeActual?: string
  endTimeExpected?: string
  patientName: string
  patientId: string
  patientAvatarUrl?: string | null
  age: number
  gender: "M" | "F"
  procedureName: string
  riskScore: string
  location: string
  riskTags: string[]
  duration: string
  status: "completed" | "pending" | "in-progress"
  priority: ProcedurePriority
  teamStatus: string
  notes?: string
  patientAvatarUrl?: string | null
}

export const MOCK_HISTORY_OPERATIONS: ScheduledOperation[] = [
  {
    id: "hist-1",
    startTime: "07:30",
    endTime: "09:45",
    endTimeActual: "09:45",
    patientName: "Khaled Mostafa",
    patientId: "CARD-00471",
    age: 63,
    gender: "M",
    procedureName: "CABG — Triple Vessel",
    riskScore: "EuroSCORE II: 4.2%",
    location: "Cardiac OR-1",
    riskTags: ["Shah Scale: Mid"],
    duration: "2h 15m",
    status: "completed",
    priority: "urgent",
    teamStatus: "Started Early",
    notes: "Successful outcome",
  },
  {
    id: "hist-2",
    startTime: "10:00",
    endTime: "11:30",
    endTimeActual: "11:30",
    patientName: "Sarah Ahmed Najar",
    patientId: "CARD-00389",
    age: 58,
    gender: "F",
    procedureName: "TAVI — Aortic Valve Replacement",
    riskScore: "EuroSCORE II: 3.1%",
    location: "Hybrid Lab",
    riskTags: ["Shah Scale: Low"],
    duration: "1h 30m",
    status: "completed",
    priority: "normal",
    teamStatus: "On Schedule",
    notes: "No complications",
  },
  {
    id: "hist-3",
    startTime: "14:00",
    endTime: "16:30",
    endTimeActual: "16:15",
    patientName: "Ahmed Hassan Ibrahim",
    patientId: "CARD-00234",
    age: 71,
    gender: "M",
    procedureName: "PCI — Left Main Stenting",
    riskScore: "EuroSCORE II: 5.5%",
    location: "Cath Lab",
    riskTags: ["Shah Scale: High"],
    duration: "2h 15m",
    status: "completed",
    priority: "emergency",
    teamStatus: "Completed Early",
  },
  {
    id: "hist-4",
    startTime: "09:00",
    endTime: "12:00",
    endTimeActual: "12:30",
    patientName: "Nadia Mahmoud",
    patientId: "CARD-00156",
    age: 55,
    gender: "F",
    procedureName: "MVR — Mitral Valve Repair",
    riskScore: "EuroSCORE II: 6.2%",
    location: "Cardiac OR-2",
    riskTags: ["Shah Scale: Mid"],
    duration: "3h 30m",
    status: "completed",
    priority: "urgent",
    teamStatus: "Ran Late",
    notes: "Complex anatomy",
  },
  {
    id: "hist-5",
    startTime: "08:00",
    endTime: "10:00",
    endTimeActual: "09:45",
    patientName: "Youssef Kamal",
    patientId: "CARD-00567",
    age: 48,
    gender: "M",
    procedureName: "Pacemaker Implantation",
    riskScore: "EuroSCORE II: 1.8%",
    location: "Cardiac OR-1",
    riskTags: ["Shah Scale: Low"],
    duration: "1h 45m",
    status: "completed",
    priority: "normal",
    teamStatus: "On Schedule",
  },
  {
    id: "hist-6",
    startTime: "11:00",
    endTime: "14:00",
    endTimeActual: "13:30",
    patientName: "Laila Farouk",
    patientId: "CARD-00678",
    age: 62,
    gender: "F",
    procedureName: "AVR — Aortic Valve Replacement",
    riskScore: "EuroSCORE II: 7.1%",
    location: "Cardiac OR-2",
    riskTags: ["Shah Scale: High"],
    duration: "2h 30m",
    status: "completed",
    priority: "urgent",
    teamStatus: "Completed Early",
  },
]
