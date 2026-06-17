"use client"

import Image from "next/image"
import Link from "next/link"
import { useLocale } from "next-intl"
import {
  ClipboardPlusIcon,
  SearchIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
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
import {
  proceduresListSearchInputClassName,
  proceduresScrollbarCss,
} from "./assistantProcedures.shared"
import type {
  ProcedureFilter,
  ProcedureOrder,
  ProcedureStats,
} from "./assistantProcedures.types"
import { StatusBadge } from "./StatusBadge"
import { ProcedureDetailPanel } from "./ProcedureDetailPanel"
import type { ProcedureConsentSavePayload } from "./ProcedureConsentDialog"

type AssistantProceduresOperationsProps = {
  orders: ProcedureOrder[]
  stats: ProcedureStats
  filter: ProcedureFilter
  setFilter: (f: ProcedureFilter) => void
  searchTerm: string
  setSearchTerm: (v: string) => void
  selectedOrder: ProcedureOrder | null
  selectOrder: (id: string) => void
  clearSelection: () => void
  onToggleRequirement: (orderId: string, requirementId: string, isDone: boolean) => void
  onUploadAttachment: (orderId: string, requirementId: string, file: File) => Promise<void>
  onAddRequirement: (
    orderId: string,
    title: string,
    description: string | null,
    allowsAttachment: boolean,
    dueAt: string | null,
  ) => void
  onEditRequirement: (
    orderId: string,
    requirementId: string,
    title: string,
    description: string | null,
    allowsAttachment: boolean,
    dueAt: string | null,
  ) => void
  onDeleteRequirement: (orderId: string, requirementId: string) => void
  onNotifyPatient: (orderId: string) => Promise<void>
  onSaveConsent: (orderId: string, payload: ProcedureConsentSavePayload) => Promise<void>
  isNotifying: boolean
  isSavingConsent: boolean
  isTogglingRequirement: boolean
  isUploadingAttachment: boolean
}

function formatScheduledAt(value: string | null, locale: string) {
  if (!value) return "—"
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
}

export function AssistantProceduresOperations({
  orders,
  stats,
  filter,
  setFilter,
  searchTerm,
  setSearchTerm,
  selectedOrder,
  selectOrder,
  clearSelection,
  onToggleRequirement,
  onUploadAttachment,
  onAddRequirement,
  onEditRequirement,
  onDeleteRequirement,
  onNotifyPatient,
  isSavingConsent,
  onSaveConsent,
  isNotifying,
  isTogglingRequirement,
  isUploadingAttachment,
}: AssistantProceduresOperationsProps) {
  const { t, ts } = useAssistantPageTranslations("procedures")
  const locale = useLocale()

  const filterTabs = [
    { key: "all" as const, label: t("filterAll"), count: stats.total },
    { key: "pending" as const, label: t("filterPending"), count: stats.pending },
    { key: "in-progress" as const, label: t("filterActive"), count: stats.inProgress },
    { key: "completed" as const, label: t("filterDone"), count: stats.completed },
  ] as const

  if (selectedOrder) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#F9F8F5] animate-in fade-in duration-300">
        <header className="shrink-0 border-b border-[#E8E6E0]/60 bg-white px-5 py-3.5 sm:px-6 sm:py-4">
          <Breadcrumb>
            <BreadcrumbList className="text-[10px] sm:text-[11px]">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="text-[10px] font-medium sm:text-[11px]"
                  >
                    {t("breadcrumb")}
                  </button>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="max-w-[min(100vw-12rem,28rem)] truncate text-[10px] font-medium text-foreground sm:text-[11px]">
                  {selectedOrder.patientName}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
          <ProcedureDetailPanel
            order={selectedOrder}
            onBack={clearSelection}
            onToggleRequirement={(requirementId, isDone) =>
              onToggleRequirement(selectedOrder.id, requirementId, isDone)
            }
            onUploadAttachment={(requirementId, file) =>
              onUploadAttachment(selectedOrder.id, requirementId, file)
            }
            onAddRequirement={(title, description, allowsAttachment, dueAt) =>
              onAddRequirement(selectedOrder.id, title, description, allowsAttachment, dueAt)
            }
            onEditRequirement={(requirementId, title, description, allowsAttachment, dueAt) =>
              onEditRequirement(
                selectedOrder.id,
                requirementId,
                title,
                description,
                allowsAttachment,
                dueAt,
              )
            }
            onDeleteRequirement={(requirementId) =>
              onDeleteRequirement(selectedOrder.id, requirementId)
            }
            onNotifyPatient={() => onNotifyPatient(selectedOrder.id)}
            onSaveConsent={(payload) => onSaveConsent(selectedOrder.id, payload)}
            isSavingConsent={isSavingConsent}
            isNotifying={isNotifying}
            isTogglingRequirement={isTogglingRequirement}
            isUploadingAttachment={isUploadingAttachment}
          />
        </div>
      </div>
    )
  }

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
                    {t("breadcrumb")}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
            <div className="min-w-0 space-y-0.5">
              <h1 className="font-serif text-[22px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[24px] lg:text-[26px]">
                {t("title")}
              </h1>
              <p className="text-[13px] font-medium text-muted-foreground sm:text-[14px]">
                {t("subtitle")}
              </p>
            </div>
            <div className="hidden flex-col items-end gap-0.5 xl:flex">
              <span className="text-[10px] font-bold text-muted-foreground sm:text-[11px]">
                {t("openOrders")}
              </span>
              <span className="text-[16px] font-bold leading-none text-[#1A5345] tabular-nums sm:text-[17px]">
                {stats.pending + stats.inProgress}
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2 pt-1 sm:mt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:gap-2 sm:pb-0">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-[12px] font-bold transition-all",
                    filter === tab.key
                      ? "bg-[#1A5345] text-white shadow-sm"
                      : "text-muted-foreground hover:bg-white hover:text-[#1A1F1E] hover:shadow-sm",
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "rounded-lg px-1.5 py-0.5 text-[10px] font-bold shadow-sm transition-colors",
                      filter === tab.key ? "bg-white/10 text-white" : "bg-black/5 text-[#1A5345]",
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
                placeholder={t("searchPlaceholder")}
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
              <table className="min-w-[920px] w-full border-collapse bg-white text-left">
                <thead className="sticky top-0 z-10 bg-[#F4F3ED]/90 shadow-[0_1px_0_0_#E8E6E0] backdrop-blur-md">
                  <tr className="font-serif text-[15px] font-bold text-[#1A1F1E]">
                    <th className="py-4 pl-4 pr-4">{ts("patient")}</th>
                    <th className="px-4 py-4">{t("tableProcedure")}</th>
                    <th className="px-4 py-4">{t("tableChecklist")}</th>
                    <th className="px-4 py-4">{t("tablePriority")}</th>
                    <th className="px-4 py-4">{t("tableScheduled")}</th>
                    <th className="px-4 py-4">{ts("tableStatus")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E6E0]/40">
                  {orders.length === 0 ? (
                    <tr>
                      <td className="px-4 py-20 text-center" colSpan={6}>
                        <div className="flex flex-col items-center justify-center opacity-50">
                          <ClipboardPlusIcon className="mb-4 size-12 stroke-[1.25]" />
                          <p className="text-[16px] font-bold text-[#1A1F1E]">{t("emptyTitle")}</p>
                          <p className="mt-1 text-[13px] font-medium text-muted-foreground">
                            {t("emptyHint")}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => {
                      const done = order.requirements.filter((r) => r.isDone).length
                      const total = order.requirements.length
                      const priorityCfg = PRIORITY_CONFIG[order.priority]

                      return (
                        <tr
                          key={order.id}
                          role="button"
                          tabIndex={0}
                          className="group cursor-pointer border-t border-[#E8E6E0]/40 transition-colors hover:bg-[#F9F8F5]/50"
                          onClick={() => selectOrder(order.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              selectOrder(order.id)
                            }
                          }}
                        >
                          <td className="py-4 pl-4 pr-4">
                            <div className="flex items-center gap-3">
                              <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E8E6E0]/60 bg-[#F4F3EF]">
                                <Image
                                  src={`https://i.pravatar.cc/150?u=${encodeURIComponent(order.patientId)}`}
                                  alt=""
                                  width={44}
                                  height={44}
                                  className="size-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-[14px] font-bold text-[#1A1F1E] group-hover:text-[#1A5345]">
                                  {order.patientName}
                                </p>
                                <p className="text-[11px] font-medium text-muted-foreground">
                                  {order.patientAge}
                                  {ts("yrs")}
                                  {order.patientPhone ? ` · ${order.patientPhone}` : ""}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <p className="max-w-[220px] truncate text-[13px] font-semibold text-[#1A1F1E]">
                              {order.procedureName}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] font-medium text-muted-foreground">
                              {order.doctorName}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-[13px] font-bold tabular-nums text-[#1A5345]">
                              {done}/{total}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            {order.priority === "normal" ? (
                              <span className="text-[12px] font-medium text-muted-foreground">—</span>
                            ) : (
                              <span
                                className={cn(
                                  "inline-flex rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                                  priorityCfg.style,
                                )}
                              >
                                {priorityCfg.label}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-[12px] font-medium text-muted-foreground tabular-nums">
                            {formatScheduledAt(order.scheduledAt, locale)}
                          </td>
                          <td className="px-4 py-4">
                            <StatusBadge status={order.status} />
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
      </div>
    </div>
  )
}
