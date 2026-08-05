"use client"

import type { ConsultationReport } from "../../../doctorPatients.types"
import type { ConsultationReportDraft } from "../../../consultationReportEditor"
import { REPORT_EMPTY_MESSAGES } from "@/lib/consultation-report.mapper"
import { cn } from "@/lib/utils"
import {
  ActivityIcon,
  ArrowRightLeftIcon,
  ClipboardCheckIcon,
  ClipboardListIcon,
  FileTextIcon,
  FlaskConicalIcon,
  PillIcon,
  ScanLineIcon,
  SparklesIcon,
  StethoscopeIcon,
  Trash2Icon,
  UserRoundIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { EditableReportBlock } from "./EditableReportBlock"

function ReportTextBlock({
  value,
  emptyMessage,
  className,
}: {
  value: string
  emptyMessage: string
  className?: string
}) {
  const isEmpty = value === emptyMessage
  return (
    <p
      className={cn(
        "whitespace-pre-wrap text-[13px] font-medium leading-relaxed md:text-[14px]",
        isEmpty ? "text-[#6B7870] italic" : "text-[#1A1F1E]",
        className,
      )}
    >
      {value}
    </p>
  )
}

function SectionShell({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#E8E6E0]/80 bg-white p-5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.02)] sm:p-6",
        className,
      )}
    >
      <div className="mb-4 flex items-center gap-2.5">
        <Icon className="size-5 text-[#1A5345]" aria-hidden />
        <h3 className="text-[15px] font-bold text-[#1A1F1E]">{title}</h3>
      </div>
      {children}
    </div>
  )
}

const AI_MODALITY_LABELS: Record<string, string> = {
  ct: "CT",
  xray: "X-ray",
  ecg: "ECG",
  echo: "Echo",
  cine_mri: "Cine MRI",
  ecg_classification: "ECG classification",
  lab_panel: "Lab report AI",
}

type ConsultationReportSessionSectionsProps = {
  report: ConsultationReport
  draft: ConsultationReportDraft
  isEditing: boolean
  sectionGroup: "clinical" | "orders"
  onUpdateDraft: (patch: Partial<ConsultationReportDraft>) => void
  onUpdateAiStudy: (
    studyId: string,
    patch: Partial<ConsultationReportDraft["aiStudies"][number]>,
  ) => void
  onRemoveAiStudy: (studyId: string) => void
}

