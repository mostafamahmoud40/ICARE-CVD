"use client"

import { PatientAvatar } from "@/components/shared/PatientAvatar"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertTriangleIcon,
  ClipboardPlusIcon,
  FileTextIcon,
  ScissorsIcon,
  SearchIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { PRIORITY_CONFIG } from "@/app/(assistant)/assistant-procedures/assistantProcedures.config"
import { StatusBadge } from "@/app/(assistant)/assistant-procedures/StatusBadge"

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

export function DoctorProceduresList() {
  const router = useRouter()
  const vm = useDoctorProcedures()

  const filterTabs = [
    { key: "all" as const, label: "All", count: vm.stats.total },
    { key: "pending" as const, label: "Pending", count: vm.stats.pending },
    { key: "in-progress" as const, label: "Active", count: vm.stats.inProgress },
    { key: "completed" as const, label: "Verified", count: vm.stats.completed },
  ] as const

  return (
    <DoctorProceduresPageShell
      title="All procedures"
      subtitle="Full registry of operations with status, readiness, and report links."
      currentPage="All procedures"
      stats={
        <>
          <DoctorProceduresStat
            label="Active procedures"
            value={vm.stats.inProgress}
            icon={ScissorsIcon}
            tone="green"
          />
          <DoctorProceduresStat
            label="Pending clearance"
            value={vm.stats.pendingClearance}
            icon={AlertTriangleIcon}
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
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:gap-2 sm:pb-0">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => vm.setFilter(tab.key)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-[12px] font-bold transition-all",
                  vm.filter === tab.key
                    ? "bg-[#1A5345] text-white shadow-sm"
                    : "text-muted-foreground hover:bg-white hover:text-[#1A1F1E] hover:shadow-sm",
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "rounded-lg px-1.5 py-0.5 text-[10px] font-bold shadow-sm transition-colors",
                    vm.filter === tab.key ? "bg-white/10 text-white" : "bg-black/5 text-[#1A5345]",
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="group relative w-full sm:min-w-0 sm:w-[min(100%,360px)] lg:max-w-[400px]">
            <SearchIcon
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#1A5345]/35 transition-colors group-focus-within:text-[#1A5345] sm:left-4"
              strokeWidth={2}
              aria-hidden
            />
            <Input
              type="search"
              placeholder="Search patient or procedure…"
              value={vm.searchTerm}
              onChange={(e) => vm.setSearchTerm(e.target.value)}
              className={doctorProceduresListSearchInputClassName}
            />
          </div>
        </div>
      }
    >
      <div className="custom-scrollbar w-full pb-6 pt-4">
          <div className="overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
            <div className="overflow-x-auto">
              <table className="min-w-[1040px] w-full border-collapse bg-white text-left">
                <thead className="sticky top-0 z-10 bg-[#F4F3ED]/90 shadow-[0_1px_0_0_#E8E6E0] backdrop-blur-md">
                  <tr className="font-serif text-[15px] font-bold text-[#1A1F1E]">
                    <th className="py-4 pl-4 pr-4">Patient</th>
                    <th className="px-4 py-4">Procedure</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Priority</th>
                    <th className="px-4 py-4">Scheduled</th>
                    <th className="px-4 py-4">Readiness</th>
                    <th className="px-4 py-4">Open items</th>
                    <th className="px-4 py-4">Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E6E0]/40">
                  {vm.isLoading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <tr key={i}>
                          <td className="py-4 pl-4 pr-4" colSpan={8}>
                            <Skeleton className="h-12 w-full rounded-lg" />
                          </td>
                        </tr>
                      ))
                    : vm.orders.length === 0
                      ? (
                          <tr>
                            <td className="px-4 py-20 text-center" colSpan={8}>
                              <div className="flex flex-col items-center justify-center opacity-50">
                                <ClipboardPlusIcon className="mb-4 size-12 stroke-[1.25]" />
                                <p className="text-[16px] font-bold text-[#1A1F1E]">No procedures match</p>
                                <p className="mt-1 text-[13px] font-medium text-muted-foreground">
                                  Try changing search or filters.
                                </p>
                              </div>
                            </td>
                          </tr>
                        )
                      : (
                          vm.orders.map((order) => {
                            const { done, total, pct, pending } = getProcedureReadiness(order)
                            const priorityCfg = PRIORITY_CONFIG[order.priority]
                            const href = `/doctor-procedures/${order.id}`
                            const reportHref = `/doctor-procedures/${order.id}/report`

                            return (
                              <tr
                                key={order.id}
                                role="link"
                                tabIndex={0}
                                className="group cursor-pointer border-t border-[#E8E6E0]/40 transition-colors hover:bg-[#F9F8F5]/50"
                                onClick={() => router.push(href)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault()
                                    router.push(href)
                                  }
                                }}
                              >
                                <td className="py-4 pl-4 pr-4">
                                  <Link
                                    href={href}
                                    className="flex items-start gap-3"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E8E6E0]/60 bg-[#F4F3EF]">
                                      <PatientAvatar name={order.patientName} avatarUrl={null} />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="truncate font-serif text-[15px] font-bold leading-snug text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]">
                                        {order.patientName}
                                      </p>
                                      <p className="mt-0.5 text-[12px] font-medium tabular-nums tracking-wide text-muted-foreground">
                                        {formatPatientRowId(order.patientId)} · {order.patientAge} yrs
                                      </p>
                                    </div>
                                  </Link>
                                </td>
                                <td className="px-4 py-4 align-middle">
                                  <p className="max-w-[220px] truncate text-[14px] font-semibold text-[#1A1F1E]">
                                    {order.procedureName}
                                  </p>
                                  <p className="mt-0.5 truncate text-[11px] font-medium text-muted-foreground">
                                    {order.department}
                                  </p>
                                </td>
                                <td className="px-4 py-4 align-middle">
                                  <StatusBadge status={order.status} />
                                </td>
                                <td className="px-4 py-4 align-middle">
                                  {order.priority === "normal" ? (
                                    <span className="text-[12px] font-medium text-muted-foreground">—</span>
                                  ) : (
                                    <span
                                      className={cn(
                                        "inline-flex rounded-lg border px-2 py-0.5 text-[10px] font-bold",
                                        priorityCfg.style,
                                      )}
                                    >
                                      {priorityCfg.label}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-4 align-middle">
                                  <span className="text-[13px] font-medium tabular-nums text-[#1A1F1E]/80">
                                    {formatScheduledAt(order.scheduledAt)}
                                  </span>
                                </td>
                                <td className="px-4 py-4 align-middle">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={cn(
                                        "text-[14px] font-bold tabular-nums",
                                        pct >= 100
                                          ? "text-emerald-600"
                                          : pct >= 70
                                            ? "text-amber-600"
                                            : "text-rose-600",
                                      )}
                                    >
                                      {pct}%
                                    </span>
                                    {total > 0 ? <ReadinessPill pct={pct} /> : null}
                                  </div>
                                  <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                                    {done}/{total} complete
                                  </p>
                                </td>
                                <td className="px-4 py-4 align-middle">
                                  {pending > 0 ? (
                                    <div className="inline-flex items-center gap-1.5" aria-label={`${pending} open items`}>
                                      <AlertTriangleIcon className="size-4 shrink-0 text-amber-600" aria-hidden />
                                      <span className="text-[14px] font-semibold tabular-nums text-[#1A1F1E]">
                                        {pending}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-[14px] font-semibold tabular-nums text-emerald-600">0</span>
                                  )}
                                </td>
                                <td className="px-4 py-4 align-middle">
                                  <Link
                                    href={reportHref}
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#1A5345] transition-colors hover:text-[#0F3D32]"
                                  >
                                    <FileTextIcon className="size-4 shrink-0" aria-hidden />
                                    {order.status === "completed" ? "Write report" : "Draft report"}
                                  </Link>
                                </td>
                              </tr>
                            )
                          })
                        )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      <style dangerouslySetInnerHTML={{ __html: doctorProceduresScrollbarCss() }} />
    </DoctorProceduresPageShell>
  )
}
