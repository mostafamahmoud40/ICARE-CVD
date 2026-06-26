"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { showIcareErrorToast } from "@/components/shared/icare-toast"
import { fetchConsultationSession } from "./consultation.api"
import {
  apiEchoToAnalysisResult,
  base64ToFile,
  createEchoDocument,
  deleteEchoAnalysis,
  fetchEchoAnalyses,
  saveEchoAnalysis,
  updateEchoReport,
  uploadEchoFileToStorage,
  type ApiEchoAnalysis,
} from "./consultationEcho.api"
import {
  useEchoAnalyze,
  useEchoGenerateReport,
  type EchoAnalysisResult,
} from "./useEchoAnalysis"

export type PersistedEchoState = {
  id: string
  fileName: string
  fileSize: number
  videoUrl: string
  analysis: EchoAnalysisResult
  aiReport: string | null
}

export function useConsultationEchoAnalysis(
  queueEntryId: string,
  patientId: string | undefined,
  enabled: boolean,
) {
  const queryClient = useQueryClient()
  const [echoFile, setEchoFile] = useState<File | null>(null)
  const [savedEcho, setSavedEcho] = useState<PersistedEchoState | null>(null)
  const [analysisResult, setAnalysisResult] = useState<EchoAnalysisResult | null>(null)
  const [report, setReport] = useState<string | null>(null)
  const [consultationId, setConsultationId] = useState<string | null>(null)
  const hydratedRef = useRef(false)

  const analyzeMutation = useEchoAnalyze()
  const reportMutation = useEchoGenerateReport()

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
    queryKey: ["consultation-echo", patientId, consultationId],
    queryFn: () => fetchEchoAnalyses(patientId!, consultationId ?? undefined),
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
    if (!latest?.videoUrl) return

    const persisted = mapApiToPersisted(latest)
    setSavedEcho(persisted)
    setAnalysisResult(persisted.analysis)
    setReport(persisted.aiReport)
  }, [analysesQuery.data])

  const handleFileSelected = useCallback((file: File) => {
    setEchoFile(file)
    setSavedEcho(null)
    setAnalysisResult(null)
    setReport(null)
    analyzeMutation.reset()
    reportMutation.reset()
  }, [analyzeMutation, reportMutation])

  const handleRemove = useCallback(async () => {
    if (savedEcho?.id && patientId) {
      try {
        await deleteEchoAnalysis(patientId, savedEcho.id)
        await queryClient.invalidateQueries({
          queryKey: ["consultation-echo", patientId, consultationId],
        })
      } catch {
        showIcareErrorToast(
          "Could not delete echo study",
          "The saved analysis may still appear after refresh.",
        )
        return
      }
    }

    setEchoFile(null)
    setSavedEcho(null)
    setAnalysisResult(null)
    setReport(null)
    analyzeMutation.reset()
    reportMutation.reset()
  }, [analyzeMutation, consultationId, patientId, queryClient, reportMutation, savedEcho])

  const persistAnalysis = useCallback(
    async (file: File, ml: EchoAnalysisResult) => {
      if (!patientId) throw new Error("Patient not loaded")

      const videoKey = await uploadEchoFileToStorage(patientId, file)
      const videoDoc = await createEchoDocument(patientId, {
        fileName: file.name,
        contentType: file.type || "video/mp4",
        s3Key: videoKey,
        fileSize: file.size,
        title: "Echocardiogram source video",
      })

      const overlayFile = base64ToFile(
        ml.overlay_gif,
        `${file.name.replace(/\.[^.]+$/, "")}-segmentation.gif`,
        "image/gif",
      )
      const overlayKey = await uploadEchoFileToStorage(patientId, overlayFile)
      const overlayDoc = await createEchoDocument(patientId, {
        fileName: overlayFile.name,
        contentType: "image/gif",
        s3Key: overlayKey,
        fileSize: overlayFile.size,
        title: "Echo segmentation overlay",
      })

      const frameFile = base64ToFile(
        ml.frame_viz,
        `${file.name.replace(/\.[^.]+$/, "")}-frames.png`,
        "image/png",
      )
      const frameKey = await uploadEchoFileToStorage(patientId, frameFile)
      const frameDoc = await createEchoDocument(patientId, {
        fileName: frameFile.name,
        contentType: "image/png",
        s3Key: frameKey,
        fileSize: frameFile.size,
        title: "Echo frame visualization",
      })

      const saved = await saveEchoAnalysis(patientId, {
        consultationId: consultationId ?? undefined,
        videoDocumentId: videoDoc.id,
        overlayGifDocumentId: overlayDoc.id,
        frameVizDocumentId: frameDoc.id,
        fileName: file.name,
        ef: ml.ef,
        label: ml.label,
        es_frame: ml.es_frame,
        ed_frame: ml.ed_frame,
        es_area: ml.es_area,
        ed_area: ml.ed_area,
        total_frames: ml.total_frames,
        device: ml.device,
        chart_data: ml.chart_data,
      })

      const persisted = mapApiToPersisted(saved)
      setSavedEcho(persisted)
      setAnalysisResult(persisted.analysis)
      setReport(persisted.aiReport)
      setEchoFile(null)

      await queryClient.invalidateQueries({
        queryKey: ["consultation-echo", patientId, consultationId],
      })
    },
    [consultationId, patientId, queryClient],
  )

  const handleAnalyze = useCallback(async () => {
    if (!echoFile) return
    try {
      const result = await analyzeMutation.mutateAsync(echoFile)
      setAnalysisResult(result)
      setReport(null)
      await persistAnalysis(echoFile, result)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed"
      showIcareErrorToast("Echo analysis failed", message)
    }
  }, [analyzeMutation, echoFile, persistAnalysis])

  const handleGenerateReport = useCallback(async () => {
    if (!analysisResult) return
    try {
      const text = await reportMutation.mutateAsync(analysisResult)
      setReport(text)

      const analysisId = savedEcho?.id
      if (analysisId && patientId) {
        const updated = await updateEchoReport(patientId, analysisId, text)
        setReport(updated.aiReport)
        setSavedEcho((prev) =>
          prev ? { ...prev, aiReport: updated.aiReport } : prev,
        )
        await queryClient.invalidateQueries({
          queryKey: ["consultation-echo", patientId, consultationId],
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Report generation failed"
      showIcareErrorToast("Could not generate report", message)
    }
  }, [
    analysisResult,
    consultationId,
    patientId,
    queryClient,
    reportMutation,
    savedEcho,
  ])

  return {
    echoFile,
    savedEcho,
    analysisResult,
    report,
    isLoading: analysesQuery.isLoading || sessionQuery.isLoading,
    isAnalyzing: analyzeMutation.isPending,
    isGeneratingReport: reportMutation.isPending,
    analyzeError:
      analyzeMutation.error instanceof Error ? analyzeMutation.error.message : null,
    onFileSelected: handleFileSelected,
    onRemove: () => void handleRemove(),
    onAnalyze: () => void handleAnalyze(),
    onGenerateReport: () => void handleGenerateReport(),
  }
}

function mapApiToPersisted(api: ApiEchoAnalysis): PersistedEchoState {
  return {
    id: api.id,
    fileName: api.fileName ?? api.videoDocument?.fileName ?? "Echocardiogram",
    fileSize: api.videoDocument?.sizeBytes ?? 0,
    videoUrl: api.videoUrl ?? "",
    analysis: apiEchoToAnalysisResult(api),
    aiReport: api.aiReport,
  }
}
