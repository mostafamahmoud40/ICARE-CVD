"use client"

import Link from "next/link"
import { useState } from "react"
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  ClockIcon,
  DoorOpenIcon,
  FileTextIcon,
  HeartPulseIcon,
  SaveIcon,
  ScissorsIcon,
  StethoscopeIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Skeleton } from "@/components/ui/skeleton"
import { showIcareSuccessToast } from "@/components/shared/icare-toast"
import type { IntraoperativeComplicationKey } from "@/app/(assistant)/assistant-procedures/assistantProcedureReports.mock"
import { PRIORITY_CONFIG } from "@/app/(assistant)/assistant-procedures/assistantProcedures.config"
import { StatusBadge } from "@/app/(assistant)/assistant-procedures/StatusBadge"

import {
  doctorProceduresScrollbarCss,
  formatPatientRowId,
} from "./doctorProcedures.shared"
import {
  INTRAOP_COMPLICATION_OPTIONS,
  RECOVERY_STATUS_OPTIONS,
  useDoctorProcedureReport,
} from "./useDoctorProcedureReport"

type DoctorProcedureReportPageProps = {
  procedureId: string
}

type ReportTab = "overview" | "intraoperative" | "postOp" | "discharge"

const FORM_CARD =
  "rounded-2xl border border-[#E8E6E0]/70 bg-white p-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] sm:p-5"

const FIELD_LABEL = "text-[11px] font-bold text-[#6B7870]"
const FIELD_INPUT =
  "rounded-xl border-[#E8E6E0]/80 bg-[#F9F8F5] text-[13px] font-medium focus-visible:border-[#1A5345]/50 focus-visible:ring-[#1A5345]/12"

