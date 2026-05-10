import { AlertTriangleIcon, CheckCircle2Icon } from "lucide-react"

import { showIcareToast } from "@/components/shared/icare-toast"

import type {
  AssistantAppointmentRow,
  AssistantAppointmentVisitMode,
  AssistantVitalsHistoryRow,
} from "./assistantPatientProfile.types"

export function vitalsRowClipboardText(vh: AssistantVitalsHistoryRow, patientName: string): string {
  return [
    `Patient: ${patientName}`,
    `Date: ${vh.date} · ${vh.time}`,
    `BP: ${vh.bp} mmHg · HR: ${vh.hr} bpm · Temp: ${vh.temp} °C`,
    `SpO₂: ${vh.spo2}% · Glucose: ${vh.glucose} mg/dL · Weight: ${vh.weight} kg`,
    `Recorded by: ${vh.takenBy}`,
  ].join("\n")
}

export function appointmentVisitModeLabel(mode: AssistantAppointmentVisitMode): string {
  return mode === "video" ? "Virtual" : "In clinic"
}

export function appointmentClipboardText(app: AssistantAppointmentRow, patientName: string): string {
  return [
    `Patient: ${patientName}`,
    `${app.type} — ${app.date}`,
    `Visit: ${appointmentVisitModeLabel(app.visitMode)}`,
    `Time: ${app.time}`,
    `Clinician: ${app.doctor.name} (${app.doctor.department})`,
    `Status: ${app.status}`,
    `Booked by: ${app.bookedBy}`,
  ].join("\n")
}

export async function copyAssistantPatientRowToClipboard(label: string, text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    showIcareToast({ title: label, icon: CheckCircle2Icon })
  } catch {
    showIcareToast({
      title: "Could not copy to clipboard",
      description: "Clipboard access was denied or is not available.",
      icon: AlertTriangleIcon,
      iconWrapClassName: "bg-red-50 text-red-600 ring-red-200/80",
      duration: 6000,
    })
  }
}

export function vitalsRecorderInitials(name: string): string {
  const cleaned = name.replace(/^(Asst\.|Dr\.)\s*/i, "").trim()
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  if (parts.length === 1) {
    const w = parts[0]
    return w.length >= 2 ? w.slice(0, 2).toUpperCase() : w.toUpperCase()
  }
  return "?"
}
