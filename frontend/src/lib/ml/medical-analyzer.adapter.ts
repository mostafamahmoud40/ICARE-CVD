import {
  getMlServiceUrl,
  getMriServiceUrl,
  MEDICAL_ANALYZER_CHAT_ROUTE,
  MEDICAL_ANALYZER_OCR_ROUTE,
} from "./ml-env"
import { parseJsonResponse, postFormData, postJson } from "./ml-http"

export const medicalAnalyzerMlAdapter = {
  async segmentCt(file: File): Promise<unknown> {
    const formData = new FormData()
    formData.append("file", file)
    const res = await postFormData(
      `${getMlServiceUrl()}/api/v1/ct/segment`,
      formData,
    )
    if (!res.ok) {
      const text = await res.text().catch(() => `HTTP ${res.status}`)
      throw new Error(text || `HTTP ${res.status}`)
    }
    return res.json()
  },

  async analyzeXray(file: File): Promise<unknown> {
    const formData = new FormData()
    formData.append("file", file)
    const res = await postFormData(
      `${getMlServiceUrl()}/api/v1/xray/analyze`,
      formData,
    )
    if (!res.ok) {
      const text = await res.text().catch(() => `HTTP ${res.status}`)
      throw new Error(text || `HTTP ${res.status}`)
    }
    return res.json()
  },

  async predictMri(formData: FormData): Promise<unknown> {
    const res = await postFormData(`${getMriServiceUrl()}/predict`, formData)
    return parseJsonResponse(res)
  },

  async chat(payload: unknown, init?: RequestInit): Promise<unknown> {
    const res = await fetch(MEDICAL_ANALYZER_CHAT_ROUTE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      ...init,
    })
    return parseJsonResponse(res)
  },

  async ocr(formData: FormData): Promise<unknown> {
    const res = await postFormData(MEDICAL_ANALYZER_OCR_ROUTE, formData)
    return parseJsonResponse(res)
  },

  async postChatJson<T>(payload: unknown): Promise<T> {
    return postJson<T>(MEDICAL_ANALYZER_CHAT_ROUTE, payload)
  },
}

export { getMlServiceUrl, getMriServiceUrl }
