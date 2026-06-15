"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { useConsultationPanelWidths } from "./usePanelResize"
import type {
  ConsultationData,
  ConsultationMedicalHistory,
  ConsultationVitalReading,
  DiagnosisEntry,
  PrescriptionEntry,
  TestOrder,
  HomeMeasurement,
  VitalSigns,
  PhysicalExamFindings,
  ProcedureDetails,
  Allergy,
  ExistingCondition,
} from "./consultation.types"
import { mockConsultationData } from "./consultation.mock"
import { PatientSidebar } from "./PatientSidebar"
import { VitalsSection } from "./VitalsSection"
import { MedicalHistorySection } from "./MedicalHistorySection"
import { ProceduresSection } from "./ProceduresSection"
import { ChiefComplaintSection } from "./ChiefComplaintSection"
import { PhysicalExamSection } from "./PhysicalExamSection"
import { DiagnosisSection } from "./DiagnosisSection"
import { PrescriptionsSection } from "./PrescriptionsSection"
import { ClinicalNotesSection } from "./ClinicalNotesSection"
import { FollowUpSection } from "./FollowUpSection"
import { TestsAndMeasurementsSection } from "./TestsAndMeasurementsSection"
import { CTScanSection } from "./CTScanSection"
import { XrayScanSection } from "./XrayScanSection"
import { EchoVideoSection } from "./EchoVideoSection"
import { CineMRISection } from "./CineMRISection"
import { EcgSection } from "./EcgSection"
import { EcgRagSection } from "./EcgRagSection"
import { LabMaterialsSection } from "./LabMaterialsSection"
import type { LabMaterialFile } from "./consultation.types"
import { AIAssistantPanel } from "./AIAssistantPanel"
import { ConsultationFloatingPatientQueryBar } from "./ConsultationFloatingPatientQueryBar"
import { ConsultationVoiceDictationErrorProvider } from "./ConsultationVoiceDictationErrorContext"
import { useLocalStorageState } from "./useLocalStorageState"
import { PatientBriefingAgent, BriefingAgentChip } from "./PatientBriefingAgent"
import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  CheckCircle2Icon,
  SaveIcon,
  StethoscopeIcon,
} from "lucide-react"

