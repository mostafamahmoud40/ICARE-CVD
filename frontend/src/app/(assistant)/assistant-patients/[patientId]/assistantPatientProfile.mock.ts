import {
  ActivityIcon,
  DropletsIcon,
  FileTextIcon,
  PillIcon,
  SyringeIcon,
  VideoIcon,
} from "lucide-react"

import type {
  ActiveMedicationAssistant,
  AssistantAppointmentRow,
  AssistantLabReportRow,
  AssistantPrescriptionRow,
  AssistantVitalsHistoryRow,
  AssistantVitalsTrendPoint,
  AssistantVisitHistoryRow,
  PastMedicationRow,
} from "./assistantPatientProfile.types"

export const MOCK_ACTIVE_MEDICATIONS_ASSISTANT: ActiveMedicationAssistant[] = [
  {
    id: "rx-atorva",
    name: "Atorvastatin",
    strength: "40 mg • Tablet",
    frequencyLabel: "Once daily",
    timesOfDay: ["22:00"],
    withFood: "Any time; patient usually with a light evening snack.",
    instructionPatient: "Take 1 tablet daily at bedtime.",
    adherencePct: 92,
    adherenceBarClass: "bg-emerald-500",
    adherenceTextClass: "text-emerald-600",
    supply: { variant: "warning", label: "Refill in 5 days" },
    Icon: PillIcon,
    details: {
      prescriber: "Dr. Sarah Jenkins",
      startedOn: "Jan 8, 2025",
      sigSummary: "40 mg PO qHS × 90 days",
      quantity: "90 tablets",
      refillsRemaining: 2,
    },
  },
  {
    id: "rx-metop",
    name: "Metoprolol",
    strength: "50 mg • Ext. release",
    frequencyLabel: "Once daily",
    timesOfDay: ["08:00"],
    withFood: "With breakfast (within 30 min of meal).",
    instructionPatient: "Take 1 tablet daily with food.",
    adherencePct: 85,
    adherenceBarClass: "bg-emerald-500",
    adherenceTextClass: "text-emerald-600",
    supply: { variant: "ok", label: "24 days supply left" },
    Icon: PillIcon,
    details: {
      prescriber: "Dr. Sarah Jenkins",
      startedOn: "Nov 2, 2025",
      sigSummary: "50 mg PO qAM with food × 30 days",
      quantity: "30 tablets",
      refillsRemaining: 5,
    },
  },
  {
    id: "rx-enox",
    name: "Enoxaparin",
    strength: "40 mg • Subcutaneous injection",
    frequencyLabel: "Once daily",
    timesOfDay: ["09:00"],
    withFood: "Not required; rotate abdomen injection sites.",
    instructionPatient: "Inject 1 prefilled syringe daily.",
    adherencePct: 60,
    adherenceBarClass: "bg-amber-500",
    adherenceTextClass: "text-amber-600",
    supply: { variant: "ok", label: "60 days supply left" },
    Icon: SyringeIcon,
    details: {
      prescriber: "Dr. Andrew Clark",
      startedOn: "Dec 1, 2026",
      sigSummary: "40 mg SQ daily × 14 (teaching done)",
      quantity: "14 syringes",
      refillsRemaining: 0,
    },
  },
]

export const MOCK_PAST_MEDICATIONS: PastMedicationRow[] = [
  {
    id: "past-aspirin",
    name: "Aspirin",
    strength: "81 mg • Tablet",
    kind: "discontinued",
    endedOn: "Mar 12, 2024",
    note: "Stopped when antiplatelet therapy was revised by cardiology.",
  },
  {
    id: "past-lisinopril",
    name: "Lisinopril",
    strength: "10 mg • Tablet",
    kind: "completed",
    endedOn: "Aug 3, 2025",
    note: "Planned course completed; blood pressure stable on current regimen.",
  },
]

export const MOCK_APPOINTMENTS: AssistantAppointmentRow[] = [
  {
    id: "app-1",
    date: "May 12, 2026",
    time: "10:00 AM - 10:30 AM",
    doctor: {
      name: "Dr. Sarah Jenkins",
      department: "Cardiology Dept.",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=SarahJenkins&backgroundColor=e8e6e0",
    },
    status: "Upcoming",
    type: "Follow-up Visit",
    /** Virtual (telehealth) vs in-person at the clinic */
    visitMode: "video" as const,
    bookedBy: "Patient App",
  },
  {
    id: "app-2",
    date: "April 05, 2026",
    time: "02:15 PM - 03:00 PM",
    doctor: {
      name: "Dr. Andrew Clark",
      department: "Cardiology Dept.",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=AndrewClark&backgroundColor=e8e6e0",
    },
    status: "Completed",
    type: "Routine Checkup",
    visitMode: "in_clinic" as const,
    bookedBy: "Clinic Reception",
  },
  {
    id: "app-3",
    date: "February 18, 2026",
    time: "11:00 AM - 11:45 AM",
    doctor: {
      name: "Dr. Emily Chen",
      department: "Endocrinology",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=EmilyChen&backgroundColor=e8e6e0",
    },
    status: "Canceled",
    type: "Consultation",
    visitMode: "in_clinic" as const,
    bookedBy: "Assistant (System)",
  },
]

