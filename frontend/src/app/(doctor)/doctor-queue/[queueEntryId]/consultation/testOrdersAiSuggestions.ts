import type { ClinicalNotesAiContext } from "./clinicalNotesAiSuggestions"
import type { TestOrder } from "./consultation.types"

export type TestOrderSuggestion = {
  id: string
  testType: TestOrder["testType"]
  testName: string
  urgency: TestOrder["urgency"]
  notes: string
  fastingRequired: boolean
  rationale: string
  caution?: string
}

function orderedHaystack(ctx: ClinicalNotesAiContext): string {
  return ctx.testOrders
    .map((order) => `${order.testName} ${order.testType} ${order.notes}`)
    .join(" ")
    .toLowerCase()
}

function alreadyOrdered(ctx: ClinicalNotesAiContext, ...needles: string[]): boolean {
  const hay = orderedHaystack(ctx)
  return needles.some((needle) => hay.includes(needle.toLowerCase()))
}

function hasCondition(ctx: ClinicalNotesAiContext, ...needles: string[]): boolean {
  const hay = [
    ...ctx.existingConditions.map((c) => `${c.name} ${c.details}`),
    ...ctx.diagnoses.map((d) => `${d.description} ${d.notes}`),
    ctx.chiefComplaint,
    ctx.structuredComplaint,
  ]
    .join(" ")
    .toLowerCase()
  return needles.some((needle) => hay.includes(needle.toLowerCase()))
}

function examText(ctx: ClinicalNotesAiContext): string {
  const e = ctx.physicalExam
  return [
    e.heartSounds,
    e.murmurs,
    e.jvp,
    e.peripheralEdema,
    e.lungAuscultation,
    e.additionalFindings,
  ]
    .join(" ")
    .toLowerCase()
}

function addIfNew(
  list: TestOrderSuggestion[],
  ctx: ClinicalNotesAiContext,
  suggestion: TestOrderSuggestion,
) {
  const key = `${suggestion.testType}:${suggestion.testName}`.toLowerCase()
  if (list.some((item) => `${item.testType}:${item.testName}`.toLowerCase() === key)) return
  if (alreadyOrdered(ctx, suggestion.testName, suggestion.testType.replace(/_/g, " "))) return
  list.push(suggestion)
}

