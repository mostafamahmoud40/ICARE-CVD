import type { EcgClassificationResult } from "@/app/(doctor)/doctor-queue/[queueEntryId]/consultation/consultationEcgCls.api"

import { getEcgClassificationUrl } from "./ml-env"
import { parseJsonResponse, postFormData } from "./ml-http"

export const ecgClsMlAdapter = {
  async classifyImage(file: File): Promise<EcgClassificationResult> {
    const fd = new FormData()
    fd.append("file", file)
    const res = await postFormData(
      `${getEcgClassificationUrl()}/predict/image`,
      fd,
    )
    return parseJsonResponse<EcgClassificationResult>(res)
  },

  async classifyWfdb(
    heaFile: File,
    datFile: File,
  ): Promise<EcgClassificationResult> {
    const fd = new FormData()
    fd.append("hea_file", heaFile)
    fd.append("dat_file", datFile)
    const res = await postFormData(
      `${getEcgClassificationUrl()}/predict/wfdb`,
      fd,
    )
    return parseJsonResponse<EcgClassificationResult>(res)
  },
}
