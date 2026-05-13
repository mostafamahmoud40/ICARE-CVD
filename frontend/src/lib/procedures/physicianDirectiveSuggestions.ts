export type PhysicianDirectiveSuggestion = {
  id: string
  title: string
  description: string | null
  rationale: string
  allowsAttachment: boolean
  source: "rules" | "llm"
}

export type DirectiveSuggestionInput = {
  procedureName: string
  notes: string | null
  priority: "normal" | "urgent" | "emergency"
  patientAge: number
  department: string
  existingTitles: string[]
  existingDescriptions: string[]
}

function slugId(prefix: string, seed: string): string {
  const compact = seed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 48)
  return `${prefix}-${compact || "item"}`
}

function blob(input: DirectiveSuggestionInput): string {
  return `${input.procedureName}\n${input.notes ?? ""}`.toLowerCase()
}

/** Loose duplicate check vs existing checklist rows */
export function isLikelyDuplicateSuggestion(
  suggestion: Pick<PhysicianDirectiveSuggestion, "title" | "description">,
  input: DirectiveSuggestionInput,
): boolean {
  const t = suggestion.title.toLowerCase().trim()
  const d = (suggestion.description ?? "").toLowerCase().trim()
  const pool = [...input.existingTitles, ...input.existingDescriptions].map((s) =>
    s.toLowerCase(),
  )
  for (const x of pool) {
    if (!x.trim()) continue
    if (x.includes(t) || t.includes(x.slice(0, Math.min(24, x.length)))) return true
    if (d && (x.includes(d.slice(0, 40)) || d.includes(x.slice(0, 40)))) return true
  }
  return false
}

/**
 * Deterministic, protocol-style suggestions — safe for assistant workflows (not diagnoses).
 */
export function buildRuleBasedDirectiveSuggestions(
  input: DirectiveSuggestionInput,
): PhysicianDirectiveSuggestion[] {
  const out: PhysicianDirectiveSuggestion[] = []
  const text = blob(input)
  const proc = input.procedureName.toLowerCase()

  const push = (
    prefix: string,
    title: string,
    description: string | null,
    rationale: string,
    allowsAttachment: boolean,
  ) => {
    const s: PhysicianDirectiveSuggestion = {
      id: slugId(prefix, title),
      title,
      description,
      rationale,
      allowsAttachment,
      source: "rules",
    }
    if (!isLikelyDuplicateSuggestion(s, input)) out.push(s)
  }

  /* Contrast / iodine / allergy */
  if (/iodine|contrast|iso-?osmolar|allergy/.test(text)) {
    push(
      "contrast",
      "Contrast reaction precautions",
      "Verify iso-osmolar or alternative contrast plan per allergy documentation; emergency meds available.",
      "Notes mention iodine/contrast sensitivity.",
      false,
    )
    push(
      "band",
      "Allergy identification",
      "Confirm allergy alert on wristband and in EMR before transport to procedure suite.",
      "Contrast allergy workflows require double verification.",
      false,
    )
  }

  /* Anticoagulation / blood thinners */
  if (/blood\s*thinner|anticoag|warfarin|aspirin|clopidogrel|ticagrelor|heparin|novel\s*oral/.test(text)) {
    push(
      "ac",
      "Anticoagulation coordination",
      "Confirm holding/adjustment per institutional bridge protocol and document last doses.",
      "Antithrombotic medications affect bleeding risk around invasive procedures.",
      false,
    )
  }

  /* Cath lab / PCI family */
  if (
    /catheter|cath lab|pci|angioplasty|stent|coronary/.test(proc) ||
    /catheter|cath lab|pci|angioplasty/.test(text)
  ) {
    push(
      "renal",
      "Renal function documentation",
      "Ensure recent creatinine/eGFR on chart prior to contrast administration.",
      "Standard contrast safety screening for invasive cardiac procedures.",
      true,
    )
    push(
      "consent",
      "Procedure consent verified",
      "Signed informed consent on file; witness/time documented per policy.",
      "Required governance step before invasive cardiac procedures.",
      true,
    )
  }

  /* TEE */
  if (/tee|transesophageal|echocardiogram\s*\(tee\)/.test(proc)) {
    push(
      "npo",
      "NPO compliance",
      "Confirm fasting interval per anesthesia policy prior to TEE.",
      "TEE procedures require esophageal instrumentation.",
      false,
    )
    push(
      "dent",
      "Dental appliances",
      "Patient has removed dentures / orthodontic devices as applicable.",
      "Airway safety for transesophageal imaging.",
      false,
    )
  }

  /* Pacemaker / implant */
  if (/pacemaker|device\s*implant|cied/.test(proc)) {
    push(
      "abx",
      "Peri-procedure antibiotics",
      "Document pre-incision antibiotic per surgical prophylaxis protocol.",
      "Common implant infection-prevention bundle.",
      false,
    )
  }

  /* Age / frailty hint */
  if (input.patientAge >= 70) {
    push(
      "fall",
      "Fall-risk & mobility plan",
      "Bed/chair alarm or escort as needed for transport to/from procedure area.",
      "Older adults often need enhanced mobility support peri-procedure.",
      false,
    )
  }

  /* Priority */
  if (input.priority === "urgent" || input.priority === "emergency") {
    push(
      "team",
      "Team readiness huddle",
      "Brief nursing + physician on critical allergies, anticoagulation, and contingency plans.",
      "Higher-acuity cases benefit from explicit communication checkpoints.",
      false,
    )
  }

  return out
}
