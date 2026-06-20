"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { showIcareErrorToast } from "@/components/shared/icare-toast"
import { fetchConsultationSession } from "./consultation.api"
import {
  apiToClassificationResult,
  base64ToFile,
  createEcgClsDocument,
  deleteEcgClsAnalysis,
  fetchEcgClsAnalyses,
  saveEcgClsAnalysis,
  uploadEcgClsFileToStorage,
  type ApiEcgClsAnalysis,
  type EcgClassificationResult,
  type EcgClsInputSource,
} from "./consultationEcgCls.api"

const ECG_CLS_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_ECG_CLASSIFICATION_URL ?? "http://localhost:8503")
    : "http://localhost:8503"

export type AnalysisStatus = "idle" | "processing" | "done" | "error"

export type PersistedEcgClsStudy = {
  id: string
  inputSource: EcgClsInputSource
  fileName: string
  imageFileName?: string
  heaFileName?: string
  datFileName?: string
  result: EcgClassificationResult & { previewUrl?: string | null }
}

async function classifyImage(file: File): Promise<EcgClassificationResult> {
  const fd = new FormData()
  fd.append("file", file)
  const res = await fetch(`${ECG_CLS_URL}/predict/image`, { method: "POST", body: fd })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof json.detail === "string" ? json.detail : `HTTP ${res.status}`)
  }
  if (json.error) throw new Error(json.error)
  return json as EcgClassificationResult
}

async function classifyWfdb(
  heaFile: File,
  datFile: File,
): Promise<EcgClassificationResult> {
  const fd = new FormData()
  fd.append("hea_file", heaFile)
  fd.append("dat_file", datFile)
  const res = await fetch(`${ECG_CLS_URL}/predict/wfdb`, { method: "POST", body: fd })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof json.detail === "string" ? json.detail : `HTTP ${res.status}`)
  }
  if (json.error) throw new Error(json.error)
  return json as EcgClassificationResult
}

function mapApiToPersisted(api: ApiEcgClsAnalysis): PersistedEcgClsStudy {
  return {
    id: api.id,
    inputSource: api.inputSource,
    fileName: api.fileName ?? "ECG classification",
    imageFileName: api.imageDocument?.fileName ?? undefined,
    heaFileName: api.heaDocument?.fileName ?? undefined,
    datFileName: api.datDocument?.fileName ?? undefined,
    result: apiToClassificationResult(api),
  }
}

