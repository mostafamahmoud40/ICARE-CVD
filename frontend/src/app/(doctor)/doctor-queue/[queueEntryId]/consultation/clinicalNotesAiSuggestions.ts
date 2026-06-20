import type {
  ActiveMedication,
  DiagnosisEntry,
  ExistingCondition,
  FamilyHistoryItem,
  LifestyleFlag,
  PhysicalExamFindings,
  PrescriptionEntry,
  TestOrder,
  VitalSigns,
} from "./consultation.types"

export type ClinicalNotesAiContext = {
  patientName: string
  age: number
  gender: string
  chiefComplaint: string
  structuredComplaint: string
  diagnoses: DiagnosisEntry[]
  prescriptions: PrescriptionEntry[]
  vitals: VitalSigns
  physicalExam: PhysicalExamFindings
  existingConditions: ExistingCondition[]
  activeMedications: ActiveMedication[]
  familyHistory: FamilyHistoryItem[]
  testOrders: TestOrder[]
  lifestyleFlags: LifestyleFlag[]
}

function formatGender(gender: string) {
  if (gender === "male") return "male"
  if (gender === "female") return "female"
  return "patient"
}

function vitalLine(vitals: VitalSigns): string | null {
  const parts: string[] = []
  if (vitals.systolicBP && vitals.diastolicBP) {
    parts.push(`BP ${vitals.systolicBP}/${vitals.diastolicBP} mmHg`)
  }
  if (vitals.heartRate) parts.push(`HR ${vitals.heartRate} bpm`)
  if (vitals.oxygenSaturation) parts.push(`SpO₂ ${vitals.oxygenSaturation}%`)
  if (vitals.temperature) parts.push(`Temp ${vitals.temperature}°C`)
  return parts.length > 0 ? `Vitals today: ${parts.join(", ")}.` : null
}

function physicalExamLines(exam: PhysicalExamFindings): string[] {
  const entries: Array<[string, string]> = [
    ["Heart sounds", exam.heartSounds],
    ["Murmurs", exam.murmurs],
    ["JVP", exam.jvp],
    ["Peripheral edema", exam.peripheralEdema],
    ["Lung auscultation", exam.lungAuscultation],
    ["Additional findings", exam.additionalFindings],
  ]
  return entries
    .filter(([, value]) => value.trim())
    .map(([label, value]) => `${label}: ${value.trim()}.`)
}

function examBlob(ctx: ClinicalNotesAiContext): string {
  const e = ctx.physicalExam
  return [
    e.heartSounds,
    e.murmurs,
    e.jvp,
    e.peripheralEdema,
    e.lungAuscultation,
    e.additionalFindings,
    ...ctx.diagnoses.map((d) => `${d.description} ${d.notes}`),
  ]
    .join(" ")
    .toLowerCase()
}

function conditionHaystack(ctx: ClinicalNotesAiContext): string {
  return [
    ...ctx.existingConditions.map((c) => `${c.name} ${c.details}`),
    ...ctx.diagnoses.map((d) => `${d.description} ${d.notes}`),
  ]
    .join(" ")
    .toLowerCase()
}

function hasCondition(ctx: ClinicalNotesAiContext, ...needles: string[]): boolean {
  const hay = conditionHaystack(ctx)
  return needles.some((n) => hay.includes(n.toLowerCase()))
}

function medNames(ctx: ClinicalNotesAiContext): string[] {
  const fromActive = ctx.activeMedications
    .filter((m) => m.status === "active")
    .map((m) => `${m.name} ${m.dose}`.toLowerCase())
  const fromRx = ctx.prescriptions.map((rx) => `${rx.name} ${rx.dose}`.toLowerCase())
  return [...fromActive, ...fromRx]
}

function medMatches(ctx: ClinicalNotesAiContext, pattern: RegExp): boolean {
  return medNames(ctx).some((name) => pattern.test(name))
}

function findMedDose(ctx: ClinicalNotesAiContext, pattern: RegExp): string | null {
  const hit = medNames(ctx).find((name) => pattern.test(name))
  return hit ?? null
}

function hasPrematureMiFamilyHistory(ctx: ClinicalNotesAiContext): boolean {
  return ctx.familyHistory.some(
    (item) =>
      /mi|myocardial|heart attack|coronary|cad/i.test(`${item.condition} ${item.details}`) &&
      /father|mother|parent|sibling|brother|sister|family/i.test(item.relationship),
  )
}

