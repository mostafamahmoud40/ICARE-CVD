"use client"

import { useMutation } from "@tanstack/react-query"

import type { RequirementAttachmentInsight } from "@/lib/procedures/requirementAttachmentAnalysis"

export type AnalyzeRequirementAttachmentInput = {
  file: File
  requirementTitle: string
  requirementDescription: string | null
}

async function postAnalyzeRequirementAttachment(
  input: AnalyzeRequirementAttachmentInput,
): Promise<RequirementAttachmentInsight> {
  const form = new FormData()
  form.append("file", input.file)
  form.append("requirementTitle", input.requirementTitle)
  if (input.requirementDescription) {
    form.append("requirementDescription", input.requirementDescription)
  }

  const res = await fetch("/api/procedures/analyze-requirement-attachment", {
    method: "POST",
    body: form,
  })

  const data: unknown = await res.json().catch(() => ({}))
  const obj = data && typeof data === "object" ? (data as Record<string, unknown>) : {}

  if (!res.ok) {
    const err =
      typeof obj.error === "string" ? obj.error : `Request failed (${res.status})`
    throw new Error(err)
  }

  if (obj.success !== true || !obj.insight || typeof obj.insight !== "object") {
    throw new Error("Invalid analysis response")
  }

  return obj.insight as RequirementAttachmentInsight
}

export function useAnalyzeRequirementAttachment() {
  return useMutation({
    mutationFn: postAnalyzeRequirementAttachment,
  })
}