export const MOCK_VITALS_HISTORY: AssistantVitalsHistoryRow[] = [
  {
    id: "vh-1",
    date: "May 02, 2026",
    time: "09:45 AM",
    bp: "120/80",
    hr: "72",
    temp: "36.8",
    spo2: "98",
    weight: "82.0",
    glucose: "95",
    takenBy: "Asst. Maria",
  },
  {
    id: "vh-2",
    date: "April 28, 2026",
    time: "10:15 AM",
    bp: "128/84",
    hr: "78",
    temp: "37.1",
    spo2: "97",
    weight: "82.5",
    glucose: "105",
    takenBy: "Asst. Maria",
  },
  {
    id: "vh-3",
    date: "April 15, 2026",
    time: "11:30 AM",
    bp: "118/76",
    hr: "68",
    temp: "36.6",
    spo2: "99",
    weight: "81.8",
    glucose: "92",
    takenBy: "Dr. Sarah",
  },
]

export const MOCK_VITALS_TREND: AssistantVitalsTrendPoint[] = [
  { month: "Jan", systolic: 134, diastolic: 86 },
  { month: "Feb", systolic: 130, diastolic: 84 },
  { month: "Mar", systolic: 126, diastolic: 82 },
  { month: "Apr", systolic: 128, diastolic: 84 },
  { month: "May", systolic: 120, diastolic: 80 },
]

