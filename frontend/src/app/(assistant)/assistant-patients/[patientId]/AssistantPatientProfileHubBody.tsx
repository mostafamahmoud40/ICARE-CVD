"use client"

import { ClockIcon } from "lucide-react"
import { MedicalHistory, Documents } from "@/features/patient-record"
import type { AssistantPatientProfilePageState } from "./useAssistantPatientProfilePage"
import { AssistantPatientAppointmentsHub } from "./AssistantPatientAppointmentsHub"
import { AssistantPatientLabResultsHub } from "./AssistantPatientLabResultsHub"
import { AssistantPatientPrescriptionHub } from "./AssistantPatientPrescriptionHub"
import { AssistantPatientProfileMain } from "./AssistantPatientProfileMain"
import { AssistantPatientVisitHistoryHub } from "./AssistantPatientVisitHistoryHub"
import { AssistantPatientVitalsHub } from "./AssistantPatientVitalsHub"

type AssistantPatientProfileHubBodyProps = Pick<
  AssistantPatientProfilePageState,
  | "patientId"
  | "patient"
  | "vitals"
  | "appointments"
  | "visitHistory"
  | "labResults"
  | "prescriptions"
  | "vitalsHistory"
  | "vitalsTrend"
  | "medicalHistory"
  | "documents"
  | "emptyHubMessage"
  | "tabs"
  | "activeTab"
  | "setActiveTab"
  | "showHubSoon"
  | "hubViewParam"
  | "setIsAddVitalsOpen"
  | "selectedLabReport"
  | "setSelectedLabReport"
  | "selectedPrescription"
  | "setSelectedPrescription"
  | "vitalReadingDetail"
  | "setVitalReadingDetail"
  | "appointmentDetail"
  | "setAppointmentDetail"
>

export function AssistantPatientProfileHubBody({
  patientId,
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
  tabs,
  activeTab,
  setActiveTab,
  showHubSoon,
  hubViewParam,
  setIsAddVitalsOpen,
  selectedLabReport,
  setSelectedLabReport,
  selectedPrescription,
  setSelectedPrescription,
  vitalReadingDetail,
  setVitalReadingDetail,
  appointmentDetail,
  setAppointmentDetail,
}: AssistantPatientProfileHubBodyProps) {
  if (showHubSoon) {
    return (
      <div className="flex min-h-[min(520px,calc(100vh-200px))] flex-col items-center justify-center px-8 py-24">
        <ClockIcon className="mb-5 size-14 text-muted-foreground/35" strokeWidth={1.25} aria-hidden />
        <p className="text-[clamp(1.5rem,4vw,1.75rem)] font-semibold tracking-tight text-[#1A1F1E]">
          Soon
        </p>
      </div>
    )
  }

  if (hubViewParam === "documents") {
    return <Documents documents={documents} emptyMessage={emptyHubMessage("documents")} />
  }

  if (hubViewParam === "medical-history") {
    return (
      <MedicalHistory {...medicalHistory} emptyMessage={emptyHubMessage("medical history")} />
    )
  }

  if (hubViewParam === "visit-history") {
    return (
      <AssistantPatientVisitHistoryHub
        visitHistory={visitHistory}
        emptyHubMessage={emptyHubMessage}
      />
    )
  }

  if (hubViewParam === "lab-results") {
    return (
      <AssistantPatientLabResultsHub
        labResults={labResults}
        patient={patient}
        selectedLabReport={selectedLabReport}
        onSelectedLabReportChange={setSelectedLabReport}
        emptyHubMessage={emptyHubMessage}
      />
    )
  }

  if (hubViewParam === "prescription") {
    return (
      <AssistantPatientPrescriptionHub
        prescriptions={prescriptions}
        patient={patient}
        selectedPrescription={selectedPrescription}
        onSelectedPrescriptionChange={setSelectedPrescription}
        emptyHubMessage={emptyHubMessage}
      />
    )
  }

  if (hubViewParam === "vitals") {
    return (
      <AssistantPatientVitalsHub
        vitalsHistory={vitalsHistory}
        vitalsTrend={vitalsTrend}
        patient={patient}
        vitalReadingDetail={vitalReadingDetail}
        onVitalReadingDetailChange={setVitalReadingDetail}
        onAddVitalsOpen={() => setIsAddVitalsOpen(true)}
        emptyHubMessage={emptyHubMessage}
      />
    )
  }

  if (hubViewParam === "appointments") {
    return (
      <AssistantPatientAppointmentsHub
        appointments={appointments}
        patient={patient}
        appointmentDetail={appointmentDetail}
        onAppointmentDetailChange={setAppointmentDetail}
        emptyHubMessage={emptyHubMessage}
      />
    )
  }

  return (
    <AssistantPatientProfileMain
      patient={patient}
      vitals={vitals}
      tabs={tabs}
      activeTab={activeTab}
      onActiveTabChange={setActiveTab}
      patientId={patientId}
    />
  )
}
