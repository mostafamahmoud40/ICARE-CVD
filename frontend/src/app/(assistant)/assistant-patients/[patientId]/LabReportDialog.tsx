"use client"

import {
  DownloadIcon,
  DropletsIcon,
  HeartPulseIcon,
  Printer,
  QrCodeIcon,
  ShareIcon,
  StethoscopeIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

import type { AssistantLabReportRow, AssistantLabTestRow } from "./assistantPatientProfile.types"

export function LabReportDialog({
  report,
  patientName,
  patientCode,
  isOpen,
  onClose,
}: {
  report: AssistantLabReportRow | null
  patientName: string
  patientCode: string
  isOpen: boolean
  onClose: () => void
}) {
  if (!report) return null

  const referenceNo = `RPT-2026-05-${report.id.split("-")[1] ?? report.id}`

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="flex w-full max-w-[calc(100vw-1.5rem)] flex-col gap-0 overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-2xl sm:max-w-[min(94vw,880px)]">
        <DialogTitle className="sr-only">{report.title} report</DialogTitle>

        <div className="flex items-center justify-between gap-3 border-b border-[#E8E6E0]/60 bg-[#F9F8F5] px-5 py-3 print:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <Badge className="shrink-0 rounded-md border-0 bg-[#1A5345]/10 px-1.5 py-0 text-[9px] font-bold leading-5 text-[#1A5345]">
              Lab report
            </Badge>
            <span className="truncate text-[11px] font-bold text-[#1A1F1E]">{report.date}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg border border-[#E8E6E0]/40 text-[#1A1F1E] shadow-none hover:bg-white"
              aria-label="Share report"
            >
              <ShareIcon className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg border border-[#E8E6E0]/40 text-[#1A1F1E] shadow-none hover:bg-white"
              aria-label="Download report"
            >
              <DownloadIcon className="size-3.5" />
            </Button>
            <Button
              onClick={() => window.print()}
              size="icon"
              className="size-8 rounded-lg border-0 bg-[#1A5345] text-white shadow-sm hover:bg-[#1A1F1E]"
              aria-label="Print report"
            >
              <Printer className="size-3.5" />
            </Button>
          </div>
        </div>

        <div className="relative max-h-[calc(90vh-3rem)] overflow-x-hidden overflow-y-auto p-5 print:p-0 sm:p-6">
          <div className="pointer-events-none absolute inset-0 flex rotate-[-15deg] select-none items-center justify-center opacity-[0.02]">
            <HeartPulseIcon className="size-[320px] text-[#1A5345]" />
          </div>

          <div className="relative z-10">
            <div className="mb-5 overflow-hidden rounded-xl border border-[#E8E6E0] bg-gradient-to-br from-[#FAFAF8] via-white to-[#F3F7F5]">
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                <div className="min-w-0 space-y-2">
                  <div className="flex items-start gap-3">
                    <HeartPulseIcon className="mt-0.5 size-6 shrink-0 text-[#1A5345]" aria-hidden />
                    <div>
                      <h2 className="font-serif text-[22px] font-bold leading-tight tracking-tight text-[#1A1F1E]">
                        ICARE-CVD
                      </h2>
                      <p className="mt-0.5 text-[13px] font-medium text-[#1A5345]">Advanced diagnostics</p>
                    </div>
                  </div>
                  <div className="pl-9">
                    <p className="text-[11px] font-medium text-muted-foreground">Requested test</p>
                    <h1 className="mt-0.5 text-[20px] font-bold leading-snug text-[#1A1F1E]">{report.title}</h1>
                  </div>
                </div>

                <div className="shrink-0 space-y-2 border-t border-[#E8E6E0]/70 pt-3 sm:border-t-0 sm:border-l sm:pl-5 sm:pt-0 sm:text-right">
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground">Reference no.</p>
                    <p className="font-mono text-[14px] font-bold text-[#1A1F1E]">{referenceNo}</p>
                  </div>
                  <div className="text-[11px] leading-relaxed text-muted-foreground">
                    <p><span className="font-medium text-[#1A1F1E]">Collected:</span> {report.date}, 08:30 AM</p>
                    <p><span className="font-medium text-[#1A1F1E]">Reported:</span> {report.date}, 11:45 AM</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3 rounded-xl border border-[#E8E6E0] bg-[#F9F8F5] p-3.5">
              <div>
                <p className="mb-1 text-[11px] font-medium text-muted-foreground">Patient name</p>
                <p className="text-[14px] font-bold text-[#1A1F1E]">{patientName}</p>
              </div>
              <div>
                <p className="mb-1 text-[11px] font-medium text-muted-foreground">Patient code</p>
                <p className="text-[14px] font-bold tabular-nums text-[#1A1F1E]">{patientCode}</p>
              </div>
              <div>
                <p className="mb-1 text-[11px] font-medium text-muted-foreground">Report date</p>
                <p className="text-[14px] font-bold text-[#1A1F1E]">{report.date}</p>
              </div>
            </div>

            <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#E8E6E0]/60 bg-[#F9F8F5]/80 px-4 py-3">
              <StethoscopeIcon className="size-4 shrink-0 text-[#1A5345]" aria-hidden />
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-muted-foreground">Requesting physician</p>
                <p className="text-[14px] font-bold text-[#1A1F1E]">
                  {report.doctor.name}
                  <span className="ml-1.5 text-[12px] font-medium text-muted-foreground">
                    · {report.doctor.department} · {report.category}
                  </span>
                </p>
              </div>
            </div>

            <div className="mb-5">
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="flex items-center gap-2 text-[15px] font-bold text-[#1A1F1E]">
                  <DropletsIcon className="size-4 text-[#1A5345]" aria-hidden />
                  Investigation parameters
                </h2>
                <span className="text-[11px] font-medium text-muted-foreground">SI units</span>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#E8E6E0]">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-[#1A1F1E] text-white">
                      <th className="px-4 py-3 text-left text-[11px] font-bold">Test parameter</th>
                      <th className="px-3 py-3 text-center text-[11px] font-bold">Result</th>
                      <th className="px-3 py-3 text-center text-[11px] font-bold">Reference range</th>
                      <th className="px-4 py-3 text-right text-[11px] font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E6E0]/60">
                    {report.tests.map((test: AssistantLabTestRow, idx: number) => (
                      <tr key={idx} className="transition-colors hover:bg-[#F9F8F5]/50">
                        <td className="px-4 py-3">
                          <p className="text-[13px] font-bold text-[#1A1F1E]">{test.name}</p>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <div className="flex items-baseline justify-center gap-1">
                            <span
                              className={cn(
                                "text-[16px] font-bold tabular-nums",
                                test.status === "high" || test.status === "low"
                                  ? "text-red-600"
                                  : "text-[#1A5345]",
                              )}
                            >
                              {test.value}
                            </span>
                            <span className="text-[11px] font-medium text-muted-foreground">{test.unit}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="text-[12px] font-medium text-[#1A1F1E]/70">{test.range}</span>
                          <span className="ml-1 text-[11px] text-muted-foreground">{test.unit}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                              test.status === "normal"
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-600/10"
                                : "bg-red-50 text-red-700 ring-red-600/10",
                            )}
                          >
                            {test.status.charAt(0).toUpperCase() + test.status.slice(1).toLowerCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="mt-3 px-1 text-[11px] leading-relaxed text-muted-foreground">
                Clinical correlation is required for definitive diagnosis. Abnormal values should be reviewed by the physician.
              </p>
            </div>

            <div className="flex items-end justify-between border-t border-[#E8E6E0] pt-5">
              <div className="flex items-center gap-4">
                <div className="flex size-20 items-center justify-center rounded-xl border-2 border-[#E8E6E0] bg-white p-2">
                  <QrCodeIcon className="size-full text-[#1A1F1E]" />
                </div>
                <p className="max-w-[160px] text-[10px] font-medium leading-relaxed text-muted-foreground">
                  Scan to verify report authenticity
                </p>
              </div>
              <div className="text-right">
                <p className="font-serif text-[18px] font-bold italic text-[#1A1F1E]">{report.doctor.name}</p>
                <div className="my-1 h-0.5 w-36 bg-[#1A1F1E]" />
                <p className="text-[11px] font-medium text-[#1A5345]">{report.doctor.department} specialist</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
