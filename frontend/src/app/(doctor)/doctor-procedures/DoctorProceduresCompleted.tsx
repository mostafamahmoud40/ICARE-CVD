"use client"

import { PatientAvatar } from "@/components/shared/PatientAvatar"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { FileTextIcon, HistoryIcon, SearchIcon } from "lucide-react"

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
} from "./doctorProcedures.shared"
import { useDoctorProcedures } from "./useDoctorProcedures"

export function DoctorProceduresCompleted() {
  const router = useRouter()
  const vm = useDoctorProcedures()
  const [searchTerm, setSearchTerm] = useState("")

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return vm.completedOrders
    return vm.completedOrders.filter(
      (o) =>
        o.patientName.toLowerCase().includes(q) ||
        o.procedureName.toLowerCase().includes(q),
    )
  }, [vm.completedOrders, searchTerm])

  return (
    <DoctorProceduresPageShell
      title="Completed procedures"
      subtitle="Verified operations with finalized or draft post-operative reports."
      currentPage="Completed"
      stats={
        <DoctorProceduresStat
          label="Verified"
          value={vm.completedOrders.length}
          icon={HistoryIcon}
          tone="green"
        />
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
        <div className="overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
          <div className="overflow-x-auto">
            <table className="min-w-[920px] w-full border-collapse bg-white text-left">
              <thead className="sticky top-0 z-10 bg-[#F4F3ED]/90 shadow-[0_1px_0_0_#E8E6E0] backdrop-blur-md">
                <tr className="font-serif text-[15px] font-bold text-[#1A1F1E]">
                  <th className="py-4 pl-4 pr-4">Patient</th>
                  <th className="px-4 py-4">Procedure</th>
                  <th className="px-4 py-4">Completed</th>
                  <th className="px-4 py-4">Priority</th>
                  <th className="px-4 py-4">Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E6E0]/40">
                {vm.isLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}>
                        <td className="py-4 pl-4 pr-4" colSpan={5}>
                          <Skeleton className="h-12 w-full rounded-lg" />
                        </td>
                      </tr>
                    ))
                  : filtered.length === 0
                    ? (
                        <tr>
                          <td className="px-4 py-20 text-center" colSpan={5}>
                            <div className="flex flex-col items-center justify-center opacity-50">
                              <HistoryIcon className="mb-4 size-12 stroke-[1.25]" />
                              <p className="text-[16px] font-bold text-[#1A1F1E]">No completed procedures</p>
                            </div>
                          </td>
                        </tr>
                      )
                    : (
                        filtered.map((order) => {
                          const reportHref = `/doctor-procedures/${order.id}/report`
                          const priorityCfg = PRIORITY_CONFIG[order.priority]

                          return (
                            <tr
                              key={order.id}
                              role="link"
                              tabIndex={0}
                              className="group cursor-pointer border-t border-[#E8E6E0]/40 transition-colors hover:bg-[#F9F8F5]/50"
                              onClick={() => router.push(reportHref)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault()
                                  router.push(reportHref)
                                }
                              }}
                            >
                              <td className="py-4 pl-4 pr-4">
                                <div className="flex items-start gap-3">
                                  <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E8E6E0]/60 bg-[#F4F3EF]">
                                    <PatientAvatar name={order.patientName} avatarUrl={null} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate font-serif text-[15px] font-bold text-[#1A1F1E] group-hover:text-[#1A5345]">
                                      {order.patientName}
                                    </p>
                                    <p className="mt-0.5 text-[12px] font-medium text-muted-foreground">
                                      {formatPatientRowId(order.patientId)}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 align-middle">
                                <p className="max-w-[220px] truncate text-[14px] font-semibold text-[#1A1F1E]">
                                  {order.procedureName}
                                </p>
                                <StatusBadge status={order.status} />
                              </td>
                              <td className="px-4 py-4 align-middle">
                                <span className="text-[13px] font-medium tabular-nums text-[#1A1F1E]/80">
                                  {formatScheduledAt(order.scheduledAt)}
                                </span>
                              </td>
                              <td className="px-4 py-4 align-middle">
                                {order.priority === "normal" ? (
                                  <span className="text-[12px] text-muted-foreground">—</span>
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
                                <Link
                                  href={reportHref}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#1A5345] hover:text-[#0F3D32]"
                                >
                                  <FileTextIcon className="size-4" aria-hidden />
                                  View report
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
