"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { LabMaterialFile } from "./consultation.types"
import type {
  LabAnalysisBundle,
  LabAnalysisPhase,
  LabResultStatus,
  MedicalAnalyzerRawBundle,
} from "./labMaterials.types"
import { medicalAnalyzerMlAdapter } from "@/lib/ml"

// ─── Response mapper (SRP: shape translation only) ────────────────────────────

function mapRawBundle(raw: MedicalAnalyzerRawBundle): LabAnalysisBundle {
  return {
    facility: {
      hospitalName: raw.facility?.hospital_name ?? "",
      labName:      raw.facility?.lab_name      ?? "",
      doctorName:   raw.facility?.doctor_name   ?? "",
    },
    patient: {
      id:            raw.patient?.id             ?? "",
      dateCollected: raw.patient?.date_collected ?? "",
      dateReported:  raw.patient?.date_reported  ?? "",
    },
    results: (raw.results ?? []).map((r) => ({
      testName:       r.test_name       ?? "",
      value:          r.value           ?? "",
      unit:           r.unit            ?? "",
      referenceRange: r.reference_range ?? "",
      status: (r.status ?? "Normal") as LabResultStatus,
    })),
    summary: raw.summary ?? "",
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export type UseLabMaterialsWorkspaceResult = {
  /** True after files are added, while AI runs, or after results exist. */
  workspaceOpen: boolean
  analysisPhase: LabAnalysisPhase
  analysis: LabAnalysisBundle | null
  analysisError: string | null
  chatOpen: boolean
  setChatOpen: (open: boolean) => void
  runAiAnalysis: () => Promise<void>
}

/**
 * Owns lab workspace visibility and AI analysis lifecycle.
 * Calls the Medical Analyzer Flask service for real OCR + structuring.
 * Parent keeps the file list; this hook owns analysis UI state only (SRP).
 */
export function useLabMaterialsWorkspace(
  items: LabMaterialFile[],
): UseLabMaterialsWorkspaceResult {
  const [analysisPhase, setAnalysisPhase] = useState<LabAnalysisPhase>("idle")
  const [analysis, setAnalysis] = useState<LabAnalysisBundle | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [chatOpen, setChatOpen] = useState(false)

  const itemSig = useMemo(
    () => items.map((i) => i.id).sort().join("|"),
    [items],
  )
  const prevSigRef = useRef(itemSig)

  const workspaceOpen =
    items.length > 0 ||
    analysisPhase === "analyzing" ||
    analysisPhase === "complete" ||
    analysisPhase === "error"

  // Reset analysis when file list changes after a completed run
  useEffect(() => {
    if (items.length === 0) {
      setAnalysisPhase("idle")
      setAnalysis(null)
      setAnalysisError(null)
      prevSigRef.current = ""
      return
    }
    if (analysisPhase !== "analyzing") {
      if (
        prevSigRef.current !== itemSig &&
        (analysisPhase === "complete" || analysisPhase === "error")
      ) {
        setAnalysisPhase("idle")
        setAnalysis(null)
        setAnalysisError(null)
      }
    }
    prevSigRef.current = itemSig
  }, [itemSig, items.length, analysisPhase])

  const runAiAnalysis = useCallback(async () => {
    if (items.length === 0) return

    setAnalysisPhase("analyzing")
    setAnalysis(null)
    setAnalysisError(null)

    // The Medical Analyzer accepts one document at a time — use the first file.
    // Multiple files: the first document's analysis is shown; upload remaining
    // individually if needed (can be extended to sequential calls later).
    const firstFile = items.find((item) => item.file)?.file
    if (!firstFile) {
      setAnalysisError("No local file available to analyze. Re-upload the report.")
      setAnalysisPhase("error")
      return
    }

    const formData = new FormData()
    formData.append("file", firstFile)

    try {
      const data = (await medicalAnalyzerMlAdapter.ocr(formData)) as {
        success: boolean
        markdown?: string
        llm_error?: string
        error?: string
      }

      if (!data.success) throw new Error(data.error ?? "Analysis failed")
      if (data.llm_error) throw new Error(`AI structuring failed: ${data.llm_error}`)
      if (!data.markdown) throw new Error("Empty response from the analyzer")

      const rawBundle = JSON.parse(data.markdown) as MedicalAnalyzerRawBundle
      setAnalysis(mapRawBundle(rawBundle))
      setAnalysisPhase("complete")
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : "Unknown error")
      setAnalysisPhase("error")
    }
  }, [items])

  return {
    workspaceOpen,
    analysisPhase,
    analysis,
    analysisError,
    chatOpen,
    setChatOpen,
    runAiAnalysis,
  }
}
