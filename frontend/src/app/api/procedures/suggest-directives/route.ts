import { NextRequest, NextResponse } from "next/server"

import {
  buildRuleBasedDirectiveSuggestions,
  isLikelyDuplicateSuggestion,
  type DirectiveSuggestionInput,
  type PhysicianDirectiveSuggestion,
} from "@/lib/procedures/physicianDirectiveSuggestions"

export const runtime = "nodejs"

type ExistingReq = { title?: string; description?: string | null }

function parseBody(body: unknown): DirectiveSuggestionInput | null {
  if (!body || typeof body !== "object") return null
  const o = body as Record<string, unknown>
  const procedureName = typeof o.procedureName === "string" ? o.procedureName.trim() : ""
  if (!procedureName) return null

  const notes = typeof o.notes === "string" && o.notes.trim() ? o.notes.trim() : null
  const department = typeof o.department === "string" ? o.department.trim() : ""
  const patientAge =
    typeof o.patientAge === "number" && Number.isFinite(o.patientAge)
      ? o.patientAge
      : typeof o.patientAge === "string"
        ? Number.parseInt(o.patientAge, 10)
        : 0

  const pr = o.priority
  const priority =
    pr === "urgent" || pr === "emergency" || pr === "normal" ? pr : "normal"

  const existing: ExistingReq[] = Array.isArray(o.existingRequirements)
    ? (o.existingRequirements as ExistingReq[])
    : []

  const existingTitles = existing
    .map((r) => (typeof r.title === "string" ? r.title : ""))
    .filter(Boolean)
  const existingDescriptions = existing
    .map((r) => (typeof r.description === "string" ? r.description : ""))
    .filter(Boolean)

  return {
    procedureName,
    notes,
    priority,
    patientAge: Number.isFinite(patientAge) ? Math.max(0, patientAge) : 0,
    department,
    existingTitles,
    existingDescriptions,
  }
}

function stripCodeFence(s: string): string {
  let t = s.trim()
  if (t.startsWith("```")) {
    t = t.replace(/^```[a-zA-Z]*\s*\n?/, "").replace(/\n?```\s*$/, "")
  }
  return t.trim()
}

async function tryLlmSuggestions(
  origin: string,
  input: DirectiveSuggestionInput,
): Promise<PhysicianDirectiveSuggestion[]> {
  const avoid = [...input.existingTitles, ...input.existingDescriptions]
    .slice(0, 14)
    .join("; ")
  const prompt = `You assist hospital cath-lab / procedure coordinators. Return ONLY a JSON array (no markdown fences, no commentary) with at most 3 objects. Each object MUST have:
- "title": short imperative line (max 90 chars)
- "description": one sentence detail or ""
- "allows_attachment": boolean (true if a document upload would normally be expected)

Directives must be operational checklist items only — never diagnoses or drug dosing. If nothing useful beyond standard consent/NPO, return [].

Context:
Procedure: ${input.procedureName}
Department: ${input.department}
Patient age: ${input.patientAge}
Priority: ${input.priority}
Physician notes: ${input.notes ?? "(none)"}
Avoid duplicating checklist titles: ${avoid || "(none)"}`

  try {
    const res = await fetch(`${origin}/api/medical-analyzer/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        history: [{ role: "user", content: prompt }],
        context: {
          task: "procedure_directive_suggestions",
          procedureName: input.procedureName,
          notes: input.notes,
          priority: input.priority,
        },
      }),
    })

    if (!res.ok) return []

    const data = (await res.json()) as {
      success?: boolean
      reply?: string
    }

    if (!data.success || typeof data.reply !== "string" || !data.reply.trim()) return []

    const raw = stripCodeFence(data.reply)
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    const out: PhysicianDirectiveSuggestion[] = []
    for (let i = 0; i < parsed.length; i++) {
      const row = parsed[i]
      if (!row || typeof row !== "object") continue
      const r = row as Record<string, unknown>
      const title = typeof r.title === "string" ? r.title.trim() : ""
      if (!title) continue
      const description =
        typeof r.description === "string" && r.description.trim()
          ? r.description.trim()
          : null
      const allowsAttachment = Boolean(r.allows_attachment)

      const suggestion: PhysicianDirectiveSuggestion = {
        id: `llm-${i}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`,
        title,
        description,
        rationale: "Suggested by AI — review before adding.",
        allowsAttachment,
        source: "llm",
      }

      if (isLikelyDuplicateSuggestion(suggestion, input)) continue
      if (out.some((x) => x.title.toLowerCase() === suggestion.title.toLowerCase())) continue
      out.push(suggestion)
    }

    return out
  } catch {
    return []
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const json: unknown = await req.json().catch(() => null)
    const input = parseBody(json)
    if (!input) {
      return NextResponse.json(
        { success: false, error: "Invalid body: procedureName required" },
        { status: 400 },
      )
    }

    const rules = buildRuleBasedDirectiveSuggestions(input)
    const origin = new URL(req.url).origin
    const llmExtra = await tryLlmSuggestions(origin, input)

    const merged: PhysicianDirectiveSuggestion[] = [...rules]
    for (const s of llmExtra) {
      if (merged.some((m) => m.title.toLowerCase() === s.title.toLowerCase())) continue
      if (isLikelyDuplicateSuggestion(s, input)) continue
      merged.push(s)
    }

    return NextResponse.json({
      success: true,
      suggestions: merged.slice(0, 10),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Suggest-directives failed"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
