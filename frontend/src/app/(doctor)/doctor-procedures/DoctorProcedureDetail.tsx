"use client"

import { useEffect, useState } from "react"
import { PatientAvatar } from "@/components/shared/PatientAvatar"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  CircleIcon,
  ClipboardListIcon,
  FileTextIcon,
  Loader2Icon,
  SparklesIcon,
  StethoscopeIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
import { PRIORITY_CONFIG } from "@/app/(assistant)/assistant-procedures/assistantProcedures.config"
import { StatusBadge } from "@/app/(assistant)/assistant-procedures/StatusBadge"
import { useSuggestPhysicianDirectives } from "@/app/(assistant)/assistant-procedures/useSuggestPhysicianDirectives"
import type { PhysicianDirectiveSuggestion } from "@/lib/procedures/physicianDirectiveSuggestions"

import {
  doctorProceduresScrollbarCss,
  formatScheduledAt,
  getProcedureReadiness,
} from "./doctorProcedures.shared"
import { useDoctorProcedures } from "./useDoctorProcedures"

type DoctorProcedureDetailProps = {
  procedureId: string
}

export function DoctorProcedureDetail({ procedureId }: DoctorProcedureDetailProps) {
  const { getOrderById, isLoading } = useDoctorProcedures()
  const order = getOrderById(procedureId)
  const suggestDirectivesMutation = useSuggestPhysicianDirectives()

  const [directives, setDirectives] = useState("")
  const [suggestions, setSuggestions] = useState<PhysicianDirectiveSuggestion[]>([])
  const [clearanceApproved, setClearanceApproved] = useState(false)

  useEffect(() => {
    setDirectives("")
    setSuggestions([])
    setClearanceApproved(false)
    suggestDirectivesMutation.reset()
  }, [procedureId])

  if (isLoading) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#F9F8F5] p-6">
        <Skeleton className="mb-4 h-8 w-64 rounded-lg" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="mt-4 h-96 w-full rounded-2xl" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center bg-[#F9F8F5] px-6">
        <ClipboardListIcon className="mb-4 size-12 text-muted-foreground/40" strokeWidth={1.25} />
        <p className="text-[16px] font-bold text-[#1A1F1E]">Procedure not found</p>
        <p className="mt-1 text-[13px] font-medium text-muted-foreground">
          This order may have been removed or the link is invalid.
        </p>
        <Button asChild variant="ghost" className="mt-4 text-[#1A5345] hover:text-[#0F3D32]">
          <Link href="/doctor-procedures">
            <ArrowLeftIcon className="size-4" aria-hidden />
            Back to procedures
          </Link>
        </Button>
      </div>
    )
  }

  const { done, total, pct, pending } = getProcedureReadiness(order)
  const priorityCfg = PRIORITY_CONFIG[order.priority]
  const allReady = pct >= 100

  const handleGenerateSuggestions = () => {
    suggestDirectivesMutation.mutate(order, {
      onSuccess: (list) => setSuggestions(list),
    })
  }

  const formatSuggestion = (item: PhysicianDirectiveSuggestion) => {
    const body = item.description?.trim() || item.rationale.trim()
    return body ? `${item.title}: ${body}` : item.title
  }

  const handleApplySuggestion = (item: PhysicianDirectiveSuggestion) => {
    const line = formatSuggestion(item)
    setDirectives((prev) => (prev.trim() ? `${prev.trim()}\n\n${line}` : line))
  }

  const handleApproveClearance = () => {
    setClearanceApproved(true)
    showIcareSuccessToast(
      "Clearance recorded",
      allReady
        ? "Pre-op checklist is complete. The OR team has been notified."
        : "Conditional clearance saved. Open checklist items remain under assistant follow-up.",
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
                  <BreadcrumbPage className="max-w-[min(100vw-12rem,28rem)] truncate text-[10px] font-medium sm:text-[11px]">
                    {order.procedureName}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-3 sm:gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E8E6E0]/60 bg-[#F4F3EF] sm:size-14">
                <PatientAvatar
                  name={order.patientName}
                  avatarUrl={null}
                  sizes="56px"
                  initialsClassName="text-[14px]"
                />
              </div>
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-serif text-[20px] font-bold leading-tight text-[#1A1F1E] sm:text-[22px]">
                    {order.patientName}
                  </h1>
                  <StatusBadge status={order.status} />
                  {order.priority !== "normal" ? (
                    <span
                      className={cn(
                        "inline-flex rounded-lg border px-2 py-0.5 text-[10px] font-bold",
                        priorityCfg.style,
                      )}
                    >
                      {priorityCfg.label}
                    </span>
                  ) : null}
                </div>
                <p className="text-[14px] font-semibold text-[#1A5345]">{order.procedureName}</p>
                <p className="text-[12px] font-medium text-muted-foreground">
                  {order.department} · {order.doctorName}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                asChild
                className="h-9 border-0 bg-transparent text-muted-foreground shadow-none hover:bg-transparent hover:text-[#1A5345]"
              >
                <Link href="/doctor-procedures">
                  <ArrowLeftIcon className="size-4" aria-hidden />
                  Back
                </Link>
              </Button>
              <Button
                type="button"
                variant="ghost"
                asChild
                className="h-9 gap-1.5 border border-[#E8E6E0]/80 bg-white text-[13px] font-bold text-[#1A5345] shadow-none hover:border-[#1A5345]/30 hover:bg-[#F9F8F5]"
              >
                <Link href={`/doctor-procedures/${procedureId}/report`}>
                  <FileTextIcon className="size-4" aria-hidden />
                  {order.status === "completed" ? "Write operation report" : "Draft operation report"}
                </Link>
              </Button>
              <Button
                type="button"
                disabled={clearanceApproved}
                onClick={handleApproveClearance}
                className="h-9 rounded-xl bg-[#1A5345] px-4 text-[13px] font-bold text-white hover:bg-[#0F3D32]"
              >
                {clearanceApproved ? "Clearance recorded" : "Sign off clearance"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex-1 overflow-auto bg-[#F9F8F5] px-5 py-4 sm:px-6 sm:py-5">
        <div className="custom-scrollbar mx-auto w-full max-w-5xl space-y-4 pb-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SnapshotCard label="Scheduled" icon={CalendarDaysIcon}>
              <p className="text-[14px] font-bold text-[#1A1F1E]">{formatScheduledAt(order.scheduledAt)}</p>
            </SnapshotCard>
            <SnapshotCard label="Readiness" icon={ClipboardListIcon}>
              <p
                className={cn(
                  "text-[14px] font-bold tabular-nums",
                  pct >= 100 ? "text-emerald-600" : pct >= 70 ? "text-amber-600" : "text-rose-600",
                )}
              >
                {pct}% · {done}/{total}
              </p>
            </SnapshotCard>
            <SnapshotCard label="Open items" icon={StethoscopeIcon}>
              <p className="text-[14px] font-bold tabular-nums text-[#1A1F1E]">{pending}</p>
            </SnapshotCard>
            <SnapshotCard label="Consent" icon={FileTextIcon}>
              <p className="text-[14px] font-bold text-[#1A1F1E]">
                {order.consent ? "Signed" : "Pending"}
              </p>
            </SnapshotCard>
          </div>

          {order.notes ? (
            <section className="rounded-2xl border border-[#E8E6E0]/70 bg-white p-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] sm:p-5">
              <h2 className="mb-2 font-serif text-[15px] font-bold text-[#1A1F1E]">Clinical notes</h2>
              <p className="text-[13px] font-medium leading-relaxed text-muted-foreground">{order.notes}</p>
            </section>
          ) : null}

          <section className="rounded-2xl border border-[#E8E6E0]/70 bg-white p-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] sm:p-5">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-serif text-[15px] font-bold text-[#1A1F1E]">Pre-op checklist</h2>
                <p className="text-[12px] font-medium text-muted-foreground">
                  Reviewed by assistant — read-only for physician sign-off.
                </p>
              </div>
              <div className="h-2 w-full max-w-[160px] overflow-hidden rounded-full bg-[#E8E6E0]">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    pct >= 100 ? "bg-emerald-500" : pct >= 70 ? "bg-amber-500" : "bg-rose-500",
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            <ul className="space-y-2">
              {order.requirements.map((req) => (
                <li
                  key={req.id}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border px-3 py-3 sm:px-4",
                    req.isDone
                      ? "border-emerald-200/60 bg-emerald-50/40"
                      : "border-[#E8E6E0]/60 bg-[#FBFDFC]",
                  )}
                >
                  {req.isDone ? (
                    <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                  ) : (
                    <CircleIcon className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-[#1A1F1E]">{req.title}</p>
                    {req.description ? (
                      <p className="mt-0.5 text-[12px] font-medium text-muted-foreground">{req.description}</p>
                    ) : null}
                    {req.attachmentName ? (
                      <p className="mt-1 text-[11px] font-medium text-[#1A5345]">{req.attachmentName}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-[#E8E6E0]/70 bg-white p-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] sm:p-5">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-serif text-[15px] font-bold text-[#1A1F1E]">Physician directives</h2>
                <p className="text-[12px] font-medium text-muted-foreground">
                  Document orders for the care team before the procedure.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                disabled={suggestDirectivesMutation.isPending}
                onClick={handleGenerateSuggestions}
                className="h-9 gap-1.5 border-0 bg-violet-50 text-violet-700 shadow-none hover:bg-violet-100 hover:text-violet-800"
              >
                {suggestDirectivesMutation.isPending ? (
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                ) : (
                  <SparklesIcon className="size-4" aria-hidden />
                )}
                AI suggestions
              </Button>
            </div>

            {suggestions.length > 0 ? (
              <div className="mb-3 space-y-2">
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleApplySuggestion(item)}
                    className="flex w-full items-start gap-2 rounded-xl border border-violet-200/70 bg-violet-50/50 px-3 py-2.5 text-left transition-colors hover:bg-violet-50"
                  >
                    <SparklesIcon className="mt-0.5 size-4 shrink-0 text-violet-600" aria-hidden />
                    <span className="text-[12px] font-medium leading-relaxed text-[#1A1F1E]">
                      {formatSuggestion(item)}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}

            <Textarea
              value={directives}
              onChange={(e) => setDirectives(e.target.value)}
              placeholder="Enter pre-procedure directives for nursing and anaesthesia…"
              className="min-h-[120px] resize-y rounded-xl border-[#E8E6E0]/80 bg-[#F9F8F5] text-[13px] font-medium focus-visible:border-[#1A5345]/50 focus-visible:ring-[#1A5345]/12"
            />
          </section>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: doctorProceduresScrollbarCss() }} />
    </div>
  )
}

function SnapshotCard({
  label,
  icon: Icon,
  children,
}: {
  label: string
  icon: LucideIcon
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-[#E8E6E0]/60 bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-1 flex items-center gap-1.5">
        <Icon className="size-4 text-[#1A5345]" aria-hidden />
        <p className="text-[11px] font-medium text-[#6B7870]">{label}</p>
      </div>
      {children}
    </div>
  )
}
