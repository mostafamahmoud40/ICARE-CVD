"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  removePatientCareTaskByOrderId,
  syncConsultationTestOrders,
  upsertPatientCareTaskFromTestOrder,
} from "@/lib/patientCareTimelineBridge"
import { useConsultationPanelWidths } from "./usePanelResize"
import type {
  Allergy,
  ExistingCondition,
  FamilyHistoryItem,
  ReferralEntry,
  TestOrder,
} from "./consultation.types"
import { PatientSidebar } from "./PatientSidebar"
import { VitalsSection } from "./VitalsSection"
import { MedicalHistorySection } from "./MedicalHistorySection"
import { ProceduresSection } from "./ProceduresSection"
import { ChiefComplaintSection } from "./ChiefComplaintSection"
import { PhysicalExamSection } from "./PhysicalExamSection"
import { DiagnosisSection } from "./DiagnosisSection"
import { PrescriptionsSection } from "./PrescriptionsSection"
import { ReferralsSection } from "./ReferralsSection"
import { ClinicalNotesSection } from "./ClinicalNotesSection"
import { FollowUpSection } from "./FollowUpSection"
import { PatientInstructionsSection } from "./PatientInstructionsSection"
import { TestsAndMeasurementsSection } from "./TestsAndMeasurementsSection"
import { CTScanSection } from "./CTScanSection"
import { useConsultationCtAnalysis } from "./useConsultationCtAnalysis"
import { XrayScanSection } from "./XrayScanSection"
import { useConsultationXrayAnalysis } from "./useConsultationXrayAnalysis"
import { useConsultationEchoAnalysis } from "./useConsultationEchoAnalysis"
import { EchoVideoSection } from "./EchoVideoSection"
import { CineMRISection } from "./CineMRISection"
import { useConsultationCineMri } from "./useConsultationCineMri"
import { EcgSection } from "./EcgSection"
import { useConsultationEcgAnalysis } from "./useConsultationEcgAnalysis"
import { EcgRagSection } from "./EcgRagSection"
import { EcgClassificationSection } from "./EcgClassificationSection"
import { useConsultationEcgClassification } from "./useConsultationEcgClassification"
import { LabMaterialsSection } from "./LabMaterialsSection"
import { useConsultationLabMaterials } from "./useConsultationLabMaterials"
import { AIAssistantPanel } from "./AIAssistantPanel"
import { ConsultationFloatingPatientQueryBar } from "./ConsultationFloatingPatientQueryBar"
import { ConsultationVoiceDictationErrorProvider } from "./ConsultationVoiceDictationErrorContext"
import { useLocalStorageState } from "./useLocalStorageState"
import { useConsultationDraft } from "./useConsultationDraft"
import { useConsultationVitals } from "./useConsultationVitals"
import { useConsultationLiveSections } from "./useConsultationLiveSections"
import { useCompleteConsultation } from "./useCompleteConsultation"
import { useQueueEntryId } from "./useQueueEntryId"
import { isBriefingAcknowledged } from "./briefingStorage"
import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  CheckCircle2Icon,
  Loader2Icon,
  SaveIcon,
  StethoscopeIcon,
} from "lucide-react"

