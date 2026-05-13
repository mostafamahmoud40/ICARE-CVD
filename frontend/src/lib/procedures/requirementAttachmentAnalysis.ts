/**
 * Rule-based + structured-lab extraction for procedure requirement attachments.
 * Intended as clinical decision support only — assistants must confirm manually.
 */

export type RequirementInsightConfidence = "high" | "medium" | "low"

export type RequirementAttachmentInsight = {
  summary: string
  suggestComplete: boolean
  confidence: RequirementInsightConfidence
  extracted: {
    creatinineMgDl?: number
    egfrMlMin?: number
    highlights?: string[]
  }
}

type RawLabResult = {
  test_name?: string
  value?: string
}

type RawLabBundle = {
  results?: RawLabResult[]
  summary?: string
}

export function parseFirstNumber(value: string): number | undefined {
  const normalized = value.replace(/,/g, ".").replace(/\s+/g, " ").trim()
  const m = normalized.match(/-?\d+(?:\.\d+)?/)
  if (!m) return undefined
  const n = Number.parseFloat(m[0])
  return Number.isFinite(n) ? n : undefined
}

function tryParseLabBundle(markdown: string): RawLabBundle | null {
  try {
    const parsed = JSON.parse(markdown) as unknown
    if (!parsed || typeof parsed !== "object") return null
    const o = parsed as Record<string, unknown>
    if (!Array.isArray(o.results)) return null
    return parsed as RawLabBundle
  } catch {
    return null
  }
}

function extractRenalFromBundle(bundle: RawLabBundle): {
  creatinineMgDl?: number
  egfrMlMin?: number
} {
  let creatinineMgDl: number | undefined
  let egfrMlMin: number | undefined

  for (const r of bundle.results ?? []) {
    const name = (r.test_name ?? "").toLowerCase()
    const val = parseFirstNumber(r.value ?? "")
    if (val == null) continue

    if (
      /\bcreatinine\b/.test(name) ||
      name.includes("scr") ||
      name.includes("serum creatinine")
    ) {
      creatinineMgDl = val
    }
    if (/\begfr\b/.test(name) || /\bgfr\b/.test(name) || name.includes("estimated")) {
      egfrMlMin = val
    }
  }

  return { creatinineMgDl, egfrMlMin }
}

function extractRenalFromPlainText(text: string): {
  creatinineMgDl?: number
  egfrMlMin?: number
} {
  const lower = text.toLowerCase()
  let creatinineMgDl: number | undefined
  let egfrMlMin: number | undefined

  const crPatterns = [
    /(?:creatinine|scr|serum\s+creatinine)\s*[:=]?\s*(-?\d+(?:\.\d+)?)\s*(?:mg\/?dl|µmol\/l|umol\/l)?/gi,
    /(?:creatinine|scr)\s+(-?\d+(?:\.\d+)?)/gi,
  ]
  for (const re of crPatterns) {
    const m = re.exec(lower)
    if (m?.[1]) {
      creatinineMgDl = Number.parseFloat(m[1])
      if (Number.isFinite(creatinineMgDl)) break
      creatinineMgDl = undefined
    }
  }

  const egfrPatterns = [
    /(?:egfr|gfr|estimated\s+gfr)\s*[:=]?\s*(-?\d+(?:\.\d+)?)/gi,
    /(?:egfr|gfr)\s+(-?\d+(?:\.\d+)?)/gi,
  ]
  for (const re of egfrPatterns) {
    const m = re.exec(lower)
    if (m?.[1]) {
      egfrMlMin = Number.parseFloat(m[1])
      if (Number.isFinite(egfrMlMin)) break
      egfrMlMin = undefined
    }
  }

  return { creatinineMgDl, egfrMlMin }
}

function classifyRequirement(title: string, description: string | null) {
  const blob = `${title}\n${description ?? ""}`.toLowerCase()
  return {
    wantsRenal:
      /creatinine|egfr|\bgfr\b|renal|kidney|\bbmp\b|contrast|renal function/.test(blob),
    wantsConsent: /consent|signature|signed/.test(blob),
    wantsInsurance: /insurance|pre-?auth|authorization|approval/.test(blob),
  }
}

function buildHighlights(extracted: RequirementAttachmentInsight["extracted"]): string[] {
  const h: string[] = []
  if (extracted.creatinineMgDl != null) {
    h.push(`Creatinine: ${extracted.creatinineMgDl} mg/dL (parsed)`)
  }
  if (extracted.egfrMlMin != null) {
    h.push(`eGFR: ${extracted.egfrMlMin} mL/min/1.73m² (parsed)`)
  }
  return h
}

