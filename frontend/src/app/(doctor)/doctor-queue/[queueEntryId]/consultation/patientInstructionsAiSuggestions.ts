import type { ClinicalNotesAiContext } from "./clinicalNotesAiSuggestions"

export type PatientInstructionsDraft = {
  patientDiagnosisSummary: string
  patientLifestyleAdvice: string
  patientDangerSigns: string
}

const DEFAULT_DANGER_SIGNS = [
  "Severe or crushing chest pain lasting more than a few minutes",
  "Sudden shortness of breath or inability to speak full sentences",
  "Fainting, collapse, or sudden confusion",
  "Facial drooping, arm weakness, or slurred speech (stroke signs)",
  "Heart rate very fast with dizziness or near-fainting",
  "Swelling of legs with sudden worsening breathlessness",
].join("\n• ")

function primaryDiagnosisLine(ctx: ClinicalNotesAiContext): string {
  const primary = ctx.diagnoses.find((d) => d.type === "primary") ?? ctx.diagnoses[0]
  if (primary) {
    return `Based on today's visit, your doctor's working diagnosis is ${primary.description}. This will be monitored and may be updated after further tests.`
  }
  if (ctx.structuredComplaint === "chest_pain") {
    return "Based on today's visit, your symptoms are being evaluated for possible heart-related causes. Further tests may be needed to confirm the exact diagnosis."
  }
  return "Based on today's visit, your doctor reviewed your heart health and cardiovascular risk factors. Further tests or follow-up may be recommended."
}

function lifestyleLines(ctx: ClinicalNotesAiContext): string[] {
  const lines: string[] = [
    "Take all prescribed medications at the same time each day unless your doctor advises otherwise.",
    "Follow a heart-healthy diet: reduce salt, limit fried and processed foods, and favor vegetables, whole grains, and lean protein.",
    "If cleared for activity, aim for regular walking most days — start slowly and stop if you develop chest pain, severe breathlessness, or dizziness.",
    "Avoid smoking and limit alcohol; both worsen blood pressure and heart strain.",
    "Monitor your weight and report rapid gain (e.g. >2 kg in a few days) — it may signal fluid retention.",
  ]

  const hasDiabetes = ctx.existingConditions.some((c) => /diabetes|dm/i.test(c.name))
  const hasHypertension = ctx.existingConditions.some((c) => /hypertension|htn|blood pressure/i.test(c.name))

  if (hasDiabetes) {
    lines.push("Check blood sugar as directed and keep a simple log to review at follow-up.")
  }
  if (hasHypertension) {
    lines.push("Limit added salt; check blood pressure at home if you have a cuff and record readings.")
  }
  if (ctx.lifestyleFlags.some((f) => /sleep|apnea|snor/i.test(`${f.label} ${f.value}`))) {
    lines.push("Prioritize regular sleep; discuss snoring or daytime sleepiness with your care team.")
  }

  return lines
}

export function buildPatientInstructionsDraft(ctx: ClinicalNotesAiContext): PatientInstructionsDraft {
  return {
    patientDiagnosisSummary: primaryDiagnosisLine(ctx),
    patientLifestyleAdvice: lifestyleLines(ctx).map((line) => `• ${line}`).join("\n"),
    patientDangerSigns: `Go to the emergency department immediately or call emergency services if you experience:\n• ${DEFAULT_DANGER_SIGNS}`,
  }
}
