"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import {
  ActivityIcon,
  DropletsIcon,
  FileTextIcon,
  GaugeIcon,
  HeartPulseIcon,
  PillIcon,
  ScaleIcon,
  SyringeIcon,
  ThermometerIcon,
  WindIcon,
} from "lucide-react"

import type {
  AssistantAppointmentRow,
  AssistantLabReportRow,
  AssistantPatientProfileTabId,
  AssistantPatientSummary,
  AssistantPrescriptionRow,
  AssistantVitalsHistoryRow,
  VitalSummaryCard,
} from "./assistantPatientProfile.types"

const PROFILE_TAB_IDS = [
  "overview",
  "clinical-notes",
  "lab-results",
  "imaging",
  "medications",
] as const satisfies readonly AssistantPatientProfileTabId[]

function buildMockPatient(patientId: string): AssistantPatientSummary {
  return {
    id: patientId,
    name: "Ahmed Mohammed",
    age: 58,
    gender: "Male",
    mrn: `MRN-${String(patientId).padStart(6, "0")}`,
    phone: "+20 123 456 7890",
    email: "ahmed.m@example.com",
    address: "Maadi, Cairo, Egypt",
    maritalStatus: "Married",
    occupation: "Civil Engineer",
    dateAdded: "Jan 15, 2024",
    condition: "Coronary Artery Disease",
    status: "In Treatment",
    riskLevel: "High Risk",
    bloodType: "O+",
    lastVisitDate: "May 02, 2026",
    lastVisitType: "Echocardiogram",
    primaryDoctor: "Dr. Sarah Jenkins",
    emergencyContact: { name: "Fatima Ali", relation: "Spouse", phone: "+20 100 234 5678" },
    insurance: { provider: "Allianz Egypt", policyNumber: "ALZ-987654321" },
    height: "175 cm",
    weight: "86.5 kg",
    bmi: "28.2",
    allergies: ["Penicillin", "Peanuts"],
    lifestyle: {
      smoking: { status: "Ex-smoker", detail: "Quit 2019", color: "text-[#8C3B3B]" },
      exercise: { status: "Low", detail: "Physical activity", color: "text-[#926020]" },
      diet: { status: "Moderate", detail: "Diet quality", color: "text-[#926020]" },
      alcohol: { status: "None", detail: "Alcohol", color: "text-[#1A5345]" },
      sleep: { status: "5-6 hrs", detail: "Sleep/night", color: "text-[#926020]" },
      stress: { status: "High", detail: "Stress level", color: "text-[#8C3B3B]" },
    },
    adherence: 85,
    riskScore: 78,
  }
}

const VITAL_SUMMARY_CARDS: VitalSummaryCard[] = [
  {
    label: "Blood pressure",
    value: "100/67",
    unit: "mmHg",
    icon: GaugeIcon,
    iconClass: "text-blue-600",
    status: "normal",
  },
  {
    label: "Heart rate",
    value: "89",
    unit: "bpm",
    icon: HeartPulseIcon,
    iconClass: "text-red-600",
    status: "normal",
  },
  {
    label: "SpO₂",
    value: "98",
    unit: "%",
    icon: DropletsIcon,
    iconClass: "text-emerald-600",
    status: "normal",
  },
  {
    label: "Temperature",
    value: "101.2",
    unit: "°F",
    icon: ThermometerIcon,
    iconClass: "text-red-600",
    status: "critical",
  },
  {
    label: "Respiratory rate",
    value: "24",
    unit: "rpm",
    icon: WindIcon,
    iconClass: "text-sky-600",
    status: "warning",
  },
  {
    label: "Weight",
    value: "100",
    unit: "kg",
    icon: ScaleIcon,
    iconClass: "text-orange-600",
    status: "normal",
  },
]

const PROFILE_TABS = [
  { id: "overview" as const, label: "Overview", icon: ActivityIcon },
  { id: "clinical-notes" as const, label: "Clinical Notes", icon: FileTextIcon },
  { id: "lab-results" as const, label: "Lab Results", icon: SyringeIcon },
  { id: "imaging" as const, label: "ECG & Imaging", icon: HeartPulseIcon },
  { id: "medications" as const, label: "Medications", icon: PillIcon },
]

type UseAssistantPatientProfilePageOpts = {
  /** From server `page.tsx` after `await params` (Next.js 16+). */
  routePatientId: string
}

export function useAssistantPatientProfilePage({ routePatientId }: UseAssistantPatientProfilePageOpts) {
  const patientId = routePatientId.trim() || "1"
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState<string>("overview")
  const [isAddVitalsOpen, setIsAddVitalsOpen] = useState(false)
  const [expandedLabId, setExpandedLabId] = useState<string | null>(null)
  const [selectedLabReport, setSelectedLabReport] = useState<AssistantLabReportRow | null>(null)
  const [selectedPrescription, setSelectedPrescription] = useState<AssistantPrescriptionRow | null>(null)
  const [vitalReadingDetail, setVitalReadingDetail] = useState<AssistantVitalsHistoryRow | null>(null)
  const [appointmentDetail, setAppointmentDetail] = useState<AssistantAppointmentRow | null>(null)

  const patient = useMemo(() => buildMockPatient(patientId), [patientId])

  useEffect(() => {
    const t = searchParams.get("tab")
    if (t && PROFILE_TAB_IDS.includes(t as AssistantPatientProfileTabId)) {
      setActiveTab(t)
    } else if (!t) {
      setActiveTab("overview")
    }
  }, [searchParams])

  const patientProfilePath = `/assistant-patients/${patientId}`
  const hubNavItems = useMemo(
    () =>
      [
        { key: "profile", label: "Profile", href: patientProfilePath },
        {
          key: "appointments",
          label: "Appointments",
          href: `${patientProfilePath}?view=appointments`,
        },
        { key: "vitals", label: "Vitals", href: `${patientProfilePath}?view=vitals` },
        {
          key: "visit-history",
          label: "Visit History",
          href: `${patientProfilePath}?view=visit-history`,
        },
        { key: "lab-results", label: "Lab Results", href: `${patientProfilePath}?view=lab-results` },
        { key: "prescription", label: "Prescription", href: `${patientProfilePath}?view=prescription` },
        {
          key: "medical-history",
          label: "Medical History",
          href: `${patientProfilePath}?view=medical-history`,
        },
        { key: "documents", label: "Documents", href: `${patientProfilePath}?view=documents` },
        { key: "insurance", label: "Insurance", href: `${patientProfilePath}?view=insurance` },
      ] as const,
    [patientProfilePath]
  )

  const hubViewParam = searchParams.get("view")
  const hubSoonViews = ["insurance"] as const
  const showHubSoon = hubSoonViews.some((v) => v === hubViewParam)

  const hubNavActive = (key: (typeof hubNavItems)[number]["key"]) => {
    const onPatientPage = pathname === patientProfilePath
    if (!onPatientPage) return false
    if (key === "profile") return !hubViewParam
    return hubViewParam === key
  }

  return {
    patientId,
    pathname,
    searchParams,
    patient,
    vitals: VITAL_SUMMARY_CARDS,
    tabs: PROFILE_TABS,
    patientProfilePath,
    hubNavItems,
    hubNavActive,
    hubViewParam,
    showHubSoon,
    activeTab,
    setActiveTab,
    isAddVitalsOpen,
    setIsAddVitalsOpen,
    expandedLabId,
    setExpandedLabId,
    selectedLabReport,
    setSelectedLabReport,
    selectedPrescription,
    setSelectedPrescription,
    vitalReadingDetail,
    setVitalReadingDetail,
    appointmentDetail,
    setAppointmentDetail,
  }
}