function riskFactorLabels(ctx: ClinicalNotesAiContext): string[] {
  const factors: string[] = []
  if (hasCondition(ctx, "hypertension", "htn", "blood pressure")) factors.push("long-standing HTN")
  if (hasCondition(ctx, "diabetes", "dm", "t2dm", "type 2")) factors.push("DM")
  if (hasCondition(ctx, "dyslipidemia", "hyperlipid", "cholesterol", "ldl")) factors.push("dyslipidemia")
  if (hasPrematureMiFamilyHistory(ctx)) factors.push("strong family history of premature MI")
  if (
    ctx.lifestyleFlags.some((f) => /smok/i.test(f.label) && f.riskLevel !== "low") ||
    hasCondition(ctx, "smok")
  ) {
    factors.push("tobacco exposure")
  }
  if (ctx.lifestyleFlags.some((f) => /obes|bmi|overweight/i.test(`${f.label} ${f.value}`))) {
    factors.push("elevated BMI / metabolic risk")
  }
  return factors
}

function hasEcgSignal(ctx: ClinicalNotesAiContext): boolean {
  return /ecg|st depression|st elevation|t wave|ischemic|strain pattern|lvh/i.test(examBlob(ctx))
}

function lvefFromContext(ctx: ClinicalNotesAiContext): string | null {
  const match = examBlob(ctx).match(/lvef\s*(\d{1,3})\s*%?/i)
  return match ? `${match[1]}%` : null
}

function hasEdema(ctx: ClinicalNotesAiContext): boolean {
  return /edema|pedal edema|pitting/i.test(examBlob(ctx))
}

function hasHeartFailureDx(ctx: ClinicalNotesAiContext): boolean {
  return hasCondition(ctx, "heart failure", "hfref", "hfpef", "hf ")
}

function hasIschemicSuspicion(ctx: ClinicalNotesAiContext): boolean {
  return (
    ctx.structuredComplaint === "chest_pain" ||
    hasCondition(
      ctx,
      "angina",
      "cad",
      "coronary",
      "ischemic",
      "acs",
      "myocardial",
    )
  )
}

function hasAngiographyPlan(ctx: ClinicalNotesAiContext): boolean {
  return ctx.testOrders.some((order) =>
    /angiograph|catheterization|cath lab|coronary angio/i.test(
      `${order.testName} ${order.testType} ${order.notes}`,
    ),
  )
}

function primaryDiagnosis(ctx: ClinicalNotesAiContext): DiagnosisEntry | null {
  if (ctx.diagnoses.length === 0) return null
  return ctx.diagnoses.find((d) => d.type === "primary") ?? ctx.diagnoses[0]
}

function buildSuspicionParagraph(ctx: ClinicalNotesAiContext): string | null {
  const primary = primaryDiagnosis(ctx)
  const factors = riskFactorLabels(ctx)

  if (hasIschemicSuspicion(ctx)) {
    const factorPhrase =
      factors.length > 0 ? `given the risk factor burden (${factors.join(" + ")})` : "given the overall cardiovascular risk profile"
    const ecgPhrase = hasEcgSignal(ctx) ? ", ECG changes" : ""
    const primaryLabel = primary?.description ?? "significant coronary disease"
    return `High clinical suspicion of ${primaryLabel.toLowerCase().includes("cad") || primaryLabel.toLowerCase().includes("coronary") ? primaryLabel : `significant multivessel CAD / ${primaryLabel}`} ${factorPhrase}${ecgPhrase}. Would not be surprised if angiography reveals need for PCI rather than medical therapy alone.`
  }

  if (primary) {
    const factorSuffix = factors.length > 0 ? ` Risk context: ${factors.join(", ")}.` : ""
    const ecgSuffix = hasEcgSignal(ctx) ? " Objective data today includes ECG changes that reinforce this weighting." : ""
    return `Working clinical suspicion remains focused on ${primary.description}${primary.icdCode ? ` (${primary.icdCode})` : ""} as the leading problem for this encounter.${factorSuffix}${ecgSuffix} Differential diagnoses remain active but currently ranked below this impression.`
  }

  if (factors.length > 0) {
    return `No single diagnosis locked yet, but cardiovascular risk clustering (${factors.join(", ")}) raises internal suspicion for occult atherosclerotic disease — will let symptoms, exam, and investigations refine the working impression.`
  }

  return null
}

