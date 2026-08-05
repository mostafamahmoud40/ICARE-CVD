import type { ConsultationsData, VisitSummary } from "./consultations.types"
import { computeConsultationStats } from "./consultations.utils"

const visitsData: VisitSummary[] = [
  {
    id: "visit-001",
    scheduledAt: "2026-04-14T10:30:00",
    visitType: "clinic",
    visitTitle: "Cardiology visit",
    doctor: {
      name: "Dr. Sarah Johnson",
      specialty: "Cardiology",
    },
    recordStatus: "report-ready",
    vitals: [
      { label: "Blood pressure", value: "142/88", unit: "", status: "elevated", note: "Elevated" },
      { label: "Heart rate", value: "78", unit: "bpm", status: "normal", note: "Normal" },
      { label: "Weight", value: "84", unit: "kg", status: "normal", note: "+1kg since last visit" },
      { label: "SpO2", value: "97", unit: "%", status: "normal", note: "Normal" },
    ],
    doctorNotes: "You came in with increased shortness of breath over the past week, especially during physical activity. No chest pain was reported. Your blood pressure has been elevated based on your home readings.",
    diagnosis: {
      tags: [
        { label: "Hypertensive urgency", variant: "urgency" },
        { label: "Stable CAD", variant: "stable" },
      ],
      description: "Your blood pressure is not well controlled with the current medication dose. The doctor will adjust your Metoprolol dosage.",
    },
    medications: [
      {
        name: "Metoprolol",
        dosage: "100 mg",
        schedule: "Morning & evening",
        status: "increased",
        note: "Dose increased from 50 mg",
        icon: "blue",
      },
      {
        name: "Spironolactone",
        dosage: "25 mg",
        schedule: "Morning · with food",
        status: "new",
        note: "Started at this visit",
        icon: "yellow",
      },
      {
        name: "Aspirin",
        dosage: "75 mg",
        schedule: "Morning",
        status: "ongoing",
        note: "No change",
        icon: "red",
      },
      {
        name: "Atorvastatin",
        dosage: "20 mg",
        schedule: "Evening",
        status: "ongoing",
        icon: "green",
      },
      {
        name: "Amlodipine",
        dosage: "5 mg",
        schedule: "Was taken once daily before this visit",
        status: "discontinued",
        note: "Stopped — blood pressure now managed with Metoprolol dose increase",
        icon: "blue",
      },
      {
        name: "Hydrochlorothiazide",
        dosage: "12.5 mg",
        schedule: "Previously morning only",
        status: "discontinued",
        note: "Stopped — you had been on this for 8 months",
        icon: "green",
      },
    ],
    orders: [
      {
        id: "o-001-1",
        kind: "self_care",
        title: "Measure BP twice daily",
        detail: "Log readings in the app every morning and evening",
        status: "pending",
      },
      {
        id: "o-001-2",
        kind: "lab",
        title: "Renal function panel",
        detail: "Blood test at the lab — bring this visit summary if asked",
        status: "pending",
        dueDate: "April 19, 2026",
      },
      {
        id: "o-001-3",
        kind: "referral",
        title: "Nephrology consultation",
        specialty: "Nephrology",
        referredDoctor: "Dr. Ahmed Hassan",
        detail: "Review kidney function before the next cardiology dose adjustment",
        status: "pending",
        urgency: "routine",
      },
      {
        id: "o-001-4",
        kind: "appointment",
        title: "Cardiology follow-up",
        detail: "In-clinic review with Dr. Sarah Johnson",
        status: "scheduled",
        dueDate: "April 28, 2026",
      },
    ],
    previousVisits: [],
    aiNote: "Your BP has been trending upward over the past 4 weeks. The dose increase in Metoprolol should help — it's important to take it consistently, especially the evening dose which you missed several times recently. If you feel dizziness or your heart rate drops below 60, contact the clinic immediately.",
  },
  {
    id: "visit-002",
    scheduledAt: "2026-03-12T09:00:00",
    visitType: "virtual",
    visitTitle: "Cardiology visit",
    doctor: {
      name: "Dr. Sarah Johnson",
      specialty: "Cardiology",
    },
    recordStatus: "updated",
    vitals: [
      { label: "Blood pressure", value: "138/85", unit: "", status: "elevated", note: "Slightly elevated" },
      { label: "Heart rate", value: "76", unit: "bpm", status: "normal", note: "Normal" },
      { label: "Weight", value: "83", unit: "kg", status: "normal", note: "Stable" },
      { label: "SpO2", value: "98", unit: "%", status: "normal", note: "Normal" },
    ],
    doctorNotes: "Routine follow-up visit. Patient reports feeling well overall. Blood pressure slightly elevated but stable. Continue current medication regimen.",
    diagnosis: {
      tags: [
        { label: "Stable CAD", variant: "stable" },
        { label: "Hypertension", variant: "stable" },
      ],
      description: "Stable condition. Continue monitoring BP at home. Patient should maintain current medication schedule.",
    },
    medications: [
      { name: "Metoprolol 50 mg", dosage: "50 mg", schedule: "Morning & evening · Ongoing", status: "ongoing", note: "No change", icon: "blue" },
      { name: "Aspirin 75 mg", dosage: "75 mg", schedule: "Morning · Ongoing", status: "ongoing", note: "No change", icon: "red" },
    ],
    orders: [
      {
        id: "o-002-1",
        kind: "self_care",
        title: "Daily BP log",
        detail: "Continue home monitoring until your next visit",
        status: "completed",
      },
      {
        id: "o-002-2",
        kind: "appointment",
        title: "Cardiology follow-up",
        detail: "Video visit with Dr. Sarah Johnson",
        status: "scheduled",
        dueDate: "April 14, 2026",
      },
    ],
    previousVisits: [],
    aiNote: "Patient adherence to medication has been good. BP readings show stable trend. Recommend continuing lifestyle modifications including low sodium diet.",
  },
  {
    id: "visit-003",
    scheduledAt: "2026-02-03T14:15:00",
    visitType: "clinic",
    visitTitle: "Cardiology visit",
    doctor: {
      name: "Dr. Sarah Johnson",
      specialty: "Cardiology",
    },
    recordStatus: "report-ready",
    vitals: [
      { label: "Blood pressure", value: "135/82", unit: "", status: "elevated", note: "Stable" },
      { label: "Heart rate", value: "72", unit: "bpm", status: "normal", note: "Normal" },
      { label: "Weight", value: "82", unit: "kg", status: "normal", note: "Stable" },
      { label: "SpO2", value: "97", unit: "%", status: "normal", note: "Normal" },
    ],
    doctorNotes: "ECG review completed. No significant changes from previous ECG. Rhythm remains regular. Patient denies chest pain or palpitations.",
    diagnosis: {
      tags: [
        { label: "Sinus rhythm", variant: "stable" },
        { label: "CAD stable", variant: "stable" },
      ],
      description: "ECG shows stable sinus rhythm. No acute changes. Continue current management plan.",
    },
    medications: [
      { name: "Metoprolol 50 mg", dosage: "50 mg", schedule: "Morning & evening · Ongoing", status: "ongoing", note: "No change", icon: "blue" },
    ],
    orders: [
      {
        id: "o-003-1",
        kind: "imaging",
        title: "ECG on file",
        detail: "No repeat ECG needed before the next visit",
        status: "completed",
      },
      {
        id: "o-003-2",
        kind: "appointment",
        title: "Cardiology follow-up",
        detail: "Routine in-clinic visit",
        status: "scheduled",
        dueDate: "March 12, 2026",
      },
    ],
    previousVisits: [],
    aiNote: "ECG patterns remain consistent with previous readings. No concerning arrhythmias detected. Heart rate variability is within normal limits.",
  },
  {
    id: "visit-004",
    scheduledAt: "2026-01-10T11:00:00",
    visitType: "virtual",
    visitTitle: "Cardiology visit",
    doctor: {
      name: "Dr. Sarah Johnson",
      specialty: "Cardiology",
    },
    recordStatus: "pending-report",
    vitals: [
      { label: "Blood pressure", value: "140/88", unit: "", status: "elevated", note: "Elevated" },
      { label: "Heart rate", value: "74", unit: "bpm", status: "normal", note: "Normal" },
      { label: "Weight", value: "82", unit: "kg", status: "normal", note: "Stable" },
      { label: "SpO2", value: "98", unit: "%", status: "normal", note: "Normal" },
    ],
    doctorNotes: "Initial visit for BP management. Patient reports occasional headaches and mild fatigue. Home BP readings consistently elevated at 140/90 or higher.",
    diagnosis: {
      tags: [
        { label: "Stage 1 Hypertension", variant: "urgency" },
        { label: "CAD", variant: "stable" },
      ],
      description: "BP management initiated. Started on Metoprolol 50mg twice daily. Patient educated on home BP monitoring and lifestyle modifications.",
    },
    medications: [
      { name: "Metoprolol 50 mg", dosage: "50 mg", schedule: "Morning & evening · New", status: "new", note: "New prescription", icon: "blue" },
    ],
    orders: [
      {
        id: "o-004-1",
        kind: "self_care",
        title: "Home BP monitoring",
        detail: "Start twice-daily checks and log in the app",
        status: "completed",
      },
      {
        id: "o-004-2",
        kind: "self_care",
        title: "Lifestyle plan",
        detail: "Reduce sodium intake and add light exercise 3× per week",
        status: "pending",
      },
      {
        id: "o-004-3",
        kind: "appointment",
        title: "Cardiology follow-up",
        detail: "Video visit to review BP trends",
        status: "scheduled",
        dueDate: "February 3, 2026",
      },
    ],
    previousVisits: [],
    aiNote: "First BP management visit. Patient shows good understanding of condition. High likelihood of success with medication adherence and lifestyle changes.",
  },
]

export const mockVisitData: ConsultationsData = {
  visits: visitsData,
  totalCount: visitsData.length,
}

export const mockStats = computeConsultationStats(visitsData)

export function getVisitById(id: string): VisitSummary | undefined {
  return visitsData.find(visit => visit.id === id)
}
