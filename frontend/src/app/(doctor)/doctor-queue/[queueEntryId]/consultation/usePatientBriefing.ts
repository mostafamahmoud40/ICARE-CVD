"use client"

import { useMemo } from "react"
import type { PatientSummary } from "./consultation.types"

export type BriefingMessageType =
  | "greeting"
  | "demographics"
  | "conditions"
  | "medications"
  | "allergies"
  | "family"
  | "lifestyle"
  | "risk"
  | "complete"

export type BriefingMessage = {
  id: string
  type: BriefingMessageType
  text: string
}

function buildMessages(summary: PatientSummary): BriefingMessage[] {
  const { demographics, existingConditions, activeMedications, allergies, familyHistory, lifestyleFlags } = summary
  const firstName = demographics.fullName.split(" ")[0]

  const messages: BriefingMessage[] = []

  messages.push({
    id: "greeting",
    type: "greeting",
    text: `Hello Doctor! I've prepared a comprehensive briefing on your next patient. Let me walk you through everything I know about them...`,
  })

  messages.push({
    id: "demographics",
    type: "demographics",
    text: `Patient: ${demographics.fullName}, ${demographics.age}-year-old ${demographics.gender}, Blood Type ${demographics.bloodType}. ${demographics.occupation}, ${demographics.maritalStatus}. Contact: ${demographics.phone}.`,
  })

  if (existingConditions.length > 0) {
    const conditionTexts = existingConditions.map(
      (c) => `${c.name} (${c.details}, diagnosed ${new Date(c.diagnosedAt).getFullYear()})`
    )
    messages.push({
      id: "conditions",
      type: "conditions",
      text: `${firstName} has ${existingConditions.length} active condition${existingConditions.length > 1 ? "s" : ""}: ${conditionTexts.join("; ")}. ${existingConditions.length > 1 ? "These comorbidities significantly increase cardiovascular risk." : ""}`,
    })
  }

  if (activeMedications.length > 0) {
    const medTexts = activeMedications.map((m) => `${m.name} ${m.dose} ${m.frequency.toLowerCase()}`)
    messages.push({
      id: "medications",
      type: "medications",
      text: `Currently on ${activeMedications.length} medication${activeMedications.length > 1 ? "s" : ""}: ${medTexts.join("; ")}. All are currently active with no pauses.`,
    })
  }

  if (allergies.length > 0) {
    const allergyTexts = allergies.map((a) => `${a.allergen} (${a.reaction})`)
    const hasAnaphylaxis = allergies.some((a) => a.reaction.toLowerCase().includes("anaphylaxis"))
    messages.push({
      id: "allergies",
      type: "allergies",
      text: `Important — ${allergies.length} allerg${allergies.length > 1 ? "ies" : "y"} documented: ${allergyTexts.join("; ")}. ${hasAnaphylaxis ? "WARNING: Anaphylaxis reaction detected — exercise extreme caution with related prescriptions!" : "Keep these in mind when prescribing."}`,
    })
  }

  if (familyHistory.length > 0) {
    const fhTexts = familyHistory.map((fh) => `${fh.relationship}: ${fh.condition} (${fh.details})`)
    messages.push({
      id: "family",
      type: "family",
      text: `Family history is significant: ${fhTexts.join("; ")}. ${familyHistory.some((fh) => fh.condition.toLowerCase().includes("myocardial") || fh.condition.toLowerCase().includes("mi")) ? "Early family history of cardiac events is a major risk factor." : ""}`,
    })
  }

  const highRisks = lifestyleFlags.filter((f) => f.riskLevel === "high")
  const modRisks = lifestyleFlags.filter((f) => f.riskLevel === "moderate")
  if (lifestyleFlags.length > 0) {
    const riskTexts = lifestyleFlags.map((f) => `${f.label}: ${f.value}`)
    messages.push({
      id: "lifestyle",
      type: "lifestyle",
      text: `Lifestyle risk factors: ${riskTexts.join("; ")}. ${highRisks.length > 0 ? `${highRisks.length} high-risk factor${highRisks.length > 1 ? "s" : ""} identified — ${highRisks.map((r) => r.label).join(", ")}.` : ""} ${modRisks.length > 0 ? `${modRisks.length} moderate-risk factors as well.` : ""}`,
    })
  }

  const riskFactors: string[] = []
  if (existingConditions.some((c) => c.name.toLowerCase().includes("hypertension"))) riskFactors.push("hypertension")
  if (existingConditions.some((c) => c.name.toLowerCase().includes("diabetes"))) riskFactors.push("diabetes")
  if (existingConditions.some((c) => c.name.toLowerCase().includes("dyslipidemia") || c.name.toLowerCase().includes("lipid"))) riskFactors.push("dyslipidemia")
  if (familyHistory.some((fh) => fh.condition.toLowerCase().includes("mi") || fh.condition.toLowerCase().includes("myocardial"))) riskFactors.push("premature family history of MI")
  if (lifestyleFlags.some((f) => f.label === "BMI" && f.riskLevel === "high")) riskFactors.push("obesity")
  if (lifestyleFlags.some((f) => f.label === "Smoking" && f.riskLevel === "moderate")) riskFactors.push("former smoking history")

  messages.push({
    id: "risk",
    type: "risk",
    text: `Overall CVD Risk Assessment: ${highRisks.length >= 2 || riskFactors.length >= 4 ? "HIGH" : highRisks.length >= 1 || riskFactors.length >= 2 ? "MODERATE-HIGH" : "MODERATE"}. ${riskFactors.length > 0 ? `Key compounding factors: ${riskFactors.join(", ")}.` : ""} This patient ${riskFactors.length >= 4 ? "requires aggressive, multi-targeted risk factor management and close follow-up." : riskFactors.length >= 2 ? "would benefit from focused risk factor modification." : "should continue current management with monitoring."}`,
  })

  messages.push({
    id: "complete",
    type: "complete",
    text: `Briefing complete! I'm ready to assist during the consultation. You'll find my clinical suggestions in the AI panel on the right side. Feel free to ask me anything about ${firstName} during the examination.`,
  })

  return messages
}

export function usePatientBriefing(summary: PatientSummary) {
  const messages = useMemo(() => buildMessages(summary), [summary])

  return {
    messages,
    isComplete: true,
  }
}
