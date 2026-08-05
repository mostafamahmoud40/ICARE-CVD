"use client"

import { useCallback } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { analyzeLabReportFile, panelTitleFromFileName } from "@/lib/labReportAnalysis"
import { fetchPatientLabOrders, uploadPatientLabReport } from "./labOrders.api"
import type { PatientLabOrder } from "./labOrders.types"

const queryKey = ["patient-lab-orders"]

export function usePatientLabOrders() {
  const queryClient = useQueryClient()

  const query = useQuery<PatientLabOrder[], Error>({
    queryKey,
    queryFn: fetchPatientLabOrders,
    staleTime: 60_000,
  })

  const uploadMutation = useMutation({
    mutationFn: async ({ orderId, file }: { orderId: string; file: File }) => {
      const analysis = await analyzeLabReportFile(file)
      await uploadPatientLabReport({
        orderId,
        file,
        analysis,
        panelTitle: panelTitleFromFileName(file.name),
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey })
    },
  })

  const uploadReport = useCallback(
    (orderId: string, file: File) => uploadMutation.mutateAsync({ orderId, file }),
    [uploadMutation],
  )

  return {
    orders: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    uploadReport,
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error,
  }
}
