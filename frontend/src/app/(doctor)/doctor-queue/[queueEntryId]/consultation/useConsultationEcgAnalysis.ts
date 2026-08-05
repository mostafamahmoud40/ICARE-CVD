"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { showIcareErrorToast } from "@/components/shared/icare-toast"
import { fetchConsultationSession } from "./consultation.api"
import {
  createEcgDocument,
  deleteEcgAnalysis,
  fetchEcgAnalyses,
  saveEcgAnalysis,
  updateEcgReport,
  uploadEcgFileToStorage,
  type ApiEcgAnalysis,
} from "./consultationEcg.api"
import type { EcgReport, EcgResult } from "./ecgAnalysis.types"
import { ecgMlAdapter } from "@/lib/ml"

export type PersistedEcgState = {
  id: string
  fileName: string
  heaFileName: string
  datFileName: string
  heaSize: number
  datSize: number
  analysis: EcgResult
  aiReport: EcgReport | null
}

async function inferEcg(heaFile: File, datFile: File): Promise<EcgResult> {
  return ecgMlAdapter.infer(heaFile, datFile)
}

async function generateEcgReport(ecgResult: EcgResult): Promise<EcgReport> {
  return ecgMlAdapter.generateReport(ecgResult)
}

export function useConsultationEcgAnalysis(
  queueEntryId: string,
  patientId: string | undefined,
  enabled: boolean,
) {
  const queryClient = useQueryClient()
  const [heaFile, setHeaFile] = useState<File | null>(null)
  const [datFile, setDatFile] = useState<File | null>(null)
  const [savedEcg, setSavedEcg] = useState<PersistedEcgState | null>(null)
  const [analysisResult, setAnalysisResult] = useState<EcgResult | null>(null)
  const [report, setReport] = useState<EcgReport | null>(null)
  const [consultationId, setConsultationId] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [reportError, setReportError] = useState<string | null>(null)
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
    queryKey: ["consultation-ecg", patientId, consultationId],
    queryFn: () => fetchEcgAnalyses(patientId!, consultationId ?? undefined),
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
    if (!latest?.analysis) return

    const persisted = mapApiToPersisted(latest)
    setSavedEcg(persisted)
    setAnalysisResult(persisted.analysis)
    setReport(persisted.aiReport)
  }, [analysesQuery.data])

  const handleHeaSelected = useCallback((file: File | null) => {
    setHeaFile(file)
    if (!file) return
    setSavedEcg(null)
    setAnalysisResult(null)
    setReport(null)
    setAnalyzeError(null)
    setReportError(null)
  }, [])

  const handleDatSelected = useCallback((file: File | null) => {
    setDatFile(file)
    if (!file) return
    setSavedEcg(null)
    setAnalysisResult(null)
    setReport(null)
    setAnalyzeError(null)
    setReportError(null)
  }, [])

  const handleRemove = useCallback(async () => {
    if (savedEcg?.id && patientId) {
      try {
        await deleteEcgAnalysis(patientId, savedEcg.id)
        await queryClient.invalidateQueries({
          queryKey: ["consultation-ecg", patientId, consultationId],
        })
      } catch {
        showIcareErrorToast(
          "Could not delete ECG study",
          "The saved analysis may still appear after refresh.",
        )
        return
      }
    }

    setHeaFile(null)
    setDatFile(null)
    setSavedEcg(null)
    setAnalysisResult(null)
    setReport(null)
    setAnalyzeError(null)
    setReportError(null)
  }, [consultationId, patientId, queryClient, savedEcg])

  const persistAnalysis = useCallback(
    async (hea: File, dat: File, ml: EcgResult) => {
      if (!patientId) throw new Error("Patient not loaded")

      const heaKey = await uploadEcgFileToStorage(patientId, hea)
      const heaDoc = await createEcgDocument(patientId, {
        fileName: hea.name,
        contentType: hea.type || "application/octet-stream",
        s3Key: heaKey,
        fileSize: hea.size,
        title: "ECG header (.hea)",
      })

      const datKey = await uploadEcgFileToStorage(patientId, dat)
      const datDoc = await createEcgDocument(patientId, {
        fileName: dat.name,
        contentType: dat.type || "application/octet-stream",
        s3Key: datKey,
        fileSize: dat.size,
        title: "ECG signal (.dat)",
      })

      const saved = await saveEcgAnalysis(patientId, {
        consultationId: consultationId ?? undefined,
        heaDocumentId: heaDoc.id,
        datDocumentId: datDoc.id,
        recordName: ml.meta.record,
        fileName: ml.meta.record || hea.name.replace(/\.hea$/i, ""),
        analysis: ml,
      })

      const persisted = mapApiToPersisted(saved)
      setSavedEcg(persisted)
      setAnalysisResult(persisted.analysis)
      setHeaFile(null)
      setDatFile(null)

      await queryClient.invalidateQueries({
        queryKey: ["consultation-ecg", patientId, consultationId],
      })

      return persisted
    },
    [consultationId, patientId, queryClient],
  )

  const persistReport = useCallback(
    async (analysisId: string, aiReport: EcgReport) => {
      if (!patientId) return
      const updated = await updateEcgReport(patientId, analysisId, aiReport)
      setReport(updated.aiReport)
      setSavedEcg((prev) =>
        prev ? { ...prev, aiReport: updated.aiReport } : prev,
      )
      await queryClient.invalidateQueries({
        queryKey: ["consultation-ecg", patientId, consultationId],
      })
    },
    [consultationId, patientId, queryClient],
  )

  const handleAnalyze = useCallback(async () => {
    if (!heaFile || !datFile) return

    setIsAnalyzing(true)
    setAnalyzeError(null)
    setReportError(null)
    setAnalysisResult(null)
    setReport(null)

    try {
      const result = await inferEcg(heaFile, datFile)
      setAnalysisResult(result)

      const persisted = await persistAnalysis(heaFile, datFile, result)

      setIsGeneratingReport(true)
      try {
        const aiReport = await generateEcgReport(result)
        setReport(aiReport)
        await persistReport(persisted.id, aiReport)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Report generation failed"
        setReportError(message)
      } finally {
        setIsGeneratingReport(false)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed"
      setAnalyzeError(message)
      showIcareErrorToast("ECG analysis failed", message)
    } finally {
      setIsAnalyzing(false)
    }
  }, [datFile, heaFile, persistAnalysis, persistReport])

  return {
    heaFile,
    datFile,
    savedEcg,
    analysisResult,
    report,
    isLoading: analysesQuery.isLoading || sessionQuery.isLoading,
    isAnalyzing,
    isGeneratingReport,
    analyzeError,
    reportError,
    onHeaFileSelected: handleHeaSelected,
    onDatFileSelected: handleDatSelected,
    onRemove: () => void handleRemove(),
    onAnalyze: () => void handleAnalyze(),
  }
}

function mapApiToPersisted(api: ApiEcgAnalysis): PersistedEcgState {
  return {
    id: api.id,
    fileName: api.fileName ?? api.recordName ?? "ECG recording",
    heaFileName: api.heaDocument?.fileName ?? "recording.hea",
    datFileName: api.datDocument?.fileName ?? "recording.dat",
    heaSize: api.heaDocument?.sizeBytes ?? 0,
    datSize: api.datDocument?.sizeBytes ?? 0,
    analysis: api.analysis,
    aiReport: api.aiReport,
  }
}
