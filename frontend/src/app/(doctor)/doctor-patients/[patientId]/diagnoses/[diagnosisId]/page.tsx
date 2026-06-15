"use client"

import { use } from "react"
import Link from "next/link"
import { DoctorPatientRecordShell } from "../../../DoctorPatientRecordShell"
import { DiagnosisDetailPage } from "./DiagnosisDetailPage"
import { Button } from "@/components/ui/button"

type PageProps = {
  params: Promise<{ patientId: string; diagnosisId: string }>
}

export default function PatientDiagnosisDetailPage({ params }: PageProps) {
  const { patientId, diagnosisId } = use(params)

  return (
    <DoctorPatientRecordShell patientId={patientId}>
      {(record) => {
        const diagnosis = record.diagnoses.find((d) => d.id === diagnosisId)

        if (!diagnosis) {
          return (
            <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-[#F9F8F5] px-6 py-16">
              <p className="text-[16px] font-bold text-[#1A1F1E]">Diagnosis not found</p>
              <p className="text-[13px] font-medium text-[#6B7870]">This problem list entry may have been removed.</p>
              <Button asChild size="sm" className="h-8 rounded-lg bg-[#1A5345] px-4 text-[12px] font-bold text-white hover:bg-[#133F34]">
                <Link href={`/doctor-patients/${patientId}/diagnoses`}>Back to diagnoses</Link>
              </Button>
            </main>
          )
        }

        return <DiagnosisDetailPage patient={record.patient} diagnosis={diagnosis} visits={record.visits} />
      }}
    </DoctorPatientRecordShell>
  )
}
