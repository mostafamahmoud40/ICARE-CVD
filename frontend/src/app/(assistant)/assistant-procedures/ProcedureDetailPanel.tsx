"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import {
  ArrowLeftIcon,
  BellIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  ClockIcon,
  FileTextIcon,
  Loader2Icon,
  PlusIcon,
  SparklesIcon,
  StethoscopeIcon,
} from "lucide-react"
import { StatusBadge } from "./StatusBadge"
import { RequirementItem } from "./RequirementItem"
import { RequirementForm } from "./RequirementForm"
import { NotifyPatientDialog } from "./NotifyPatientDialog"
import { Button } from "@/components/ui/button"
import { useAssistantPageTranslations } from "../use-assistant-i18n"
import type { RequirementAttachmentInsight } from "@/lib/procedures/requirementAttachmentAnalysis"
import type { PhysicianDirectiveSuggestion } from "@/lib/procedures/physicianDirectiveSuggestions"
import { PRIORITY_CONFIG } from "./assistantProcedures.config"
import type { ProcedureOrder } from "./assistantProcedures.types"
import { ProcedureConsentCard } from "./ProcedureConsentCard"
import type { ProcedureConsentSavePayload } from "./ProcedureConsentDialog"
import { nonConsentRequirements, findConsentRequirement } from "./procedureConsent.shared"
import { useAnalyzeRequirementAttachment } from "./useAnalyzeRequirementAttachment"
import { useSuggestPhysicianDirectives } from "./useSuggestPhysicianDirectives"

type ProcedureDetailPanelProps = {
  order: ProcedureOrder
  onBack: () => void
  onToggleRequirement: (requirementId: string, isDone: boolean) => void
  onUploadAttachment: (requirementId: string, file: File) => Promise<void>
  onAddRequirement: (
    title: string,
    description: string | null,
    allowsAttachment: boolean,
    dueAt: string | null,
  ) => void
  onEditRequirement: (
    requirementId: string,
    title: string,
    description: string | null,
    allowsAttachment: boolean,
    dueAt: string | null,
  ) => void
  onDeleteRequirement: (requirementId: string) => void
  onNotifyPatient: () => Promise<void>
  onSaveConsent: (payload: ProcedureConsentSavePayload) => Promise<void>
  isNotifying: boolean
  isSavingConsent: boolean
  isTogglingRequirement: boolean
  isUploadingAttachment: boolean
}

