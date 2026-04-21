"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { useConsultationPanelWidths } from "./usePanelResize"
import type { ConsultationData, DiagnosisEntry, PrescriptionEntry, TestOrder, HomeMeasurement, VitalSigns, PhysicalExamFindings, AISuggestion } from "./consultation.types"
import { mockConsultationData } from "./consultation.mock"
import { PatientSidebar } from "./PatientSidebar"
import { VitalsSection } from "./VitalsSection"
import { ChiefComplaintSection } from "./ChiefComplaintSection"
import { PhysicalExamSection } from "./PhysicalExamSection"
import { DiagnosisSection } from "./DiagnosisSection"
import { PrescriptionsSection } from "./PrescriptionsSection"
import { ClinicalNotesSection } from "./ClinicalNotesSection"
import { FollowUpSection } from "./FollowUpSection"
import { TestsAndMeasurementsSection } from "./TestsAndMeasurementsSection"
import { AIAssistantPanel } from "./AIAssistantPanel"
import { ConsultationFloatingPatientQueryBar } from "./ConsultationFloatingPatientQueryBar"
import { PatientBriefingAgent, BriefingAgentChip } from "./PatientBriefingAgent"
import { Button } from "@/components/ui/button"
import {
  CheckCircle2Icon,
  SaveIcon,
  StethoscopeIcon,
} from "lucide-react"

