"use client"

import { useState, useMemo } from "react"
import type { PatientInfo, PatientPrescription, AddPrescriptionPayload } from "./doctorPrescriptions.types"
import { cn } from "@/lib/utils"
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  HeartPulseIcon,
  PillIcon,
  SearchIcon,
  UserRoundIcon,
  XIcon,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { useDoctorPrescriptions } from "./useDoctorPrescriptions"
import { PatientPrescriptionPanel } from "./PatientPrescriptionPanel"
import { AddPrescriptionDialog } from "./AddPrescriptionDialog"
import { PrescriptionDetailDialog } from "./PrescriptionDetailDialog"

type PatientListItemProps = {
  patient: PatientInfo
  prescriptionCount: number
  poorComplianceCount: number
  isSelected: boolean
  onClick: () => void
}

function PatientListItem({
  patient,
  prescriptionCount,
  poorComplianceCount,
  isSelected,
  onClick,
}: PatientListItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-all",
        isSelected
          ? "border-[#E5EEEA] bg-[#E8F0EE]"
          : "border-transparent bg-[#FBFDFC] hover:bg-[#F9F8F5]",
      )}
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full",
          isSelected ? "bg-[#1A5345] text-white" : "bg-[#E8F0EE] text-[#1A5345]",
        )}
      >
        <UserRoundIcon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-[#102F27]">{patient.fullName}</p>
        <p className="truncate text-[11px] text-muted-foreground">{patient.activeMedications} active medications</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="rounded-full bg-[#F5F5F3] px-1.5 py-0.5 text-[10px] font-medium text-[#6B7870]">
            {prescriptionCount} Rx
          </span>
          {poorComplianceCount > 0 && (
            <span className="flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">
              <AlertTriangleIcon className="size-2.5" />
              {poorComplianceCount}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

export function DoctorPrescriptions() {
  const { data, addPrescription, pausePrescription, resumePrescription, discontinuePrescription, deletePrescription } =
    useDoctorPrescriptions()
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    data.patients[0]?.id ?? "",
  )
  const [patientSearch, setPatientSearch] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedPrescription, setSelectedPrescription] = useState<PatientPrescription | null>(null)

  const selectedPatient = data.patients.find((p) => p.id === selectedPatientId) ?? null

  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return data.patients
    const q = patientSearch.toLowerCase()
    return data.patients.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q),
    )
  }, [data.patients, patientSearch])

  const patientRxCounts = useMemo(() => {
    const counts: Record<string, { total: number; poor: number }> = {}
    for (const p of data.patients) {
      const rxs = data.prescriptions.filter((r) => r.patientId === p.id)
      counts[p.id] = {
        total: rxs.filter((r) => r.status === "active").length,
        poor: rxs.filter((r) => r.compliance === "poor" && r.status === "active").length,
      }
    }
    return counts
  }, [data.patients, data.prescriptions])

  const handleAddPrescription = (payload: AddPrescriptionPayload) => {
    addPrescription(payload)
  }

  const currentPrescription = selectedPrescription
    ? data.prescriptions.find((r) => r.id === selectedPrescription.id) ?? null
    : null

  return (
    <main className="flex flex-1 overflow-hidden bg-[#F9F8F5]">
      {/* Left Sidebar: Patient List */}
      <div className="flex w-[320px] shrink-0 flex-col border-r border-[#E8E6E0] bg-white">
        {/* Header */}
        <div className="border-b border-[#E8E6E0] bg-[#FAFAF8] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-[#1A5345]">
              <PillIcon className="size-5 text-white" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#1A1F1E]">Prescriptions</h2>
              <p className="text-[11px] text-[#6B7870]">
                Manage prescriptions for {data.stats.totalPatients} patients
              </p>
            </div>
          </div>

        </div>

        {/* Stats & Search Section */}
        <div className="border-b border-[#E8E6E0] bg-[#FAFAF8] px-4 py-3">
          {/* Stats - Horizontal Layout */}
          <div className="mb-3 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md bg-[#E8F0EE]">
                <HeartPulseIcon className="size-4 text-[#1A5345]" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-[#102F27]">{data.stats.activePrescriptions}</span>
                <span className="text-[11px] text-[#6B7870]">Active Rx</span>
              </div>
            </div>
            <div className="h-4 w-px bg-[#E5EEEA]" />
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md bg-amber-50">
                <AlertTriangleIcon className="size-4 text-amber-500" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-amber-600">{data.stats.poorComplianceCount}</span>
                <span className="text-[11px] text-[#6B7870]">Poor Compliance</span>
              </div>
            </div>
          </div>

          {/* Patient Search */}
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#9CA3AF]" />
            <Input
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              placeholder="Search patients..."
              className="h-8 border-[#E8E6E0] bg-white pl-8 text-[12px] placeholder:text-[#9CA3AF]"
            />
            {patientSearch && (
              <button
                onClick={() => setPatientSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7870]"
              >
                <XIcon className="size-3" />
              </button>
            )}
          </div>
        </div>

        {/* Patient List */}
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {filteredPatients.map((patient) => {
            const counts = patientRxCounts[patient.id] ?? { total: 0, poor: 0 }
            return (
              <PatientListItem
                key={patient.id}
                patient={patient}
                prescriptionCount={counts.total}
                poorComplianceCount={counts.poor}
                isSelected={patient.id === selectedPatientId}
                onClick={() => setSelectedPatientId(patient.id)}
              />
            )
          })}
          {filteredPatients.length === 0 && (
            <div className="py-6 text-center text-[12px] text-muted-foreground">
              No patients match your search.
            </div>
          )}
        </div>
      </div>

      {/* Right: Patient Prescription Panel */}
      {selectedPatient ? (
        <PatientPrescriptionPanel
          patient={selectedPatient}
          prescriptions={data.prescriptions}
          onAddPrescription={() => setShowAddDialog(true)}
          onPause={pausePrescription}
          onResume={resumePrescription}
          onDiscontinue={discontinuePrescription}
          onDelete={deletePrescription}
          onSelectPrescription={setSelectedPrescription}
          className="flex-1"
        />
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-[#F5F5F3]">
              <PillIcon className="size-8 text-[#9CA3AF]" />
            </div>
            <p className="text-[14px] text-[#6B7870]">Select a patient to manage prescriptions</p>
          </div>
        </div>
      )}

      {/* Add Prescription Dialog */}
      {selectedPatient && (
        <AddPrescriptionDialog
          open={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          patientName={selectedPatient.fullName}
          patientId={selectedPatient.id}
          onAdd={handleAddPrescription}
        />
      )}

      {/* Prescription Detail Dialog */}
      <PrescriptionDetailDialog
        prescription={currentPrescription}
        onClose={() => setSelectedPrescription(null)}
      />
    </main>
  )
}
