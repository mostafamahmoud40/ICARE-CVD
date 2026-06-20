import type { LabResult } from "../../doctorPatients.types"
import type { LabAnalysisBundle } from "@/app/(doctor)/doctor-queue/[queueEntryId]/consultation/labMaterials.types"
import {
  analyzeLabReportFile,
  mapAiStatusToLabStatus,
  panelTitleFromFileName,
} from "@/lib/labReportAnalysis"

export { analyzeLabReportFile, mapAiStatusToLabStatus, panelTitleFromFileName }

export function analysisToLabResults(args: {
  bundle: LabAnalysisBundle
  panelId: string
  documentId: string
  panelTitle: string
  date: string
  orderedBy: string
  baseId: number
}): LabResult[] {
  const { bundle, panelId, documentId, panelTitle, date, orderedBy, baseId } = args

  if (bundle.results.length === 0) {
    throw new Error("No test values were found in this report.")
  }

  return bundle.results.map((row, index) => ({
    id: `lab-${baseId}-${index}`,
    panelId,
    panelTitle,
    source: "upload" as const,
    documentId,
    testName: row.testName,
    value: row.value,
    unit: row.unit,
    referenceRange: row.referenceRange,
    status: mapAiStatusToLabStatus(row.status),
    date: bundle.patient.dateReported || date,
    orderedBy: bundle.facility.doctorName || orderedBy,
  }))
}
