"use client"

import { useQuery } from "@tanstack/react-query"
import { mockDoctorPatientsData, mockPatientFullRecord } from "./doctorPatients.mock"
import type { PatientFullRecord } from "./doctorPatients.types"

function getMockPatientRecord(patientId: string): PatientFullRecord {
  const patient = mockDoctorPatientsData.patients.find((p) => p.id === patientId)

  return {
    ...mockPatientFullRecord,
    patient: patient ?? { ...mockPatientFullRecord.patient, id: patientId },
  }
}

export function useDoctorPatientRecord(patientId: string) {
  return useQuery({
    queryKey: ["doctor-patient-record", patientId],
    queryFn: () => getMockPatientRecord(patientId),
    enabled: Boolean(patientId),
    staleTime: 60_000,
  })
}