function buildControlParagraph(ctx: ClinicalNotesAiContext): string | null {
  const parts: string[] = []

  if (hasCondition(ctx, "dyslipidemia", "hyperlipid", "ldl", "cholesterol")) {
    const statin = findMedDose(ctx, /atorvastatin|rosuvastatin|simvastatin|statin/)
    if (statin) {
      parts.push(
        `LDL still appears above target despite ${statin.replace(/\s+/g, " ").trim()} — consider intensification, adjunct therapy, or adherence review before attributing failure to pharmacologic inadequacy alone`,
      )
    } else {
      parts.push("Lipid indices remain a concern on today's review — statin therapy may need initiation or uptitration once baseline labs are confirmed")
    }
  }

  if (hasCondition(ctx, "diabetes", "dm", "t2dm", "hba1c")) {
    const diabetesMed = findMedDose(ctx, /metformin|empagliflozin|glipizide|insulin/)
    const hba1cMatch = examBlob(ctx).match(/hba1c[^0-9]*(\d+(?:\.\d+)?)\s*%?/i)
    const hba1cPhrase = hba1cMatch ? `HbA1c suboptimal (${hba1cMatch[1]}%)` : "glycemic control appears suboptimal"
    parts.push(
      `${hba1cPhrase}${diabetesMed ? ` despite ${diabetesMed.replace(/\s+/g, " ").trim()}` : " on current regimen"} — possible medication non-adherence or inadequate dosing; will address adherence sensitively at next visit rather than assume non-compliance outright`,
    )
  }

  const uncontrolledBp =
    ctx.vitals.systolicBP &&
    ctx.vitals.diastolicBP &&
    (Number(ctx.vitals.systolicBP) >= 140 || Number(ctx.vitals.diastolicBP) >= 90)
  if (uncontrolledBp && hasCondition(ctx, "hypertension", "htn")) {
    const bpMed = findMedDose(ctx, /lisinopril|amlodipine|losartan|bisoprolol|hypertens/)
    parts.push(
      `Blood pressure above goal today (${ctx.vitals.systolicBP}/${ctx.vitals.diastolicBP} mmHg)${bpMed ? ` despite ${bpMed.replace(/\s+/g, " ").trim()}` : ""} — internally favor adherence check and dose optimization before labeling resistant hypertension`,
    )
  }

  if (parts.length === 0) return null
  return parts.join(". ") + "."
}

function buildWatchfulParagraph(ctx: ClinicalNotesAiContext): string | null {
  const lvef = lvefFromContext(ctx)
  const edema = hasEdema(ctx)
  const reducedEf = lvef ? Number(lvef.replace("%", "")) <= 50 : false

  if (!edema && !reducedEf && !hasHeartFailureDx(ctx)) return null

  if (edema || reducedEf) {
    const efPhrase = lvef ? `LVEF ${lvef}` : "ventricular function parameters"
    const hfFormal = hasHeartFailureDx(ctx)
    if (hfFormal) {
      return `Heart failure already on the problem list; ${edema ? "peripheral edema persists" : "exam still raises concern"} with ${efPhrase} — monitoring trajectory closely and will escalate diuretic/GDMT strategy internally if congestion worsens.`
    }
    return `Mild edema${reducedEf ? ` + ${efPhrase} noted` : " noted"} — watching closely for early progression to heart failure; did not formally diagnose HF yet to avoid alarming patient prematurely, but will reassess at follow-up and may add diagnosis if edema/symptoms progress.`
  }

  return null
}

function buildDispositionParagraph(ctx: ClinicalNotesAiContext): string | null {
  const angio = hasAngiographyPlan(ctx)
  const ischemic = hasIschemicSuspicion(ctx)
  const troponinNegative = /troponin negative|negative troponin|tni negative/i.test(examBlob(ctx))
  const unstable =
    ctx.diagnoses.some((d) => d.severity === "critical") ||
    /rest pain|dynamic ecg|st elevation/i.test(examBlob(ctx))

  if (angio && ischemic) {
    if (unstable) {
      return "Given higher-acuity features, considered expedited admission pathway — if currently stable after initial workup, document exact trigger thresholds that would mandate ED return before scheduled angiography."
    }
    return `Elected outpatient angiography referral rather than urgent admission — presentation appears stable${troponinNegative ? ", troponin negative" : ""}, no rest pain documented at visit, no dynamic ECG changes captured at time of assessment. Will escalate to ER referral if any red-flag symptoms occur before follow-up.`
  }

  if (ctx.testOrders.length > 0) {
    const names = ctx.testOrders.map((o) => o.testName).join(", ")
    return `Investigations ordered (${names}) to answer specific internal clinical questions before committing to escalation — results may shift the working impression materially.`
  }

  if (ischemic && !angio) {
    return "Stable ischemic presentation today; deferred invasive strategy pending non-invasive risk stratification unless symptoms become rest-equivalent or biomarkers trend upward."
  }

  return null
}

