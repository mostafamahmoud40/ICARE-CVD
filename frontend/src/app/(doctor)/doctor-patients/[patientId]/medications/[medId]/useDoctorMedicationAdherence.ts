"use client"

import { useQuery } from "@tanstack/react-query"

import { patientKeys } from "@/lib/query-keys"
import { fetchDoctorMedicationAdherenceRecord } from "../../../doctorPatientClinical.api"

export function useDoctorMedicationAdherence(medicationId: string) {
  return useQuery({
    queryKey: patientKeys.medicationAdherence(medicationId),
    queryFn: () => fetchDoctorMedicationAdherenceRecord(medicationId),
    staleTime: 60_000,
  })
}
