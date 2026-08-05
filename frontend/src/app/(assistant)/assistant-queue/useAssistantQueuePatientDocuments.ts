"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { apiClient } from "@/lib/api-client"
import type { QueuePatientDocumentDto, StudyKind } from "./assistantQueue.documents.types"
import { studyKindToPayload } from "./assistantQueue.documents.types"

type UploadIntentResult = {
  key: string
  uploadUrl: string
  publicUrl?: string
  expiresIn: number
}

export const assistantQueueDocumentsQueryKey = (queueEntryId: string | null) =>
  ["assistant-queue-patient-documents", queueEntryId] as const

export function formatQueueDocumentUploadError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string | string[] } | undefined
    if (Array.isArray(data?.message)) return data.message.join(", ")
    if (typeof data?.message === "string") return data.message
    return err.message
  }
  if (err instanceof Error) return err.message
  return "Upload failed"
}

export function useAssistantQueuePatientDocuments(queueEntryId: string | null) {
  const qc = useQueryClient()

  const listQuery = useQuery({
    queryKey: assistantQueueDocumentsQueryKey(queueEntryId),
    queryFn: async () => {
      const { data } = await apiClient.get<QueuePatientDocumentDto[]>(
        `/assistant/patient-queue/${queueEntryId}/documents`,
      )
      return data
    },
    enabled: Boolean(queueEntryId),
  })

  const uploadMutation = useMutation({
    mutationFn: async ({ file, studyKind }: { file: File; studyKind: StudyKind }) => {
      if (!queueEntryId) throw new Error("No queue entry selected")

      const { intentCategory, registerCategory, title } = studyKindToPayload(studyKind, file.name)
      const contentType = file.type || "application/octet-stream"

      const intentRes = await apiClient.post<UploadIntentResult>("/documents/upload-intent", {
        fileName: file.name,
        contentType,
        category: intentCategory,
      })

      const intent = intentRes.data

      const putRes = await fetch(intent.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": contentType },
      })

      if (!putRes.ok) {
        const text = await putRes.text().catch(() => "")
        throw new Error(
          text || `File storage failed (${putRes.status}). Check MinIO configuration and CORS.`,
        )
      }

      await apiClient.post(`/assistant/patient-queue/${queueEntryId}/documents`, {
        fileName: file.name,
        contentType,
        category: registerCategory,
        title,
        fileSize: file.size,
        s3Key: intent.key,
      })
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: assistantQueueDocumentsQueryKey(queueEntryId) })
    },
  })

  return {
    documents: listQuery.data ?? [],
    isLoadingDocuments: listQuery.isLoading,
    isDocumentsError: listQuery.isError,
    refetchDocuments: listQuery.refetch,
    uploadStudyFile: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
  }
}
