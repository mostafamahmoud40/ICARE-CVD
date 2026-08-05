"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  CircleIcon,
  ClipboardListIcon,
  SearchIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { PRIORITY_CONFIG } from "@/app/(assistant)/assistant-procedures/assistantProcedures.config"
import { StatusBadge } from "@/app/(assistant)/assistant-procedures/StatusBadge"
import type { ProcedureOrder } from "@/app/(assistant)/assistant-procedures/assistantProcedures.types"

import {
  DoctorProceduresPageShell,
  DoctorProceduresStat,
} from "./DoctorProceduresPageShell"
import {
  doctorProceduresListSearchInputClassName,
  doctorProceduresScrollbarCss,
  formatPatientRowId,
  formatScheduledAt,
  getProcedureReadiness,
  ReadinessPill,
} from "./doctorProcedures.shared"
import { useDoctorProcedures } from "./useDoctorProcedures"

export function DoctorProceduresPending() {
  const vm = useDoctorProcedures()
  const [searchTerm, setSearchTerm] = useState("")

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return vm.pendingReviewOrders
    return vm.pendingReviewOrders.filter(
      (o) =>
        o.patientName.toLowerCase().includes(q) ||
        o.procedureName.toLowerCase().includes(q),
    )
  }, [vm.pendingReviewOrders, searchTerm])

  return (
    <DoctorProceduresPageShell
      title="Pending clearance"
      subtitle="Review assistant progress, sign off readiness, and add physician directives."
      currentPage="Pending review"
      stats={
        <>
          <DoctorProceduresStat
            label="Awaiting review"
            value={vm.pendingReviewOrders.length}
            icon={ClipboardListIcon}
            tone="amber"
          />
          <DoctorProceduresStat
            label="Urgent cases"
            value={vm.stats.urgentCount}
            icon={AlertTriangleIcon}
            tone="rose"
          />
        </>
      }
      toolbar={
        <div className="group relative w-full sm:max-w-[400px]">
          <SearchIcon
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#1A5345]/35 transition-colors group-focus-within:text-[#1A5345] sm:left-4"
            strokeWidth={2}
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Search patient or procedure…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={doctorProceduresListSearchInputClassName}
          />
        </div>
      }
    >
      <div className="custom-scrollbar w-full pb-6 pt-4">
        {vm.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#E5EEEA] bg-white py-16 opacity-60">
            <CheckCircle2Icon className="mb-4 size-12 text-emerald-600" strokeWidth={1.25} />
            <p className="text-[16px] font-bold text-[#1A1F1E]">Nothing pending review</p>
            <p className="mt-1 text-[13px] font-medium text-muted-foreground">
              All active procedures are cleared or completed.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((order) => (
              <PendingReviewCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: doctorProceduresScrollbarCss() }} />
    </DoctorProceduresPageShell>
  )
}

function PendingReviewCard({ order }: { order: ProcedureOrder }) {
  const { done, total, pct, pending } = getProcedureReadiness(order)
  const priorityCfg = PRIORITY_CONFIG[order.priority]
  const incompleteReqs = order.requirements.filter((r) => !r.isDone).slice(0, 4)
  const completedReqs = order.requirements.filter((r) => r.isDone).slice(0, 3)

  return (
    <article className="flex h-full flex-col rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
      <div className="border-b border-[#E8E6E0]/50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E8E6E0]/60 bg-[#F4F3EF]">
            <Image
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(order.patientId)}`}
              alt=""
              width={44}
              height={44}
              unoptimized
              className="size-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
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
            <h2 className="mt-1 font-serif text-[15px] font-bold leading-snug text-[#1A1F1E]">
              {order.patientName}
            </h2>
            <p className="text-[11px] font-medium text-muted-foreground">
              {formatPatientRowId(order.patientId)} · {formatScheduledAt(order.scheduledAt)}
            </p>
          </div>
        </div>

        <p className="mt-3 text-[13px] font-semibold text-[#1A5345]">{order.procedureName}</p>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span
            className={cn(
              "text-[13px] font-bold tabular-nums",
              pct >= 100 ? "text-emerald-600" : pct >= 70 ? "text-amber-600" : "text-rose-600",
            )}
          >
            {pct}% ready · {done}/{total}
          </span>
          <ReadinessPill pct={pct} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {completedReqs.length > 0 ? (
          <div className="mb-3">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
              Completed by team
            </p>
            <ul className="space-y-1">
              {completedReqs.map((req) => (
                <li key={req.id} className="flex items-start gap-1.5 text-[11px] font-medium text-[#1A1F1E]/80">
                  <CheckCircle2Icon className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-hidden />
                  <span className="line-clamp-1">{req.title}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {incompleteReqs.length > 0 ? (
          <div className="mb-4">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
              Still open ({pending})
            </p>
            <ul className="space-y-1">
              {incompleteReqs.map((req) => (
                <li key={req.id} className="flex items-start gap-1.5 text-[11px] font-medium text-[#1A1F1E]/80">
                  <CircleIcon className="mt-0.5 size-3.5 shrink-0 text-amber-500" aria-hidden />
                  <span className="line-clamp-1">{req.title}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {order.notes ? (
          <p className="mb-4 line-clamp-2 text-[11px] font-medium leading-relaxed text-muted-foreground">
            {order.notes}
          </p>
        ) : null}

        <div className="mt-auto flex flex-col gap-1.5 sm:flex-row">
          <Button
            asChild
            className="h-9 flex-1 rounded-xl bg-[#1A5345] text-[12px] font-bold text-white hover:bg-[#0F3D32]"
          >
            <Link href={`/doctor-procedures/${order.id}`}>Review & sign off</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="h-9 flex-1 rounded-xl border border-[#E8E6E0]/80 bg-[#F9F8F5] text-[12px] font-bold text-[#1A5345] hover:bg-white"
          >
            <Link href={`/doctor-procedures/${order.id}/report`}>Draft report</Link>
          </Button>
        </div>
      </div>
    </article>
  )
}
