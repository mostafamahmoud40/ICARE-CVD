"use client"

import { PatientsList } from "./PatientsList"
import { useAddPatient } from "./useAddPatient"

export function AddPatientPageContainer() {
  const state = useAddPatient()
  return <PatientsList patients={state.patients} addPatientState={state} />
}
