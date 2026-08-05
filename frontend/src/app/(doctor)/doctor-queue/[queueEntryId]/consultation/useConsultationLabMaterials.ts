"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { showIcareErrorToast } from "@/components/shared/icare-toast"
import { analyzeLabReportFile, panelTitleFromFileName } from "@/lib/labReportAnalysis"
import type { LabMaterialFile } from "./consultation.types"
import type { LabAnalysisBundle, LabAnalysisPhase } from "./labMaterials.types"
import { fetchConsultationSession } from "./consultation.api"
import {
  createPatientDocument,
  deleteLabReportPanel,
  fetchLabReportPanels,
  importLabReportPanel,
  parseAnalysisJson,
  uploadLabFileToStorage,
} from "./consultationLabReports.api"

type PanelAnalysisState = {
  phase: LabAnalysisPhase
  analysis: LabAnalysisBundle | null
  error: string | null
}

export function useConsultationLabMaterials(
  queueEntryId: string,
  patientId: string | undefined,
  enabled: boolean,
) {
  const queryClient = useQueryClient()
  const [items, setItems] = useState<LabMaterialFile[]>([])
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [analysisByItemId, setAnalysisByItemId] = useState<
    Record<string, PanelAnalysisState>
  >({})
  const [consultationId, setConsultationId] = useState<string | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
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

  const panelsQuery = useQuery({
    queryKey: ["consultation-lab-panels", patientId, consultationId],
    queryFn: () => fetchLabReportPanels(patientId!, consultationId ?? undefined),
    enabled: Boolean(patientId && consultationId && enabled),
    staleTime: 30_000,
  })

  useEffect(() => {
    hydratedRef.current = false
  }, [queueEntryId])

  useEffect(() => {
    if (!panelsQuery.data || hydratedRef.current) return
    hydratedRef.current = true

    const loadedItems: LabMaterialFile[] = panelsQuery.data.map((panel) => ({
      id: panel.id,
      panelId: panel.id,
      documentId: panel.documentId ?? undefined,
      fileName: panel.document?.fileName ?? panel.panelTitle ?? "Lab report",
      fileSize: panel.document?.sizeBytes ?? 0,
      uploadPhase: "ready",
    }))

    const loadedAnalysis: Record<string, PanelAnalysisState> = {}
    for (const panel of panelsQuery.data) {
      try {
        loadedAnalysis[panel.id] = {
          phase: "complete",
          analysis: parseAnalysisJson(panel.analysisJson),
          error: null,
        }
      } catch {
        loadedAnalysis[panel.id] = {
          phase: "error",
          analysis: null,
          error: "Could not load saved analysis",
        }
      }
    }

    setItems(loadedItems)
    setAnalysisByItemId(loadedAnalysis)
    if (loadedItems[0]) setActiveItemId(loadedItems[0].id)
  }, [panelsQuery.data])

  const activeItem = useMemo(
    () => items.find((item) => item.id === activeItemId) ?? items[0] ?? null,
    [items, activeItemId],
  )

  const activeAnalysis = activeItem
    ? analysisByItemId[activeItem.id] ?? {
        phase: "idle" as const,
        analysis: null,
        error: null,
      }
    : { phase: "idle" as const, analysis: null, error: null }

  const workspaceOpen =
    items.length > 0 ||
    activeAnalysis.phase === "analyzing" ||
    activeAnalysis.phase === "complete" ||
    activeAnalysis.phase === "error"

  const addFiles = useCallback(
    async (files: File[]) => {
      if (!patientId || files.length === 0) return

      for (const file of files) {
        const localId = crypto.randomUUID()
        setItems((prev) => [
          ...prev,
          {
            id: localId,
            file,
            fileName: file.name,
            fileSize: file.size,
            uploadPhase: "uploading",
          },
        ])
        setActiveItemId(localId)
        setAnalysisByItemId((prev) => ({
          ...prev,
          [localId]: { phase: "idle", analysis: null, error: null },
        }))

        try {
          const s3Key = await uploadLabFileToStorage(patientId, file)
          const document = await createPatientDocument(patientId, {
            fileName: file.name,
            contentType: file.type || "application/octet-stream",
            category: "lab_report",
            s3Key,
            fileSize: file.size,
          })

          setItems((prev) =>
            prev.map((item) =>
              item.id === localId
                ? {
                    ...item,
                    documentId: document.id,
                    uploadPhase: "ready",
                  }
                : item,
            ),
          )
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Upload failed"
          setItems((prev) =>
            prev.map((item) =>
              item.id === localId
                ? { ...item, uploadPhase: "error", uploadError: message }
                : item,
            ),
          )
          showIcareErrorToast("Upload failed", message)
        }
      }
    },
    [patientId],
  )

  const removeItem = useCallback(
    async (id: string) => {
      const item = items.find((entry) => entry.id === id)
      setItems((prev) => prev.filter((entry) => entry.id !== id))
      setAnalysisByItemId((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })

      if (item?.panelId && patientId) {
        try {
          await deleteLabReportPanel(patientId, item.panelId)
        } catch {
          showIcareErrorToast(
            "Could not delete report",
            "The file may still appear after refresh.",
          )
        }
      } else if (item?.documentId && patientId) {
        try {
          await apiClient.delete(
            `/doctor/patients/${patientId}/documents/${item.documentId}`,
          )
        } catch {
          // best-effort cleanup for uploads without analysis
        }
      }

      if (patientId) {
        await queryClient.invalidateQueries({
          queryKey: ["consultation-lab-panels", patientId, consultationId],
        })
      }
    },
    [consultationId, items, patientId, queryClient],
  )

  const runAiAnalysis = useCallback(async () => {
    if (!patientId || !activeItem?.documentId) return

    const targetId = activeItem.id
    const fileForAnalysis = activeItem.file
    if (!fileForAnalysis && activeAnalysis.phase === "complete") return

    setAnalysisByItemId((prev) => ({
      ...prev,
      [targetId]: { phase: "analyzing", analysis: null, error: null },
    }))

    try {
      if (!fileForAnalysis) {
        throw new Error("Re-upload the file to run analysis again.")
      }

      const bundle = await analyzeLabReportFile(fileForAnalysis)

      const panel = await importLabReportPanel(patientId, {
        documentId: activeItem.documentId,
        consultationId: consultationId ?? undefined,
        panelTitle: panelTitleFromFileName(activeItem.fileName),
        analysis: bundle,
      })

      setItems((prev) =>
        prev.map((item) =>
          item.id === targetId
            ? { ...item, id: panel.id, panelId: panel.id, file: undefined }
            : item,
        ),
      )
      setActiveItemId(panel.id)
      setAnalysisByItemId((prev) => {
        const next = { ...prev }
        delete next[targetId]
        next[panel.id] = { phase: "complete", analysis: bundle, error: null }
        return next
      })

      await queryClient.invalidateQueries({
        queryKey: ["consultation-lab-panels", patientId, consultationId],
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed"
      setAnalysisByItemId((prev) => ({
        ...prev,
        [targetId]: { phase: "error", analysis: null, error: message },
      }))
    }
  }, [activeItem, consultationId, patientId, queryClient])

  return {
    items,
    activeItemId: activeItem?.id ?? null,
    setActiveItemId,
    addFiles,
    removeItem,
    workspaceOpen,
    analysisPhase: activeAnalysis.phase,
    analysis: activeAnalysis.analysis,
    analysisError: activeAnalysis.error,
    runAiAnalysis,
    chatOpen,
    setChatOpen,
    isLoading: panelsQuery.isLoading || sessionQuery.isLoading,
    isUploading: items.some((item) => item.uploadPhase === "uploading"),
  }
}
