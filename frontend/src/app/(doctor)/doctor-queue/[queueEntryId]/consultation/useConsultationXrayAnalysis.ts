"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { showIcareErrorToast } from "@/components/shared/icare-toast"
import { fetchConsultationSession } from "./consultation.api"
import {
  annotatedFileName,
  createXrayDocument,
  dataUrlToFile,
  deleteXrayAnalysis,
  fetchXrayAnalyses,
  saveXrayAnalysis,
  uploadXrayFileToStorage,
  type ApiXrayAnalysis,
  type XrayMlResult,
  type XrayRiskLevel,
} from "./consultationXray.api"

const ML_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_ML_SERVICE_URL ?? "http://localhost:8000")
    : "http://localhost:8000"

export type XrayAnalysisStatus = "idle" | "processing" | "done" | "error"

export type PersistedXrayResult = {
  id: string
  fileName: string
  fileSize: number
  riskLevel: XrayRiskLevel
  findings: Record<string, number>
  interpretation: string[]
  totalDetections: number
  inferenceTimeMs: number
  originalImageUrl: string
  annotatedImageUrl: string
}

export function useConsultationXrayAnalysis(
  queueEntryId: string,
  patientId: string | undefined,
  enabled: boolean,
) {
  const queryClient = useQueryClient()
  const [xrayFile, setXrayFile] = useState<File | null>(null)
  const [status, setStatus] = useState<XrayAnalysisStatus>("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [savedResult, setSavedResult] = useState<PersistedXrayResult | null>(null)
  const [consultationId, setConsultationId] = useState<string | null>(null)
  const hydratedRef = useRef(false)

  const sessionQuery = useQuery({
    queryKey: ["consultation-session", queueEntryId],
    queryFn: () => fetchConsultationSession(queueEntryId),
    enabled,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (!sessionQuery.data) return
    setConsultationId(sessionQuery.data.consultation.id)
  }, [sessionQuery.data])

  const analysesQuery = useQuery({
    queryKey: ["consultation-xray", patientId, consultationId],
    queryFn: () => fetchXrayAnalyses(patientId!, consultationId ?? undefined),
    enabled: Boolean(patientId && consultationId && enabled),
    staleTime: 30_000,
  })

  useEffect(() => {
    hydratedRef.current = false
  }, [queueEntryId])

  useEffect(() => {
    if (!analysesQuery.data?.length || hydratedRef.current) return
    hydratedRef.current = true

    const latest = analysesQuery.data[0]
    if (!latest?.originalImageUrl || !latest.annotatedImageUrl) return

    setSavedResult(mapApiToPersisted(latest))
    setStatus("done")
  }, [analysesQuery.data])

  const handleFileSelected = useCallback((file: File) => {
    setXrayFile(file)
    setSavedResult(null)
    setStatus("idle")
    setErrorMsg("")
  }, [])

  const handleRemove = useCallback(async () => {
    if (savedResult?.id && patientId) {
      try {
        await deleteXrayAnalysis(patientId, savedResult.id)
        await queryClient.invalidateQueries({
          queryKey: ["consultation-xray", patientId, consultationId],
        })
      } catch {
        showIcareErrorToast(
          "Could not delete X-ray",
          "The saved analysis may still appear after refresh.",
        )
        return
      }
    }

    setXrayFile(null)
    setSavedResult(null)
    setStatus("idle")
    setErrorMsg("")
  }, [consultationId, patientId, queryClient, savedResult])

  const persistMlResult = useCallback(
    async (file: File, ml: XrayMlResult) => {
      if (!patientId) throw new Error("Patient not loaded")

      const originalKey = await uploadXrayFileToStorage(patientId, file)
      const originalDoc = await createXrayDocument(patientId, {
        fileName: file.name,
        contentType: file.type || "image/jpeg",
        s3Key: originalKey,
        fileSize: file.size,
        title: "Chest X-ray source",
      })

      const annotatedFile = dataUrlToFile(
        ml.annotatedB64,
        annotatedFileName(file.name),
      )
      const annotatedKey = await uploadXrayFileToStorage(patientId, annotatedFile)
      const annotatedDoc = await createXrayDocument(patientId, {
        fileName: annotatedFile.name,
        contentType: annotatedFile.type,
        s3Key: annotatedKey,
        fileSize: annotatedFile.size,
        title: "Chest X-ray AI overlay",
      })

      const saved = await saveXrayAnalysis(patientId, {
        consultationId: consultationId ?? undefined,
        originalDocumentId: originalDoc.id,
        annotatedDocumentId: annotatedDoc.id,
        fileName: file.name,
        riskLevel: ml.riskLevel,
        findings: ml.findings,
        interpretation: ml.interpretation,
        totalDetections: ml.totalDetections,
        inferenceTimeMs: ml.inferenceTimeMs,
      })

      if (!saved.originalImageUrl || !saved.annotatedImageUrl) {
        throw new Error("Saved images are not available yet")
      }

      setSavedResult(mapApiToPersisted(saved))
      setXrayFile(null)
      await queryClient.invalidateQueries({
        queryKey: ["consultation-xray", patientId, consultationId],
      })
    },
    [consultationId, patientId, queryClient],
  )

  const runAnalysis = useCallback(async () => {
    if (!xrayFile) return
    setStatus("processing")
    setErrorMsg("")

    try {
      const formData = new FormData()
      formData.append("file", xrayFile)

      const res = await fetch(`${ML_URL}/api/v1/xray/analyze`, {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const text = await res.text().catch(() => `HTTP ${res.status}`)
        throw new Error(text || `HTTP ${res.status}`)
      }

      const json = await res.json()
      const ml: XrayMlResult = {
        findings: json.findings,
        riskLevel: json.risk_level,
        interpretation: json.interpretation,
        originalB64: json.original_b64,
        annotatedB64: json.annotated_b64,
        totalDetections: json.total_detections,
        inferenceTimeMs: json.inference_time_ms,
      }

      await persistMlResult(xrayFile, ml)
      setStatus("done")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      setErrorMsg(message)
      setStatus("error")
      showIcareErrorToast("X-ray analysis failed", message)
    }
  }, [persistMlResult, xrayFile])

  return {
    xrayFile,
    savedResult,
    status,
    errorMsg,
    isLoading: analysesQuery.isLoading || sessionQuery.isLoading,
    isProcessing: status === "processing",
    onFileSelected: handleFileSelected,
    onRemove: () => void handleRemove(),
    onAnalyze: () => void runAnalysis(),
    onRetry: () => void runAnalysis(),
  }
}

function mapApiToPersisted(api: ApiXrayAnalysis): PersistedXrayResult {
  return {
    id: api.id,
    fileName: api.fileName ?? api.originalDocument?.fileName ?? "Chest X-ray",
    fileSize: api.originalDocument?.sizeBytes ?? 0,
    riskLevel: api.riskLevel,
    findings: api.findings,
    interpretation: api.interpretation,
    totalDetections: api.totalDetections,
    inferenceTimeMs: api.inferenceTimeMs,
    originalImageUrl: api.originalImageUrl ?? "",
    annotatedImageUrl: api.annotatedImageUrl ?? "",
  }
}
