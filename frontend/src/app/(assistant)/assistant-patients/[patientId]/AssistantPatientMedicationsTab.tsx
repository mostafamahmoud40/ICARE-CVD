"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ArrowRightIcon } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { MedicationRecordDialog } from "@/app/(assistant)/assistant-medications/MedicationRecordDialog"
import { fetchAssistantMedicationProfile } from "@/app/(assistant)/assistant-medications/assistantMedications.api"
import {
  PatientMedicationsTableSection,
  type PastMedicationTableRow,
} from "@/app/(assistant)/assistant-medications/PatientMedicationsTableSection"
import type { MedicationLine } from "@/app/(assistant)/assistant-medications/assistantMedications.types"

type AssistantPatientMedicationsTabProps = {
  patientId: string
}

export function AssistantPatientMedicationsTab({ patientId }: AssistantPatientMedicationsTabProps) {
  const [medicationsTab, setMedicationsTab] = useState<"active" | "past">("active")
  const [recordMed, setRecordMed] = useState<MedicationLine | null>(null)

  const { data } = useQuery({
    queryKey: ["assistant-medication-profile", patientId],
    queryFn: () => fetchAssistantMedicationProfile(patientId),
    retry: false,
  })

  const activeMedications = useMemo(() => data?.medications ?? [], [data])
  const pastMedications = useMemo(
    () =>
      (data?.pastMedications ?? []).map((med) => ({
        id: med.id,
        name: med.name,
        strength: med.strength,
        dosageInstructions: med.dosageInstructions,
        statusLabel: med.statusLabel,
      })),
    [data],
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
          medicationId={recordMed.id}
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
