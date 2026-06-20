"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { showIcareErrorToast } from "@/components/shared/icare-toast"
import type { MriResult } from "./CineMRISection"
import { fetchConsultationSession } from "./consultation.api"
import {
  apiToMriResult,
  base64ToFile,
  createCineMriDocument,
  deleteCineMriAnalysis,
  fetchCineMriAnalyses,
  mlJsonToMriResult,
  saveCineMriAnalysis,
  uploadCineMriFileToStorage,
  type ApiCineMriAnalysis,
} from "./consultationCineMri.api"

const MRI_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_MRI_SERVICE_URL ?? "http://localhost:8090")
    : "http://localhost:8090"

export type AnalysisStatus = "idle" | "processing" | "done" | "error"

export type PersistedMriFileMeta = {
  fileName: string
  fileSize: number
}

export type PersistedCineMriStudy = {
  id: string
  edFile: PersistedMriFileMeta
  esFile: PersistedMriFileMeta
  result: MriResult
}

export function useConsultationCineMri(
  queueEntryId: string,
  patientId: string | undefined,
  enabled: boolean,
) {
  const queryClient = useQueryClient()
  const [edFile, setEdFile] = useState<File | null>(null)
  const [esFile, setEsFile] = useState<File | null>(null)
  const [status, setStatus] = useState<AnalysisStatus>("idle")
  const [result, setResult] = useState<MriResult | null>(null)
  const [savedStudy, setSavedStudy] = useState<PersistedCineMriStudy | null>(null)
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
    queryKey: ["consultation-cine-mri", patientId, consultationId],
    queryFn: () => fetchCineMriAnalyses(patientId!, consultationId ?? undefined),
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
    if (!latest?.edDocument || !latest.esDocument) return

    const persisted = mapApiToPersisted(latest)
    setSavedStudy(persisted)
    setResult(persisted.result)
    setStatus("done")
  }, [analysesQuery.data])

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
      await deleteCineMriAnalysis(patientId, savedStudy.id)
      await queryClient.invalidateQueries({
        queryKey: ["consultation-cine-mri", patientId, consultationId],
      })
    } catch {
      showIcareErrorToast(
        "Could not delete MRI study",
        "The saved analysis may still appear after refresh.",
      )
      throw new Error("delete failed")
    }
    setSavedStudy(null)
  }, [consultationId, patientId, queryClient, savedStudy?.id])

  const handleEdFileSelected = useCallback(
    (file: File) => {
      resetLocal()
      setSavedStudy(null)
      setEdFile(file)
    },
    [resetLocal],
  )

  const handleEsFileSelected = useCallback(
    (file: File) => {
      resetLocal()
      setSavedStudy(null)
      setEsFile(file)
    },
    [resetLocal],
  )

  const handleRemoveEd = useCallback(async () => {
    try {
      if (savedStudy) await deleteSavedStudy()
    } catch {
      return
    }
    resetLocal()
    setEdFile(null)
    setEsFile(null)
  }, [deleteSavedStudy, resetLocal, savedStudy])

  const handleRemoveEs = useCallback(async () => {
    try {
      if (savedStudy) await deleteSavedStudy()
    } catch {
      return
    }
    resetLocal()
    setEdFile(null)
    setEsFile(null)
  }, [deleteSavedStudy, resetLocal, savedStudy])

  const persistMlResult = useCallback(
    async (ed: File, es: File, ml: ReturnType<typeof mlJsonToMriResult>) => {
      if (!patientId) throw new Error("Patient not loaded")

      const edKey = await uploadCineMriFileToStorage(patientId, ed)
      const edDoc = await createCineMriDocument(patientId, {
        fileName: ed.name,
        contentType: ed.type || "application/gzip",
        s3Key: edKey,
        fileSize: ed.size,
        title: "Cine-MRI end-diastolic (ED)",
      })

      const esKey = await uploadCineMriFileToStorage(patientId, es)
      const esDoc = await createCineMriDocument(patientId, {
        fileName: es.name,
        contentType: es.type || "application/gzip",
        s3Key: esKey,
        fileSize: es.size,
        title: "Cine-MRI end-systolic (ES)",
      })

      const baseName = ed.name.replace(/\.nii(\.gz)?$/i, "")

      const rawGifFile = base64ToFile(
        ml.rawGifB64,
        `${baseName}-raw-loop.gif`,
        "image/gif",
      )
      const rawGifKey = await uploadCineMriFileToStorage(patientId, rawGifFile)
      const rawGifDoc = await createCineMriDocument(patientId, {
        fileName: rawGifFile.name,
        contentType: "image/gif",
        s3Key: rawGifKey,
        fileSize: rawGifFile.size,
        title: "Cine-MRI raw loop",
      })

      const segGifFile = base64ToFile(
        ml.segGifB64,
        `${baseName}-segmentation.gif`,
        "image/gif",
      )
      const segGifKey = await uploadCineMriFileToStorage(patientId, segGifFile)
      const segGifDoc = await createCineMriDocument(patientId, {
        fileName: segGifFile.name,
        contentType: "image/gif",
        s3Key: segGifKey,
        fileSize: segGifFile.size,
        title: "Cine-MRI segmentation animation",
      })

      const segGridEdFile = base64ToFile(
        ml.segGridEdB64,
        `${baseName}-seg-grid-ed.png`,
        "image/png",
      )
      const segGridEdKey = await uploadCineMriFileToStorage(patientId, segGridEdFile)
      const segGridEdDoc = await createCineMriDocument(patientId, {
        fileName: segGridEdFile.name,
        contentType: "image/png",
        s3Key: segGridEdKey,
        fileSize: segGridEdFile.size,
        title: "Cine-MRI segmentation grid ED",
      })

      const segGridEsFile = base64ToFile(
        ml.segGridEsB64,
        `${baseName}-seg-grid-es.png`,
        "image/png",
      )
      const segGridEsKey = await uploadCineMriFileToStorage(patientId, segGridEsFile)
      const segGridEsDoc = await createCineMriDocument(patientId, {
        fileName: segGridEsFile.name,
        contentType: "image/png",
        s3Key: segGridEsKey,
        fileSize: segGridEsFile.size,
        title: "Cine-MRI segmentation grid ES",
      })

      const saved = await saveCineMriAnalysis(patientId, {
        consultationId: consultationId ?? undefined,
        edDocumentId: edDoc.id,
        esDocumentId: esDoc.id,
        rawGifDocumentId: rawGifDoc.id,
        segGifDocumentId: segGifDoc.id,
        segGridEdDocumentId: segGridEdDoc.id,
        segGridEsDocumentId: segGridEsDoc.id,
        diagnosisClass: ml.diagnosisClass,
        elapsedSec: ml.elapsedSec,
        clinicalFeatures: ml.clinicalFeatures,
      })

      const persisted = mapApiToPersisted(saved)
      setSavedStudy(persisted)
      setResult(persisted.result)
      setEdFile(null)
      setEsFile(null)

      await queryClient.invalidateQueries({
        queryKey: ["consultation-cine-mri", patientId, consultationId],
      })
    },
    [consultationId, patientId, queryClient],
  )

  const runAnalysis = useCallback(async () => {
    if (!edFile || !esFile) return

    resetLocal()
    setStatus("processing")
    setElapsed(0)
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000)

    try {
      const formData = new FormData()
      formData.append("ed_file", edFile)
      formData.append("es_file", esFile)

      const res = await fetch(`${MRI_URL}/predict`, {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const text = await res.text().catch(() => `HTTP ${res.status}`)
        throw new Error(text || `HTTP ${res.status}`)
      }

      const json = await res.json()
      const ml = mlJsonToMriResult(json)

      const liveResult: MriResult = {
        diagnosisClass: ml.diagnosisClass,
        elapsedSec: ml.elapsedSec,
        clinicalFeatures: ml.clinicalFeatures,
        rawGifB64: ml.rawGifB64,
        segGifB64: ml.segGifB64,
        segGridEdB64: ml.segGridEdB64,
        segGridEsB64: ml.segGridEsB64,
      }
      setResult(liveResult)

      await persistMlResult(edFile, esFile, ml)
      setStatus("done")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      setErrorMsg(message)
      setStatus("error")
      showIcareErrorToast("MRI analysis failed", message)
    } finally {
      clearTimer()
    }
  }, [clearTimer, edFile, esFile, persistMlResult, resetLocal])

  return {
    edFile,
    esFile,
    savedStudy,
    result,
    status,
    errorMsg,
    elapsed,
    isLoading: analysesQuery.isLoading || sessionQuery.isLoading,
    onEdFileSelected: handleEdFileSelected,
    onEsFileSelected: handleEsFileSelected,
    onRemoveEd: () => void handleRemoveEd(),
    onRemoveEs: () => void handleRemoveEs(),
    onAnalyze: () => void runAnalysis(),
    onRetry: () => void runAnalysis(),
  }
}

function mapApiToPersisted(api: ApiCineMriAnalysis): PersistedCineMriStudy {
  return {
    id: api.id,
    edFile: {
      fileName: api.edDocument?.fileName ?? "ED scan",
      fileSize: api.edDocument?.sizeBytes ?? 0,
    },
    esFile: {
      fileName: api.esDocument?.fileName ?? "ES scan",
      fileSize: api.esDocument?.sizeBytes ?? 0,
    },
    result: apiToMriResult(api),
  }
}
