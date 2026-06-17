"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ClockIcon, FileTextIcon, HistoryIcon, MapPinIcon, SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import { useAssistantPageTranslations } from "../use-assistant-i18n"
import { PRIORITY_CONFIG } from "./assistantProcedures.config"
import { MOCK_HISTORY_OPERATIONS } from "./assistantProceduresHistory.mock"
import type { ProcedurePriority } from "./assistantProcedures.types"
import {
  proceduresListSearchInputClassName,
  proceduresScrollbarCss,
} from "./assistantProcedures.shared"

type DateFilter = "7days" | "30days" | "3months" | "all"

const PRIORITY_BADGE_CLASS: Record<Exclude<ProcedurePriority, "normal">, string> = {
  urgent: "border-0 bg-amber-500 text-white hover:bg-amber-500",
  emergency: "border-0 bg-rose-500 text-white hover:bg-rose-500",
}

export function AssistantProceduresHistory() {
  const { t, ts } = useAssistantPageTranslations("procedures")
  const [dateFilter, setDateFilter] = useState<DateFilter>("30days")
  const [searchTerm, setSearchTerm] = useState("")

  const filterTabs = [
    { key: "7days" as const, label: t("history.filter7Days") },
    { key: "30days" as const, label: t("history.filter30Days") },
    { key: "3months" as const, label: t("history.filter3Months") },
    { key: "all" as const, label: t("history.filterAll") },
  ] as const

  const filteredOperations = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return MOCK_HISTORY_OPERATIONS
    return MOCK_HISTORY_OPERATIONS.filter(
      (op) =>
        op.patientName.toLowerCase().includes(q) ||
        op.procedureName.toLowerCase().includes(q) ||
        op.patientId.toLowerCase().includes(q),
    )
  }, [searchTerm])

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#F9F8F5] animate-in fade-in duration-500">
      <style dangerouslySetInnerHTML={{ __html: proceduresScrollbarCss() }} />

      <div className="relative z-20 shrink-0 border-b border-[#E8E6E0]/60 bg-white">
        <div className="flex flex-col px-5 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-5">
          <div className="mb-2 flex items-center gap-2 sm:mb-2.5">
            <Breadcrumb>
              <BreadcrumbList className="text-[10px] sm:text-[11px]">
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/assistant-dashboard" className="text-[10px] font-medium sm:text-[11px]">
                      {ts("breadcrumbDashboard")}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-[10px] font-medium sm:text-[11px]">
                    {t("history.breadcrumb")}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
            <div className="min-w-0 space-y-0.5">
              <h1 className="font-serif text-[22px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[24px] lg:text-[26px]">
                {t("history.title")}
              </h1>
              <p className="text-[13px] font-medium text-muted-foreground sm:text-[14px]">
                {t("history.subtitle")}
              </p>
            </div>
            <div className="hidden flex-col items-end gap-0.5 xl:flex">
              <span className="text-[10px] font-bold text-muted-foreground sm:text-[11px]">
                {t("history.completedRecords")}
              </span>
              <span className="text-[16px] font-bold leading-none text-[#1A5345] tabular-nums sm:text-[17px]">
                {filteredOperations.length}
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2 pt-1 sm:mt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:gap-2 sm:pb-0">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setDateFilter(tab.key)}
                  className={cn(
                    "inline-flex h-8 items-center whitespace-nowrap rounded-lg px-3 text-[12px] font-bold transition-all",
                    dateFilter === tab.key
                      ? "bg-[#1A5345] text-white shadow-sm"
                      : "text-muted-foreground hover:bg-white hover:text-[#1A1F1E] hover:shadow-sm",
                  )}
                >
                  {tab.label}
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
                placeholder={t("history.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={proceduresListSearchInputClassName}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex-1 overflow-auto bg-[#F9F8F5] px-6 sm:px-8">
        <div className="custom-scrollbar w-full pb-6 pt-4">
          <div className="overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
            <div className="overflow-x-auto">
              <table className="min-w-[1040px] w-full border-collapse bg-white text-left">
                <thead className="sticky top-0 z-10 bg-[#F4F3ED]/90 shadow-[0_1px_0_0_#E8E6E0] backdrop-blur-md">
                  <tr className="font-serif text-[15px] font-bold text-[#1A1F1E]">
                    <th className="py-4 pl-4 pr-4">{ts("patient")}</th>
                    <th className="px-4 py-4">{t("tableProcedure")}</th>
                    <th className="px-4 py-4">{t("history.tableLocation")}</th>
                    <th className="px-4 py-4">{t("tablePriority")}</th>
                    <th className="px-4 py-4">{t("history.tableDuration")}</th>
                    <th className="py-4 pl-4 pr-4 text-right">{ts("details")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E6E0]/40">
                  {filteredOperations.length === 0 ? (
                    <tr>
                      <td className="px-4 py-20 text-center" colSpan={6}>
                        <div className="flex flex-col items-center justify-center opacity-50">
                          <HistoryIcon className="mb-4 size-12 stroke-[1.25]" />
                          <p className="text-[16px] font-bold text-[#1A1F1E]">{t("history.emptyTitle")}</p>
                          <p className="mt-1 text-[13px] font-medium text-muted-foreground">
                            {t("history.emptyHint")}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredOperations.map((op) => (
                      <tr
                        key={op.id}
                        className="group border-t border-[#E8E6E0]/40 transition-colors hover:bg-[#F9F8F5]/50"
                      >
                        <td className="py-4 pl-4 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E8E6E0]/60 bg-[#F4F3EF]">
                              <Image
                                src={`https://i.pravatar.cc/150?u=${encodeURIComponent(op.patientId)}`}
                                alt=""
                                width={44}
                                height={44}
                                className="size-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-[14px] font-bold text-[#1A1F1E] group-hover:text-[#1A5345]">
                                {op.patientName}
                              </p>
                              <p className="text-[11px] font-medium text-muted-foreground">
                                #{op.patientId}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="max-w-[240px] truncate text-[13px] font-semibold text-[#1A1F1E]">
                            {op.procedureName}
                          </p>
                          <p className="mt-0.5 text-[11px] font-medium text-muted-foreground tabular-nums">
                            {op.startTime}
                            {op.endTimeActual ? ` – ${op.endTimeActual}` : ""}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#1A1F1E]">
                            <MapPinIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                            <span className="truncate">{op.location}</span>
                          </div>
                          <p className="mt-1 truncate text-[11px] font-medium text-muted-foreground">
                            {op.riskScore}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          {op.priority === "normal" ? (
                            <span className="text-[12px] font-medium text-muted-foreground">—</span>
                          ) : (
                            <Badge
                              variant="default"
                              className={cn(
                                "rounded-lg px-2 py-0.5 text-[10px] font-bold leading-none shadow-none",
                                PRIORITY_BADGE_CLASS[op.priority],
                              )}
                            >
                              {PRIORITY_CONFIG[op.priority].label}
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5 text-[13px] font-bold tabular-nums text-[#1A1F1E]">
                            <ClockIcon className="size-3.5 text-[#1A5345]" aria-hidden />
                            {op.duration}
                          </div>
                        </td>
                        <td className="py-4 pl-4 pr-4 text-right">
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-lg border-0 bg-transparent text-[#6B7870] shadow-none transition-colors hover:bg-transparent hover:text-[#1A5345]"
                            aria-label={t("history.viewReport")}
                            title={t("history.viewReport")}
                          >
                            <Link href={`/assistant-procedures/${op.id}`}>
                              <FileTextIcon className="size-4" aria-hidden />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
