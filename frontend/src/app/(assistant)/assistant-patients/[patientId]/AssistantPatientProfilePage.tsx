"use client"

import type { AssistantPatientProfilePageState } from "./useAssistantPatientProfilePage"
import { AddVitalsDialog } from "./AddVitalsDialog"
import { AssistantPatientAiSummaryCard } from "./AssistantPatientAiSummaryCard"
import { AssistantPatientProfileHeader } from "./AssistantPatientProfileHeader"
import { AssistantPatientProfileHubBody } from "./AssistantPatientProfileHubBody"

type AssistantPatientProfilePageProps = AssistantPatientProfilePageState

export function AssistantPatientProfilePage(props: AssistantPatientProfilePageProps) {
  const { patient, hubNavItems, hubNavActive, isAddVitalsOpen, ...hubBodyProps } = props

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#F9F8F5] animate-in fade-in duration-500">
      <AssistantPatientProfileHeader
        patient={patient}
        hubNavItems={hubNavItems}
        hubNavActive={hubNavActive}
      />

      <div className="relative flex-1 overflow-y-auto custom-scrollbar">
        <AssistantPatientAiSummaryCard />
        <AssistantPatientProfileHubBody patient={patient} {...hubBodyProps} />
      </div>

      <AddVitalsDialog open={isAddVitalsOpen} onOpenChange={props.setIsAddVitalsOpen} />
    </div>
  )
}
