import { NextRequest, NextResponse } from "next/server"

import {
  analyzeRequirementAttachmentContent,
  type RequirementAttachmentInsight,
} from "@/lib/procedures/requirementAttachmentAnalysis"

export const runtime = "nodejs"

async function readPlainTextFile(file: File): Promise<string | null> {
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  if (type.startsWith("text/") || name.endsWith(".txt") || name.endsWith(".csv")) {
    try {
      return await file.text()
    } catch {
      return null
    }
  }
  return null
}

/**
 * Calls the existing Next.js OCR proxy (same origin) so the browser never hits Flask directly.
 */
async function tryExtractViaMedicalAnalyzer(
  file: File,
  origin: string,
): Promise<string | null> {
  try {
    const fd = new FormData()
    fd.append("file", file)

    const res = await fetch(`${origin}/api/medical-analyzer/ocr`, {
      method: "POST",
      body: fd,
    })

    if (!res.ok) return null

    const data = (await res.json()) as {
      success?: boolean
      markdown?: string
      error?: string
    }

    if (!data.success || typeof data.markdown !== "string" || !data.markdown.trim()) {
      return null
    }

    return data.markdown
  } catch {
    return null
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const form = await req.formData()
    const file = form.get("file")
    const titleRaw = form.get("requirementTitle")
    const descRaw = form.get("requirementDescription")

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { success: false, error: "Missing or empty file" },
        { status: 400 },
      )
    }

    const requirementTitle =
      typeof titleRaw === "string" && titleRaw.trim() ? titleRaw.trim() : "Requirement"
    const requirementDescription =
      typeof descRaw === "string" && descRaw.trim() ? descRaw.trim() : null

    const origin = new URL(req.url).origin

    let rawContent = (await readPlainTextFile(file)) ?? ""

    if (!rawContent.trim()) {
      rawContent = (await tryExtractViaMedicalAnalyzer(file, origin)) ?? ""
    }

    const insight: RequirementAttachmentInsight = analyzeRequirementAttachmentContent(
      rawContent,
      requirementTitle,
      requirementDescription,
    )

    return NextResponse.json({ success: true, insight })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
