"use client"

import { useMemo } from "react"
import type { PatientSummary } from "./consultation.types"
import { useBriefingPreparation } from "./useBriefingPreparation"

export type BriefingAlertSeverity = "critical" | "warning" | "info"

export type BriefingAlert = {
  id: string
  severity: BriefingAlertSeverity
  title: string
  detail: string
}

export type BriefingRiskTier = "high" | "moderate-high" | "moderate"

export type PatientBriefingReport = {
  patientName: string
  avatarUrl: string | null
  demographicsLine: string
  executiveSummary: string
  riskTier: BriefingRiskTier
  riskLabel: string
  riskFactors: string[]
  priorityAlerts: BriefingAlert[]
  conditions: { name: string; detail: string }[]
  medications: { name: string; detail: string }[]
  familyHistory: { relationship: string; condition: string; detail: string }[]
  lifestyleFlags: { label: string; value: string; riskLevel: string }[]
  clinicalFocus: string[]
}

export const BRIEFING_PREP_STEPS = [
  "Loading patient chart",
  "Reviewing medications and allergies",
  "Assessing cardiovascular risk",
  "Compiling pre-visit report",
] as const

function buildRiskAssessment(summary: PatientSummary) {
  const { existingConditions, familyHistory, lifestyleFlags } = summary
  const highRisks = lifestyleFlags.filter((f) => f.riskLevel === "high")
  const riskFactors: string[] = []

  if (existingConditions.some((c) => c.name.toLowerCase().includes("hypertension"))) {
    riskFactors.push("Hypertension")
  }
  if (existingConditions.some((c) => c.name.toLowerCase().includes("diabetes"))) {
    riskFactors.push("Type 2 diabetes")
  }
  if (
    existingConditions.some(
      (c) =>
        c.name.toLowerCase().includes("dyslipidemia") ||
        c.name.toLowerCase().includes("lipid"),
    )
  ) {
    riskFactors.push("Dyslipidemia")
  }
  if (
    familyHistory.some(
      (fh) =>
        fh.condition.toLowerCase().includes("mi") ||
        fh.condition.toLowerCase().includes("myocardial"),
    )
  ) {
    riskFactors.push("Premature family MI")
  }
  if (lifestyleFlags.some((f) => f.label === "BMI" && f.riskLevel === "high")) {
    riskFactors.push("Obesity")
  }
  if (lifestyleFlags.some((f) => f.label === "Smoking" && f.riskLevel === "moderate")) {
    riskFactors.push("Former smoking")
  }

  const tier: BriefingRiskTier =
    highRisks.length >= 2 || riskFactors.length >= 4
      ? "high"
      : highRisks.length >= 1 || riskFactors.length >= 2
        ? "moderate-high"
        : "moderate"

  const label =
    tier === "high"
      ? "High CVD risk"
      : tier === "moderate-high"
        ? "Moderate-high CVD risk"
        : "Moderate CVD risk"

  return { tier, label, riskFactors }
}

function buildAlerts(summary: PatientSummary): BriefingAlert[] {
  const alerts: BriefingAlert[] = []

  for (const allergy of summary.allergies) {
    const critical = allergy.reaction.toLowerCase().includes("anaphylaxis")
    alerts.push({
      id: `allergy-${allergy.id}`,
      severity: critical ? "critical" : "warning",
      title: `${allergy.allergen} allergy`,
      detail: `${allergy.category} — ${allergy.reaction}`,
    })
  }

  for (const flag of summary.lifestyleFlags.filter((f) => f.riskLevel === "high")) {
    alerts.push({
      id: `lifestyle-${flag.label}`,
      severity: "warning",
      title: `High-risk lifestyle: ${flag.label}`,
      detail: flag.value,
    })
  }

  if (summary.familyHistory.some((fh) => fh.condition.toLowerCase().includes("myocardial"))) {
    alerts.push({
      id: "family-mi",
      severity: "info",
      title: "Significant family cardiac history",
      detail: "Early MI in first-degree relative — factor into prevention strategy.",
    })
  }

  return alerts
}

function buildReport(summary: PatientSummary): PatientBriefingReport {
  const { demographics, existingConditions, activeMedications, familyHistory, lifestyleFlags } =
    summary
  const { tier, label, riskFactors } = buildRiskAssessment(summary)

  const executiveSummary = [
    `${demographics.fullName} is a ${demographics.age}-year-old ${demographics.gender} with ${existingConditions.length} active condition${existingConditions.length === 1 ? "" : "s"} and ${activeMedications.length} current medication${activeMedications.length === 1 ? "" : "s"}.`,
    summary.allergies.length > 0
      ? `${summary.allergies.length} documented allerg${summary.allergies.length === 1 ? "y requires" : "ies require"} prescribing caution before starting therapy.`
      : "No known drug allergies on file.",
    riskFactors.length > 0
      ? `Primary risk drivers: ${riskFactors.slice(0, 4).join(", ")}.`
      : "Continue structured follow-up with standard CVD monitoring.",
  ].join(" ")

  const clinicalFocus: string[] = []
  if (existingConditions.some((c) => c.name.toLowerCase().includes("hypertension"))) {
    clinicalFocus.push("Blood pressure control and target organ protection")
  }
  if (existingConditions.some((c) => c.name.toLowerCase().includes("diabetes"))) {
    clinicalFocus.push("Glycemic trends and cardiorenal protection")
  }
  if (activeMedications.length >= 3) {
    clinicalFocus.push("Polypharmacy review and interaction screening")
  }
  if (summary.allergies.length > 0) {
    clinicalFocus.push("Allergy-safe prescribing")
  }
  if (clinicalFocus.length === 0) {
    clinicalFocus.push("Baseline cardiovascular assessment and risk stratification")
  }

  return {
    patientName: demographics.fullName,
    avatarUrl: demographics.avatarUrl,
    demographicsLine: `${demographics.age} years · ${demographics.gender} · ${demographics.bloodType} · ${demographics.occupation}`,
    executiveSummary,
    riskTier: tier,
    riskLabel: label,
    riskFactors,
    priorityAlerts: buildAlerts(summary),
    conditions: existingConditions.map((c) => ({
      name: c.name,
      detail: c.details || `Diagnosed ${new Date(c.diagnosedAt).getFullYear()}`,
    })),
    medications: activeMedications.map((m) => ({
      name: m.name,
      detail: `${m.dose} · ${m.frequency}`,
    })),
    familyHistory: familyHistory.map((fh) => ({
      relationship: fh.relationship,
      condition: fh.condition,
      detail: fh.details,
    })),
    lifestyleFlags: lifestyleFlags.map((f) => ({
      label: f.label,
      value: f.value,
      riskLevel: f.riskLevel,
    })),
    clinicalFocus,
  }
}

export function usePatientBriefing(summary: PatientSummary, queueEntryId: string) {
  const report = useMemo(() => buildReport(summary), [summary])
  const { isReady, prepStep } = useBriefingPreparation(queueEntryId, true)

  return {
    report,
    isReady,
    prepStep,
  }
}