export function ConsultationPage() {
  const [data, setData] = useState<ConsultationData>(mockConsultationData)
  const [isPatientSidebarCollapsed, setIsPatientSidebarCollapsed] = useState(false)
  const [isAiPanelCollapsed, setIsAiPanelCollapsed] = useState(false)
  const [showBriefing, setShowBriefing] = useState(true)
  const [showBriefingChip, setShowBriefingChip] = useState(false)
  const {
    patientSidebarWidth,
    aiPanelWidth,
    onPatientResizePointerDown,
    onAiResizePointerDown,
    nudgePatient,
    nudgeAi,
  } = useConsultationPanelWidths()

  const updateVitals = (key: keyof VitalSigns, value: string) => {
    setData((prev) => ({ ...prev, vitals: { ...prev.vitals, [key]: value } as VitalSigns }))
  }

  const updateExam = (key: keyof PhysicalExamFindings, value: string) => {
    setData((prev) => ({ ...prev, physicalExam: { ...prev.physicalExam, [key]: value } as PhysicalExamFindings }))
  }

  const addDiagnosis = (entry: DiagnosisEntry) => {
    setData((prev) => ({ ...prev, diagnoses: [...prev.diagnoses, entry] }))
  }

  const removeDiagnosis = (id: string) => {
    setData((prev) => ({ ...prev, diagnoses: prev.diagnoses.filter((d) => d.id !== id) }))
  }

  const addPrescription = (entry: PrescriptionEntry) => {
    setData((prev) => ({ ...prev, prescriptions: [...prev.prescriptions, entry] }))
  }

  const removePrescription = (id: string) => {
    setData((prev) => ({ ...prev, prescriptions: prev.prescriptions.filter((p) => p.id !== id) }))
  }

  const addTestOrder = (entry: TestOrder) => {
    setData((prev) => ({ ...prev, testOrders: [...prev.testOrders, entry] }))
  }

  const removeTestOrder = (id: string) => {
    setData((prev) => ({ ...prev, testOrders: prev.testOrders.filter((t) => t.id !== id) }))
  }

  const addHomeMeasurement = (entry: HomeMeasurement) => {
    setData((prev) => ({ ...prev, homeMeasurements: [...prev.homeMeasurements, entry] }))
  }

  const removeHomeMeasurement = (id: string) => {
    setData((prev) => ({ ...prev, homeMeasurements: prev.homeMeasurements.filter((m) => m.id !== id) }))
  }

  const acceptSuggestion = (id: string) => {
    setData((prev) => ({
      ...prev,
      aiSuggestions: prev.aiSuggestions.map((s) =>
        s.id === id ? { ...s, accepted: true } : s,
      ),
    }))
  }

  const dismissSuggestion = (id: string) => {
    setData((prev) => ({
      ...prev,
      aiSuggestions: prev.aiSuggestions.map((s) =>
        s.id === id ? { ...s, accepted: false } : s,
      ),
    }))
  }

  const dismissBriefing = () => {
    setShowBriefing(false)
    setShowBriefingChip(true)
  }

  const reopenBriefing = () => {
    setShowBriefingChip(false)
    setShowBriefing(true)
  }

  return (
    <div className="relative flex h-[calc(100vh-4rem)] flex-col bg-[#F9F8F5]">
      {/* AI Patient Briefing Agent */}
      <PatientBriefingAgent
        summary={data.patientSummary}
        visible={showBriefing}
        onDismiss={dismissBriefing}
      />
      {showBriefingChip && <BriefingAgentChip onClick={reopenBriefing} />}

      {/* 3-column body */}
      <div className="flex flex-1 overflow-hidden">
        <PatientSidebar
          demographics={data.patientSummary.demographics}
          allergies={data.patientSummary.allergies}
          activeMedications={data.patientSummary.activeMedications}
          familyHistory={data.patientSummary.familyHistory}
          lifestyleFlags={data.patientSummary.lifestyleFlags}
          existingConditions={data.patientSummary.existingConditions}
          patientProfileHref={`/doctor-patients/${data.patientId}`}
          collapsed={isPatientSidebarCollapsed}
          onToggle={() => setIsPatientSidebarCollapsed((prev) => !prev)}
          widthPx={patientSidebarWidth}
          onNudgeWidth={nudgePatient}
        />

        {!isPatientSidebarCollapsed ? (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize patient summary panel"
            onPointerDown={onPatientResizePointerDown}
            className={cn(
              "group relative w-2 shrink-0 cursor-col-resize select-none touch-none",
              "hover:bg-[#1A5345]/10 active:bg-[#1A5345]/15",
            )}
          >
            <div className="pointer-events-none mx-auto h-full w-px bg-[#E8E6E0] group-hover:bg-[#1A5345]/35" />
          </div>
        ) : null}

        {/* Center: Consultation workflow */}
        <div className="scrollbar-hide relative flex-1 overflow-y-auto">
          {/* Top bar - sticky inside scrollable area */}
          <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-transparent px-4 py-2 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#1A5345]">
                <StethoscopeIcon className="size-4 text-white" />
              </div>
              <div>
                <h2 className="text-[14px] font-bold text-[#1A1F1E]">New Consultation</h2>
                <p className="text-[11px] text-muted-foreground">
                  {data.patientSummary.demographics.fullName} &middot; {data.patientSummary.demographics.age} yrs &middot;{" "}
                  <span className="capitalize">{data.patientSummary.demographics.gender}</span>
                </p>
              </div>
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-medium text-amber-600">
                In Progress
              </span>
            </div>
          </div>

          <div className="mx-auto max-w-[900px] space-y-5 p-5 pb-28">
            <VitalsSection 
              vitals={data.vitals} 
              onVitalChange={updateVitals} 
              patientAge={data.patientSummary.demographics.age} 
            />

            <ChiefComplaintSection
              complaint={data.chiefComplaint}
              onComplaintChange={(v) => setData((prev) => ({ ...prev, chiefComplaint: v }))}
              structuredComplaint={data.structuredComplaint}
              onStructuredComplaintChange={(v) => setData((prev) => ({ ...prev, structuredComplaint: v }))}
            />

            <PhysicalExamSection exam={data.physicalExam} onExamChange={updateExam} />

            <DiagnosisSection
              diagnoses={data.diagnoses}
              onAddDiagnosis={addDiagnosis}
              onRemoveDiagnosis={removeDiagnosis}
            />

            <PrescriptionsSection
              prescriptions={data.prescriptions}
              onAddPrescription={addPrescription}
              onRemovePrescription={removePrescription}
            />

            <TestsAndMeasurementsSection
              testOrders={data.testOrders}
              onAddTestOrder={addTestOrder}
              onRemoveTestOrder={removeTestOrder}
              homeMeasurements={data.homeMeasurements}
              onAddMeasurement={addHomeMeasurement}
              onRemoveMeasurement={removeHomeMeasurement}
            />

            <ClinicalNotesSection
              clinicalNotes={data.clinicalNotes}
              onClinicalNotesChange={(v) => setData((prev) => ({ ...prev, clinicalNotes: v }))}
              assessmentAndPlan={data.assessmentAndPlan}
              onAssessmentAndPlanChange={(v) => setData((prev) => ({ ...prev, assessmentAndPlan: v }))}
            />

            <FollowUpSection
              followUpDate={data.followUpDate}
              onFollowUpDateChange={(v) => setData((prev) => ({ ...prev, followUpDate: v }))}
              followUpNotes={data.followUpNotes}
              onFollowUpNotesChange={(v) => setData((prev) => ({ ...prev, followUpNotes: v }))}
            />

            {/* Action Buttons - Bottom of page */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E8E6E0]">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 border border-[#E5EEEA] bg-white text-[12px] hover:bg-[#E8F0EE] hover:text-[#1A5345]"
              >
                <SaveIcon className="size-3.5" />
                Save Draft
              </Button>
              <Button
                size="sm"
                className="gap-1.5 border border-white/20 bg-[#1A5345]/80 text-[12px] hover:bg-[#1A5345] backdrop-blur-sm"
              >
                <CheckCircle2Icon className="size-3.5" />
                Complete & Sign
              </Button>
            </div>
          </div>
        </div>

        {!isAiPanelCollapsed ? (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize AI assistant panel"
            onPointerDown={onAiResizePointerDown}
            className={cn(
              "group relative w-2 shrink-0 cursor-col-resize select-none touch-none",
              "hover:bg-[#1A5345]/10 active:bg-[#1A5345]/15",
            )}
          >
            <div className="pointer-events-none mx-auto h-full w-px bg-[#E8E6E0] group-hover:bg-[#1A5345]/35" />
          </div>
        ) : null}

        <AIAssistantPanel
          suggestions={data.aiSuggestions}
          onAcceptSuggestion={acceptSuggestion}
          onDismissSuggestion={dismissSuggestion}
          collapsed={isAiPanelCollapsed}
          onToggle={() => setIsAiPanelCollapsed((prev) => !prev)}
          widthPx={aiPanelWidth}
          onNudgeWidth={nudgeAi}
        />
      </div>

      <ConsultationFloatingPatientQueryBar data={data} />
    </div>
  )
}
