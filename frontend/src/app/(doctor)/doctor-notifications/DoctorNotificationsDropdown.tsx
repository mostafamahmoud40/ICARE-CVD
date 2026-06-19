"use client"

import { useState } from "react"
import Link from "next/link"
import { BellIcon } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

import { DoctorNotificationListItem, handleDoctorNotificationAction } from "./DoctorNotificationListItem"
import { useDoctorNotifications, refreshDoctorNotificationsFromApi } from "./useDoctorNotifications"

const PREVIEW_LIMIT = 5

export function DoctorNotificationsDropdown() {
  const [open, setOpen] = useState(false)
  const { notifications, unreadCount, markAllAsRead, resolveAction } = useDoctorNotifications()
  const preview = notifications.slice(0, PREVIEW_LIMIT)

  const closeMenu = () => setOpen(false)

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) {
      void refreshDoctorNotificationsFromApi()
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className={cn(
            "relative inline-flex size-9 items-center justify-center rounded-xl border-0 bg-transparent text-[#6B7870] shadow-none outline-none transition-colors hover:bg-[#F9F8F5] hover:text-[#1A5345] focus:outline-none focus-visible:outline-none focus-visible:ring-0 data-[state=open]:bg-[#F9F8F5] data-[state=open]:text-[#1A5345]",
          )}
        >
          <BellIcon className="size-[18px]" strokeWidth={2} aria-hidden />
          {unreadCount > 0 ? (
            <span className="absolute right-2 top-2 size-2 rounded-full bg-[#CC5533] ring-2 ring-white" />
          ) : null}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[min(100vw-2rem,340px)] overflow-hidden rounded-xl border-[#E8E6E0]/60 bg-white p-0 shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#E8E6E0]/60 px-4 py-2">
          <div className="flex w-fit items-center gap-2">
            <p className="text-[14px] font-bold leading-none text-[#1A1F1E]">Notifications</p>
            {unreadCount > 0 ? (
              <span className="text-[11px] font-medium leading-none text-muted-foreground">
                {unreadCount} unread
              </span>
            ) : (
              <span className="text-[11px] font-medium leading-none text-muted-foreground">
                All caught up
              </span>
            )}
          </div>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={markAllAsRead}
              className="shrink-0 text-[11px] font-semibold leading-none text-[#1A5345] transition-colors hover:text-[#133F34]"
            >
              Mark all as read
            </button>
          ) : null}
        </div>

        <div className="scrollbar-hide max-h-[320px] overflow-y-auto p-2">
          {preview.length > 0 ? (
            <div className="space-y-0.5">
              {preview.map((notification) => (
                <DoctorNotificationListItem
                  key={notification.id}
                  notification={notification}
                  compact
                  onSelect={closeMenu}
                  onAction={(notificationId, action) =>
                    handleDoctorNotificationAction(notificationId, action, resolveAction)
                  }
                />
              ))}
            </div>
          ) : (
            <div className="px-3 py-8 text-center text-[13px] text-muted-foreground">
              No notifications yet.
            </div>
          )}
        </div>

        <div className="flex justify-center border-t border-[#E8E6E0]/60 px-4 py-2">
          <Link
            href="/doctor-account/notifications"
            onClick={closeMenu}
            className="inline-flex w-fit items-center rounded-lg py-1 text-[13px] font-semibold leading-none text-[#1A5345] transition-colors hover:text-[#133F34]"
          >
            View all
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
