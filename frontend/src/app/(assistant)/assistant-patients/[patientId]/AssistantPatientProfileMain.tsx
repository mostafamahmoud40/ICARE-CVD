"use client"

import type { LucideIcon } from "lucide-react"
import type {
  AssistantPatientProfileTabId,
  AssistantPatientSummary,
  VitalSummaryCard,
} from "./assistantPatientProfile.types"
import { AssistantPatientProfileDashboard } from "./AssistantPatientProfileDashboard"
import { AssistantPatientProfileSidebar } from "./AssistantPatientProfileSidebar"

type ProfileTab = {
  id: AssistantPatientProfileTabId
  label: string
  icon: LucideIcon
}

type AssistantPatientProfileMainProps = {
  patient: AssistantPatientSummary
  vitals: VitalSummaryCard[]
  tabs: ProfileTab[]
  activeTab: AssistantPatientProfileTabId
  onActiveTabChange: (tab: AssistantPatientProfileTabId) => void
  patientId: string
}

export function AssistantPatientProfileMain({
  patient,
  vitals,
  tabs,
  activeTab,
  onActiveTabChange,
  patientId,
}: AssistantPatientProfileMainProps) {
  return (
    <div className="flex w-full flex-col gap-8 px-8 py-8 lg:flex-row">
      <AssistantPatientProfileSidebar patient={patient} />
      <AssistantPatientProfileDashboard
        patient={patient}
        vitals={vitals}
        tabs={tabs}
        activeTab={activeTab}
        onActiveTabChange={onActiveTabChange}
        patientId={patientId}
      />
    </div>
  )
}
