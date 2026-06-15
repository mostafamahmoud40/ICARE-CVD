"use client"

import { useMemo, useState } from "react"
import { BellIcon, SearchIcon, Settings2Icon } from "lucide-react"
import { toast } from "sonner"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { DoctorNotificationListItem, handleDoctorNotificationAction } from "./DoctorNotificationListItem"
import {
  DOCTOR_NOTIFICATION_KIND_OPTIONS,
  filterDoctorNotifications,
  type DoctorNotificationKindFilter,
} from "./doctorNotifications.filters"
import { useDoctorNotifications } from "./useDoctorNotifications"

export function DoctorNotificationsPage() {
  const [kindFilter, setKindFilter] = useState<DoctorNotificationKindFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const { notifications, unreadCount, markAllAsRead, resolveAction } = useDoctorNotifications()

  const filteredNotifications = useMemo(
    () => filterDoctorNotifications(notifications, kindFilter, searchQuery),
    [notifications, kindFilter, searchQuery],
  )

  const hasActiveFilters = kindFilter !== "all" || searchQuery.trim().length > 0

  return (
    <div className="flex w-full flex-1 flex-col space-y-6 p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <BellIcon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
            <h1 className="font-serif text-[26px] font-bold leading-none tracking-tight text-[#1A1F1E]">
              Notifications
            </h1>
          </div>
          <p className="mt-2 text-[14px] text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
              : "All caught up — no unread notifications."}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={markAllAsRead}
              className="text-[13px] font-semibold text-[#1A5345] transition-colors hover:text-[#133F34]"
            >
              Mark all as read
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => toast.info("Notification settings")}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#E8E6E0]/80 bg-white px-3.5 text-[13px] font-semibold text-[#374151] shadow-sm transition-colors hover:bg-[#F9F8F5] hover:text-[#1A5345]"
          >
            <Settings2Icon className="size-4 shrink-0" aria-hidden />
            Settings
          </button>
        </div>
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
            placeholder="Search by name, message, or type…"
            className="h-10 w-full rounded-xl border-[#E8E6E0]/80 bg-white pl-10 pr-3 text-[13px] font-medium text-[#1A1F1E] shadow-sm transition-all placeholder:text-muted-foreground/60 focus-visible:border-[#1A5345]/30 focus-visible:ring-0"
          />
        </div>

        <Select
          value={kindFilter}
          onValueChange={(value) => setKindFilter(value as DoctorNotificationKindFilter)}
        >
          <SelectTrigger className="h-10 w-full rounded-xl border-[#E8E6E0]/80 bg-white text-[13px] font-medium text-[#374151] sm:w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            {DOCTOR_NOTIFICATION_KIND_OPTIONS.map((option) => (
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
                <DoctorNotificationListItem
                  key={notification.id}
                  notification={notification}
                  onAction={(notificationId, action) =>
                    handleDoctorNotificationAction(notificationId, action, resolveAction)
                  }
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-14 text-center">
            <p className="text-[14px] font-semibold text-[#1A1F1E]">No notifications match</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Try a different search or filter.
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={() => {
                  setKindFilter("all")
                  setSearchQuery("")
                }}
                className="mt-4 text-[13px] font-semibold text-[#1A5345] transition-colors hover:text-[#133F34]"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        )}
      </div>

      <p className="text-[12px] font-medium text-muted-foreground">
        Showing {filteredNotifications.length} of {notifications.length} notifications
      </p>
    </div>
  )
}
