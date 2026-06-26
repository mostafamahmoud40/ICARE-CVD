"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { showIcareErrorToast } from "@/components/shared/icare-toast"
import type { SegmentationResult } from "./CTScanSection"
import { fetchConsultationSession } from "./consultation.api"
import {
  apiToSegmentationResult,
  base64ToFile,
  createCtDocument,
  dataUrlToFile,
  deleteCtAnalysis,
  fetchCtAnalyses,
  mlJsonToCtResult,
  saveCtAnalysis,
  uploadCtFileToStorage,
  type ApiCtAnalysis,
} from "./consultationCt.api"
import { medicalAnalyzerMlAdapter } from "@/lib/ml"

export type AnalysisStatus = "idle" | "processing" | "done" | "error"

export type PersistedCtStudy = {
  id: string
  fileName: string
  fileSize: number
  result: SegmentationResult
}

export function useConsultationCtAnalysis(
  queueEntryId: string,
  patientId: string | undefined,
  enabled: boolean,
) {
  const queryClient = useQueryClient()
  const [ctFile, setCtFile] = useState<File | null>(null)
  const [status, setStatus] = useState<AnalysisStatus>("idle")
  const [result, setResult] = useState<SegmentationResult | null>(null)
  const [savedStudy, setSavedStudy] = useState<PersistedCtStudy | null>(null)
  const [errorMsg, setErrorMsg] = useState("")
  const [elapsed, setElapsed] = useState(0)
  const [consultationId, setConsultationId] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
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
    queryKey: ["consultation-ct", patientId, consultationId],
    queryFn: () => fetchCtAnalyses(patientId!, consultationId ?? undefined),
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
    if (!latest?.axialUrl || !latest.maskUrl) return

    const persisted = mapApiToPersisted(latest)
    setSavedStudy(persisted)
    setResult(persisted.result)
    setStatus("done")
  }, [analysesQuery.data])

  useEffect(() => {
    if (status === "processing") {
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [status])

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const resetLocal = useCallback(() => {
    clearTimer()
    setStatus("idle")
    setResult(null)
    setErrorMsg("")
    setElapsed(0)
  }, [clearTimer])

  const deleteSavedStudy = useCallback(async () => {
    if (!savedStudy?.id || !patientId) return
    try {
      await deleteCtAnalysis(patientId, savedStudy.id)
      await queryClient.invalidateQueries({
        queryKey: ["consultation-ct", patientId, consultationId],
      })
    } catch {
      showIcareErrorToast(
        "Could not delete CT study",
        "The saved analysis may still appear after refresh.",
      )
      throw new Error("delete failed")
    }
    setSavedStudy(null)
  }, [consultationId, patientId, queryClient, savedStudy])

  const handleFileSelected = useCallback(
    (file: File) => {
      resetLocal()
      setSavedStudy(null)
      setCtFile(file)
    },
    [resetLocal],
  )

  const handleRemove = useCallback(async () => {
    try {
      if (savedStudy) await deleteSavedStudy()
    } catch {
      return
    }
    resetLocal()
    setCtFile(null)
  }, [deleteSavedStudy, resetLocal, savedStudy])

  const persistMlResult = useCallback(
    async (file: File, ml: ReturnType<typeof mlJsonToCtResult>) => {
      if (!patientId) throw new Error("Patient not loaded")

      const baseName = file.name.replace(/\.nii(\.gz)?$/i, "")

      const sourceKey = await uploadCtFileToStorage(patientId, file)
      const sourceDoc = await createCtDocument(patientId, {
        fileName: file.name,
        contentType: file.type || "application/gzip",
        s3Key: sourceKey,
        fileSize: file.size,
        title: "Cardiac CT source volume",
      })

      const maskFile = base64ToFile(
        ml.maskB64,
        `segmentation_${baseName}.nii.gz`,
        "application/gzip",
      )
      const maskKey = await uploadCtFileToStorage(patientId, maskFile)
      const maskDoc = await createCtDocument(patientId, {
        fileName: maskFile.name,
        contentType: "application/gzip",
        s3Key: maskKey,
        fileSize: maskFile.size,
        title: "Coronary segmentation mask",
      })

      const axialFile = dataUrlToFile(ml.slices.axial, `${baseName}-axial.png`)
      const axialKey = await uploadCtFileToStorage(patientId, axialFile)
      const axialDoc = await createCtDocument(patientId, {
        fileName: axialFile.name,
        contentType: "image/png",
        s3Key: axialKey,
        fileSize: axialFile.size,
        title: "CT axial slice",
      })

      const coronalFile = dataUrlToFile(ml.slices.coronal, `${baseName}-coronal.png`)
      const coronalKey = await uploadCtFileToStorage(patientId, coronalFile)
      const coronalDoc = await createCtDocument(patientId, {
        fileName: coronalFile.name,
        contentType: "image/png",
        s3Key: coronalKey,
        fileSize: coronalFile.size,
        title: "CT coronal slice",
      })

      const sagittalFile = dataUrlToFile(ml.slices.sagittal, `${baseName}-sagittal.png`)
      const sagittalKey = await uploadCtFileToStorage(patientId, sagittalFile)
      const sagittalDoc = await createCtDocument(patientId, {
        fileName: sagittalFile.name,
        contentType: "image/png",
        s3Key: sagittalKey,
        fileSize: sagittalFile.size,
        title: "CT sagittal slice",
      })

      const saved = await saveCtAnalysis(patientId, {
        consultationId: consultationId ?? undefined,
        sourceDocumentId: sourceDoc.id,
        maskDocumentId: maskDoc.id,
        axialSliceDocumentId: axialDoc.id,
        coronalSliceDocumentId: coronalDoc.id,
        sagittalSliceDocumentId: sagittalDoc.id,
        fileName: file.name,
        voxelCount: ml.voxelCount,
        predShape: ml.predShape,
        volumeMl: ml.volumeMl,
        elapsedSec: ml.elapsedSec,
      })

      const persisted = mapApiToPersisted(saved)
      setSavedStudy(persisted)
      setResult(persisted.result)
      setCtFile(null)

      await queryClient.invalidateQueries({
        queryKey: ["consultation-ct", patientId, consultationId],
      })
    },
    [consultationId, patientId, queryClient],
  )

  const runAnalysis = useCallback(async () => {
    if (!ctFile) return

    resetLocal()
    setStatus("processing")

    try {
      const json = (await medicalAnalyzerMlAdapter.segmentCt(ctFile)) as Record<
        string,
        unknown
      >
      const ml = mlJsonToCtResult(json)

      const liveResult: SegmentationResult = {
        voxelCount: ml.voxelCount,
        predShape: ml.predShape,
        volumeMl: ml.volumeMl,
        elapsedSec: ml.elapsedSec,
        slices: ml.slices,
        maskB64: ml.maskB64,
      }
      setResult(liveResult)

      await persistMlResult(ctFile, ml)
      setStatus("done")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      setErrorMsg(message)
      setStatus("error")
      showIcareErrorToast("CT analysis failed", message)
    } finally {
      clearTimer()
    }
  }, [clearTimer, ctFile, persistMlResult, resetLocal])

  return {
    ctFile,
    savedStudy,
    result,
    status,
    errorMsg,
    elapsed,
    isLoading: analysesQuery.isLoading || sessionQuery.isLoading,
    onFileSelected: handleFileSelected,
    onRemove: () => void handleRemove(),
    onAnalyze: () => void runAnalysis(),
    onRetry: () => void runAnalysis(),
  }
}

function mapApiToPersisted(api: ApiCtAnalysis): PersistedCtStudy {
  return {
    id: api.id,
    fileName: api.fileName ?? api.sourceDocument?.fileName ?? "CT scan",
    fileSize: api.sourceDocument?.sizeBytes ?? 0,
    result: apiToSegmentationResult(api),
  }
}
