"use client"

import { useMutation } from "@tanstack/react-query"

import type { PhysicianDirectiveSuggestion } from "@/lib/procedures/physicianDirectiveSuggestions"

import type { ProcedureOrder } from "./assistantProcedures.types"

async function fetchDirectiveSuggestions(
  order: ProcedureOrder,
): Promise<PhysicianDirectiveSuggestion[]> {
  const res = await fetch("/api/procedures/suggest-directives", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      procedureName: order.procedureName,
      notes: order.notes,
      priority: order.priority,
      patientAge: order.patientAge,
      department: order.department,
      existingRequirements: order.requirements.map((r) => ({
        title: r.title,
        description: r.description,
      })),
    }),
  })

  const data: unknown = await res.json().catch(() => ({}))
  const obj = data && typeof data === "object" ? (data as Record<string, unknown>) : {}

  if (!res.ok) {
    const err = typeof obj.error === "string" ? obj.error : `Request failed (${res.status})`
    throw new Error(err)
  }

  if (obj.success !== true || !Array.isArray(obj.suggestions)) {
    throw new Error("Invalid suggestions response")
  }

  return obj.suggestions as PhysicianDirectiveSuggestion[]
}

export function useSuggestPhysicianDirectives() {
  return useMutation({
    mutationFn: fetchDirectiveSuggestions,
  })
}