export function buildTestOrderSuggestions(ctx: ClinicalNotesAiContext): TestOrderSuggestion[] {
  const suggestions: TestOrderSuggestion[] = []
  const complaint = ctx.structuredComplaint
  const exam = examText(ctx)

  const chestPain =
    complaint === "chest_pain" ||
    hasCondition(ctx, "angina", "chest pain", "acs", "ischemic")
  const palpitations = complaint === "palpitations" || hasCondition(ctx, "palpitation", "arrhythmia")
  const syncope = complaint === "syncope" || hasCondition(ctx, "syncope", "faint", "collapse")
  const dyspnea =
    complaint === "dyspnea" || hasCondition(ctx, "dyspnea", "shortness of breath", "heart failure")
  const edema = complaint === "edema" || /edema|pedal edema/i.test(exam)
  const diabetes = hasCondition(ctx, "diabetes", "dm", "t2dm", "hba1c")
  const dyslipidemia = hasCondition(ctx, "dyslipidemia", "hyperlipid", "cholesterol", "ldl")
  const hypertension = hasCondition(ctx, "hypertension", "htn")
  const sleepApnea =
    hasCondition(ctx, "sleep apnea", "osa", "polysomnography") ||
    ctx.lifestyleFlags.some((f) => /sleep|snor|apnea/i.test(`${f.label} ${f.value}`))
  const cardiomyopathy = hasCondition(ctx, "cardiomyopathy", "hfref", "hfpef", "heart failure")
  const highRisk =
    hypertension &&
    (diabetes || dyslipidemia || ctx.familyHistory.some((f) => /mi|cad|coronary/i.test(f.condition)))

  if (!alreadyOrdered(ctx, "ecg", "electrocardiogram")) {
    addIfNew(suggestions, ctx, {
      id: "test-ai-ecg",
      testType: "ecg",
      testName: "12-lead ECG",
      urgency: chestPain ? "urgent" : "routine",
      notes: chestPain
        ? "Evaluate for ischemic changes, arrhythmia, or conduction abnormality."
        : "Baseline rhythm and ischemia screening for today's visit.",
      fastingRequired: false,
      rationale: "Standard first-line investigation in a cardiology encounter.",
    })
  }

  if (chestPain && !alreadyOrdered(ctx, "troponin")) {
    addIfNew(suggestions, ctx, {
      id: "test-ai-troponin",
      testType: "blood",
      testName: "High-sensitivity Troponin",
      urgency: "urgent",
      notes: "Rule out acute myocardial injury; repeat per local ACS protocol if initial result is borderline.",
      fastingRequired: false,
      rationale: "Chest pain presentation warrants objective exclusion of acute coronary syndrome.",
      caution: "Escalate to ED pathway if rising troponin or high-risk features develop.",
    })
  }

  if ((chestPain || diabetes || hypertension) && !alreadyOrdered(ctx, "lipid", "ldl")) {
    addIfNew(suggestions, ctx, {
      id: "test-ai-lipid",
      testType: "blood",
      testName: "Fasting Lipid Panel",
      urgency: "routine",
      notes: "Assess LDL, HDL, triglycerides for risk refinement and therapy targets.",
      fastingRequired: true,
      rationale: "Lipid control is central to long-term cardiovascular risk management.",
    })
  }

  if (diabetes && !alreadyOrdered(ctx, "hba1c")) {
    addIfNew(suggestions, ctx, {
      id: "test-ai-hba1c",
      testType: "blood",
      testName: "HbA1c",
      urgency: "routine",
      notes: "Glycemic control review for cardiovascular risk optimization.",
      fastingRequired: false,
      rationale: "Diabetes status should be quantified when planning cardiac prevention strategy.",
    })
  }

  if ((dyspnea || edema || cardiomyopathy) && !alreadyOrdered(ctx, "bnp", "nt-probnp")) {
    addIfNew(suggestions, ctx, {
      id: "test-ai-bnp",
      testType: "blood",
      testName: "BNP / NT-proBNP",
      urgency: dyspnea ? "urgent" : "routine",
      notes: "Support assessment for decompensated heart failure or volume overload.",
      fastingRequired: false,
      rationale: "Breathlessness or congestion raises suspicion for worsening heart failure physiology.",
    })
  }

  if (
    (dyspnea || edema || cardiomyopathy || /murmur|lv dysfunction|reduced ef|lvef/i.test(exam)) &&
    !alreadyOrdered(ctx, "echocardiogram", "echo", "tte")
  ) {
    addIfNew(suggestions, ctx, {
      id: "test-ai-echo",
      testType: "echocardiogram",
      testName: "Transthoracic Echocardiogram",
      urgency: "routine",
      notes: "Assess LV/RV function, valvular disease, pulmonary pressures, and pericardium.",
      fastingRequired: false,
      rationale: "Structural and functional cardiac assessment is indicated from current symptoms or exam signals.",
    })
  }

  if (palpitations && !alreadyOrdered(ctx, "holter", "ambulatory")) {
    addIfNew(suggestions, ctx, {
      id: "test-ai-holter",
      testType: "holter_monitor",
      testName: "Holter Monitor (24-48 hr)",
      urgency: "routine",
      notes: "Capture paroxysmal arrhythmia correlating with symptomatic episodes.",
      fastingRequired: false,
      rationale: "Intermittent palpitations often need prolonged rhythm monitoring beyond a single ECG.",
    })
  }

  if (
    chestPain &&
    !alreadyOrdered(ctx, "stress", "perfusion", "nuclear") &&
    !hasCondition(ctx, "unstable", "st elevation")
  ) {
    addIfNew(suggestions, ctx, {
      id: "test-ai-nuclear-stress",
      testType: "nuclear_stress_test",
      testName: "Nuclear Stress Test (Myocardial Perfusion)",
      urgency: "routine",
      notes: "Evaluate inducible ischemia if presentation is stable and ACS has been reasonably excluded.",
      fastingRequired: false,
      rationale: "Functional ischemia testing helps risk-stratify stable chest pain in the outpatient cardiology setting.",
      caution: "Defer if ongoing rest pain, dynamic ECG changes, or positive troponin without clear explanation.",
    })
  }

  if (
    (chestPain || highRisk) &&
    !alreadyOrdered(ctx, "ct coronary", "cta", "coronary angiography")
  ) {
    addIfNew(suggestions, ctx, {
      id: "test-ai-ct-angio",
      testType: "ct_coronary_angiography",
      testName: "CT Coronary Angiography",
      urgency: "routine",
      notes: "Non-invasive anatomic assessment of coronary disease burden when appropriate for risk profile.",
      fastingRequired: false,
      rationale: "Useful for intermediate-risk patients when anatomy would change management decisions.",
      caution: "Consider renal function, contrast allergy, and heart rate control before scheduling.",
    })
  }

  if (cardiomyopathy && !alreadyOrdered(ctx, "cardiac mri", "cmr")) {
    addIfNew(suggestions, ctx, {
      id: "test-ai-cmr",
      testType: "cardiac_mri",
      testName: "Cardiac MRI",
      urgency: "routine",
      notes: "Tissue characterization, viability, and cardiomyopathy phenotyping.",
      fastingRequired: false,
      rationale: "Superior tissue characterization when cardiomyopathy or infiltrative disease is suspected.",
    })
  }

  if (highRisk && !alreadyOrdered(ctx, "carotid", "doppler", "vascular ultrasound")) {
    addIfNew(suggestions, ctx, {
      id: "test-ai-carotid",
      testType: "carotid_doppler",
      testName: "Carotid Doppler / Vascular Ultrasound",
      urgency: "routine",
      notes: "Screen for atherosclerotic burden in high-risk vascular patients.",
      fastingRequired: false,
      rationale: "Aggregated cardiovascular risk supports evaluation of subclinical atherosclerosis.",
    })
  }

  if (syncope && !alreadyOrdered(ctx, "tilt table")) {
    addIfNew(suggestions, ctx, {
      id: "test-ai-tilt",
      testType: "tilt_table_test",
      testName: "Tilt Table Test",
      urgency: "routine",
      notes: "Evaluate reflex syncope vs arrhythmic causes when history is suggestive.",
      fastingRequired: false,
      rationale: "Recurrent syncope warrants structured autonomic / hemodynamic assessment.",
    })
  }

  if (sleepApnea && !alreadyOrdered(ctx, "sleep study", "polysomnography", "psg")) {
    addIfNew(suggestions, ctx, {
      id: "test-ai-sleep",
      testType: "sleep_study",
      testName: "Sleep Study (Polysomnography)",
      urgency: "routine",
      notes: "Assess obstructive sleep apnea as a modifiable cardiovascular risk factor.",
      fastingRequired: false,
      rationale: "Sleep-disordered breathing amplifies hypertension, arrhythmia, and heart failure risk.",
    })
  }

  if (dyspnea && !alreadyOrdered(ctx, "chest x", "x-ray", "cxr")) {
    addIfNew(suggestions, ctx, {
      id: "test-ai-cxr",
      testType: "imaging",
      testName: "Chest X-Ray",
      urgency: "routine",
      notes: "Evaluate pulmonary congestion, effusion, or alternative pulmonary pathology.",
      fastingRequired: false,
      rationale: "Basic imaging complements BNP and echo when breathlessness is present.",
    })
  }

  if (
    !alreadyOrdered(ctx, "cbc", "complete blood") &&
    (chestPain || dyspnea || diabetes || suggestions.length > 0)
  ) {
    addIfNew(suggestions, ctx, {
      id: "test-ai-cbc",
      testType: "blood",
      testName: "Complete Blood Count (CBC)",
      urgency: "routine",
      notes: "Baseline hematologic assessment before further workup or therapy changes.",
      fastingRequired: false,
      rationale: "Routine baseline labs support safe cardiovascular management.",
    })
  }

  return suggestions
}