export const MOCK_VISIT_HISTORY: AssistantVisitHistoryRow[] = [
  {
    id: "vhist-1",
    date: "May 02, 2026",
    timeAgo: "7 days ago",
    year: "2026",
    type: "Cardiology",
    doctor: {
      name: "Dr. Sarah Jenkins",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Sarah&backgroundColor=e8e6e0",
      department: "Cardiology",
    },
    summary: "Routine follow-up. Stable angina, no new symptoms. BP slightly low — medication dose reviewed. Stress test ordered.",
    tags: [
      { label: "Rx updated", icon: PillIcon, color: "text-red-600 bg-red-50 border-red-100" },
      { label: "Clinical note", icon: FileTextIcon, color: "text-slate-600 bg-slate-50 border-slate-200" }
    ],
    status: "Completed",
  },
  {
    id: "vhist-2",
    date: "Jan 15, 2026",
    timeAgo: "4 months ago",
    year: "2026",
    type: "Radiology",
    doctor: {
      name: "Dr. Laura Mitchell",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Laura&backgroundColor=e8e6e0",
      department: "Radiology",
    },
    summary: "Chest X-ray + Echo. Mild LV hypertrophy noted. No significant change vs. prior imaging.",
    tags: [
      { label: "Chest X-ray", icon: ActivityIcon, color: "text-blue-600 bg-blue-50 border-blue-100" },
      { label: "Echo report", icon: VideoIcon, color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
      { label: "Radiology report", icon: FileTextIcon, color: "text-slate-600 bg-slate-50 border-slate-200" }
    ],
    status: "Completed",
  },
  {
    id: "vhist-3",
    date: "Oct 10, 2025",
    timeAgo: "7 months ago",
    year: "2025",
    type: "Lab",
    doctor: {
      name: "Dr. Sarah Jenkins",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Sarah&backgroundColor=e8e6e0",
      department: "Cardiology",
    },
    summary: "Lipid panel + CBC + HbA1c. LDL elevated at 142 mg/dL — statin dose increased. HbA1c 5.9% borderline.",
    tags: [
      { label: "Lipid panel", icon: DropletsIcon, color: "text-purple-600 bg-purple-50 border-purple-100" },
      { label: "CBC", icon: ActivityIcon, color: "text-blue-600 bg-blue-50 border-blue-100" },
      { label: "HbA1c", icon: ActivityIcon, color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
      { label: "Rx updated", icon: PillIcon, color: "text-red-600 bg-red-50 border-red-100" }
    ],
    status: "Completed",
  },
  {
    id: "vhist-4",
    date: "Nov 05, 2024",
    timeAgo: "18 months ago",
    year: "2024",
    type: "Cardiology",
    doctor: {
      name: "Dr. Sarah Jenkins",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Sarah&backgroundColor=e8e6e0",
      department: "Cardiology",
    },
    summary: "Annual review. Stable. BP controlled. Weight up 3kg since last visit — dietitian referral placed.",
    tags: [
      { label: "Lipid panel", icon: DropletsIcon, color: "text-purple-600 bg-purple-50 border-purple-100" },
      { label: "Clinical note", icon: FileTextIcon, color: "text-slate-600 bg-slate-50 border-slate-200" },
      { label: "Rx unchanged", icon: PillIcon, color: "text-emerald-600 bg-emerald-50 border-emerald-100" }
    ],
    status: "Completed",
  },
]

export const MOCK_LAB_RESULTS: AssistantLabReportRow[] = [
  {
    id: "lab-1",
    date: "May 02, 2026",
    title: "Lipid Profile",
    category: "Biochemistry",
    doctor: {
      name: "Dr. Sarah Jenkins",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Sarah&backgroundColor=e8e6e0",
      department: "Cardiology",
    },
    tests: [
      { name: "Total Cholesterol", value: "185", unit: "mg/dL", range: "125 - 200", status: "normal" },
      { name: "LDL Cholesterol", value: "112", unit: "mg/dL", range: "0 - 100", status: "high" },
      { name: "HDL Cholesterol", value: "52", unit: "mg/dL", range: "40 - 60", status: "normal" },
      { name: "Triglycerides", value: "145", unit: "mg/dL", range: "0 - 150", status: "normal" },
    ]
  },
  {
    id: "lab-2",
    date: "April 20, 2026",
    title: "HbA1c & Blood Glucose",
    category: "Diabetic Panel",
    doctor: {
      name: "Dr. Sarah Jenkins",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Sarah&backgroundColor=e8e6e0",
      department: "Cardiology",
    },
    tests: [
      { name: "HbA1c", value: "5.8", unit: "%", range: "4.0 - 5.6", status: "high" },
      { name: "Fasting Glucose", value: "98", unit: "mg/dL", range: "70 - 100", status: "normal" },
    ]
  },
  {
    id: "lab-3",
    date: "March 15, 2026",
    title: "Complete Blood Count (CBC)",
    category: "Hematology",
    doctor: {
      name: "Dr. Mike Ross",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Mike&backgroundColor=e8e6e0",
      department: "ER",
    },
    tests: [
      { name: "Hemoglobin", value: "14.2", unit: "g/dL", range: "13.5 - 17.5", status: "normal" },
      { name: "White Blood Cells", value: "6.8", unit: "x10^9/L", range: "4.5 - 11.0", status: "normal" },
      { name: "Platelets", value: "245", unit: "x10^9/L", range: "150 - 450", status: "normal" },
    ]
  }
]

export const MOCK_PRESCRIPTIONS: AssistantPrescriptionRow[] = [
  {
    id: "pres-1",
    date: "May 15, 2026",
    status: "active",
    doctor: {
      name: "Dr. Sarah Jenkins",
      department: "Cardiology",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Sarah",
    },
    medications: [
      { name: "Atorvastatin", dosage: "20mg", frequency: "Once daily", duration: "3 months", quantity: "90 Tabs", instructions: "Take before bedtime" },
      { name: "Aspirin", dosage: "75mg", frequency: "Once daily", duration: "Ongoing", quantity: "30 Tabs", instructions: "Take after breakfast" },
    ]
  },
  {
    id: "pres-1-extra",
    date: "May 15, 2026",
    status: "active",
    doctor: {
      name: "Dr. Andrew Clark",
      department: "Internal Medicine",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Andrew",
    },
    medications: [
      { name: "Vitamin D3", dosage: "1000 IU", frequency: "Once daily", duration: "Ongoing", quantity: "60 Tabs", instructions: "Take with fat-containing meal" },
    ]
  },
  {
    id: "pres-2",
    date: "Feb 10, 2026",
    status: "completed",
    doctor: {
      name: "Dr. James Wilson",
      department: "General Medicine",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=James",
    },
    medications: [
      { name: "Amoxicillin", dosage: "500mg", frequency: "Three times daily", duration: "7 days", quantity: "21 Caps", instructions: "Finish the entire course" },
    ]
  },
  {
    id: "pres-3",
    date: "Dec 05, 2025",
    status: "active",
    doctor: {
      name: "Dr. Sarah Jenkins",
      department: "Cardiology",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Sarah",
    },
    medications: [
      { name: "Lisinopril", dosage: "10mg", frequency: "Once daily", duration: "6 months", quantity: "180 Tabs", instructions: "Monitor blood pressure" },
    ]
  }
]