export default function ConsultationPage() {
  const queueEntryId = useQueueEntryId()
  const router = useRouter()
  const { data, setData, hydrated, isLoading, isError } = useConsultationDraft(queueEntryId)
  const consultationVitals = useConsultationVitals(queueEntryId)
  const liveSections = useConsultationLiveSections(queueEntryId, data, setData, hydrated)
  const { complete, isCompleting, completingLabel } = useCompleteConsultation()
  const ctAnalysis = useConsultationCtAnalysis(
    queueEntryId,
    data?.patientId,
    hydrated && Boolean(data),
  )
  const xrayAnalysis = useConsultationXrayAnalysis(
    queueEntryId,
    data?.patientId,
    hydrated && Boolean(data),
  )
  const echoAnalysis = useConsultationEchoAnalysis(
    queueEntryId,
    data?.patientId,
    hydrated && Boolean(data),
  )
  const ecgAnalysis = useConsultationEcgAnalysis(
    queueEntryId,
    data?.patientId,
    hydrated && Boolean(data),
  )
  const ecgClassification = useConsultationEcgClassification(
    queueEntryId,
    data?.patientId,
    hydrated && Boolean(data),
  )
  const cineMri = useConsultationCineMri(
    queueEntryId,
    data?.patientId,
    hydrated && Boolean(data),
  )
  // EcgRagSection manages its own file state independently
  const labMaterials = useConsultationLabMaterials(
    queueEntryId,
    data?.patientId,
    hydrated && Boolean(data),
  )
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
    if (!hydrated || !data) return
    if (isBriefingAcknowledged(queueEntryId)) return
    router.replace(`/doctor-queue/${queueEntryId}/briefing`)
  }, [hydrated, data, queueEntryId, router])

  useEffect(() => {
    if (!hydrated || !data) return
    syncConsultationTestOrders({
      patientId: data.patientId,
      doctorName: "Your care team",
      orders: data.testOrders,
    })
  }, [hydrated, data?.patientId, data?.testOrders])

  if (isLoading || !data) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-[#F9F8F5]">
        <p className="text-[13px] font-medium text-muted-foreground">
          {isError ? "Unable to load patient record" : "Loading consultation…"}
        </p>
      </div>
    )
  }

  const updateMedicalHistory = liveSections.updateMedicalHistory

  const updateAllergies = (next: Allergy[]) => {
    const prev = data.patientSummary.allergies
    const added = next.filter((item) => !prev.some((p) => p.id === item.id))
    const removed = prev.filter((item) => !next.some((n) => n.id === item.id))
    if (added.length === 0 && removed.length === 0) return
    for (const item of added) void liveSections.addAllergy(item)
    for (const item of removed) void liveSections.removeAllergy(item.id)
  }

  const updateChronicConditions = (next: ExistingCondition[]) => {
    const prev = data.patientSummary.existingConditions
    const added = next.filter((item) => !prev.some((p) => p.id === item.id))
    const removed = prev.filter((item) => !next.some((n) => n.id === item.id))
    if (added.length === 0 && removed.length === 0) return
    for (const item of added) void liveSections.addChronicCondition(item)
    for (const item of removed) void liveSections.removeChronicCondition(item.id)
  }

  const updateFamilyHistory = (next: FamilyHistoryItem[]) => {
    const prev = data.patientSummary.familyHistory
    const added = next.filter((item) => !prev.some((p) => p.id === item.id))
    const removed = prev.filter((item) => !next.some((n) => n.id === item.id))
    if (added.length === 0 && removed.length === 0) return
    for (const item of added) void liveSections.addFamilyHistory(item)
    for (const item of removed) void liveSections.removeFamilyHistory(item.id)
  }

  const updateExam = liveSections.updateExam

  const updateProcedureDetails = liveSections.updateProcedureDetails

  const addDiagnosis = liveSections.addDiagnosis
  const removeDiagnosis = liveSections.removeDiagnosis
  const updateDiagnosis = liveSections.updateDiagnosis

  const addPrescription = liveSections.addPrescription
  const removePrescription = liveSections.removePrescription
  const updatePrescription = liveSections.updatePrescription

  const addTestOrder = (entry: TestOrder) => {
    upsertPatientCareTaskFromTestOrder({
      patientId: data.patientId,
      doctorName: "Your care team",
      order: entry,
    })
    void liveSections.addTestOrder(entry)
  }

  const removeTestOrder = (id: string) => {
    removePatientCareTaskByOrderId(id)
    void liveSections.removeTestOrder(id)
  }

  const addHomeMeasurement = liveSections.addHomeMeasurement
  const removeHomeMeasurement = liveSections.removeHomeMeasurement

  const addReferral = (entry: ReferralEntry) => {
    void liveSections.addReferral(entry)
  }

  const removeReferral = (id: string) => {
    void liveSections.removeReferral(id)
  }

  const addLabMaterials = (files: File[]) => {
    void labMaterials.addFiles(files)
  }

  const removeLabMaterial = (id: string) => {
    void labMaterials.removeItem(id)
  }

  const acceptSuggestion = (id: string) => {
    setData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        aiSuggestions: prev.aiSuggestions.map((s) =>
          s.id === id ? { ...s, accepted: true } : s,
        ),
      }
    })
  }

  const dismissSuggestion = (id: string) => {
    setData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        aiSuggestions: prev.aiSuggestions.map((s) =>
          s.id === id ? { ...s, accepted: false } : s,
        ),
      }
    })
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
              onSave={() => void consultationVitals.saveNow()}
              canSave={consultationVitals.canSave}
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
              familyHistory={data.patientSummary.familyHistory}
              onFamilyHistoryChange={updateFamilyHistory}
            />

            <ChiefComplaintSection
              complaint={data.chiefComplaint}
              onComplaintChange={liveSections.updateChiefComplaint}
              structured={data.chiefComplaintStructured}
              onStructuredChange={liveSections.updateChiefComplaintStructured}
            />

            <PhysicalExamSection exam={data.physicalExam} onExamChange={updateExam} />

            <DiagnosisSection
              diagnoses={data.diagnoses}
              onAddDiagnosis={addDiagnosis}
              onUpdateDiagnosis={updateDiagnosis}
              onRemoveDiagnosis={removeDiagnosis}
            />

            <LabMaterialsSection
              items={labMaterials.items}
              onAdd={addLabMaterials}
              onRemove={removeLabMaterial}
              activeItemId={labMaterials.activeItemId}
              onSelectItem={labMaterials.setActiveItemId}
              workspace={{
                workspaceOpen: labMaterials.workspaceOpen,
                analysisPhase: labMaterials.analysisPhase,
                analysis: labMaterials.analysis,
                analysisError: labMaterials.analysisError,
                chatOpen: labMaterials.chatOpen,
                setChatOpen: labMaterials.setChatOpen,
                runAiAnalysis: labMaterials.runAiAnalysis,
              }}
            />

            <CTScanSection
              ctFile={ctAnalysis.ctFile}
              savedStudy={ctAnalysis.savedStudy}
              result={ctAnalysis.result}
              status={ctAnalysis.status}
              errorMsg={ctAnalysis.errorMsg}
              elapsed={ctAnalysis.elapsed}
              isLoading={ctAnalysis.isLoading}
              onFileSelected={ctAnalysis.onFileSelected}
              onRemove={ctAnalysis.onRemove}
              onAnalyze={ctAnalysis.onAnalyze}
              onRetry={ctAnalysis.onRetry}
            />

            <XrayScanSection
              xrayFile={xrayAnalysis.xrayFile}
              savedResult={xrayAnalysis.savedResult}
              status={xrayAnalysis.status}
              errorMsg={xrayAnalysis.errorMsg}
              isLoading={xrayAnalysis.isLoading}
              onFileSelected={xrayAnalysis.onFileSelected}
              onRemove={xrayAnalysis.onRemove}
              onAnalyze={xrayAnalysis.onAnalyze}
              onRetry={xrayAnalysis.onRetry}
            />

            <EchoVideoSection
              echoFile={echoAnalysis.echoFile}
              savedEcho={echoAnalysis.savedEcho}
              analysisResult={echoAnalysis.analysisResult}
              report={echoAnalysis.report}
              isLoading={echoAnalysis.isLoading}
              isAnalyzing={echoAnalysis.isAnalyzing}
              isGeneratingReport={echoAnalysis.isGeneratingReport}
              analyzeError={echoAnalysis.analyzeError}
              onFileSelected={echoAnalysis.onFileSelected}
              onRemove={echoAnalysis.onRemove}
              onAnalyze={echoAnalysis.onAnalyze}
              onGenerateReport={echoAnalysis.onGenerateReport}
            />

            <CineMRISection
              edFile={cineMri.edFile}
              esFile={cineMri.esFile}
              savedStudy={cineMri.savedStudy}
              result={cineMri.result}
              status={cineMri.status}
              errorMsg={cineMri.errorMsg}
              elapsed={cineMri.elapsed}
              isLoading={cineMri.isLoading}
              onEdFileSelected={cineMri.onEdFileSelected}
              onEsFileSelected={cineMri.onEsFileSelected}
              onRemoveEd={cineMri.onRemoveEd}
              onRemoveEs={cineMri.onRemoveEs}
              onAnalyze={cineMri.onAnalyze}
              onRetry={cineMri.onRetry}
            />

            <EcgSection
              heaFile={ecgAnalysis.heaFile}
              datFile={ecgAnalysis.datFile}
              savedEcg={ecgAnalysis.savedEcg}
              analysisResult={ecgAnalysis.analysisResult}
              report={ecgAnalysis.report}
              isLoading={ecgAnalysis.isLoading}
              isAnalyzing={ecgAnalysis.isAnalyzing}
              isGeneratingReport={ecgAnalysis.isGeneratingReport}
              analyzeError={ecgAnalysis.analyzeError}
              reportError={ecgAnalysis.reportError}
              onHeaFileSelected={ecgAnalysis.onHeaFileSelected}
              onDatFileSelected={ecgAnalysis.onDatFileSelected}
              onRemove={ecgAnalysis.onRemove}
              onAnalyze={ecgAnalysis.onAnalyze}
            />

            {/* EcgRagSection is fully self-contained with its own file upload */}
            <EcgRagSection />

            <EcgClassificationSection
              mode={ecgClassification.mode}
              imageFile={ecgClassification.imageFile}
              heaFile={ecgClassification.heaFile}
              datFile={ecgClassification.datFile}
              savedStudy={ecgClassification.savedStudy}
              result={ecgClassification.result}
              status={ecgClassification.status}
              errorMsg={ecgClassification.errorMsg}
              isLoading={ecgClassification.isLoading}
              onModeChange={ecgClassification.onModeChange}
              onImageFile={ecgClassification.onImageFile}
              onHeaFile={ecgClassification.onHeaFile}
              onDatFile={ecgClassification.onDatFile}
              onAnalyze={ecgClassification.onAnalyze}
              onRetry={ecgClassification.onRetry}
              onNewRecording={ecgClassification.onNewRecording}
            />

            <ClinicalNotesSection
              clinicalNotes={data.clinicalNotes}
              onClinicalNotesChange={liveSections.updateClinicalNotes}
              assessmentAndPlan={data.assessmentAndPlan}
              onAssessmentAndPlanChange={liveSections.updateAssessmentAndPlan}
              aiContext={{
                patientName: data.patientSummary.demographics.fullName,
                age: data.patientSummary.demographics.age,
                gender: data.patientSummary.demographics.gender,
                chiefComplaint: data.chiefComplaint,
                structuredComplaint: data.structuredComplaint,
                diagnoses: data.diagnoses,
                prescriptions: data.prescriptions,
                vitals: data.vitals,
                physicalExam: data.physicalExam,
                existingConditions: data.patientSummary.existingConditions,
                activeMedications: data.patientSummary.activeMedications,
                familyHistory: data.patientSummary.familyHistory,
                testOrders: data.testOrders,
                lifestyleFlags: data.patientSummary.lifestyleFlags,
              }}
            />

            <FollowUpSection
              followUpDate={data.followUpDate}
              onFollowUpDateChange={liveSections.updateFollowUpDate}
              followUpNotes={data.followUpNotes}
              onFollowUpNotesChange={liveSections.updateFollowUpNotes}
            />

            <PatientInstructionsSection
              patientDiagnosisSummary={data.patientDiagnosisSummary}
              onPatientDiagnosisSummaryChange={liveSections.updatePatientDiagnosisSummary}
              patientLifestyleAdvice={data.patientLifestyleAdvice}
              onPatientLifestyleAdviceChange={liveSections.updatePatientLifestyleAdvice}
              patientDangerSigns={data.patientDangerSigns}
              onPatientDangerSignsChange={liveSections.updatePatientDangerSigns}
              aiContext={{
                patientName: data.patientSummary.demographics.fullName,
                age: data.patientSummary.demographics.age,
                gender: data.patientSummary.demographics.gender,
                chiefComplaint: data.chiefComplaint,
                structuredComplaint: data.structuredComplaint,
                diagnoses: data.diagnoses,
                prescriptions: data.prescriptions,
                vitals: data.vitals,
                physicalExam: data.physicalExam,
                existingConditions: data.patientSummary.existingConditions,
                activeMedications: data.patientSummary.activeMedications,
                familyHistory: data.patientSummary.familyHistory,
                testOrders: data.testOrders,
                lifestyleFlags: data.patientSummary.lifestyleFlags,
              }}
            />

            <PrescriptionsSection
              prescriptions={data.prescriptions}
              onAddPrescription={addPrescription}
              onUpdatePrescription={updatePrescription}
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
              aiContext={{
                patientName: data.patientSummary.demographics.fullName,
                age: data.patientSummary.demographics.age,
                gender: data.patientSummary.demographics.gender,
                chiefComplaint: data.chiefComplaint,
                structuredComplaint: data.structuredComplaint,
                diagnoses: data.diagnoses,
                prescriptions: data.prescriptions,
                vitals: data.vitals,
                physicalExam: data.physicalExam,
                existingConditions: data.patientSummary.existingConditions,
                activeMedications: data.patientSummary.activeMedications,
                familyHistory: data.patientSummary.familyHistory,
                testOrders: data.testOrders,
                lifestyleFlags: data.patientSummary.lifestyleFlags,
              }}
            />

            <ReferralsSection
              referrals={data.referrals}
              onAddReferral={addReferral}
              onRemoveReferral={removeReferral}
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
                onClick={liveSections.saveNow}
              >
                <SaveIcon className="size-3.5" />
                Save
              </Button>
              <Button
                size="sm"
                className="gap-1.5 border border-white/20 bg-[#1A5345]/80 text-[14px] hover:bg-[#1A5345] backdrop-blur-sm"
                disabled={
                  isCompleting ||
                  liveSections.isSaving ||
                  consultationVitals.isSaving ||
                  !liveSections.consultationId ||
                  !liveSections.patientId
                }
                onClick={() => {
                  if (!liveSections.consultationId || !liveSections.patientId) return
                  void complete({
                    patientId: liveSections.patientId,
                    consultationId: liveSections.consultationId,
                    queueEntryId,
                    saveVitals: () => consultationVitals.saveNow({ silentIfEmpty: true }),
                    saveSections: liveSections.saveNow,
                  })
                }}
              >
                {isCompleting ? (
                  <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <CheckCircle2Icon className="size-3.5" />
                )}
                {completingLabel}
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