export function useConsultationEcgClassification(
  queueEntryId: string,
  patientId: string | undefined,
  enabled: boolean,
) {
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<EcgClsInputSource>("wfdb")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [heaFile, setHeaFile] = useState<File | null>(null)
  const [datFile, setDatFile] = useState<File | null>(null)
  const [status, setStatus] = useState<AnalysisStatus>("idle")
  const [result, setResult] = useState<
    (EcgClassificationResult & { previewUrl?: string | null }) | null
  >(null)
  const [savedStudy, setSavedStudy] = useState<PersistedEcgClsStudy | null>(null)
  const [errorMsg, setErrorMsg] = useState("")
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
    queryKey: ["consultation-ecg-cls", patientId, consultationId],
    queryFn: () => fetchEcgClsAnalyses(patientId!, consultationId ?? undefined),
    enabled: Boolean(patientId && consultationId && enabled),
    staleTime: 30_000,
  })

  const isLoading = analysesQuery.isLoading || sessionQuery.isLoading

  useEffect(() => {
    hydratedRef.current = false
  }, [queueEntryId])

  useEffect(() => {
    if (!analysesQuery.data?.length || hydratedRef.current) return
    hydratedRef.current = true

    const latest = analysesQuery.data[0]
    if (!latest?.classification) return

    const persisted = mapApiToPersisted(latest)
    setSavedStudy(persisted)
    setResult(persisted.result)
    setMode(persisted.inputSource)
    setStatus("done")
  }, [analysesQuery.data])

  const resetLocal = useCallback(() => {
    setStatus("idle")
    setResult(null)
    setErrorMsg("")
  }, [])

  const onModeChange = useCallback((next: EcgClsInputSource) => {
    resetLocal()
    setMode(next)
    setImageFile(null)
    setHeaFile(null)
    setDatFile(null)
  }, [resetLocal])

  const onImageFile = useCallback((file: File | null) => {
    setImageFile(file)
    if (!file) return
    setSavedStudy(null)
    resetLocal()
  }, [resetLocal])

  const onHeaFile = useCallback((file: File | null) => {
    setHeaFile(file)
    if (!file) return
    setSavedStudy(null)
    resetLocal()
  }, [resetLocal])

  const onDatFile = useCallback((file: File | null) => {
    setDatFile(file)
    if (!file) return
    setSavedStudy(null)
    resetLocal()
  }, [resetLocal])

  const persistAnalysis = useCallback(
    async (
      inputSource: EcgClsInputSource,
      ml: EcgClassificationResult,
      files: { image?: File; hea?: File; dat?: File },
    ) => {
      if (!patientId) throw new Error("Patient not loaded")

      let imageDocumentId: string | undefined
      let heaDocumentId: string | undefined
      let datDocumentId: string | undefined
      let previewDocumentId: string | undefined
      let fileName = "ECG classification"

      if (inputSource === "image" && files.image) {
        const key = await uploadEcgClsFileToStorage(patientId, files.image)
        const doc = await createEcgClsDocument(patientId, {
          fileName: files.image.name,
          contentType: files.image.type || "image/png",
          s3Key: key,
          fileSize: files.image.size,
          title: "ECG classification image",
        })
        imageDocumentId = doc.id
        fileName = files.image.name
      }

      if (inputSource === "wfdb" && files.hea && files.dat) {
        const heaKey = await uploadEcgClsFileToStorage(patientId, files.hea)
        const heaDoc = await createEcgClsDocument(patientId, {
          fileName: files.hea.name,
          contentType: files.hea.type || "application/octet-stream",
          s3Key: heaKey,
          fileSize: files.hea.size,
          title: "ECG classification header",
        })
        const datKey = await uploadEcgClsFileToStorage(patientId, files.dat)
        const datDoc = await createEcgClsDocument(patientId, {
          fileName: files.dat.name,
          contentType: files.dat.type || "application/octet-stream",
          s3Key: datKey,
          fileSize: files.dat.size,
          title: "ECG classification signal",
        })
        heaDocumentId = heaDoc.id
        datDocumentId = datDoc.id
        fileName = files.hea.name.replace(/\.hea$/i, "")
      }

      if (ml.input_preview_b64) {
        const previewFile = base64ToFile(
          ml.input_preview_b64,
          `ecg-cls-preview-${Date.now()}.png`,
          "image/png",
        )
        const previewKey = await uploadEcgClsFileToStorage(patientId, previewFile)
        const previewDoc = await createEcgClsDocument(patientId, {
          fileName: previewFile.name,
          contentType: "image/png",
          s3Key: previewKey,
          fileSize: previewFile.size,
          title: "ECG classification strip",
        })
        previewDocumentId = previewDoc.id
      }

      const { input_preview_b64: _drop, ...classification } = ml

      const saved = await saveEcgClsAnalysis(patientId, {
        consultationId: consultationId ?? undefined,
        inputSource,
        imageDocumentId,
        heaDocumentId,
        datDocumentId,
        previewDocumentId,
        fileName,
        classification,
      })

      return mapApiToPersisted(saved)
    },
    [consultationId, patientId],
  )

  const onAnalyze = useCallback(async () => {
    const canRun =
      mode === "image" ? imageFile !== null : heaFile !== null && datFile !== null
    if (!canRun) return

    setStatus("processing")
    setResult(null)
    setErrorMsg("")

    try {
      const ml =
        mode === "image" && imageFile
          ? await classifyImage(imageFile)
          : heaFile && datFile
            ? await classifyWfdb(heaFile, datFile)
            : null

      if (!ml) throw new Error("Missing input files")

      const persisted = await persistAnalysis(mode, ml, {
        image: imageFile ?? undefined,
        hea: heaFile ?? undefined,
        dat: datFile ?? undefined,
      })

      setSavedStudy(persisted)
      setResult(persisted.result)
      setStatus("done")

      await queryClient.invalidateQueries({
        queryKey: ["consultation-ecg-cls", patientId, consultationId],
      })
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Classification failed")
      setStatus("error")
    }
  }, [
    consultationId,
    datFile,
    heaFile,
    imageFile,
    mode,
    patientId,
    persistAnalysis,
    queryClient,
  ])

  const onRemove = useCallback(async () => {
    if (savedStudy?.id && patientId) {
      try {
        await deleteEcgClsAnalysis(patientId, savedStudy.id)
        await queryClient.invalidateQueries({
          queryKey: ["consultation-ecg-cls", patientId, consultationId],
        })
      } catch {
        showIcareErrorToast(
          "Could not delete ECG classification",
          "The saved result may still appear after refresh.",
        )
        return
      }
    }

    setImageFile(null)
    setHeaFile(null)
    setDatFile(null)
    setSavedStudy(null)
    setResult(null)
    setErrorMsg("")
    setStatus("idle")
  }, [consultationId, patientId, queryClient, savedStudy])

  const onRetry = useCallback(() => {
    void onAnalyze()
  }, [onAnalyze])

  const onNewRecording = useCallback(async () => {
    if (savedStudy?.id) {
      await onRemove()
      return
    }
    resetLocal()
    setImageFile(null)
    setHeaFile(null)
    setDatFile(null)
  }, [onRemove, resetLocal, savedStudy])

  return {
    mode,
    imageFile,
    heaFile,
    datFile,
    savedStudy,
    result,
    status,
    errorMsg,
    isLoading,
    onModeChange,
    onImageFile,
    onHeaFile,
    onDatFile,
    onAnalyze,
    onRemove,
    onRetry,
    onNewRecording,
  }
}
