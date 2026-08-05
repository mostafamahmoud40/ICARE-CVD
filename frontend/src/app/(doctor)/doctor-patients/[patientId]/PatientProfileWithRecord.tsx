"use client"

import type { PatientFullRecord } from "../doctorPatients.types"
import { PatientProfile } from "./PatientProfile"
import { usePatientProfile } from "./usePatientProfile"

export function PatientProfileWithRecord({ record }: { record: PatientFullRecord }) {
  const state = usePatientProfile(record)
  return <PatientProfile {...state} />
}
