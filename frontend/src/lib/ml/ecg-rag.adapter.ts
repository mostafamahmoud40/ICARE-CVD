import { getEcgRagServiceUrl } from "./ml-env"
import { parseJsonResponse, postFormData } from "./ml-http"

export type EcgRagDiagnoseInput = {
  featuresJson: string
  query: string
  retrieved: string
  medicalHistory?: string
}

export type EcgRagAnalyzeInput = {
  heaFile: File
  datFile: File
  query?: string
  medicalHistory?: string
}

export const ecgRagMlAdapter = {
  async diagnose(input: EcgRagDiagnoseInput): Promise<{ diagnosis: string }> {
    const fd = new FormData()
    fd.append("features_json", input.featuresJson)
    fd.append("query", input.query)
    fd.append("retrieved", input.retrieved)
    if (input.medicalHistory?.trim()) {
      fd.append("medical_history", input.medicalHistory)
    }

    const res = await postFormData(`${getEcgRagServiceUrl()}/diagnose`, fd)
    const json = await parseJsonResponse<{ diagnosis: string }>(res)
    return json
  },

  async analyze(input: EcgRagAnalyzeInput): Promise<unknown> {
    const fd = new FormData()
    fd.append("dat_file", input.datFile)
    fd.append("hea_file", input.heaFile)
    if (input.query?.trim()) fd.append("query", input.query)
    if (input.medicalHistory?.trim()) {
      fd.append("medical_history", input.medicalHistory)
    }

    const res = await postFormData(`${getEcgRagServiceUrl()}/analyze`, fd)
    return parseJsonResponse(res)
  },
}
