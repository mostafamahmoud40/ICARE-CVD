import type {
  LabAnalysisBundle,
  LabResultStatus,
  MedicalAnalyzerRawBundle,
} from "@/app/(doctor)/doctor-queue/[queueEntryId]/consultation/labMaterials.types"

const OCR_ROUTE = "/api/medical-analyzer/ocr"

function mapRawBundle(raw: MedicalAnalyzerRawBundle): LabAnalysisBundle {
  return {
    facility: {
      hospitalName: raw.facility?.hospital_name ?? "",
      labName: raw.facility?.lab_name ?? "",
      doctorName: raw.facility?.doctor_name ?? "",
    },
    patient: {
      id: raw.patient?.id ?? "",
      dateCollected: raw.patient?.date_collected ?? "",
      dateReported: raw.patient?.date_reported ?? "",
    },
    results: (raw.results ?? []).map((r) => ({
      testName: r.test_name ?? "",
      value: r.value ?? "",
      unit: r.unit ?? "",
      referenceRange: r.reference_range ?? "",
      status: (r.status ?? "Normal") as LabResultStatus,
    })),
    summary: raw.summary ?? "",
  }
}

export function mapAiStatusToLabStatus(
  status: string,
): "normal" | "high" | "low" | "critical" {
  const normalized = status.trim().toLowerCase()
  if (normalized === "high" || normalized === "low" || normalized === "critical") {
    return normalized
  }
  return "normal"
}

export function panelTitleFromFileName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ")
}

export async function analyzeLabReportFile(file: File): Promise<LabAnalysisBundle> {
  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch(OCR_ROUTE, {
    method: "POST",
    body: formData,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => `HTTP ${res.status}`)
    throw new Error(text || `HTTP ${res.status}`)
  }

  const data = (await res.json()) as {
    success: boolean
    markdown?: string
    llm_error?: string
    error?: string
  }

  if (!data.success) throw new Error(data.error ?? "Analysis failed")
  if (data.llm_error) throw new Error(`AI structuring failed: ${data.llm_error}`)
  if (!data.markdown) throw new Error("Empty response from the analyzer")

  const rawBundle = JSON.parse(data.markdown) as MedicalAnalyzerRawBundle
  return mapRawBundle(rawBundle)
}
