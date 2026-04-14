"use client"

import { useState, useMemo, useCallback } from "react"
import type {
  PatientInfo,
  PatientPrescription,
  DoctorPrescriptionsPageData,
  AddPrescriptionPayload,
  UpdatePrescriptionPayload,
} from "./doctorPrescriptions.types"
import { MOCK_DOCTOR_PRESCRIPTIONS } from "./doctorPrescriptions.mock"

function computeStats(patients: PatientInfo[], prescriptions: PatientPrescription[]) {
  return {
    totalPatients: patients.length,
    totalPrescriptions: prescriptions.length,
    activePrescriptions: prescriptions.filter((p) => p.status === "active").length,
    poorComplianceCount: prescriptions.filter(
      (p) => p.compliance === "poor" && p.status === "active",
    ).length,
  }
}

export function useDoctorPrescriptions() {
  const [patients] = useState<PatientInfo[]>(MOCK_DOCTOR_PRESCRIPTIONS.patients)
  const [prescriptions, setPrescriptions] = useState<PatientPrescription[]>(
    MOCK_DOCTOR_PRESCRIPTIONS.prescriptions,
  )

  const stats = useMemo(() => computeStats(patients, prescriptions), [patients, prescriptions])

  const data: DoctorPrescriptionsPageData = useMemo(
    () => ({ patients, prescriptions, stats }),
    [patients, prescriptions, stats],
  )

  const addPrescription = useCallback((payload: AddPrescriptionPayload) => {
    const newRx: PatientPrescription = {
      id: `rx-${Date.now()}`,
      patientId: payload.patientId,
      name: payload.name,
      dose: payload.dose,
      frequency: payload.frequency,
      duration: payload.duration,
      type: payload.type,
      compliance: "good",
      sideEffects: payload.sideEffects,
      status: "active",
      prescribedAt: new Date().toISOString(),
      instructions: payload.instructions,
      timeOfDay: payload.timeOfDay,
      adherencePercent: 100,
    }
    setPrescriptions((prev) => [...prev, newRx])
  }, [])

  const updatePrescription = useCallback(
    (prescriptionId: string, payload: UpdatePrescriptionPayload) => {
      setPrescriptions((prev) =>
        prev.map((p) => (p.id === prescriptionId ? { ...p, ...payload } : p)),
      )
    },
    [],
  )

  const pausePrescription = useCallback((prescriptionId: string) => {
    setPrescriptions((prev) =>
      prev.map((p) =>
        p.id === prescriptionId ? { ...p, status: "paused" as const } : p,
      ),
    )
  }, [])

  const discontinuePrescription = useCallback((prescriptionId: string) => {
    setPrescriptions((prev) =>
      prev.map((p) =>
        p.id === prescriptionId ? { ...p, status: "discontinued" as const } : p,
      ),
    )
  }, [])

  const resumePrescription = useCallback((prescriptionId: string) => {
    setPrescriptions((prev) =>
      prev.map((p) =>
        p.id === prescriptionId ? { ...p, status: "active" as const } : p,
      ),
    )
  }, [])

  const deletePrescription = useCallback((prescriptionId: string) => {
    setPrescriptions((prev) => prev.filter((p) => p.id !== prescriptionId))
  }, [])

  return {
    data,
    addPrescription,
    updatePrescription,
    pausePrescription,
    discontinuePrescription,
    resumePrescription,
    deletePrescription,
  }
}