export function DoctorProcedureReportPage({ procedureId }: DoctorProcedureReportPageProps) {
  const vm = useDoctorProcedureReport(procedureId)
  const [activeTab, setActiveTab] = useState<ReportTab>("overview")

  const patientName = vm.order?.patientName ?? vm.history?.patientName ?? "Unknown patient"
  const patientId = vm.order?.patientId ?? vm.history?.patientId ?? procedureId
  const procedureName = vm.order?.procedureName ?? vm.history?.procedureName ?? "Procedure"
  const priority = vm.order?.priority ?? vm.history?.priority ?? "normal"

  const reportTabs = [
    { id: "overview" as const, label: "Clinical overview", icon: FileTextIcon },
    { id: "intraoperative" as const, label: "Intraoperative", icon: ScissorsIcon },
    { id: "postOp" as const, label: "Post-operative", icon: HeartPulseIcon },
    { id: "discharge" as const, label: "Discharge plan", icon: DoorOpenIcon },
  ]

  const toggleComplication = (key: IntraoperativeComplicationKey, checked: boolean) => {
    const current = vm.draft.complications
    if (key === "none") {
      vm.updateDraft("complications", checked ? ["none"] : [])
      return
    }

    const withoutNone = current.filter((item) => item !== "none")
    const next = checked
      ? [...withoutNone, key]
      : withoutNone.filter((item) => item !== key)
    vm.updateDraft("complications", next.length > 0 ? next : ["none"])
  }

  const handleSaveDraft = () => {
    vm.saveDraft()
    showIcareSuccessToast("Draft saved", "Your operation report draft has been saved locally.")
  }

  const handleFinalize = () => {
    vm.finalizeReport()
    showIcareSuccessToast(
      "Report finalized",
      "The post-operative report is marked complete and available for the care team.",
    )
  }

  if (vm.isLoading) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#F9F8F5] p-6">
        <Skeleton className="mb-4 h-8 w-72 rounded-lg" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="mt-4 h-[420px] w-full rounded-2xl" />
      </div>
    )
  }

  if (!vm.hasOrder) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center bg-[#F9F8F5] px-6">
        <FileTextIcon className="mb-4 size-12 text-muted-foreground/40" strokeWidth={1.25} />
        <p className="text-[16px] font-bold text-[#1A1F1E]">Procedure not found</p>
        <Button asChild variant="ghost" className="mt-4 text-[#1A5345] hover:text-[#0F3D32]">
          <Link href="/doctor-procedures">
            <ArrowLeftIcon className="size-4" aria-hidden />
            Back to procedures
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#F9F8F5] animate-in fade-in duration-300">
      <div className="relative z-20 shrink-0 border-b border-[#E8E6E0]/60 bg-white">
        <div className="flex flex-col px-5 pb-4 pt-4 sm:px-6 sm:pb-5 sm:pt-5">
          <div className="mb-2 flex items-center gap-2 sm:mb-2.5">
            <Breadcrumb>
              <BreadcrumbList className="text-[10px] sm:text-[11px]">
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/doctor-procedures" className="text-[10px] font-medium sm:text-[11px]">
                      Procedures
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link
                      href={`/doctor-procedures/${procedureId}`}
                      className="max-w-[10rem] truncate text-[10px] font-medium sm:max-w-none sm:text-[11px]"
                    >
                      {procedureName}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-[10px] font-medium sm:text-[11px]">
                    Operation report
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                {vm.order ? <StatusBadge status={vm.order.status} /> : null}
                {priority !== "normal" ? (
                  <span
                    className={cn(
                      "inline-flex rounded-lg border px-2 py-0.5 text-[10px] font-bold",
                      PRIORITY_CONFIG[priority].style,
                    )}
                  >
                    {PRIORITY_CONFIG[priority].label}
                  </span>
                ) : null}
                {vm.isFinalized ? (
                  <span className="inline-flex rounded-lg bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    Finalized
                  </span>
                ) : (
                  <span className="inline-flex rounded-lg bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    Draft
                  </span>
                )}
              </div>
              <h1 className="font-serif text-[22px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[24px] lg:text-[26px]">
                Post-operative report
              </h1>
              <p className="text-[13px] font-medium text-muted-foreground sm:text-[14px]">
                Document findings, monitoring, and discharge plan for {patientName} after {procedureName}.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                asChild
                className="h-9 border-0 bg-transparent text-muted-foreground shadow-none hover:bg-transparent hover:text-[#1A5345]"
              >
                <Link href={`/doctor-procedures/${procedureId}`}>
                  <ArrowLeftIcon className="size-4" aria-hidden />
                  Pre-op view
                </Link>
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleSaveDraft}
                className="h-9 gap-1.5 border border-[#E8E6E0]/80 bg-white text-[13px] font-bold text-[#1A1F1E] shadow-none hover:border-[#1A5345]/30 hover:bg-[#F9F8F5] hover:text-[#1A5345]"
              >
                <SaveIcon className="size-4" aria-hidden />
                Save draft
              </Button>
              <Button
                type="button"
                onClick={handleFinalize}
                className="h-9 rounded-xl bg-[#1A5345] px-4 text-[13px] font-bold text-white hover:bg-[#0F3D32]"
              >
                Finalize report
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <SnapshotTile icon={StethoscopeIcon} label="Patient" value={patientName} hint={formatPatientRowId(patientId)} />
            <SnapshotTile icon={CalendarDaysIcon} label="Procedure date" value={formatDateTimeInput(vm.draft.procedureDate)} />
            <SnapshotTile icon={ClockIcon} label="Duration" value={vm.draft.duration || "—"} hint={procedureName} />
          </div>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 border-b border-[#E8E6E0]/60 bg-white px-5 sm:px-6">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-px">
            {reportTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "inline-flex h-10 items-center gap-2 whitespace-nowrap border-b-2 px-3 text-[12px] font-bold transition-colors sm:px-4 sm:text-[13px]",
                    isActive
                      ? "border-[#1A5345] text-[#1A5345]"
                      : "border-transparent text-muted-foreground hover:text-[#1A1F1E]",
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="relative flex-1 overflow-auto bg-[#F9F8F5] px-5 py-4 sm:px-6 sm:py-5">
          <div className="custom-scrollbar mx-auto w-full max-w-4xl space-y-4 pb-8">
            {activeTab === "overview" ? (
              <div className="space-y-4">
                <section className={FORM_CARD}>
                  <h2 className="mb-4 font-serif text-[15px] font-bold text-[#1A1F1E]">Procedure summary</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Procedure date & time">
                      <Input
                        type="datetime-local"
                        value={toDateTimeLocalValue(vm.draft.procedureDate)}
                        onChange={(e) =>
                          vm.updateDraft(
                            "procedureDate",
                            e.target.value ? new Date(e.target.value).toISOString() : vm.draft.procedureDate,
                          )
                        }
                        className={FIELD_INPUT}
                      />
                    </FormField>
                    <FormField label="Duration">
                      <Input
                        value={vm.draft.duration}
                        onChange={(e) => vm.updateDraft("duration", e.target.value)}
                        placeholder="e.g. 2h 15m"
                        className={FIELD_INPUT}
                      />
                    </FormField>
                  </div>
                </section>

                <section className={FORM_CARD}>
                  <h2 className="mb-3 font-serif text-[15px] font-bold text-[#1A1F1E]">Pre-operative diagnosis</h2>
                  <Textarea
                    value={vm.draft.preOpDiagnosis}
                    onChange={(e) => vm.updateDraft("preOpDiagnosis", e.target.value)}
                    placeholder="Summarize the indication and pre-op assessment…"
                    className={cn(FIELD_INPUT, "min-h-[120px] resize-y")}
                  />
                </section>

                <section className={FORM_CARD}>
                  <h2 className="mb-3 font-serif text-[15px] font-bold text-[#1A1F1E]">Procedure narrative</h2>
                  <Textarea
                    value={vm.draft.procedureDetails}
                    onChange={(e) => vm.updateDraft("procedureDetails", e.target.value)}
                    placeholder="Describe the technique, devices used, and immediate outcome…"
                    className={cn(FIELD_INPUT, "min-h-[160px] resize-y")}
                  />
                </section>
              </div>
            ) : null}

            {activeTab === "intraoperative" ? (
              <div className="space-y-4">
                <section className={FORM_CARD}>
                  <h2 className="mb-3 font-serif text-[15px] font-bold text-[#1A1F1E]">Operative findings</h2>
                  <p className="mb-3 text-[12px] font-medium text-muted-foreground">
                    Enter one finding per line.
                  </p>
                  <Textarea
                    value={vm.draft.operativeFindings.join("\n")}
                    onChange={(e) =>
                      vm.updateDraft(
                        "operativeFindings",
                        e.target.value
                          .split("\n")
                          .map((line) => line.trim())
                          .filter(Boolean),
                      )
                    }
                    placeholder={"Triple vessel disease\nSevere LAD stenosis\nGood distal runoff"}
                    className={cn(FIELD_INPUT, "min-h-[160px] resize-y font-mono")}
                  />
                </section>

                <section className={FORM_CARD}>
                  <h2 className="mb-4 font-serif text-[15px] font-bold text-[#1A1F1E]">Intraoperative complications</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {INTRAOP_COMPLICATION_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-[#E8E6E0]/60 bg-[#FBFDFC] px-3 py-2.5"
                      >
                        <Checkbox
                          checked={vm.draft.complications.includes(option.value)}
                          onCheckedChange={(checked) =>
                            toggleComplication(option.value, Boolean(checked))
                          }
                          className="rounded-md border-[#E8E6E0] data-[state=checked]:border-[#1A5345] data-[state=checked]:bg-[#1A5345]"
                        />
                        <span className="text-[13px] font-medium text-[#1A1F1E]">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </section>
              </div>
            ) : null}

            {activeTab === "postOp" ? (
              <div className="space-y-4">
                <section className={FORM_CARD}>
                  <h2 className="mb-4 font-serif text-[15px] font-bold text-[#1A1F1E]">
                    Immediate post-operative status
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Consciousness">
                      <Input
                        value={vm.draft.postOpStatus.consciousnessLevel}
                        onChange={(e) =>
                          vm.updateDraft("postOpStatus", {
                            ...vm.draft.postOpStatus,
                            consciousnessLevel: e.target.value,
                          })
                        }
                        className={FIELD_INPUT}
                      />
                    </FormField>
                    <FormField label="Blood pressure">
                      <Input
                        value={vm.draft.postOpStatus.bloodPressure}
                        onChange={(e) =>
                          vm.updateDraft("postOpStatus", {
                            ...vm.draft.postOpStatus,
                            bloodPressure: e.target.value,
                          })
                        }
                        className={FIELD_INPUT}
                      />
                    </FormField>
                    <FormField label="Heart rate">
                      <Input
                        value={vm.draft.postOpStatus.heartRate}
                        onChange={(e) =>
                          vm.updateDraft("postOpStatus", {
                            ...vm.draft.postOpStatus,
                            heartRate: e.target.value,
                          })
                        }
                        className={FIELD_INPUT}
                      />
                    </FormField>
                    <FormField label="Oxygen saturation">
                      <Input
                        value={vm.draft.postOpStatus.oxygenSaturation}
                        onChange={(e) =>
                          vm.updateDraft("postOpStatus", {
                            ...vm.draft.postOpStatus,
                            oxygenSaturation: e.target.value,
                          })
                        }
                        className={FIELD_INPUT}
                      />
                    </FormField>
                    <FormField label="Ventilator status" className="sm:col-span-2">
                      <Input
                        value={vm.draft.postOpStatus.ventilatorStatus}
                        onChange={(e) =>
                          vm.updateDraft("postOpStatus", {
                            ...vm.draft.postOpStatus,
                            ventilatorStatus: e.target.value,
                          })
                        }
                        className={FIELD_INPUT}
                      />
                    </FormField>
                  </div>
                </section>

                <section className={FORM_CARD}>
                  <h2 className="mb-4 font-serif text-[15px] font-bold text-[#1A1F1E]">Recovery status</h2>
                  <div className="flex flex-wrap gap-2">
                    {RECOVERY_STATUS_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => vm.updateDraft("recoveryStatus", option.value)}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-[12px] font-bold transition-colors",
                          vm.draft.recoveryStatus === option.value
                            ? "bg-[#1A5345] text-white"
                            : "bg-[#F9F8F5] text-muted-foreground hover:bg-white hover:text-[#1A1F1E]",
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section className={FORM_CARD}>
                  <h2 className="mb-4 font-serif text-[15px] font-bold text-[#1A1F1E]">ICU monitoring</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="ICU admission">
                      <Input
                        type="datetime-local"
                        value={toDateTimeLocalValue(vm.draft.icuMonitoring.admissionDate)}
                        onChange={(e) =>
                          vm.updateDraft("icuMonitoring", {
                            ...vm.draft.icuMonitoring,
                            admissionDate: e.target.value
                              ? new Date(e.target.value).toISOString()
                              : "",
                          })
                        }
                        className={FIELD_INPUT}
                      />
                    </FormField>
                    <FormField label="Expected stay">
                      <Input
                        value={vm.draft.icuMonitoring.stayDuration}
                        onChange={(e) =>
                          vm.updateDraft("icuMonitoring", {
                            ...vm.draft.icuMonitoring,
                            stayDuration: e.target.value,
                          })
                        }
                        placeholder="e.g. 2 days"
                        className={FIELD_INPUT}
                      />
                    </FormField>
                  </div>
                </section>
              </div>
            ) : null}

            {activeTab === "discharge" ? (
              <div className="space-y-4">
                <section className={FORM_CARD}>
                  <h2 className="mb-4 font-serif text-[15px] font-bold text-[#1A1F1E]">Discharge summary</h2>
                  <div className="space-y-4">
                    <FormField label="Discharge date">
                      <Input
                        type="datetime-local"
                        value={toDateTimeLocalValue(vm.draft.dischargeSummary.dischargeDate)}
                        onChange={(e) =>
                          vm.updateDraft("dischargeSummary", {
                            ...vm.draft.dischargeSummary,
                            dischargeDate: e.target.value
                              ? new Date(e.target.value).toISOString()
                              : "",
                          })
                        }
                        className={FIELD_INPUT}
                      />
                    </FormField>
                    <FormField label="Final condition">
                      <Input
                        value={vm.draft.dischargeSummary.finalCondition}
                        onChange={(e) =>
                          vm.updateDraft("dischargeSummary", {
                            ...vm.draft.dischargeSummary,
                            finalCondition: e.target.value,
                          })
                        }
                        className={FIELD_INPUT}
                      />
                    </FormField>
                    <FormField label="Discharge instructions">
                      <Textarea
                        value={vm.draft.dischargeSummary.dischargeInstructions}
                        onChange={(e) =>
                          vm.updateDraft("dischargeSummary", {
                            ...vm.draft.dischargeSummary,
                            dischargeInstructions: e.target.value,
                          })
                        }
                        className={cn(FIELD_INPUT, "min-h-[120px] resize-y")}
                      />
                    </FormField>
                  </div>
                </section>

                <section className={FORM_CARD}>
                  <h2 className="mb-4 font-serif text-[15px] font-bold text-[#1A1F1E]">Follow-up plan</h2>
                  <div className="space-y-4">
                    <FormField label="Follow-up appointment">
                      <Input
                        type="datetime-local"
                        value={toDateTimeLocalValue(vm.draft.followUpPlan.followUpDate)}
                        onChange={(e) =>
                          vm.updateDraft("followUpPlan", {
                            ...vm.draft.followUpPlan,
                            followUpDate: e.target.value
                              ? new Date(e.target.value).toISOString()
                              : "",
                          })
                        }
                        className={FIELD_INPUT}
                      />
                    </FormField>
                    <FormField label="Required tests (one per line)">
                      <Textarea
                        value={vm.draft.followUpPlan.requiredTests.join("\n")}
                        onChange={(e) =>
                          vm.updateDraft("followUpPlan", {
                            ...vm.draft.followUpPlan,
                            requiredTests: e.target.value
                              .split("\n")
                              .map((line) => line.trim())
                              .filter(Boolean),
                          })
                        }
                        className={cn(FIELD_INPUT, "min-h-[100px] resize-y")}
                      />
                    </FormField>
                    <FormField label="Current medications (one per line)">
                      <Textarea
                        value={vm.draft.followUpPlan.currentMedications.join("\n")}
                        onChange={(e) =>
                          vm.updateDraft("followUpPlan", {
                            ...vm.draft.followUpPlan,
                            currentMedications: e.target.value
                              .split("\n")
                              .map((line) => line.trim())
                              .filter(Boolean),
                          })
                        }
                        className={cn(FIELD_INPUT, "min-h-[100px] resize-y")}
                      />
                    </FormField>
                  </div>
                </section>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: doctorProceduresScrollbarCss() }} />
    </div>
  )
}

function FormField({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className={FIELD_LABEL}>{label}</Label>
      {children}
    </div>
  )
}

function SnapshotTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-[#E8E6E0]/60 bg-[#FBFDFC] p-3">
      <div className="mb-1 flex items-center gap-1.5">
        <Icon className="size-4 text-[#1A5345]" aria-hidden />
        <p className="text-[11px] font-medium text-[#6B7870]">{label}</p>
      </div>
      <p className="truncate text-[14px] font-bold text-[#1A1F1E]">{value}</p>
      {hint ? <p className="mt-0.5 truncate text-[11px] font-medium text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function toDateTimeLocalValue(value: string) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatDateTimeInput(value: string) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
}
