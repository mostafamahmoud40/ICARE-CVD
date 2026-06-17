"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  addDays,
  addWeeks,
  format,
  isSameDay,
  startOfWeek,
  subWeeks,
} from "date-fns"
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PRIORITY_CONFIG } from "@/app/(assistant)/assistant-procedures/assistantProcedures.config"
import { StatusBadge } from "@/app/(assistant)/assistant-procedures/StatusBadge"
import type { ProcedureOrder } from "@/app/(assistant)/assistant-procedures/assistantProcedures.types"

import {
  DoctorProceduresPageShell,
  DoctorProceduresStat,
} from "./DoctorProceduresPageShell"
import {
  doctorProceduresScrollbarCss,
  formatScheduledAt,
  getProcedureReadiness,
} from "./doctorProcedures.shared"
import { useDoctorProcedures } from "./useDoctorProcedures"

export function DoctorProceduresCalendar() {
  const vm = useDoctorProcedures()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  )

  const ordersByDay = useMemo(() => {
    const map = new Map<string, ProcedureOrder[]>()
    for (const day of weekDays) {
      map.set(format(day, "yyyy-MM-dd"), [])
    }
    for (const order of vm.scheduledOrders) {
      if (!order.scheduledAt) continue
      const key = format(new Date(order.scheduledAt), "yyyy-MM-dd")
      if (map.has(key)) {
        map.get(key)!.push(order)
      }
    }
    for (const [, list] of map) {
      list.sort(
        (a, b) =>
          new Date(a.scheduledAt ?? 0).getTime() - new Date(b.scheduledAt ?? 0).getTime(),
      )
    }
    return map
  }, [vm.scheduledOrders, weekDays])

  const weekCount = useMemo(
    () =>
      weekDays.reduce((acc, day) => acc + (ordersByDay.get(format(day, "yyyy-MM-dd"))?.length ?? 0), 0),
    [weekDays, ordersByDay],
  )

  return (
    <DoctorProceduresPageShell
      title="Procedure calendar"
      subtitle="Weekly view of scheduled operations and clearance deadlines."
      currentPage="Calendar"
      stats={
        <>
          <DoctorProceduresStat
            label="This week"
            value={weekCount}
            icon={CalendarDaysIcon}
            tone="green"
          />
          <DoctorProceduresStat
            label="Scheduled total"
            value={vm.scheduledOrders.length}
            icon={ClockIcon}
            tone="green"
          />
        </>
      }
      toolbar={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] font-bold text-[#1A1F1E]">
            {format(weekDays[0], "MMM d")} – {format(weekDays[6], "MMM d, yyyy")}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setWeekStart((prev) => subWeeks(prev, 1))}
              className="size-9 border-0 bg-transparent p-0 text-muted-foreground shadow-none hover:bg-transparent hover:text-[#1A5345]"
            >
              <ChevronLeftIcon className="size-4" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              className="h-8 rounded-lg px-3 text-[12px] font-bold text-[#1A5345] hover:bg-[#E8F0EE]"
            >
              Today
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setWeekStart((prev) => addWeeks(prev, 1))}
              className="size-9 border-0 bg-transparent p-0 text-muted-foreground shadow-none hover:bg-transparent hover:text-[#1A5345]"
            >
              <ChevronRightIcon className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      }
    >
      <div className="custom-scrollbar w-full pb-6 pt-4">
        {vm.isLoading ? (
          <Skeleton className="h-[520px] w-full rounded-2xl" />
        ) : (
          <div className="grid gap-3 lg:grid-cols-7">
            {weekDays.map((day) => {
              const key = format(day, "yyyy-MM-dd")
              const dayOrders = ordersByDay.get(key) ?? []
              const isToday = isSameDay(day, new Date())

              return (
                <div
                  key={key}
                  className={cn(
                    "min-h-[280px] rounded-2xl border bg-white p-3 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]",
                    isToday ? "border-[#1A5345]/40 ring-1 ring-[#1A5345]/10" : "border-[#E8E6E0]/70",
                  )}
                >
                  <div className="mb-3 flex items-center justify-between border-b border-[#E8E6E0]/50 pb-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        {format(day, "EEE")}
                      </p>
                      <p
                        className={cn(
                          "font-serif text-[18px] font-bold tabular-nums",
                          isToday ? "text-[#1A5345]" : "text-[#1A1F1E]",
                        )}
                      >
                        {format(day, "d")}
                      </p>
                    </div>
                    {dayOrders.length > 0 ? (
                      <span className="rounded-lg bg-[#E8F0EE] px-2 py-0.5 text-[10px] font-bold text-[#1A5345]">
                        {dayOrders.length}
                      </span>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    {dayOrders.length === 0 ? (
                      <p className="py-6 text-center text-[11px] font-medium text-muted-foreground/70">
                        No procedures
                      </p>
                    ) : (
                      dayOrders.map((order) => {
                        const { pct } = getProcedureReadiness(order)
                        const priorityCfg = PRIORITY_CONFIG[order.priority]

                        return (
                          <Link
                            key={order.id}
                            href={`/doctor-procedures/${order.id}`}
                            className="block rounded-xl border border-[#E8E6E0]/60 bg-[#FBFDFC] p-2.5 transition-colors hover:border-[#1A5345]/30 hover:bg-[#F9F8F5]"
                          >
                            <div className="mb-1 flex items-start justify-between gap-1">
                              <p className="line-clamp-2 text-[12px] font-bold leading-snug text-[#1A1F1E]">
                                {order.procedureName}
                              </p>
                              <StatusBadge status={order.status} />
                            </div>
                            <p className="truncate text-[11px] font-medium text-muted-foreground">
                              {order.patientName}
                            </p>
                            <p className="mt-1 text-[10px] font-medium tabular-nums text-[#1A5345]">
                              {formatScheduledAt(order.scheduledAt)}
                            </p>
                            <div className="mt-2 flex items-center justify-between gap-2">
                              {order.priority !== "normal" ? (
                                <span
                                  className={cn(
                                    "rounded-lg border px-1.5 py-0.5 text-[9px] font-bold",
                                    priorityCfg.style,
                                  )}
                                >
                                  {priorityCfg.label}
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-muted-foreground">
                                  {pct}% ready
                                </span>
                              )}
                            </div>
                          </Link>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: doctorProceduresScrollbarCss() }} />
    </DoctorProceduresPageShell>
  )
}
