"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { ArrowLeftIcon, BellIcon, CalendarDaysIcon, ClipboardListIcon, ClockIcon, PlusIcon, StethoscopeIcon, UserRoundIcon } from "lucide-react"
import { StatusBadge } from "./StatusBadge"
import { RequirementItem } from "./RequirementItem"
import { RequirementForm } from "./RequirementForm"
import { NotifyPatientDialog } from "./NotifyPatientDialog"
import { PRIORITY_CONFIG } from "./assistantProcedures.config"
import type { ProcedureOrder } from "./assistantProcedures.types"

type ProcedureDetailPanelProps = {
  order: ProcedureOrder
  onBack: () => void
  onToggleRequirement: (requirementId: string, isDone: boolean) => void
  onUploadAttachment: (requirementId: string, file: File) => void
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
  isNotifying: boolean
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
  isNotifying,
  isTogglingRequirement,
  isUploadingAttachment,
}: ProcedureDetailPanelProps) {
  const [editingReq, setEditingReq] = useState<{
    id: string
    title: string
    description: string
    allowsAttachment: boolean
    dueAt?: string | null
  } | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [notifyOpen, setNotifyOpen] = useState(false)

  const doneCount = order.requirements.filter((r) => r.isDone).length
  const totalCount = order.requirements.length
  const allDone = totalCount > 0 && doneCount === totalCount

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Sticky Header */}
      <div className="flex shrink-0 items-center gap-2 border-b border-[#E8E6E0] px-3 py-2.5 sm:px-4 sm:py-3">
        <button
          onClick={onBack}
          className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-[#E8F0EE] hover:text-[#1A5345] md:hidden"
          aria-label="Go back"
        >
          <ArrowLeftIcon className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[12px] font-bold text-[#102F27] sm:text-[13px]">
            {order.patientName}
          </h3>
          <p className="truncate text-[9px] text-muted-foreground sm:text-[10px]">
            {order.procedureName}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setNotifyOpen(true)}
          className="flex items-center gap-1 rounded-lg border border-[#E5EEEA] px-2 py-1.5 text-[10px] font-medium text-[#1A5345] transition-colors hover:bg-[#E8F0EE] sm:text-[11px]"
          aria-label="Notify patient"
        >
          <BellIcon className="size-3.5" />
          <span className="hidden sm:inline">Notify</span>
        </button>

        <NotifyPatientDialog
          open={notifyOpen}
          onOpenChange={setNotifyOpen}
          order={order}
          onConfirm={onNotifyPatient}
          isSending={isNotifying}
        />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">

        {/* ── Hero patient card ── */}
        <div className="overflow-hidden rounded-2xl border border-[#E5EEEA] bg-white shadow-sm">
          <div className="h-1 w-full bg-[#1A5345]" />
          <div className="flex items-center justify-between gap-3 p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#E8F0EE] sm:size-14">
                <UserRoundIcon className="size-6 text-[#1A5345] sm:size-7" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-[#102F27]">{order.patientName}</p>
                <p className="text-[11px] text-muted-foreground">{order.patientAge} years old</p>
                {order.patientPhone && (
                  <p className="text-[10px] text-muted-foreground">{order.patientPhone}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <StatusBadge status={order.status} />
              {order.priority !== "normal" && (
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium", PRIORITY_CONFIG[order.priority].style)}>
                  {PRIORITY_CONFIG[order.priority].dot && (
                    <span className={cn("inline-block size-1.5 shrink-0 rounded-full", PRIORITY_CONFIG[order.priority].dot)} aria-hidden />
                  )}
                  {PRIORITY_CONFIG[order.priority].label}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Info rows ── */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 rounded-xl border border-[#E5EEEA] bg-white px-3 py-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#E8F0EE]">
              <StethoscopeIcon className="size-4 text-[#1A5345]" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] text-muted-foreground">Procedure</p>
              <p className="text-[12px] font-semibold text-[#102F27]">{order.procedureName}</p>
            </div>
          </div>

          {order.scheduledAt && (
            <div className="flex items-center gap-3 rounded-xl border border-[#E5EEEA] bg-white px-3 py-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                <CalendarDaysIcon className="size-4 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-muted-foreground">Scheduled</p>
                <p className="text-[12px] font-semibold text-[#102F27]">
                  {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.scheduledAt))}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-1.5">
            <div className="flex items-center gap-2.5 rounded-xl border border-[#E5EEEA] bg-white px-3 py-2.5">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#F5F5F3]">
                <ClockIcon className="size-3.5 text-[#6B7870]" />
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground">Requested</p>
                <p className="text-[11px] font-semibold text-[#102F27]">
                  {new Intl.DateTimeFormat("en-GB", { dateStyle: "short" }).format(new Date(order.createdAt))}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl border border-[#E5EEEA] bg-white px-3 py-2.5">
              <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", allDone ? "bg-emerald-50" : "bg-[#F5F5F3]")}>
                <ClipboardListIcon className={cn("size-3.5", allDone ? "text-emerald-600" : "text-[#6B7870]")} />
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground">Progress</p>
                <p className={cn("text-[11px] font-semibold", allDone ? "text-emerald-600" : "text-[#102F27]")}>
                  {doneCount}/{totalCount} done
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Doctor notes ── */}
        {order.notes && (
          <div className="rounded-xl border border-[#E5EEEA] bg-[#FAFAF8] p-3">
            <p className="mb-1 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Doctor Notes</p>
            <p className="text-[11px] leading-relaxed text-[#1A1F1E]">{order.notes}</p>
          </div>
        )}

        {/* ── Requirements checklist ── */}
        <div>
          {/* Header */}
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-semibold text-[#102F27]">Requirements</p>
              <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-medium", allDone ? "bg-emerald-50 text-emerald-700" : "bg-[#F5F5F3] text-[#6B7870]")}>
                {doneCount}/{totalCount}
              </span>
            </div>
            <button
              type="button"
              onClick={() => { setShowAddForm(true); setEditingReq(null) }}
              className="flex items-center gap-1 rounded-lg bg-[#1A5345] px-2.5 py-1.5 text-[10px] font-medium text-white transition-colors hover:bg-[#0F3D32]"
            >
              <PlusIcon className="size-3" />
              Add
            </button>
          </div>

          {/* Progress bar */}
          {totalCount > 0 && (
            <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-[#E8E6E0]">
              <div
                className={cn("h-full rounded-full transition-all", allDone ? "bg-emerald-500" : "bg-[#1A5345]")}
                style={{ width: `${(doneCount / totalCount) * 100}%` }}
              />
            </div>
          )}

          <div className="space-y-2">
            {order.requirements.map((req) => (
              <RequirementItem
                key={req.id}
                requirement={req}
                onToggle={() => onToggleRequirement(req.id, !req.isDone)}
                onUpload={(file) => onUploadAttachment(req.id, file)}
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

            {order.requirements.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E5EEEA] bg-white py-6">
                <p className="text-[11px] text-muted-foreground sm:text-[12px]">
                  No requirements yet. Click Add to create one.
                </p>
              </div>
            )}
          </div>

          {/* Add dialog */}
          <RequirementForm
            open={showAddForm}
            onSave={(title, description, allowsAttachment, dueAt) => {
              onAddRequirement(title, description, allowsAttachment, dueAt)
              setShowAddForm(false)
            }}
            onCancel={() => setShowAddForm(false)}
          />

          {/* Edit dialog */}
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
    </div>
  )
}
