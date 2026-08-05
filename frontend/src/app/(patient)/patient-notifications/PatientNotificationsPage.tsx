"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { BellIcon, SearchIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  PatientNotificationListItem,
  handlePatientNotificationAction,
} from "./PatientNotificationListItem"
import {
  PATIENT_NOTIFICATION_KIND_OPTIONS,
  filterPatientNotifications,
  type PatientNotificationKindFilter,
} from "./patientNotifications.filters"
import { usePatientNotifications } from "./usePatientNotifications"

export function PatientNotificationsPage() {
  const t = useTranslations("patient.notifications")
  const [kindFilter, setKindFilter] = useState<PatientNotificationKindFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const { notifications, unreadCount, markAllAsRead, markAsRead, resolveAction } =
    usePatientNotifications()

  const filteredNotifications = useMemo(
    () => filterPatientNotifications(notifications, kindFilter, searchQuery),
    [notifications, kindFilter, searchQuery],
  )

  const hasActiveFilters = kindFilter !== "all" || searchQuery.trim().length > 0

  return (
    <div className="flex w-full flex-1 flex-col space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <BellIcon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
            <h1 className="font-serif text-[24px] font-bold leading-none tracking-tight text-[#1A1F1E] sm:text-[26px]">
              {t("title")}
            </h1>
          </div>
          <p className="mt-2 text-[14px] text-muted-foreground">
            {unreadCount > 0
              ? t("pageUnread", { count: unreadCount })
              : t("pageAllCaughtUp")}
          </p>
        </div>

        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={markAllAsRead}
            className="self-start text-[13px] font-semibold text-[#1A5345] transition-colors hover:text-[#133F34] sm:self-center"
          >
            {t("markAllRead")}
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="group relative min-w-0 flex-1">
          <SearchIcon
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF] transition-colors group-focus-within:text-[#1A5345]"
            strokeWidth={2}
            aria-hidden
          />
          <Input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-10 w-full rounded-xl border-[#E8E6E0]/80 bg-white pl-10 pr-3 text-[13px] font-medium text-[#1A1F1E] shadow-sm transition-all placeholder:text-muted-foreground/60 focus-visible:border-[#1A5345]/30 focus-visible:ring-0"
          />
        </div>

        <Select
          value={kindFilter}
          onValueChange={(value) => setKindFilter(value as PatientNotificationKindFilter)}
        >
          <SelectTrigger className="h-10 w-full rounded-xl border-[#E8E6E0]/80 bg-white text-[13px] font-medium text-[#374151] sm:w-[200px]">
            <SelectValue placeholder={t("filterPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {PATIENT_NOTIFICATION_KIND_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value} className="text-[13px]">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E8E6E0]/60 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
        {filteredNotifications.length > 0 ? (
          <div className="divide-y divide-[#E8E6E0]/50">
            {filteredNotifications.map((notification) => (
              <div key={notification.id} className="px-2 py-1">
                <PatientNotificationListItem
                  notification={notification}
                  onMarkRead={markAsRead}
                  onAction={(notificationId, action) =>
                    handlePatientNotificationAction(notificationId, action, resolveAction)
                  }
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-14 text-center">
            <p className="text-[14px] font-semibold text-[#1A1F1E]">{t("noMatchesTitle")}</p>
            <p className="mt-1 text-[13px] text-muted-foreground">{t("noMatchesHint")}</p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={() => {
                  setKindFilter("all")
                  setSearchQuery("")
                }}
                className="mt-4 text-[13px] font-semibold text-[#1A5345] transition-colors hover:text-[#133F34]"
              >
                {t("clearFilters")}
              </button>
            ) : null}
          </div>
        )}
      </div>

      <p className="text-[12px] font-medium text-muted-foreground">
        {t("showingCount", {
          shown: filteredNotifications.length,
          total: notifications.length,
        })}
      </p>
    </div>
  )
}
