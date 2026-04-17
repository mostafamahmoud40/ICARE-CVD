import type { ConsultationsData, VisitSummary, ConsultationStats } from "./consultations.types"

const visitsData: VisitSummary[] = [
  {
    id: "visit-001",
    date: "April 14, 2026",
    doctor: {
      name: "Dr. Sarah Johnson",
      specialty: "Cardiology",
    },
    status: "completed",
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
      { name: "Metoprolol 100 mg", dosage: "100 mg", schedule: "Morning & evening · Ongoing", status: "increased", note: "Dose increased from 50mg", icon: "blue" },
      { name: "Aspirin 75 mg", dosage: "75 mg", schedule: "Morning · Ongoing", status: "ongoing", note: "No change", icon: "red" },
      { name: "Atorvastatin 20 mg", dosage: "20 mg", schedule: "Evening · Ongoing", status: "ongoing", note: "No change", icon: "green" },
    ],
    followUpInstructions: [
      { title: "Measure BP twice daily", description: "Log readings in the app every morning and evening", status: "pending" },
      { title: "Renal function panel", description: "Order blood test within the next 5 days", status: "pending" },
      { title: "Next visit", description: "April 28, 2026 — in 2 weeks", status: "scheduled", date: "April 28, 2026" },
    ],
    previousVisits: [],
    aiNote: "Your BP has been trending upward over the past 4 weeks. The dose increase in Metoprolol should help — it's important to take it consistently, especially the evening dose which you missed several times recently. If you feel dizziness or your heart rate drops below 60, contact the clinic immediately.",
  },
  {
    id: "visit-002",
    date: "March 12, 2026",
    doctor: {
      name: "Dr. Sarah Johnson",
      specialty: "Cardiology",
    },
    status: "completed",
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
    followUpInstructions: [
      { title: "Continue BP monitoring", description: "Keep daily BP log", status: "completed" },
      { title: "Next visit", description: "April 14, 2026", status: "scheduled", date: "April 14, 2026" },
    ],
    previousVisits: [],
    aiNote: "Patient adherence to medication has been good. BP readings show stable trend. Recommend continuing lifestyle modifications including low sodium diet.",
  },
  {
    id: "visit-003",
    date: "February 3, 2026",
    doctor: {
      name: "Dr. Sarah Johnson",
      specialty: "Cardiology",
    },
    status: "completed",
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
    followUpInstructions: [
      { title: "ECG monitoring", description: "No immediate action needed", status: "completed" },
      { title: "Next visit", description: "March 12, 2026", status: "scheduled", date: "March 12, 2026" },
    ],
    previousVisits: [],
    aiNote: "ECG patterns remain consistent with previous readings. No concerning arrhythmias detected. Heart rate variability is within normal limits.",
  },
  {
    id: "visit-004",
    date: "January 10, 2026",
    doctor: {
      name: "Dr. Sarah Johnson",
      specialty: "Cardiology",
    },
    status: "completed",
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
    followUpInstructions: [
      { title: "Home BP monitoring", description: "Start twice daily BP checks", status: "completed" },
      { title: "Lifestyle changes", description: "Reduce sodium intake, increase exercise", status: "pending" },
      { title: "Next visit", description: "February 3, 2026", status: "scheduled", date: "February 3, 2026" },
    ],
    previousVisits: [],
    aiNote: "First BP management visit. Patient shows good understanding of condition. High likelihood of success with medication adherence and lifestyle changes.",
  },
]

export const mockVisitData: ConsultationsData = {
  visits: visitsData,
  totalCount: visitsData.length,
}

export const mockStats: ConsultationStats = {
  totalVisits: 4,
  completedVisits: 4,
  upcomingVisits: 0,
  thisMonthVisits: 1,
}

export function getVisitById(id: string): VisitSummary | undefined {
  return visitsData.find(visit => visit.id === id)
}
