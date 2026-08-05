/** ML service base URLs (DIP — single source for env defaults). */

function clientDefault(fallback: string) {
  return typeof window !== "undefined" ? fallback : fallback
}

export function getMlServiceUrl() {
  return (
    process.env.NEXT_PUBLIC_ML_SERVICE_URL ??
    clientDefault("http://localhost:8000")
  )
}

export function getEcgServiceUrl() {
  return (
    process.env.NEXT_PUBLIC_ECG_SERVICE_URL ??
    clientDefault("http://localhost:5050")
  )
}

export function getEcgRagServiceUrl() {
  return (
    process.env.NEXT_PUBLIC_ECG_RAG_SERVICE_URL ??
    clientDefault("http://localhost:8502")
  )
}

export function getEcgClassificationUrl() {
  return (
    process.env.NEXT_PUBLIC_ECG_CLASSIFICATION_URL ??
    clientDefault("http://localhost:8503")
  )
}

export function getMriServiceUrl() {
  return (
    process.env.NEXT_PUBLIC_MRI_SERVICE_URL ??
    clientDefault("http://localhost:8090")
  )
}

export const MEDICAL_ANALYZER_CHAT_ROUTE = "/api/medical-analyzer/chat"
export const MEDICAL_ANALYZER_OCR_ROUTE = "/api/medical-analyzer/ocr"
