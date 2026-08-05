import type { EcgReport, EcgResult } from "@/app/(doctor)/doctor-queue/[queueEntryId]/consultation/ecgAnalysis.types"

import { getEcgServiceUrl } from "./ml-env"
import { parseJsonResponse, postFormData, postJson } from "./ml-http"

export type EcgChatMessage = { role: string; content: string }

export const ecgMlAdapter = {
  async infer(heaFile: File, datFile: File): Promise<EcgResult> {
    const formData = new FormData()
    formData.append("hea", heaFile)
    formData.append("dat", datFile)

    const res = await postFormData(`${getEcgServiceUrl()}/infer`, formData)
    const json = await parseJsonResponse<EcgResult & { error?: string }>(res)
    return json
  },

  async generateReport(ecgResult: EcgResult): Promise<EcgReport> {
    const json = await postJson<{
      success?: boolean
      report?: EcgReport
      error?: string
    }>(`${getEcgServiceUrl()}/report`, { ecg_result: ecgResult })

    if (!json.success || !json.report) {
      throw new Error(json.error ?? "Failed to generate report")
    }

    return json.report
  },

  async chat(payload: {
    history: EcgChatMessage[]
    ecg_context?: unknown
  }): Promise<{ reply: string }> {
    const json = await postJson<{ reply?: string; error?: string }>(
      `${getEcgServiceUrl()}/chat`,
      payload,
    )

    if (!json.reply) {
      throw new Error(json.error ?? "No reply from ECG chat")
    }

    return { reply: json.reply }
  },
}