export function ProcedureDetailPanel({
  order,
  onBack,
  onToggleRequirement,
  onUploadAttachment,
  onAddRequirement,
  onEditRequirement,
  onDeleteRequirement,
  onNotifyPatient,
  onSaveConsent,
  isNotifying,
  isSavingConsent,
  isTogglingRequirement,
  isUploadingAttachment,
}: ProcedureDetailPanelProps) {
  const { t } = useAssistantPageTranslations("procedures")
  const analyzeMutation = useAnalyzeRequirementAttachment()
  const suggestDirectivesMutation = useSuggestPhysicianDirectives()
  const [analyzingRequirementId, setAnalyzingRequirementId] = useState<string | null>(null)
  const [attachmentInsights, setAttachmentInsights] = useState<
    Record<string, RequirementAttachmentInsight>
  >({})
  const [directiveSuggestions, setDirectiveSuggestions] = useState<
    PhysicianDirectiveSuggestion[]
  >([])

  const [editingReq, setEditingReq] = useState<{
    id: string
    title: string
    description: string
    allowsAttachment: boolean
    dueAt?: string | null
  } | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [notifyOpen, setNotifyOpen] = useState(false)

  const checklistRequirements = nonConsentRequirements(order)
  const consentRequirement = findConsentRequirement(order)
  const consentDone = consentRequirement ? consentRequirement.isDone : true

  const doneCount =
    checklistRequirements.filter((r) => r.isDone).length + (consentDone ? (consentRequirement ? 1 : 0) : 0)
  const totalCount = checklistRequirements.length + (consentRequirement ? 1 : 0)
  const allDone = totalCount > 0 && doneCount === totalCount

  const dicebearAvatarUrl = (name: string, id: string) => {
    const seed = (name + id).replace(/\s+/g, "")
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`
  }

  useEffect(() => {
    setAttachmentInsights({})
    setAnalyzingRequirementId(null)
    setDirectiveSuggestions([])
    suggestDirectivesMutation.reset()
  }, [order.id])

  const handleGenerateDirectiveSuggestions = () => {
    suggestDirectivesMutation.mutate(order, {
      onSuccess: (list) => setDirectiveSuggestions(list),
    })
  }

  const handleAddDirectiveSuggestion = (s: PhysicianDirectiveSuggestion) => {
    onAddRequirement(s.title, s.description ?? s.title, s.allowsAttachment, null)
    setDirectiveSuggestions((prev) => prev.filter((x) => x.id !== s.id))
  }

  const handleRequirementAttachment = async (requirementId: string, file: File) => {
    const meta = order.requirements.find((r) => r.id === requirementId)
    await onUploadAttachment(requirementId, file)

    setAttachmentInsights((prev) => {
      const next = { ...prev }
      delete next[requirementId]
      return next
    })

    setAnalyzingRequirementId(requirementId)
    try {
      const insight = await analyzeMutation.mutateAsync({
        file,
        requirementTitle: meta?.title ?? "Requirement",
        requirementDescription: meta?.description ?? null,
      })
      setAttachmentInsights((prev) => ({ ...prev, [requirementId]: insight }))
    } catch {
      setAttachmentInsights((prev) => ({
        ...prev,
        [requirementId]: {
          summary:
            "Automatic analysis failed. Review the attachment manually before marking this item verified.",
          suggestComplete: false,
          confidence: "low",
          extracted: {},
        },
      }))
    } finally {
      setAnalyzingRequirementId(null)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#F9F8F5]">
      <div className="z-10 flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-[#E8E6E0]/60 bg-[#F9F8F5] px-5 py-5 sm:px-8 sm:py-6">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex size-9 items-center justify-center rounded-lg border border-[#E8E6E0] bg-white text-muted-foreground shadow-sm transition-colors hover:bg-slate-50 hover:text-[#1A5345] md:hidden"
            aria-label={t("detail.back")}
          >
            <ArrowLeftIcon className="size-4" />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h2 className="truncate font-serif text-[20px] font-bold tracking-tight text-[#1A1F1E]">
                {order.patientName}
              </h2>
              <StatusBadge status={order.status} />
            </div>
            <p className="mt-0.5 truncate text-[13px] font-medium text-muted-foreground">
              {order.procedureName}
              {order.scheduledAt
                ? ` · ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.scheduledAt))}`
                : ""}
            </p>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          className="h-8 rounded-lg border-0 bg-[#1A5345] px-5 text-[12px] font-bold text-white shadow-sm transition-colors hover:bg-[#133F34]"
          onClick={() => setNotifyOpen(true)}
        >
          <BellIcon className="mr-2 size-4" />
          {t("detail.notifyPatient")}
        </Button>

        <NotifyPatientDialog
          open={notifyOpen}
          onOpenChange={setNotifyOpen}
          order={order}
          onConfirm={onNotifyPatient}
          isSending={isNotifying}
        />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">

        {/* ── Hero Patient Section ── */}
        <div className="relative overflow-hidden rounded-3xl border border-[#E8E6E0]/80 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] sm:p-6">
          <div className="absolute top-0 right-0 size-32 rounded-full bg-[#1A5345]/5 -mr-16 -mt-16 blur-3xl opacity-60" />
          <div className="relative flex flex-col items-center justify-between gap-4 sm:flex-row sm:items-start">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
              <div className="size-16 shrink-0 overflow-hidden rounded-2xl border-2 border-[#F4F3ED] bg-white p-0.5 shadow-md sm:size-20">
                <img
                   src={dicebearAvatarUrl(order.patientName, order.patientId)}
                   alt=""
                   className="size-full rounded-[14px] object-cover sm:rounded-[18px]"
                />
              </div>
              <div className="text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                   <h2 className="font-serif text-[22px] font-bold tracking-tight text-[#1A1F1E] sm:text-[26px]">
                     {order.patientName}
                   </h2>
                   <StatusBadge status={order.status} />
                </div>
                <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2 text-[12px] font-bold text-muted-foreground/80 sm:justify-start sm:gap-3 sm:text-[13px]">
                   <span className="flex items-center gap-1.5">
                     <span className="text-[#1A5345] opacity-60">Age:</span>
                     <span className="text-[#1A1F1E]">{order.patientAge}y</span>
                   </span>
                   <span className="size-1 rounded-full bg-[#E8E6E0]" />
                   <span className="flex items-center gap-1.5">
                     <span className="text-[#1A5345] opacity-60">ID:</span>
                     <span className="text-[#1A1F1E]">#{order.patientId}</span>
                   </span>
                   {order.patientPhone && (
                      <>
                        <span className="size-1 rounded-full bg-[#E8E6E0]" />
                        <span className="flex items-center gap-1.5">
                           <span className="text-[#1A5345] opacity-60">Contact:</span>
                           <span className="text-[#1A1F1E]">{order.patientPhone}</span>
                        </span>
                      </>
                   )}
                </div>
              </div>
            </div>

            {order.priority !== "normal" && (
              <span className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider shadow-sm sm:text-[12px]",
                PRIORITY_CONFIG[order.priority].style
              )}>
                <span className="size-1.5 rounded-full bg-current opacity-40 animate-pulse" />
                {PRIORITY_CONFIG[order.priority].label}
              </span>
            )}
          </div>
        </div>

        {/* ── Procedure Core Info ── */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
          <div className="group flex items-center gap-4 rounded-2xl border border-[#E8E6E0]/80 bg-white p-4 shadow-sm transition-all hover:shadow-md">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#E8F0EE] text-[#1A5345] shadow-inner sm:size-12">
              <StethoscopeIcon className="size-5 sm:size-6" />
            </div>
            <div className="min-w-0">
              <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1A5345]/50 sm:text-[11px]">Procedure</p>
              <p className="truncate text-[15px] font-bold leading-tight text-[#1A1F1E] sm:text-[16px] group-hover:text-[#1A5345] transition-colors">{order.procedureName}</p>
            </div>
          </div>

          {order.scheduledAt && (
            <div className="group flex items-center gap-4 rounded-2xl border border-[#E8E6E0]/80 bg-white p-4 shadow-sm transition-all hover:shadow-md">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF8E7] text-[#B8860B] shadow-inner sm:size-12">
                <CalendarDaysIcon className="size-5 sm:size-6" />
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700/60 sm:text-[11px]">Schedule</p>
                <p className="text-[15px] font-bold leading-tight text-[#1A1F1E] sm:text-[16px]">
                  {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.scheduledAt))}
                </p>
              </div>
            </div>
          )}
        </div>

        <ProcedureConsentCard
          order={order}
          onSaveConsent={onSaveConsent}
          isSavingConsent={isSavingConsent}
        />

        {/* ── Summary & Notes ── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">
           <div className="space-y-5 lg:col-span-2">
              {/* Doctor notes */}
              {order.notes && (
                <div className="rounded-3xl border border-[#E8E6E0]/80 bg-white p-5 shadow-sm sm:p-6">
                  <div className="mb-3 flex items-center gap-2">
                     <FileTextIcon className="size-4 text-[#1A5345]/60" />
                     <p className="font-serif text-[15px] font-bold text-[#1A1F1E] sm:text-[16px]">Physician Directives</p>
                  </div>
                  <div className="relative rounded-2xl border border-[#E8E6E0]/60 bg-[#F9F8F5]/50 p-4 italic sm:p-5">
                     <div className="absolute top-2 left-2 text-[#1A5345]/10 text-4xl font-serif">"</div>
                     <p className="relative z-10 text-[13px] font-medium leading-relaxed text-[#1A1F1E] sm:text-[14px] pl-2">
                       {order.notes}
                     </p>
                  </div>
                </div>
              )}

              {/* AI-assisted directive suggestions */}
              <div className="relative overflow-hidden rounded-3xl border border-[#1A5345]/15 bg-white p-5 shadow-sm sm:p-6">
                <div className="absolute top-0 right-0 size-40 rounded-full bg-[#1A5345]/5 -mr-20 -mt-20 blur-3xl opacity-30" />
                <div className="relative mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-[#E8F0EE] text-[#1A5345] shadow-sm">
                       <SparklesIcon className="size-5" />
                    </div>
                    <div>
                      <p className="font-serif text-[16px] font-bold leading-tight text-[#1A1F1E] sm:text-[18px]">
                        AI Suggestions
                      </p>
                      <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wide">
                        Context-Aware Directives
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateDirectiveSuggestions}
                    disabled={suggestDirectivesMutation.isPending}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#1A5345]/20 bg-[#E8F0EE]/50 px-4 py-2 text-[12px] font-bold text-[#1A5345] transition-all hover:bg-[#1A5345] hover:text-white disabled:opacity-60"
                  >
                    {suggestDirectivesMutation.isPending ? (
                      <>
                        <Loader2Icon className="size-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="size-4" />
                        Generate List
                      </>
                    )}
                  </button>
                </div>

                {suggestDirectivesMutation.isError && (
                  <p className="mb-3 text-[11px] font-bold text-rose-600">
                    {suggestDirectivesMutation.error instanceof Error
                      ? suggestDirectivesMutation.error.message
                      : "Could not load suggestions."}
                  </p>
                )}

                {directiveSuggestions.length === 0 && !suggestDirectivesMutation.isPending ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <p className="max-w-[280px] text-[12px] font-medium leading-relaxed text-muted-foreground/70">
                      Use AI to propose checklist items aligned with the procedure context and physician notes.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {directiveSuggestions.map((s) => (
                      <li
                        key={s.id}
                        className="group rounded-2xl border border-[#E8E6E0]/50 bg-[#F9F8F5]/40 p-4 transition-all hover:border-[#1A5345]/20 hover:bg-[#E8F0EE]/20 sm:p-5"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[14px] font-bold text-[#1A1F1E] sm:text-[15px]">
                                {s.title}
                              </span>
                              <span
                                className={cn(
                                  "rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                                  s.source === "llm"
                                    ? "bg-[#1A5345] text-white shadow-sm"
                                    : "bg-muted text-muted-foreground",
                                )}
                              >
                                {s.source === "llm" ? "AI Intelligence" : "Protocol"}
                              </span>
                            </div>
                            {s.description && (
                              <p className="text-[12px] leading-relaxed text-muted-foreground/90">{s.description}</p>
                            )}
                            <div className="flex items-center gap-1.5 text-[10px] font-bold italic text-[#1A5345]/70">
                               <SparklesIcon className="size-3" />
                               <span>{s.rationale}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddDirectiveSuggestion(s)}
                            className="shrink-0 rounded-xl bg-white border border-[#1A5345]/20 px-4 py-2 text-[11px] font-bold text-[#1A5345] shadow-sm transition-all hover:bg-[#1A5345] hover:text-white"
                          >
                            Add to List
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Requirements checklist */}
              <div className="rounded-3xl border border-[#E8E6E0]/80 bg-white p-5 shadow-sm sm:p-8">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                  <div className="min-w-0 space-y-1.5">
                    <h4 className="font-serif text-[18px] font-bold leading-tight text-[#1A1F1E] sm:text-[22px]">
                      Requirements Checklist
                    </h4>
                    <div className="flex flex-wrap items-center gap-3">
                       <div className={cn(
                          "rounded-full px-3 py-1 text-[11px] font-bold tracking-wide transition-all sm:text-[12px]",
                          allDone ? "bg-[#E8F0EE] text-[#1A5345] shadow-sm" : "bg-[#F9F8F5] text-[#1A5345]/70"
                       )}>
                          {doneCount} of {totalCount} Completed
                       </div>
                       {allDone && (
                          <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#1A5345] sm:text-[12px]">
                             <CheckCircle2Icon className="size-4 shrink-0" />
                             Ready for Procedure
                          </span>
                       )}
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Add directive"
                    title="Add directive"
                    onClick={() => { setShowAddForm(true); setEditingReq(null) }}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1A5345] px-5 text-[12px] font-bold text-white shadow-lg shadow-[#1A5345]/10 transition-all hover:bg-[#133F34] hover:-translate-y-0.5 active:scale-95"
                  >
                    <PlusIcon className="size-4" />
                    <span>New Requirement</span>
                  </button>
                </div>

                {/* Progress tracker */}
                {totalCount > 0 && (
                  <div className="mb-8 space-y-2">
                    <div className="flex justify-between px-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                       <span>Verification Progress</span>
                       <span className="tabular-nums text-[#1A5345]">{Math.round((doneCount / totalCount) * 100)}%</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full border border-[#F4F3ED] bg-[#F9F8F5] p-0.5 shadow-inner">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-1000 ease-out shadow-sm",
                          allDone ? "bg-[#1A5345]" : "bg-gradient-to-r from-[#1A5345] to-[#4F6D64]"
                        )}
                        style={{ width: `${(doneCount / totalCount) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {checklistRequirements.map((req) => (
                    <RequirementItem
                      key={req.id}
                      requirement={req}
                      onToggle={() => onToggleRequirement(req.id, !req.isDone)}
                      onUpload={(file) => handleRequirementAttachment(req.id, file)}
                      attachmentInsight={attachmentInsights[req.id]}
                      isAnalyzingAttachment={analyzingRequirementId === req.id}
                      onDismissInsight={() =>
                        setAttachmentInsights((prev) => {
                          const next = { ...prev }
                          delete next[req.id]
                          return next
                        })
                      }
                      onApplyInsightSuggestion={() => {
                        if (!req.isDone) onToggleRequirement(req.id, true)
                      }}
                      onEdit={() => setEditingReq({
                        id: req.id,
                        title: req.title,
                        description: req.description ?? "",
                        allowsAttachment: req.allowsAttachment,
                        dueAt: req.dueAt ?? null,
                      })}
                      onDelete={() => onDeleteRequirement(req.id)}
                      isToggling={isTogglingRequirement}
                      isUploading={isUploadingAttachment}
                    />
                  ))}

                  {checklistRequirements.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#E8E6E0] bg-[#F9F8F5]/30 px-6 py-12 sm:py-16">
                      <div className="mb-4 flex size-16 items-center justify-center rounded-2xl border border-[#E8E6E0] bg-white shadow-sm">
                         <ClipboardListIcon className="size-8 text-muted-foreground/30" strokeWidth={1} />
                      </div>
                      <p className="max-w-[240px] text-center text-[13px] font-bold text-muted-foreground/50">
                        No clinical directives assigned. Add one or use AI suggestions to get started.
                      </p>
                    </div>
                  )}
                </div>
              </div>
           </div>

           {/* Sidebar Info */}
           <div className="space-y-4">
              <div className="rounded-2xl border border-[#E8E6E0]/80 bg-white p-5 shadow-sm">
                 <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">Request Context</p>
                 <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-xl bg-[#F9F8F5] px-3 py-2.5">
                       <div className="flex items-center gap-2.5">
                          <ClockIcon className="size-4 text-[#1A5345]/60" />
                          <span className="text-[12px] font-bold text-[#1A1F1E]">Created</span>
                       </div>
                       <span className="text-[12px] font-bold tabular-nums text-[#1A5345]">
                          {new Intl.DateTimeFormat("en-GB", { dateStyle: "short" }).format(new Date(order.createdAt))}
                       </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-[#F9F8F5] px-3 py-2.5">
                       <div className="flex items-center gap-2.5">
                          <ClipboardListIcon className="size-4 text-[#1A5345]/60" />
                          <span className="text-[12px] font-bold text-[#1A1F1E]">Tasks</span>
                       </div>
                       <span className={cn("text-[12px] font-black tabular-nums", allDone ? "text-[#1A5345]" : "text-[#B8860B]")}>
                          {doneCount} / {totalCount}
                       </span>
                    </div>
                 </div>
              </div>
              
              <div className="rounded-2xl border border-[#E8E6E0]/80 bg-white p-5 shadow-sm">
                 <div className="flex items-center gap-2 mb-3">
                    <SparklesIcon className="size-4 text-[#1A5345]" />
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">Assistive Note</p>
                 </div>
                 <p className="text-[11px] leading-relaxed text-muted-foreground/80 italic font-medium">
                   All verification steps are tracked and logged. Ensure patient notifications are sent once requirements are finalized.
                 </p>
              </div>
           </div>
        </div>

        {/* Forms */}
        <RequirementForm
          open={showAddForm}
          onSave={(title, description, allowsAttachment, dueAt) => {
            onAddRequirement(title, description, allowsAttachment, dueAt)
            setShowAddForm(false)
          }}
          onCancel={() => setShowAddForm(false)}
        />

        <RequirementForm
          open={editingReq !== null}
          initial={editingReq ?? undefined}
          onSave={(title, description, allowsAttachment, dueAt) => {
            if (editingReq) onEditRequirement(editingReq.id, title, description, allowsAttachment, dueAt)
            setEditingReq(null)
          }}
          onCancel={() => setEditingReq(null)}
        />
      </div>
    </div>
  )
}
