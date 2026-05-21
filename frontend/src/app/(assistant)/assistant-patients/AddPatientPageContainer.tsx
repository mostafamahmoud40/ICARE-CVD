"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"

import { PatientsList } from "./PatientsList"
import { useAddPatient } from "./useAddPatient"

function PatientsListFallback() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 bg-[#F9F8F5] px-6 text-center text-sm text-muted-foreground">
      Loading patients…
    </div>
  )
}

function PatientsListFromUrl() {
  const state = useAddPatient()
  const searchParams = useSearchParams()
  const q = searchParams.get("q")?.trim() ?? ""
  const addOpen = searchParams.get("add") === "1"

  return (
    <PatientsList
      key={`${q}-${addOpen}`}
      patients={state.patients}
      addPatientState={state}
      initialSearchQuery={q}
      initialSheetOpen={addOpen}
    />
  )
}

export function AddPatientPageContainer() {
  return (
    <Suspense fallback={<PatientsListFallback />}>
      <PatientsListFromUrl />
    </Suspense>
  )
}
