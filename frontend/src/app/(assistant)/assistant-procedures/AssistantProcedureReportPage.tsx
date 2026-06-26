"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useAssistantProcedureReportData } from "./useAssistantProcedureReportData"
import {
  ArrowLeftIcon,
  AlertTriangleIcon,
  BedIcon,
  CalendarCheckIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  ClockIcon,
  DoorOpenIcon,
  EyeIcon,
  FileTextIcon,
  HeartPulseIcon,
  MapPinIcon,
  PillIcon,
  ScissorsIcon,
  SparklesIcon,
  StethoscopeIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { cn } from "@/lib/utils"
import { useAssistantPageTranslations } from "../use-assistant-i18n"
import { PRIORITY_CONFIG } from "./assistantProcedures.config"
import { resolveProcedureReport } from "./assistantProcedureReports.mock"
import type { IntraoperativeComplicationKey, RecoveryStatusKey } from "./assistantProcedureReports.mock"

type AssistantProcedureReportPageProps = {
  procedureId: string
}

const REPORT_CARD =
  "h-fit rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md"

const REPORT_BODY_TEXT = "text-[13px] font-medium leading-relaxed text-[#6B7870] sm:text-[14px]"
const REPORT_HINT_TEXT = "text-[12px] font-medium text-[#6B7870] sm:text-[13px]"
const REPORT_INSET =
  "rounded-xl border border-[#E8E6E0]/60 bg-[#FAFAF8] px-4 py-3.5 text-[13px] leading-relaxed text-[#1A1F1E] sm:text-[14px]"

const REPORT_TAB_PANEL =
  "min-h-[360px] w-full rounded-2xl border border-[#E8E6E0]/80 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] sm:p-6"

type ReportTab =
  | "clinicalOverview"
  | "intraoperativeRecord"
  | "postOperativeMonitoring"
  | "recoveryDischarge"
  | "aiInsights"

export function AssistantProcedureReportPage({ procedureId }: AssistantProcedureReportPageProps) {
  const { t, ts } = useAssistantPageTranslations("procedures")
  const [activeTab, setActiveTab] = useState<ReportTab>("clinicalOverview")

  const { ordersQuery, historyQuery } = useAssistantProcedureReportData()

  const order = useMemo(
    () => ordersQuery.data?.find((item) => item.id === procedureId) ?? null,
    [ordersQuery.data, procedureId],
  )
  const history = useMemo(
    () => historyQuery.data?.find((item) => item.id === procedureId) ?? null,
    [historyQuery.data, procedureId],
  )
  const report = useMemo(
    () => resolveProcedureReport(procedureId, order, history),
    [procedureId, order, history],
  )

  const reportTabs = [
    { id: "clinicalOverview" as const, label: t("report.sections.clinicalOverview"), icon: FileTextIcon },
    { id: "intraoperativeRecord" as const, label: t("report.sections.intraoperativeRecord"), icon: ScissorsIcon },
    { id: "postOperativeMonitoring" as const, label: t("report.sections.postOperativeMonitoring"), icon: HeartPulseIcon },
    { id: "recoveryDischarge" as const, label: t("report.sections.recoveryDischarge"), icon: DoorOpenIcon },
    { id: "aiInsights" as const, label: t("report.sections.ai"), icon: SparklesIcon },
  ]

  if (!order && !history) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center gap-4 bg-[#F9F8F5] p-8 text-center">
        <FileTextIcon className="size-12 text-muted-foreground/30" />
        <h2 className="text-lg font-bold text-[#1A1F1E]">{t("report.notFoundTitle")}</h2>
        <p className="max-w-md text-sm text-muted-foreground">{t("report.notFoundHint")}</p>
        <Button asChild variant="outline" className="h-8 rounded-lg border-[#E8E6E0] bg-white px-4 text-[12px] font-bold shadow-sm hover:border-[#1A5345]/30 hover:bg-slate-50 hover:text-[#1A5345]">
          <Link href="/assistant-procedures?view=history">{t("report.backToHistory")}</Link>
        </Button>
      </div>
    )
  }

  const patientName = order?.patientName ?? history!.patientName
  const patientId = order?.patientId ?? history!.patientId
  const procedureName = order?.procedureName ?? history!.procedureName
  const priority = order?.priority ?? history!.priority
  const location = history?.location ?? order?.department ?? "—"
  const doneCount = order?.requirements.filter((req) => req.isDone).length ?? 0
  const totalCount = order?.requirements.length ?? 0

  const procedureDateLabel = report
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "long", timeStyle: "short" }).format(
        new Date(report.procedureDate),
      )
    : "—"

  const formatCompletedAt = (value: string) =>
    new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(value),
    )

  const activeComplications =
    report?.complications.filter((c) => c !== "none") ?? []
  const hasNoComplications = activeComplications.length === 0

  const icuAdmissionLabel =
    report?.icuMonitoring.admissionDate
      ? new Intl.DateTimeFormat(undefined, { dateStyle: "long", timeStyle: "short" }).format(
          new Date(report.icuMonitoring.admissionDate),
        )
      : null

  const dischargeDateLabel = report?.dischargeSummary.dischargeDate
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "long", timeStyle: "short" }).format(
        new Date(report.dischargeSummary.dischargeDate),
      )
    : "—"

  const followUpDateLabel = report?.followUpPlan.followUpDate
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "long", timeStyle: "short" }).format(
        new Date(report.followUpPlan.followUpDate),
      )
    : "—"

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-x-hidden bg-[#F9F8F5] animate-in fade-in duration-500">
      {/* Header — matches assistant dashboard */}
      <div className="relative z-20 shrink-0 border-b border-[#E8E6E0]/60 bg-gradient-to-br from-white via-[#FFFCFA] to-[#E8F0EE]/30">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#1A5345]/15 via-[#CC5533]/35 to-[#1A5345]/15"
          aria-hidden
        />
        <div className="flex flex-col px-6 pb-5 pt-4 sm:px-8 sm:pb-6 sm:pt-5">
          <Breadcrumb>
            <BreadcrumbList className="text-[10px] sm:text-[11px]">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/assistant-dashboard" className="font-medium">
                    {ts("breadcrumbDashboard")}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/assistant-procedures?view=history" className="font-medium">
                    {t("history.breadcrumb")}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium">{t("report.breadcrumb")}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="mt-3 flex flex-col gap-3 sm:mt-4 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="default"
                  className={cn(
                    "rounded-lg px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-none",
                    priority === "normal"
                      ? "border-0 bg-[#6B7870] text-white"
                      : priority === "urgent"
                        ? "border-0 bg-amber-500 text-white"
                        : "border-0 bg-rose-500 text-white",
                  )}
                >
                  {PRIORITY_CONFIG[priority].label}
                </Badge>
                {history?.riskScore ? (
                  <span className="rounded-lg bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700">
                    {history.riskScore}
                  </span>
                ) : null}
              </div>
              <h1 className="font-serif text-[24px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[26px] lg:text-[28px]">
                {t("report.title")}
              </h1>
              <p className={REPORT_BODY_TEXT}>
                {t("report.subtitleProcedure", { procedure: procedureName, id: procedureId })}
              </p>
            </div>

            <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:gap-2.5">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="group h-8 shrink-0 items-center gap-1.5 rounded-lg border-[#E8E6E0] bg-white px-4 text-[12px] font-bold text-[#1A1F1E] shadow-sm transition-all hover:border-[#1A5345]/30 hover:bg-slate-50 hover:text-[#1A5345] hover:shadow-md"
              >
                <Link href="/assistant-procedures?view=history">
                  <ArrowLeftIcon className="size-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden />
                  {t("report.backToHistory")}
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="group h-8 shrink-0 items-center gap-1.5 rounded-lg border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-[0_2px_10px_rgba(26,83,69,0.2)] transition-all hover:bg-[#133F34] hover:shadow-[0_4px_14px_rgba(26,83,69,0.25)]"
              >
                <Link href="/assistant-dashboard">{ts("breadcrumbDashboard")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-auto bg-[#F9F8F5] px-6 pb-10 pt-6 sm:px-8 sm:pb-12 sm:pt-8">
        <div className="w-full min-w-0 space-y-8">
          {/* Key metrics — dashboard stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {report ? (
              <>
                <DashboardStatCard
                  icon={CalendarDaysIcon}
                  iconClassName="text-[#1A5345]"
                  label={t("report.procedureDate")}
                  value={procedureDateLabel}
                  hint={procedureName}
                />
                <DashboardStatCard
                  icon={ClockIcon}
                  iconClassName="text-[#CC5533]"
                  label={t("report.duration")}
                  value={report.duration}
                  hint={location}
                />
              </>
            ) : null}
            <DashboardStatCard
              icon={UsersIcon}
              iconClassName="text-[#1A5345]"
              label={ts("patient")}
              value={patientName}
              hint={`#${patientId}`}
            />
            <DashboardStatCard
              icon={MapPinIcon}
              iconClassName="text-[#CC5533]"
              label={t("history.tableLocation")}
              value={location}
              hint={t("report.operatingSuite")}
            />
          </div>

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
            <div className="flex min-w-0 flex-col gap-6 xl:col-span-2">
              <div className="flex items-center gap-2 overflow-x-auto border-b border-[#E8E6E0] pb-px custom-scrollbar">
              {reportTabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-[14px] font-bold outline-none transition-all",
                      isActive
                        ? "border-[#1A5345] text-[#1A5345]"
                        : "border-transparent text-muted-foreground hover:rounded-t-lg hover:bg-slate-50 hover:text-[#1A1F1E]",
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            <div className={cn(REPORT_TAB_PANEL, "animate-in fade-in duration-300")}>
              {activeTab === "clinicalOverview" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <ReportCard icon={FileTextIcon} title={t("report.procedureOverview")}>
                    <h3 className="font-serif text-[18px] font-bold text-[#1A1F1E]">{procedureName}</h3>
                    {history?.notes && !report?.preOpDiagnosis ? (
                      <p className={cn("mt-3", REPORT_INSET)}>{history.notes}</p>
                    ) : null}
                  </ReportCard>
                  <ReportCard icon={StethoscopeIcon} title={t("report.preOpDiagnosis")}>
                    <p className={REPORT_INSET}>
                      {report?.preOpDiagnosis?.trim() ? report.preOpDiagnosis : t("report.noPreOpDiagnosis")}
                    </p>
                  </ReportCard>
                </div>
              ) : null}

              {activeTab === "intraoperativeRecord" ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <ReportCard icon={EyeIcon} title={t("report.operativeFindings")} hint={t("report.operativeFindingsHint")}>
                      {report && report.operativeFindings.length > 0 ? (
                        <ul className="space-y-2">
                          {report.operativeFindings.map((finding) => (
                            <li key={finding} className={cn("flex items-start gap-2.5", REPORT_INSET, "py-2.5")}>
                              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#1A5345]" aria-hidden />
                              {finding}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className={REPORT_HINT_TEXT}>{t("report.noOperativeFindings")}</p>
                      )}
                    </ReportCard>
                    <ReportCard icon={ScissorsIcon} title={t("report.procedureDetails")} hint={t("report.procedureDetailsHint")}>
                      <p className={REPORT_INSET}>
                        {report?.procedureDetails?.trim() ? report.procedureDetails : t("report.noProcedureDetails")}
                      </p>
                    </ReportCard>
                  </div>
                  <ReportCard icon={AlertTriangleIcon} title={t("report.intraoperativeComplications")} hint={t("report.intraoperativeComplicationsHint")}>
                    <div className="flex flex-wrap gap-2">
                      {hasNoComplications ? (
                        <Badge className="rounded-lg border-0 bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-none">
                          {t("report.complications.none")}
                        </Badge>
                      ) : (
                        activeComplications.map((key: IntraoperativeComplicationKey) => (
                          <Badge key={key} className="rounded-lg border-0 bg-rose-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-none">
                            {t(`report.complications.${key}`)}
                          </Badge>
                        ))
                      )}
                    </div>
                  </ReportCard>
                  <ReportCard icon={UsersIcon} title={t("report.surgicalTeam")}>
                    {report && report.surgicalTeam.length > 0 ? (
                      <div className="overflow-x-auto rounded-xl border border-[#E8E6E0]/60">
                        <table className="w-full min-w-[320px] text-left text-[13px]">
                          <thead className="bg-[#F9F8F5]/80">
                            <tr>
                              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t("report.teamRole")}</th>
                              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t("report.teamMember")}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E8E6E0]/40">
                            {report.surgicalTeam.map((member) => (
                              <tr key={member.roleKey}>
                                <td className="px-4 py-3 font-semibold text-[#1A1F1E]">{t(`report.teamRoles.${member.roleKey}`)}</td>
                                <td className="px-4 py-3 font-medium text-[#6B7870]">{member.name}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className={REPORT_HINT_TEXT}>{t("report.notAvailable")}</p>
                    )}
                  </ReportCard>
                </div>
              ) : null}

              {activeTab === "postOperativeMonitoring" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <ReportCard icon={HeartPulseIcon} title={t("report.immediatePostOpStatus")}>
                    {report ? (
                      <dl className="grid gap-3 sm:grid-cols-2">
                        <PostOpStat label={t("report.postOpStatus.consciousnessLevel")} value={report.postOpStatus.consciousnessLevel} />
                        <PostOpStat label={t("report.postOpStatus.bloodPressure")} value={report.postOpStatus.bloodPressure} />
                        <PostOpStat label={t("report.postOpStatus.heartRate")} value={report.postOpStatus.heartRate} />
                        <PostOpStat label={t("report.postOpStatus.oxygenSaturation")} value={report.postOpStatus.oxygenSaturation} />
                        <PostOpStat className="sm:col-span-2" label={t("report.postOpStatus.ventilatorStatus")} value={report.postOpStatus.ventilatorStatus} />
                      </dl>
                    ) : (
                      <p className={REPORT_HINT_TEXT}>{t("report.notAvailable")}</p>
                    )}
                  </ReportCard>
                  <ReportCard icon={BedIcon} title={t("report.icuMonitoring")}>
                    {report ? (
                      <dl className="grid gap-3">
                        <PostOpStat label={t("report.icuMonitoringFields.admissionDate")} value={icuAdmissionLabel ?? t("report.notAdmittedIcu")} />
                        <PostOpStat label={t("report.icuMonitoringFields.stayDuration")} value={report.icuMonitoring.stayDuration} />
                      </dl>
                    ) : (
                      <p className={REPORT_HINT_TEXT}>{t("report.notAvailable")}</p>
                    )}
                  </ReportCard>
                </div>
              ) : null}

              {activeTab === "aiInsights" ? (
                report ? (
                  <ReportCard icon={SparklesIcon} title={t("report.aiRecoveryPrediction")}>
                    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <PostOpStat label={t("report.aiPrediction.recoveryRiskScore")} value={report.aiRecoveryPrediction.recoveryRiskScore} />
                      <PostOpStat label={t("report.aiPrediction.expectedRecoveryTime")} value={report.aiRecoveryPrediction.expectedRecoveryTime} />
                      <PostOpStat label={t("report.aiPrediction.readmissionRisk")} value={report.aiRecoveryPrediction.readmissionRisk} />
                      <PostOpStat label={t("report.aiPrediction.infectionRisk")} value={report.aiRecoveryPrediction.infectionRisk} />
                      <PostOpStat label={t("report.aiPrediction.recommendedMonitoringLevel")} value={report.aiRecoveryPrediction.recommendedMonitoringLevel} />
                      <PostOpStat label={t("report.aiPrediction.recoveryProbability")} value={report.aiRecoveryPrediction.recoveryProbability} />
                    </dl>
                  </ReportCard>
                ) : (
                  <p className={REPORT_HINT_TEXT}>{t("report.notAvailable")}</p>
                )
              ) : null}

              {activeTab === "recoveryDischarge" ? (
                report ? (
                  <div className="space-y-4">
                    <ReportCard icon={PillIcon} title={t("report.postOpMedications")}>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {report.postOpMedications.map((group) => (
                          <div key={group.category}>
                            <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
                              {t(`report.medicationCategories.${group.category}`)}
                            </p>
                            <ul className="mt-2 space-y-1.5">
                              {group.items.map((item) => (
                                <li key={item} className={cn(REPORT_INSET, "py-2 font-medium")}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </ReportCard>
                    <div className="grid gap-4 md:grid-cols-2">
                      <ReportCard icon={DoorOpenIcon} title={t("report.dischargeSummary")}>
                        <dl className="space-y-3">
                          <PostOpStat label={t("report.discharge.dischargeDate")} value={dischargeDateLabel} />
                          <PostOpStat label={t("report.discharge.finalCondition")} value={report.dischargeSummary.finalCondition} />
                          <div className={REPORT_INSET}>
                            <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t("report.discharge.dischargeInstructions")}</dt>
                            <dd className="mt-2">{report.dischargeSummary.dischargeInstructions}</dd>
                          </div>
                        </dl>
                      </ReportCard>
                      <ReportCard icon={CalendarCheckIcon} title={t("report.followUpPlan")}>
                        <dl className="space-y-3">
                          <PostOpStat label={t("report.followUp.followUpDate")} value={followUpDateLabel} />
                          <div className={REPORT_INSET}>
                            <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t("report.followUp.requiredTests")}</dt>
                            <dd className="mt-2 space-y-1">
                              {report.followUpPlan.requiredTests.map((test) => (
                                <p key={test} className="font-medium">{test}</p>
                              ))}
                            </dd>
                          </div>
                          <div className={REPORT_INSET}>
                            <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t("report.followUp.currentMedications")}</dt>
                            <dd className="mt-2 space-y-1">
                              {report.followUpPlan.currentMedications.map((med) => (
                                <p key={med} className="font-medium">{med}</p>
                              ))}
                            </dd>
                          </div>
                        </dl>
                      </ReportCard>
                    </div>
                  </div>
                ) : (
                  <p className={REPORT_HINT_TEXT}>{t("report.notAvailable")}</p>
                )
              ) : null}
            </div>
            </div>

            <aside className="flex min-w-0 flex-col gap-6">
              {order ? (
                <div className={REPORT_CARD}>
                  <div className="flex items-center justify-between border-b border-[#E8E6E0]/60 pb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2Icon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
                      <h2 className="font-serif text-[16px] font-bold text-[#1A1F1E]">{t("report.checklistProgress")}</h2>
                    </div>
                    <span className="rounded-lg bg-[#1A5345] px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
                      {t("report.checklistCompleted", { done: doneCount, total: totalCount })}
                    </span>
                  </div>
                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#EEF5F3]">
                    <div className="h-full rounded-full bg-[#1A5345] transition-all duration-300" style={{ width: `${(doneCount / totalCount) * 100}%` }} />
                  </div>
                </div>
              ) : null}

              <ReportCard icon={ClipboardListIcon} title={t("report.preOpActions")}>
                {report && report.preOpProcedures.length > 0 ? (
                  <div className="space-y-2.5">
                    {report.preOpProcedures.map((item) => (
                      <div key={item.id} className="flex items-start gap-3 rounded-xl border border-[#E8E6E0]/60 bg-[#FAFAF8] px-3.5 py-3">
                        <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-bold text-[#1A1F1E]">{item.title}</p>
                          <p className="mt-0.5 text-[11px] font-medium text-[#6B7870]">
                            {t("report.completedAt", { date: formatCompletedAt(item.completedAt) })}
                            {item.completedBy ? ` · ${item.completedBy}` : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-[#E8E6E0] bg-[#F9F8F5]/50 p-6 text-center">
                    <p className={REPORT_HINT_TEXT}>{t("report.noPreOpActions")}</p>
                  </div>
                )}
              </ReportCard>

              {report ? (
                <>
                  <ReportCard icon={TrendingUpIcon} title={t("report.recoveryAssessment")}>
                    <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">{t("report.recoveryStatusLabel")}</p>
                    <Badge className={cn("mt-2 rounded-lg border-0 px-3 py-1 text-[12px] font-bold shadow-none", recoveryStatusClass(report.recoveryStatus))}>
                      {t(`report.recoveryStatus.${report.recoveryStatus}`)}
                    </Badge>
                  </ReportCard>

                  <ReportCard icon={AlertTriangleIcon} title={t("report.postOpComplications")}>
                    <div className="overflow-x-auto rounded-xl border border-[#E8E6E0]/60">
                      <table className="w-full min-w-[260px] text-left text-[13px]">
                        <thead className="bg-[#F9F8F5]/80">
                          <tr>
                            <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("report.postOpComplicationLabel")}</th>
                            <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("report.complicationStatusLabel")}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8E6E0]/40">
                          {report.postOpComplications.map((item) => (
                            <tr key={item.key}>
                              <td className="px-3 py-2.5 font-semibold text-[#1A1F1E]">{t(`report.postOpComplicationTypes.${item.key}`)}</td>
                              <td className="px-3 py-2.5">
                                <Badge className={cn("rounded-lg border-0 px-2 py-0.5 text-[10px] font-bold shadow-none", item.present ? "bg-rose-500 text-white" : "bg-emerald-600 text-white")}>
                                  {item.present ? t("report.present") : t("report.absent")}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </ReportCard>
                </>
              ) : null}
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardStatCard({
  icon: Icon,
  iconClassName,
  label,
  value,
  hint,
}: {
  icon: typeof CalendarDaysIcon
  iconClassName: string
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className={cn(REPORT_CARD, "relative overflow-hidden")}>
      <Icon className={cn("absolute right-4 top-4 size-5", iconClassName)} aria-hidden />
      <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <h3 className="mt-2 font-serif text-[18px] font-bold leading-snug text-[#1A1F1E] sm:text-[20px]">{value}</h3>
      {hint ? <p className="mt-2 text-[11px] font-medium text-[#6B7870] line-clamp-2">{hint}</p> : null}
    </div>
  )
}

function ReportCard({
  icon: Icon,
  title,
  hint,
  className,
  children,
}: {
  icon: typeof FileTextIcon
  title: string
  hint?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn(REPORT_CARD, className)}>
      <div className="flex items-center gap-2 border-b border-[#E8E6E0]/40 pb-3">
        <Icon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
        <h3 className="font-serif text-[16px] font-bold text-[#1A1F1E]">{title}</h3>
      </div>
      {hint ? <p className={cn("mt-2", REPORT_HINT_TEXT)}>{hint}</p> : null}
      <div className="mt-4">{children}</div>
    </div>
  )
}

function PostOpStat({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={cn("rounded-xl border border-[#E8E6E0]/60 bg-[#FAFAF8] px-3.5 py-3", className)}>
      <dt className="text-[12px] font-bold text-[#6B7870]">{label}</dt>
      <dd className="mt-1 text-[14px] font-semibold text-[#1A1F1E]">{value}</dd>
    </div>
  )
}

function recoveryStatusClass(status: RecoveryStatusKey): string {
  switch (status) {
    case "excellent":
      return "bg-emerald-600 text-white"
    case "good":
      return "bg-[#1A5345] text-white"
    case "fair":
      return "bg-amber-500 text-white"
    case "poor":
      return "bg-rose-500 text-white"
  }
}
