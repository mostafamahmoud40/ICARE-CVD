"use client"

import { useState } from "react"
import Link from "next/link"
import { ClockIcon } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import type {
  AssistantNotification,
  AssistantNotificationAction,
} from "./assistantNotifications.types"
import {
  formatAssistantNotificationTime,
  getAssistantNotificationMeta,
} from "./assistantNotifications.utils"

const ICON_FIRST_KINDS = new Set<AssistantNotification["kind"]>([
  "emergency",
  "procedure",
  "checklist",
  "document",
  "system",
])

function usesIconPresentation(notification: AssistantNotification) {
  return !notification.sender || ICON_FIRST_KINDS.has(notification.kind)
}

function actionButtonClass(variant: AssistantNotificationAction["variant"] = "secondary", compact?: boolean) {
  return cn(
    "inline-flex items-center justify-center rounded-lg font-semibold transition-colors",
    compact ? "h-7 px-2.5 text-[11px]" : "h-8 px-3 text-[12px]",
    variant === "primary" && "bg-[#1A5345] text-white hover:bg-[#133F34]",
    variant === "secondary" &&
      "border border-[#E8E6E0]/80 bg-white text-[#374151] hover:bg-[#F9F8F5]",
    variant === "destructive" &&
      "border border-red-200 bg-white text-red-600 hover:bg-red-50",
  )
}

type AssistantNotificationListItemProps = {
  notification: AssistantNotification
  compact?: boolean
  onSelect?: () => void
  onAction?: (notificationId: string, action: AssistantNotificationAction) => void
}

function NotificationPersonAvatar({
  name,
  avatarUrl,
  unread,
}: {
  name: string
  avatarUrl?: string | null
  unread?: boolean
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const fallbackSrc = `https://i.pravatar.cc/150?u=${encodeURIComponent(name)}`
  const src = avatarUrl?.trim() && !imageFailed ? avatarUrl.trim() : fallbackSrc

  return (
    <div className="relative shrink-0">
      <div className="size-10 overflow-hidden rounded-full border border-[#E8E6E0]/60 bg-[#F4F3EF]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={name}
          className="size-full object-cover"
          onError={() => setImageFailed(true)}
        />
      </div>
      {unread ? (
        <span
          className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-[#CC5533] ring-2 ring-white"
          aria-hidden
        />
      ) : null}
    </div>
  )
}

function NotificationMetaRow({ createdAt, compact }: { createdAt: string; compact?: boolean }) {
  return (
    <p
      className={cn(
        "mt-1 flex items-center gap-1 text-[10px] font-medium text-muted-foreground/80",
        compact && "mt-1",
      )}
    >
      <ClockIcon className="size-3 shrink-0" aria-hidden />
      <span>{formatAssistantNotificationTime(createdAt)}</span>
    </p>
  )
}

function PersonNotificationContent({
  notification,
  compact,
}: {
  notification: AssistantNotification & { sender: NonNullable<AssistantNotification["sender"]> }
  compact?: boolean
}) {
  return (
    <>
      <NotificationPersonAvatar
        name={notification.sender.name}
        avatarUrl={notification.sender.avatarUrl}
        unread={!notification.read}
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-[13px] text-[#1A1F1E]",
            !notification.read ? "font-bold" : "font-semibold",
          )}
        >
          {notification.sender.name}
        </p>
        <p
          className={cn(
            "mt-0.5 leading-snug text-[#374151]",
            compact ? "line-clamp-2 text-[11px]" : "text-[12px]",
          )}
        >
          {notification.body}
        </p>
        <NotificationMetaRow createdAt={notification.createdAt} compact={compact} />
      </div>
    </>
  )
}

function SystemNotificationContent({
  notification,
  compact,
}: {
  notification: AssistantNotification
  compact?: boolean
}) {
  const { icon: Icon, accent } = getAssistantNotificationMeta(notification.kind)

  return (
    <>
      <div className="relative mt-0.5 shrink-0">
        <div className="flex size-10 items-center justify-center rounded-full border border-[#E8E6E0]/60 bg-[#F4F3EF]">
          <Icon className="size-4" style={{ color: accent }} aria-hidden />
        </div>
        {!notification.read ? (
          <span
            className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-[#CC5533] ring-2 ring-white"
            aria-hidden
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-[13px] leading-snug text-[#1A1F1E]",
            !notification.read ? "font-bold" : "font-medium",
          )}
        >
          {notification.title ?? "Notification"}
        </p>
        <p
          className={cn(
            "mt-0.5 leading-snug text-[#374151]",
            compact ? "line-clamp-2 text-[11px]" : "text-[12px]",
          )}
        >
          {notification.body}
        </p>
        <NotificationMetaRow createdAt={notification.createdAt} compact={compact} />
      </div>
    </>
  )
}

function NotificationActions({
  notification,
  actions,
  compact,
  onAction,
  onSelect,
}: {
  notification: AssistantNotification
  actions: AssistantNotificationAction[]
  compact?: boolean
  onAction?: (notificationId: string, action: AssistantNotificationAction) => void
  onSelect?: () => void
}) {
  const visibleActions = compact ? actions.slice(0, 2) : actions

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      {visibleActions.map((action) => {
        const className = actionButtonClass(action.variant, compact)

        if (action.href) {
          return (
            <Link
              key={action.id}
              href={action.href}
              className={className}
              onClick={(event) => {
                event.stopPropagation()
                onAction?.(notification.id, action)
                onSelect?.()
              }}
            >
              {action.label}
            </Link>
          )
        }

        return (
          <button
            key={action.id}
            type="button"
            className={className}
            onClick={(event) => {
              event.stopPropagation()
              onAction?.(notification.id, action)
              onSelect?.()
            }}
          >
            {action.label}
          </button>
        )
      })}
    </div>
  )
}

export function AssistantNotificationListItem({
  notification,
  compact = false,
  onSelect,
  onAction,
}: AssistantNotificationListItemProps) {
  const hasActions = Boolean(notification.actions?.length)

  const mainContent = usesIconPresentation(notification) ? (
    <SystemNotificationContent notification={notification} compact={compact} />
  ) : (
    <PersonNotificationContent
      notification={{ ...notification, sender: notification.sender! }}
      compact={compact}
    />
  )

  const rowClass = cn(
    "w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[#F9F8F5]",
    !notification.read && "bg-[#FAFAF8]",
  )

  const inner = hasActions ? (
    <div className="flex items-center justify-between gap-4">
      {notification.href ? (
        <Link
          href={notification.href}
          className="flex min-w-0 flex-1 gap-3 rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#1A5345]/20"
          onClick={onSelect}
        >
          {mainContent}
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 gap-3">{mainContent}</div>
      )}
      <NotificationActions
        notification={notification}
        actions={notification.actions!}
        compact={compact}
        onAction={onAction}
        onSelect={onSelect}
      />
    </div>
  ) : (
    <div className="flex gap-3">{mainContent}</div>
  )

  if (hasActions) {
    return <div className={rowClass}>{inner}</div>
  }

  if (notification.href) {
    return (
      <Link href={notification.href} className={cn(rowClass, "flex gap-3")} onClick={onSelect}>
        {mainContent}
      </Link>
    )
  }

  return (
    <button type="button" className={cn(rowClass, "flex gap-3")} onClick={onSelect}>
      {mainContent}
    </button>
  )
}

export function handleAssistantNotificationAction(
  notificationId: string,
  action: AssistantNotificationAction,
  resolveAction: (notificationId: string, actionId: string) => void,
) {
  resolveAction(notificationId, action.id)
  toast.success("Action recorded")
}
