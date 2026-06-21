"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import {
  ActivityIcon,
  FileTextIcon,
  HeartPulseIcon,
  PillIcon,
  SyringeIcon,
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
import { useAssistantPatientRecord } from "../useAssistantPatientRecord"
import { emptyHubMessage } from "../assistantPatientProfile.mapper"

const PROFILE_TAB_IDS = [
  "overview",
  "clinical-notes",
  "lab-results",
  "imaging",
  "medications",
] as const satisfies readonly AssistantPatientProfileTabId[]

const PROFILE_TABS = [
  { id: "overview" as const, label: "Overview", icon: ActivityIcon },
  { id: "clinical-notes" as const, label: "Clinical Notes", icon: FileTextIcon },
  { id: "lab-results" as const, label: "Lab Results", icon: SyringeIcon },
  { id: "imaging" as const, label: "ECG & Imaging", icon: HeartPulseIcon },
  { id: "medications" as const, label: "Medications", icon: PillIcon },
]

const FALLBACK_PATIENT: AssistantPatientSummary = {
  id: "",
  avatarUrl: null,
  name: "Loading…",
  age: 0,
  gender: "—",
  mrn: "—",
  phone: "—",
  email: "—",
  address: "—",
  maritalStatus: "—",
  occupation: "—",
  dateAdded: "—",
  condition: "—",
  status: "—",
  riskLevel: "—",
  bloodType: "—",
  lastVisitDate: "—",
  lastVisitType: "—",
  primaryDoctor: "—",
  emergencyContact: { name: "—", relation: "—", phone: "—" },
  insurance: { provider: "—", policyNumber: "—" },
  height: "—",
  weight: "—",
  bmi: "—",
  allergies: [],
  lifestyle: {
    smoking: { status: "—", detail: "Smoking status", color: "text-[#6B7870]" },
    exercise: { status: "—", detail: "Physical activity", color: "text-[#6B7870]" },
    diet: { status: "—", detail: "Diet quality", color: "text-[#6B7870]" },
    alcohol: { status: "—", detail: "Alcohol", color: "text-[#6B7870]" },
    sleep: { status: "—", detail: "Sleep/night", color: "text-[#6B7870]" },
    stress: { status: "—", detail: "Stress level", color: "text-[#6B7870]" },
  },
  adherence: 0,
  riskScore: 0,
}

type UseAssistantPatientProfilePageOpts = {
  routePatientId: string
}

export function useAssistantPatientProfilePage({ routePatientId }: UseAssistantPatientProfilePageOpts) {
  const patientId = routePatientId.trim()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const record = useAssistantPatientRecord(patientId)

  const [activeTab, setActiveTab] = useState<string>("overview")
  const [isAddVitalsOpen, setIsAddVitalsOpen] = useState(false)
  const [expandedLabId, setExpandedLabId] = useState<string | null>(null)
  const [selectedLabReport, setSelectedLabReport] = useState<AssistantLabReportRow | null>(null)
  const [selectedPrescription, setSelectedPrescription] = useState<AssistantPrescriptionRow | null>(null)
  const [vitalReadingDetail, setVitalReadingDetail] = useState<AssistantVitalsHistoryRow | null>(null)
  const [appointmentDetail, setAppointmentDetail] = useState<AssistantAppointmentRow | null>(null)

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
    [patientProfilePath],
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

  const patient = record.patient ?? FALLBACK_PATIENT
  const vitals: VitalSummaryCard[] = record.vitals ?? []
  const appointments = record.appointments ?? []
  const visitHistory = record.visitHistory ?? []
  const labResults = record.labResults ?? []
  const prescriptions = record.prescriptions ?? []
  const vitalsHistory = record.vitalsHistory ?? []
  const vitalsTrend = record.vitalsTrend ?? []
  const medicalHistory = record.medicalHistory ?? {
    conditions: [],
    surgeries: [],
    allergies: [],
    familyHistory: [],
  }
  const documents = record.documents ?? []

  return {
    patientId,
    pathname,
    searchParams,
    patient,
    vitals,
    appointments,
    visitHistory,
    labResults,
    prescriptions,
    vitalsHistory,
    vitalsTrend,
    medicalHistory,
    documents,
    emptyHubMessage,
    isRecordLoading: record.isLoading,
    isRecordError: record.isError,
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
