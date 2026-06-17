"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { mockProcedureOrders } from "@/app/(assistant)/assistant-procedures/assistantProcedures.mock"
import { MOCK_HISTORY_OPERATIONS } from "@/app/(assistant)/assistant-procedures/assistantProceduresHistory.mock"
import {
  resolveProcedureReport,
  type ProcedureReportData,
  type RecoveryStatusKey,
} from "@/app/(assistant)/assistant-procedures/assistantProcedureReports.mock"
import type { ProcedureOrder } from "@/app/(assistant)/assistant-procedures/assistantProcedures.types"

import { useDoctorProcedures } from "./useDoctorProcedures"

const STORAGE_PREFIX = "icare-doctor-procedure-report:"

type StoredReport = {
  draft: ProcedureReportData
  finalized: boolean
  updatedAt: string
}

function createEmptyDraft(order: ProcedureOrder | null): ProcedureReportData {
  return {
    procedureDate: order?.scheduledAt ?? new Date().toISOString(),
    duration: "",
    preOpDiagnosis: order?.notes ?? "",
    operativeFindings: [],
    procedureDetails: "",
    complications: ["none"],
    postOpStatus: {
      consciousnessLevel: "",
      bloodPressure: "",
      heartRate: "",
      oxygenSaturation: "",
      ventilatorStatus: "",
    },
    icuMonitoring: { admissionDate: "", stayDuration: "" },
    postOpMedications: [],
    postOpComplications: [],
    recoveryStatus: "good",
    aiRecoveryPrediction: {
      recoveryRiskScore: "",
      expectedRecoveryTime: "",
      readmissionRisk: "",
      infectionRisk: "",
      recommendedMonitoringLevel: "",
      recoveryProbability: "",
    },
    dischargeSummary: {
      dischargeDate: "",
      finalCondition: "",
      dischargeInstructions: "",
    },
    followUpPlan: {
      followUpDate: "",
      requiredTests: [],
      currentMedications: [],
    },
    surgicalTeam: [],
    preOpProcedures: [],
  }
}

function readStoredReport(procedureId: string): StoredReport | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${procedureId}`)
    if (!raw) return null
    return JSON.parse(raw) as StoredReport
  } catch {
    return null
  }
}

function writeStoredReport(procedureId: string, payload: StoredReport) {
  localStorage.setItem(`${STORAGE_PREFIX}${procedureId}`, JSON.stringify(payload))
}

export function hasStoredProcedureReport(procedureId: string): boolean {
  return readStoredReport(procedureId) !== null
}

export function useDoctorProcedureReport(procedureId: string) {
  const { getOrderById, isLoading: ordersLoading } = useDoctorProcedures()
  const order = getOrderById(procedureId)

  const history = useMemo(
    () => MOCK_HISTORY_OPERATIONS.find((item) => item.id === procedureId) ?? null,
    [procedureId],
  )

  const seedReport = useMemo(() => {
    const resolved = resolveProcedureReport(procedureId, order ?? null, history)
    return resolved ?? createEmptyDraft(order ?? null)
  }, [procedureId, order, history])

  const [draft, setDraft] = useState<ProcedureReportData>(seedReport)
  const [isFinalized, setIsFinalized] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const stored = readStoredReport(procedureId)
    if (stored) {
      setDraft(stored.draft)
      setIsFinalized(stored.finalized)
    } else {
      setDraft(seedReport)
      setIsFinalized(false)
    }
    setIsHydrated(true)
  }, [procedureId, seedReport])

  const updateDraft = useCallback(
    <K extends keyof ProcedureReportData>(key: K, value: ProcedureReportData[K]) => {
      setDraft((prev) => ({ ...prev, [key]: value }))
      setIsFinalized(false)
    },
    [],
  )

  const saveDraft = useCallback(() => {
    writeStoredReport(procedureId, {
      draft,
      finalized: false,
      updatedAt: new Date().toISOString(),
    })
  }, [draft, procedureId])

  const finalizeReport = useCallback(() => {
    writeStoredReport(procedureId, {
      draft,
      finalized: true,
      updatedAt: new Date().toISOString(),
    })
    setIsFinalized(true)
  }, [draft, procedureId])

  const resetToSeed = useCallback(() => {
    setDraft(seedReport)
    setIsFinalized(false)
    localStorage.removeItem(`${STORAGE_PREFIX}${procedureId}`)
  }, [procedureId, seedReport])

  return {
    order,
    history,
    draft,
    setDraft,
    updateDraft,
    saveDraft,
    finalizeReport,
    resetToSeed,
    isFinalized,
    isLoading: ordersLoading || !isHydrated,
    hasOrder: Boolean(order) || Boolean(history) || mockProcedureOrders.some((o) => o.id === procedureId),
  }
}

export const RECOVERY_STATUS_OPTIONS: { value: RecoveryStatusKey; label: string }[] = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
]

export const INTRAOP_COMPLICATION_OPTIONS = [
  { value: "none" as const, label: "None" },
  { value: "excessiveBleeding" as const, label: "Excessive bleeding" },
  { value: "arrhythmia" as const, label: "Arrhythmia" },
  { value: "cardiacArrest" as const, label: "Cardiac arrest" },
]
