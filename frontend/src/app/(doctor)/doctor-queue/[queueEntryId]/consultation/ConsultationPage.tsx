"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  removePatientCareTaskByOrderId,
  syncConsultationTestOrders,
  upsertPatientCareTaskFromTestOrder,
} from "@/lib/patientCareTimelineBridge"
import { useConsultationPanelWidths } from "./usePanelResize"
import type {
  ConsultationMedicalHistory,
  DiagnosisEntry,
  PrescriptionEntry,
  TestOrder,
  HomeMeasurement,
  PhysicalExamFindings,
  ProcedureDetails,
  Allergy,
  ExistingCondition,
} from "./consultation.types"
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
import { useConsultationDraft } from "./useConsultationDraft"
import { useConsultationVitals } from "./useConsultationVitals"
import { hasConsultationDraft } from "./consultationDraftStorage"
import { isBriefingAcknowledged } from "./briefingStorage"
import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  CheckCircle2Icon,
  SaveIcon,
  StethoscopeIcon,
} from "lucide-react"

export function ConsultationPage({ queueEntryId }: { queueEntryId: string }) {
  const router = useRouter()
  const { data, setData, saveDraftNow, hydrated } = useConsultationDraft(queueEntryId)
  const consultationVitals = useConsultationVitals(queueEntryId)
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
  const {
    patientSidebarWidth,
    aiPanelWidth,
    onPatientResizePointerDown,
    onAiResizePointerDown,
    nudgePatient,
    nudgeAi,
  } = useConsultationPanelWidths()

  useEffect(() => {
    if (!hydrated) return
    if (hasConsultationDraft(queueEntryId) || isBriefingAcknowledged(queueEntryId)) return
    router.replace(`/doctor-queue/${queueEntryId}/briefing`)
  }, [hydrated, queueEntryId, router])

  useEffect(() => {
    if (!hydrated) return
    syncConsultationTestOrders({
      patientId: data.patientId,
      doctorName: "Your care team",
      orders: data.testOrders,
    })
  }, [hydrated, data.patientId, data.testOrders])

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
    setData((prev) => {
      upsertPatientCareTaskFromTestOrder({
        patientId: prev.patientId,
        doctorName: "Your care team",
        order: entry,
      })
      return { ...prev, testOrders: [...prev.testOrders, entry] }
    })
  }

  const removeTestOrder = (id: string) => {
    setData((prev) => ({ ...prev, testOrders: prev.testOrders.filter((t) => t.id !== id) }))
    removePatientCareTaskByOrderId(id)
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
          <div className="sticky top-0 z-20 flex items-center border-b border-white/10 bg-transparent px-4 py-2 backdrop-blur-sm">
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
          </div>

          <div className="mx-auto max-w-[900px] space-y-5 p-5 pb-28">
            <VitalsSection
              vitals={consultationVitals.vitals}
              onVitalChange={consultationVitals.onVitalChange}
              onApplyLastReading={consultationVitals.applyLastReading}
              lastVitalReading={consultationVitals.lastVitalReading}
              patientAge={
                consultationVitals.patientAge || data.patientSummary.demographics.age
              }
              isLoading={consultationVitals.isLoading}
              isSaving={consultationVitals.isSaving}
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
                onClick={saveDraftNow}
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
