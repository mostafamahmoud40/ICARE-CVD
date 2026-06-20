"use client"

import { useState } from "react"
import type { Medication } from "./medications.types"
import { MedicationList } from "./MedicationList"
import { MedicationDetail } from "./MedicationDetail"
import { useMedications } from "./useMedications"

export function Medications() {
  const { data, markAsTaken, markAsSkipped } = useMedications()
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null)

  const currentSelected = selectedMedication
    ? data.medications.find((m) => m.id === selectedMedication.id) ?? null
    : null

  return (
    <main className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-[#F9F8F5]">
      <MedicationList
        medications={data.medications}
        onMarkTaken={markAsTaken}
        onMarkSkipped={markAsSkipped}
        onSelectMedication={setSelectedMedication}
      />

      <MedicationDetail
        medication={currentSelected}
        onClose={() => setSelectedMedication(null)}
      />
    </main>
  )
}