function buildDeferredParagraph(ctx: ClinicalNotesAiContext): string | null {
  const parts: string[] = []
  const angio = hasAngiographyPlan(ctx)
  const hasP2y12 = medMatches(ctx, /clopidogrel|ticagrelor|prasugrel|prasugel/)
  const hasAntiplateletRx = ctx.prescriptions.some((rx) => rx.type === "antiplatelets")
  const ischemic = hasIschemicSuspicion(ctx)

  if (angio && ischemic && !hasP2y12) {
    parts.push(
      "Did not start P2Y12 inhibitor pending angiography results — will reassess antiplatelet regimen based on findings (medical therapy vs PCI)",
    )
  } else if (ischemic && !hasAntiplateletRx && !medMatches(ctx, /aspirin/)) {
    parts.push(
      "Held off intensified antiplatelet therapy for now — bleeding risk, pending investigations, or need for procedural planning should be documented before dual-pathway therapy",
    )
  }

  const deferredDiagnoses = ctx.diagnoses.filter((d) => d.type === "differential")
  if (deferredDiagnoses.length > 0) {
    parts.push(
      `Keeping ${deferredDiagnoses.map((d) => d.description).join(" and ")} on the internal differential without committing on the record yet — will retire or promote based on objective follow-up`,
    )
  }

  if (ctx.prescriptions.length === 0 && ctx.activeMedications.length > 0 && ischemic) {
    parts.push(
      "No medication changes made today despite ischemic concern — intentionally conservative pending complete data review; uptitration options noted internally for next visit if stability holds",
    )
  }

  if (parts.length === 0) return null
  return parts.join(". ") + "."
}

function buildFallbackParagraph(ctx: ClinicalNotesAiContext): string {
  const complaint = ctx.chiefComplaint.trim() || ctx.structuredComplaint.trim() || "cardiovascular review"
  const primary = primaryDiagnosis(ctx)
  if (primary) {
    return `Assessment remains anchored on ${primary.description}. Management choices today reflect stability of presentation, available objective data, and preference to avoid premature diagnostic labeling in the patient-facing record — internal reasoning to be updated after investigations and symptom trajectory are clearer.`
  }
  return `${ctx.age}-year-old ${formatGender(ctx.gender)} assessed for ${complaint}. Internal impression still forming — will document explicit clinical suspicion, differential weighting, and management rationale once exam and investigation data are integrated; patient-facing communication to remain measured until certainty improves.`
}

export function buildClinicalNotesDraft(ctx: ClinicalNotesAiContext): string {
  const complaint = ctx.chiefComplaint.trim() || ctx.structuredComplaint.trim()
  const paragraphs: string[] = []

  paragraphs.push(
    `${ctx.age}-year-old ${formatGender(ctx.gender)} (${ctx.patientName}) seen for ${complaint || "cardiovascular follow-up"}.`,
  )

  if (ctx.existingConditions.length > 0) {
    const conditions = ctx.existingConditions.map((c) => c.name).join(", ")
    paragraphs.push(`Known conditions include ${conditions}.`)
  }

  if (ctx.activeMedications.length > 0) {
    const meds = ctx.activeMedications
      .filter((m) => m.status === "active")
      .map((m) => `${m.name} ${m.dose} (${m.frequency})`)
      .join("; ")
    if (meds) paragraphs.push(`Current medications: ${meds}.`)
  }

  const vitals = vitalLine(ctx.vitals)
  if (vitals) paragraphs.push(vitals)

  const examLines = physicalExamLines(ctx.physicalExam)
  if (examLines.length > 0) {
    paragraphs.push(`Physical examination — ${examLines.join(" ")}`)
  } else {
    paragraphs.push("Physical examination performed; no acute distress documented.")
  }

  paragraphs.push(
    "Patient reports symptoms as described above. No acute red-flag features requiring immediate escalation were identified during this visit.",
  )

  return paragraphs.join("\n\n")
}

export function buildAssessmentAndPlanDraft(ctx: ClinicalNotesAiContext): string {
  const paragraphs = [
    buildSuspicionParagraph(ctx),
    buildControlParagraph(ctx),
    buildWatchfulParagraph(ctx),
    buildDispositionParagraph(ctx),
    buildDeferredParagraph(ctx),
  ].filter((paragraph): paragraph is string => Boolean(paragraph))

  if (paragraphs.length === 0) {
    paragraphs.push(buildFallbackParagraph(ctx))
  }

  return paragraphs.join("\n\n")
}
