"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ArrowRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MedicationRecordDialog } from "@/app/(assistant)/assistant-medications/MedicationRecordDialog"
import {
  mapActiveMedicationToLine,
  mapPastMedicationToRow,
} from "@/app/(assistant)/assistant-medications/assistantPatientMedications.mapper"
import {
  PatientMedicationsTableSection,
  type PastMedicationTableRow,
} from "@/app/(assistant)/assistant-medications/PatientMedicationsTableSection"
import type { MedicationLine } from "@/app/(assistant)/assistant-medications/assistantMedications.types"
import {
  MOCK_ACTIVE_MEDICATIONS_ASSISTANT,
  MOCK_PAST_MEDICATIONS,
} from "./assistantPatientProfile.mock"

type AssistantPatientMedicationsTabProps = {
  patientId: string
}

export function AssistantPatientMedicationsTab({ patientId }: AssistantPatientMedicationsTabProps) {
  const [medicationsTab, setMedicationsTab] = useState<"active" | "past">("active")
  const [recordMed, setRecordMed] = useState<MedicationLine | null>(null)

  const activeMedications = useMemo(
    () => MOCK_ACTIVE_MEDICATIONS_ASSISTANT.map(mapActiveMedicationToLine),
    [],
  )
  const pastMedications = useMemo(
    () => MOCK_PAST_MEDICATIONS.map(mapPastMedicationToRow),
    [],
  )

  const openRecord = (med: MedicationLine | PastMedicationTableRow) => {
    if ("adherencePct7d" in med) {
      setRecordMed(med)
      return
    }

    setRecordMed({
      id: med.id,
      name: med.name,
      strength: med.strength,
      type: "pill",
      dosageInstructions: med.dosageInstructions,
      frequencyLabel: "",
      adherencePct7d: 0,
      missedLast7d: 0,
      nextRefillDue: null,
      adherenceHistory7d: Array.from({ length: 7 }, () => false),
    })
  }

  return (
    <div className="animate-in fade-in duration-300">
      <PatientMedicationsTableSection
        medications={activeMedications}
        pastMedications={pastMedications}
        medicationsTab={medicationsTab}
        onMedicationsTabChange={setMedicationsTab}
        onViewActiveRecord={openRecord}
        onViewPastRecord={openRecord}
        toolbarEnd={
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 rounded-lg border-[#E8E6E0] bg-white text-[12px] font-bold text-[#1A5345] shadow-sm hover:bg-[#F9F8F5]"
          >
            <Link href={`/assistant-medications/${patientId}`}>
              Manage adherence
              <ArrowRightIcon className="ml-1.5 size-3.5" />
            </Link>
          </Button>
        }
      />

      {recordMed ? (
        <MedicationRecordDialog
          open
          onOpenChange={(open) => {
            if (!open) setRecordMed(null)
          }}
          medicationName={recordMed.name}
          strength={recordMed.strength}
          type={recordMed.type}
          dosageInstructions={recordMed.dosageInstructions}
          frequencyLabel={recordMed.frequencyLabel}
        />
      ) : null}
    </div>
  )
}
