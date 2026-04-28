"use client"

import { useMutation } from "@tanstack/react-query"
import { echoApiClient } from "@/lib/echo-api-client"

export type EchoAnalysisResult = {
  ef: number
  label: "Normal" | "Mildly Reduced" | "Reduced"
  es_frame: number
  ed_frame: number
  es_area: number
  ed_area: number
  total_frames: number
  device: string
  frame_viz: string
  overlay_gif: string
  chart_data: {
    areas: number[]
    es_frame: number
    ed_frame: number
    systole_frames: number[]
  }
}

export type EchoReportResult = {
  report: string
}

export type EchoChatResult = {
  response: string
}

export type EchoChatMessage = {
  role: "user" | "assistant"
  content: string
}

// ── analyze ──────────────────────────────────────────────────────────────────

export function useEchoAnalyze() {
  return useMutation({
    mutationFn: (video: File) => {
      const fd = new FormData()
      fd.append("video", video)
      return echoApiClient
        .post<EchoAnalysisResult>("/analyze", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((r) => r.data)
    },
  })
}

// ── generate report ───────────────────────────────────────────────────────────

export function useEchoGenerateReport() {
  return useMutation({
    mutationFn: (analysisData: EchoAnalysisResult) =>
      echoApiClient
        .post<EchoReportResult>("/generate_report", analysisData)
        .then((r) => r.data.report),
  })
}

// ── chat ──────────────────────────────────────────────────────────────────────

export function useEchoChat() {
  return useMutation({
    mutationFn: ({
      message,
      analysisData,
      history,
    }: {
      message: string
      analysisData: EchoAnalysisResult
      history: EchoChatMessage[]
    }) =>
      echoApiClient
        .post<EchoChatResult>("/chat", {
          message,
          analysis_data: analysisData,
          history,
        })
        .then((r) => r.data.response),
  })
}