/**
 * Full pipeline: OCR / analyzer markdown or plain text + requirement metadata → insight.
 */
export function analyzeRequirementAttachmentContent(
  rawContent: string,
  requirementTitle: string,
  requirementDescription: string | null,
): RequirementAttachmentInsight {
  const trimmed = rawContent.trim()
  const { wantsRenal, wantsConsent, wantsInsurance } = classifyRequirement(
    requirementTitle,
    requirementDescription,
  )

  const bundle = tryParseLabBundle(trimmed)
  const fromBundle = bundle ? extractRenalFromBundle(bundle) : {}
  const fromText = extractRenalFromPlainText(trimmed)

  const creatinineMgDl = fromBundle.creatinineMgDl ?? fromText.creatinineMgDl
  const egfrMlMin = fromBundle.egfrMlMin ?? fromText.egfrMlMin

  const extracted: RequirementAttachmentInsight["extracted"] = {}
  if (creatinineMgDl != null) extracted.creatinineMgDl = creatinineMgDl
  if (egfrMlMin != null) extracted.egfrMlMin = egfrMlMin
  extracted.highlights = buildHighlights(extracted)

  /* ── Renal / labs ───────────────────────────────────────────── */
  if (wantsRenal) {
    const hasBoth = creatinineMgDl != null && egfrMlMin != null
    const hasOne =
      creatinineMgDl != null || egfrMlMin != null || (bundle?.results?.length ?? 0) > 0

    if (hasBoth) {
      return {
        summary:
          "Renal indices detected (creatinine + eGFR). Review values against local contrast protocol, then mark verified if appropriate.",
        suggestComplete: true,
        confidence: bundle ? "high" : "medium",
        extracted,
      }
    }

    if (hasOne) {
      return {
        summary:
          "Partial lab data detected. Confirm the missing value (creatinine or eGFR) is documented elsewhere before marking complete.",
        suggestComplete: false,
        confidence: "medium",
        extracted,
      }
    }

    if (trimmed.length < 40) {
      return {
        summary:
          "Not enough text extracted from this file for automatic lab checks. Upload a clearer document or enter values manually.",
        suggestComplete: false,
        confidence: "low",
        extracted,
      }
    }

    return {
      summary:
        "No creatinine/eGFR pattern found in the extracted text. Manual review required.",
      suggestComplete: false,
      confidence: "low",
      extracted,
    }
  }

  /* ── Consent ────────────────────────────────────────────────── */
  if (wantsConsent) {
    const consentLike =
      /consent|signature|patient\s+signature|signed\s+by|witness/i.test(trimmed) &&
      trimmed.length > 80
    if (consentLike) {
      return {
        summary:
          "Document language resembles a consent form. Confirm identity, date, and signatures before marking verified.",
        suggestComplete: true,
        confidence: "medium",
        extracted: { highlights: ["Consent-like wording detected"] },
      }
    }
    return {
      summary:
        "Could not confidently identify consent language. Please verify the PDF/image manually.",
      suggestComplete: false,
      confidence: "low",
      extracted: {},
    }
  }

  /* ── Insurance ──────────────────────────────────────────────── */
  if (wantsInsurance) {
    const ok =
      /approved|authorization|auth\s*#|reference|pre.?auth|eligible/i.test(trimmed) &&
      trimmed.length > 40
    if (ok) {
      return {
        summary:
          "Possible approval or authorization wording found. Confirm reference numbers and validity dates.",
        suggestComplete: true,
        confidence: "low",
        extracted: { highlights: ["Authorization-related keywords detected"] },
      }
    }
    return {
      summary: "No clear approval cues in extracted text. Manual review recommended.",
      suggestComplete: false,
      confidence: "low",
      extracted: {},
    }
  }

  /* ── Generic attachment ─────────────────────────────────────── */
  if (trimmed.length > 120) {
    return {
      summary:
        "Document text extracted; requirement intent is generic. Review content and mark verified only after confirming it meets the directive.",
      suggestComplete: false,
      confidence: "low",
      extracted,
    }
  }

  return {
    summary:
      "Little or no readable text. Try a text export, or run OCR via the medical analyzer service.",
    suggestComplete: false,
    confidence: "low",
    extracted,
  }
}