export function ConsultationReportSessionSections({
  report,
  draft,
  isEditing,
  sectionGroup,
  onUpdateDraft,
  onUpdateAiStudy,
  onRemoveAiStudy,
}: ConsultationReportSessionSectionsProps) {
  const visibleAiStudies = draft.aiStudies.filter((study) => !study.hidden)
  const hasTestOrders = report.sessionTestOrders.length > 0
  const hasHomeMeasurements = report.homeMeasurements.length > 0
  const hasReferrals = report.referrals.length > 0

  if (sectionGroup === "clinical") {
    return (
      <>
        <SectionShell title="Medical history (visit snapshot)" icon={ClipboardListIcon}>
        <EditableReportBlock
          editing={isEditing}
          value={draft.medicalHistorySummary}
          onChange={(medicalHistorySummary) => onUpdateDraft({ medicalHistorySummary })}
          className={
            draft.medicalHistorySummary === REPORT_EMPTY_MESSAGES.medicalHistorySummary
              ? "text-[#6B7870] italic"
              : "text-[#1A1F1E]"
          }
          rows={6}
        />
      </SectionShell>

      <SectionShell title="Clinical notes" icon={FileTextIcon}>
        <EditableReportBlock
          editing={isEditing}
          value={draft.clinicalNotes}
          onChange={(clinicalNotes) => onUpdateDraft({ clinicalNotes })}
          className={
            draft.clinicalNotes === REPORT_EMPTY_MESSAGES.clinicalNotes
              ? "text-[#6B7870] italic"
              : "text-[#1A1F1E]"
          }
          rows={6}
        />
      </SectionShell>

      <SectionShell title="Assessment & plan (internal)" icon={ClipboardCheckIcon}>
        <EditableReportBlock
          editing={isEditing}
          value={draft.assessmentAndPlan}
          onChange={(assessmentAndPlan) => onUpdateDraft({ assessmentAndPlan })}
          className={
            draft.assessmentAndPlan === REPORT_EMPTY_MESSAGES.assessmentAndPlan
              ? "text-[#6B7870] italic"
              : "text-[#1A1F1E]"
          }
          rows={6}
        />
      </SectionShell>
      </>
    )
  }

  return (
    <>
      {report.prescriptions.length > 0 ? (
        <SectionShell title="Prescriptions" icon={PillIcon} className="overflow-hidden">
          <div className="-mx-5 -mb-5 sm:-mx-6 sm:-mb-6 overflow-x-auto custom-scrollbar border-t border-[#E8E6E0]/60 mt-2">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#F9F8F5] border-b border-[#E8E6E0]/60">
                <tr>
                  <th className="px-5 sm:px-6 py-3 font-semibold text-[#1A1F1E]">Medication</th>
                  <th className="px-4 py-3 font-semibold text-[#1A1F1E]">Dose</th>
                  <th className="px-4 py-3 font-semibold text-[#1A1F1E]">Frequency</th>
                  <th className="px-4 py-3 font-semibold text-[#1A1F1E]">Duration</th>
                  <th className="px-5 sm:px-6 py-3 font-semibold text-[#1A1F1E]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E6E0]/60">
                {report.prescriptions.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-[#F9F8F5]/50 group">
                    <td className="px-5 sm:px-6 py-4 font-bold text-[#1A1F1E] group-hover:text-[#1A5345] transition-colors">
                      {p.name}
                    </td>
                    <td className="px-4 py-4 font-medium text-muted-foreground">{p.dose}</td>
                    <td className="px-4 py-4 font-medium text-muted-foreground">{p.frequency}</td>
                    <td className="px-4 py-4 font-medium text-muted-foreground">{p.duration}</td>
                    <td className="px-5 sm:px-6 py-4">
                      {p.isNew ? (
                        <span className="inline-flex items-center rounded-lg bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 ring-1 ring-inset ring-blue-600/20">
                          New
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-lg bg-[#F3F2F0] px-2 py-0.5 text-[10px] font-bold text-[#6B7870] ring-1 ring-inset ring-gray-500/10">
                          Continued
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionShell>
      ) : null}

      <SectionShell title="Tests & orders placed" icon={FlaskConicalIcon}>
        {!hasTestOrders ? (
          <ReportTextBlock
            value={REPORT_EMPTY_MESSAGES.testOrders}
            emptyMessage={REPORT_EMPTY_MESSAGES.testOrders}
          />
        ) : (
          <div className="space-y-3">
            {report.sessionTestOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-xl border border-[#E8E6E0]/60 bg-[#FAFAF8] p-4"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-[#E8F0EE]/80 px-2 py-0.5 text-[10px] font-bold uppercase text-[#1A5345]">
                    {order.priority}
                  </span>
                  <span className="rounded-lg bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-[#6B7870] ring-1 ring-[#E8E6E0]">
                    {order.status}
                  </span>
                </div>
                <p className="text-[13px] font-bold text-[#1A1F1E]">
                  {order.tests.length > 0 ? order.tests.join(" · ") : "Order placed"}
                </p>
                {order.notes ? (
                  <p className="mt-1 text-[12px] leading-relaxed text-[#6B7870]">{order.notes}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </SectionShell>

      <SectionShell title="Home monitoring instructions" icon={ActivityIcon}>
        {!hasHomeMeasurements ? (
          <ReportTextBlock
            value={REPORT_EMPTY_MESSAGES.homeMeasurements}
            emptyMessage={REPORT_EMPTY_MESSAGES.homeMeasurements}
          />
        ) : (
          <ul className="space-y-2">
            {report.homeMeasurements.map((item, index) => (
              <li
                key={`${item.metric}-${index}`}
                className="rounded-xl border border-[#E8E6E0]/60 bg-[#FAFAF8] px-4 py-3"
              >
                <p className="text-[13px] font-bold text-[#1A1F1E]">
                  {item.metric.replace(/_/g, " ")}
                </p>
                <p className="text-[12px] text-[#6B7870]">
                  {[item.frequency, item.notes].filter(Boolean).join(" · ") || "As directed"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </SectionShell>

      <SectionShell title="AI analyses & session uploads" icon={SparklesIcon}>
        {!isEditing && visibleAiStudies.length === 0 ? (
          <ReportTextBlock
            value={REPORT_EMPTY_MESSAGES.aiStudies}
            emptyMessage={REPORT_EMPTY_MESSAGES.aiStudies}
          />
        ) : isEditing && draft.aiStudies.length === 0 ? (
          <ReportTextBlock
            value={REPORT_EMPTY_MESSAGES.aiStudies}
            emptyMessage={REPORT_EMPTY_MESSAGES.aiStudies}
          />
        ) : (
          <div className="space-y-3">
            {(isEditing ? draft.aiStudies : visibleAiStudies).map((study) => (
              <div
                key={study.id}
                className={cn(
                  "rounded-xl border p-4",
                  study.hidden
                    ? "border-dashed border-[#E8E6E0] bg-[#FAFAF8] opacity-60"
                    : "border-violet-200/60 bg-violet-50/30",
                )}
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase text-violet-800">
                      <ScanLineIcon className="size-3" aria-hidden />
                      {AI_MODALITY_LABELS[study.modality] ?? study.modality}
                    </span>
                    {study.fileName ? (
                      <span className="text-[11px] font-medium text-[#6B7870]">
                        {study.fileName}
                      </span>
                    ) : null}
                  </div>
                  {isEditing ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={study.hidden}
                      className="h-7 gap-1 rounded-lg border-0 bg-transparent px-2 text-[11px] font-bold text-rose-600 shadow-none hover:bg-rose-50 hover:text-rose-700"
                      onClick={() => onRemoveAiStudy(study.id)}
                    >
                      <Trash2Icon className="size-3.5" aria-hidden />
                      Remove
                    </Button>
                  ) : null}
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <EditableReportBlock
                      editing
                      value={study.title}
                      onChange={(title) => onUpdateAiStudy(study.id, { title })}
                      rows={1}
                      className="min-h-0 font-bold text-[#1A1F1E]"
                    />
                    <EditableReportBlock
                      editing
                      value={study.summary}
                      onChange={(summary) => onUpdateAiStudy(study.id, { summary })}
                      rows={4}
                    />
                    <EditableReportBlock
                      editing
                      value={study.details}
                      onChange={(details) => onUpdateAiStudy(study.id, { details })}
                      rows={3}
                      className="text-[#6B7870]"
                    />
                  </div>
                ) : (
                  <>
                    <p className="text-[13px] font-bold text-[#1A1F1E]">{study.title}</p>
                    <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-[#2D3633]">
                      {study.summary}
                    </p>
                    {study.details ? (
                      <p className="mt-2 text-[12px] leading-relaxed text-[#6B7870]">
                        {study.details}
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionShell>

      <SectionShell title="Specialist referrals" icon={ArrowRightLeftIcon}>
        {!hasReferrals ? (
          <ReportTextBlock
            value={REPORT_EMPTY_MESSAGES.referrals}
            emptyMessage={REPORT_EMPTY_MESSAGES.referrals}
          />
        ) : (
          <div className="space-y-3">
            {report.referrals.map((ref, index) => (
              <div
                key={`${ref.specialty}-${index}`}
                className="rounded-xl border border-[#E8E6E0]/60 bg-[#FAFAF8] p-4"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#E8F0EE]/80 px-2 py-1 text-[11px] font-bold text-[#1A5345]">
                    <UserRoundIcon className="size-3" aria-hidden />
                    {ref.specialty}
                  </span>
                  <span
                    className={cn(
                      "rounded-lg px-2 py-1 text-[9px] font-bold shadow-sm",
                      ref.urgency === "urgent" ? "bg-red-600 text-white" : "bg-emerald-600 text-white",
                    )}
                  >
                    {ref.urgency === "urgent" ? "Urgent" : "Routine"}
                  </span>
                </div>
                <p className="text-[13px] leading-relaxed text-[#1A1F1E]">
                  <span className="font-bold text-[#6B7870]">Reason: </span>
                  {ref.reason}
                </p>
              </div>
            ))}
          </div>
        )}
      </SectionShell>

      <SectionShell title="Procedure planning" icon={StethoscopeIcon}>
        <EditableReportBlock
          editing={isEditing}
          value={draft.procedureDetailsSummary}
          onChange={(procedureDetailsSummary) => onUpdateDraft({ procedureDetailsSummary })}
          className={
            draft.procedureDetailsSummary === REPORT_EMPTY_MESSAGES.procedureDetailsSummary
              ? "text-[#6B7870] italic"
              : "text-[#1A1F1E]"
          }
          rows={5}
        />
      </SectionShell>
    </>
  )
}