export function ConsultationPage() {
  const [data, setData] = useState<ConsultationData>(mockConsultationData)
  const [ctFile, setCtFile] = useState<File | null>(null)
  const [xrayFile, setXrayFile] = useState<File | null>(null)
  const [echoFile, setEchoFile] = useState<File | null>(null)
  const [mriEdFile, setMriEdFile] = useState<File | null>(null)
  const [mriEsFile, setMriEsFile] = useState<File | null>(null)
  const [ecgHeaFile, setEcgHeaFile] = useState<File | null>(null)
  const [ecgDatFile, setEcgDatFile] = useState<File | null>(null)
  // EcgRagSection manages its own file state independently
  const [labMaterials, setLabMaterials] = useState<LabMaterialFile[]>([])
  const [isPatientSidebarCollapsed, setIsPatientSidebarCollapsed] = useLocalStorageState("consultation-patient-sidebar-collapsed", false)
  const [isAiPanelCollapsed, setIsAiPanelCollapsed] = useLocalStorageState("consultation-ai-panel-collapsed", false)
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

  const applyLastVitalReading = (reading: ConsultationVitalReading) => {
    setData((prev) => ({
      ...prev,
      vitals: {
        systolicBP: reading.systolicBP != null ? String(reading.systolicBP) : prev.vitals.systolicBP,
        diastolicBP: reading.diastolicBP != null ? String(reading.diastolicBP) : prev.vitals.diastolicBP,
        heartRate: reading.heartRate != null ? String(reading.heartRate) : prev.vitals.heartRate,
        temperature: reading.temperature != null ? String(reading.temperature) : prev.vitals.temperature,
        respiratoryRate:
          reading.respiratoryRate != null ? String(reading.respiratoryRate) : prev.vitals.respiratoryRate,
        oxygenSaturation:
          reading.oxygenSaturation != null ? String(reading.oxygenSaturation) : prev.vitals.oxygenSaturation,
        heightCm: reading.heightCm != null ? String(reading.heightCm) : prev.vitals.heightCm,
        weightKg: reading.weight != null ? String(reading.weight) : prev.vitals.weightKg,
      },
    }))
  }

  const updateMedicalHistory = (next: ConsultationMedicalHistory) => {
    setData((prev) => ({ ...prev, medicalHistory: next }))
  }

  const updateAllergies = (next: Allergy[]) => {
    setData((prev) => ({
      ...prev,
      patientSummary: { ...prev.patientSummary, allergies: next },
    }))
  }

  const updateChronicConditions = (next: ExistingCondition[]) => {
    setData((prev) => ({
      ...prev,
      patientSummary: { ...prev.patientSummary, existingConditions: next },
    }))
  }

  const updateExam = (key: keyof PhysicalExamFindings, value: string) => {
    setData((prev) => ({ ...prev, physicalExam: { ...prev.physicalExam, [key]: value } as PhysicalExamFindings }))
  }

  const updateProcedureDetails = <K extends keyof ProcedureDetails>(
    key: K,
    value: ProcedureDetails[K],
  ) => {
    setData((prev) => ({
      ...prev,
      procedureDetails: { ...prev.procedureDetails, [key]: value },
    }))
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

  const addLabMaterials = (files: File[]) => {
    setLabMaterials((prev) => [
      ...prev,
      ...files.map((file) => ({ id: crypto.randomUUID(), file })),
    ])
  }

  const removeLabMaterial = (id: string) => {
    setLabMaterials((prev) => prev.filter((item) => item.id !== id))
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

  const briefingTrendData = [
    { visitLabel: "V1", systolic: 158, diastolic: 98, hba1c: 8.1 },
    { visitLabel: "V2", systolic: 151, diastolic: 94, hba1c: 7.8 },
    { visitLabel: "V3", systolic: 145, diastolic: 91, hba1c: 7.5 },
    { visitLabel: "V4", systolic: 139, diastolic: 87, hba1c: 7.2 },
  ] as const

  const briefingVisitStats = {
    totalVisitsLast6Months: 4,
    followUpAdherencePercent: 88,
    medicationAdherencePercent: 84,
    adherenceNarrative:
      "Medication adherence is moderate-to-good at 84%, but there has been a noticeable decline since the last 8 weeks. Main gaps are evening doses and weekend consistency, especially for antihypertensive and diabetes medications. Patient is generally compliant on weekdays but needs reinforcement for routine continuity.",
  } as const

  const briefingVitalProgressData = [
    { visitLabel: "V1", sbp: 158, dbp: 98, hr: 88, spo2: 94 },
    { visitLabel: "V2", sbp: 151, dbp: 94, hr: 84, spo2: 95 },
    { visitLabel: "V3", sbp: 145, dbp: 91, hr: 81, spo2: 96 },
    { visitLabel: "V4", sbp: 139, dbp: 87, hr: 78, spo2: 97 },
  ] as const

  const medicationAdherenceTrendData = [
    { visitLabel: "V1", adherence: 74, target: 90 },
    { visitLabel: "V2", adherence: 79, target: 90 },
    { visitLabel: "V3", adherence: 82, target: 90 },
    { visitLabel: "V4", adherence: 84, target: 90 },
  ] as const

  const medicationMissedBreakdownData = [
    { medication: "Amlodipine", missedPercent: 18 },
    { medication: "Metformin", missedPercent: 22 },
    { medication: "Atorvastatin", missedPercent: 12 },
    { medication: "Aspirin", missedPercent: 10 },
  ] as const

  return (
    <TooltipProvider delay={300}>
      <ConsultationVoiceDictationErrorProvider>
        <div className="relative flex h-[calc(100vh-4rem)] flex-col bg-[#F9F8F5]">
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
                <h2 className="font-serif text-[17px] font-bold text-[#1A1F1E]">New Consultation</h2>
                <p className="text-[13px] text-muted-foreground">
                  {data.patientSummary.demographics.fullName} &middot; {data.patientSummary.demographics.age} yrs &middot;{" "}
                  <span className="capitalize">{data.patientSummary.demographics.gender}</span>
                </p>
              </div>
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[12px] font-medium text-amber-600">
                In Progress
              </span>
            </div>
            <div className="relative shrink-0">
              {showBriefingChip && <BriefingAgentChip onClick={reopenBriefing} />}
              <PatientBriefingAgent
                summary={data.patientSummary}
                visible={showBriefing}
                onDismiss={dismissBriefing}
                trendData={[...briefingTrendData]}
                visitStats={briefingVisitStats}
                vitalProgressData={[...briefingVitalProgressData]}
                medicationAdherenceTrendData={[...medicationAdherenceTrendData]}
                medicationMissedBreakdownData={[...medicationMissedBreakdownData]}
              />
            </div>
          </div>

          <div className="mx-auto max-w-[900px] space-y-5 p-5 pb-28">
            <VitalsSection 
              vitals={data.vitals} 
              onVitalChange={updateVitals}
              onApplyLastReading={applyLastVitalReading}
              lastVitalReading={data.lastVitalReading}
              patientAge={data.patientSummary.demographics.age} 
            />

            <MedicalHistorySection
              medicalHistory={data.medicalHistory}
              onMedicalHistoryChange={updateMedicalHistory}
              chronicConditions={data.patientSummary.existingConditions}
              onChronicConditionsChange={updateChronicConditions}
              allergies={data.patientSummary.allergies}
              onAllergiesChange={updateAllergies}
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
              patientSummary={data.patientSummary}
              structuredComplaint={data.structuredComplaint}
            />

            <TestsAndMeasurementsSection
              testOrders={data.testOrders}
              onAddTestOrder={addTestOrder}
              onRemoveTestOrder={removeTestOrder}
              homeMeasurements={data.homeMeasurements}
              onAddMeasurement={addHomeMeasurement}
              onRemoveMeasurement={removeHomeMeasurement}
            />

            <LabMaterialsSection
              items={labMaterials}
              onAdd={addLabMaterials}
              onRemove={removeLabMaterial}
            />

            <CTScanSection ctFile={ctFile} onCtFileChange={setCtFile} />

            <XrayScanSection xrayFile={xrayFile} onXrayFileChange={setXrayFile} />

            <EchoVideoSection echoFile={echoFile} onEchoFileChange={setEchoFile} />

            <CineMRISection
              edFile={mriEdFile}
              onEdFileChange={setMriEdFile}
              esFile={mriEsFile}
              onEsFileChange={setMriEsFile}
            />

            <EcgSection
              heaFile={ecgHeaFile}
              datFile={ecgDatFile}
              onHeaFileChange={setEcgHeaFile}
              onDatFileChange={setEcgDatFile}
            />

            {/* EcgRagSection is fully self-contained with its own file upload */}
            <EcgRagSection />

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

            <ProceduresSection
              details={data.procedureDetails}
              onDetailsChange={updateProcedureDetails}
            />

            {/* Action Buttons - Bottom of page */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E8E6E0]">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 border border-[#E5EEEA] bg-white text-[14px] hover:bg-[#E8F0EE] hover:text-[#1A5345]"
              >
                <SaveIcon className="size-3.5" />
                Save Draft
              </Button>
              <Button
                size="sm"
                className="gap-1.5 border border-white/20 bg-[#1A5345]/80 text-[14px] hover:bg-[#1A5345] backdrop-blur-sm"
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
      </ConsultationVoiceDictationErrorProvider>
    </TooltipProvider>
  )
}
