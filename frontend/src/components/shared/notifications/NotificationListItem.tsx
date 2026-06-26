"use client"

import Link from "next/link"
import { ClockIcon } from "lucide-react"

import { PatientAvatar } from "@/components/shared/PatientAvatar"
import { cn } from "@/lib/utils"

import type {
  NotificationListAction,
  NotificationListItemModel,
} from "./notification-list-item.types"

function actionButtonClass(
  variant: NotificationListAction["variant"] = "secondary",
  compact?: boolean,
) {
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

function NotificationPersonAvatar({
  name,
  avatarUrl,
  unread,
}: {
  name: string
  avatarUrl?: string | null
  unread?: boolean
}) {
  return (
    <div className="relative shrink-0">
      <div className="size-10 overflow-hidden rounded-full border border-[#E8E6E0]/60 bg-[#F4F3EF]">
        <PatientAvatar name={name} avatarUrl={avatarUrl} sizes="40px" />
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

function NotificationMetaRow({
  createdAtLabel,
  compact,
}: {
  createdAtLabel: string
  compact?: boolean
}) {
  return (
    <p
      className={cn(
        "mt-1 flex items-center gap-1 text-[10px] font-medium text-muted-foreground/80",
        compact && "mt-1",
      )}
    >
      <ClockIcon className="size-3 shrink-0" aria-hidden />
      <span>{createdAtLabel}</span>
    </p>
  )
}

function PersonNotificationContent({
  item,
  compact,
}: {
  item: NotificationListItemModel & {
    sender: NonNullable<NotificationListItemModel["sender"]>
  }
  compact?: boolean
}) {
  return (
    <>
      <NotificationPersonAvatar
        name={item.sender.name}
        avatarUrl={item.sender.avatarUrl}
        unread={!item.read}
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-[13px] text-[#1A1F1E]",
            !item.read ? "font-bold" : "font-semibold",
          )}
        >
          {item.sender.name}
        </p>
        <p
          className={cn(
            "mt-0.5 leading-snug text-[#374151]",
            compact ? "line-clamp-2 text-[11px]" : "text-[12px]",
          )}
        >
          {item.body}
        </p>
        <NotificationMetaRow createdAtLabel={item.createdAtLabel} compact={compact} />
      </div>
    </>
  )
}

function SystemNotificationContent({
  item,
  compact,
}: {
  item: NotificationListItemModel
  compact?: boolean
}) {
  const Icon = item.icon

  return (
    <>
      <div className="relative mt-0.5 shrink-0">
        <div className="flex size-10 items-center justify-center rounded-full border border-[#E8E6E0]/60 bg-[#F4F3EF]">
          <Icon className="size-4" style={{ color: item.accent }} aria-hidden />
        </div>
        {!item.read ? (
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
            !item.read ? "font-bold" : "font-medium",
          )}
        >
          {item.title ?? "Notification"}
        </p>
        <p
          className={cn(
            "mt-0.5 leading-snug text-[#374151]",
            compact ? "line-clamp-2 text-[11px]" : "text-[12px]",
          )}
        >
          {item.body}
        </p>
        <NotificationMetaRow createdAtLabel={item.createdAtLabel} compact={compact} />
      </div>
    </>
  )
}

function NotificationActions({
  item,
  actions,
  compact,
  onAction,
  onSelect,
}: {
  item: NotificationListItemModel
  actions: NotificationListAction[]
  compact?: boolean
  onAction?: (notificationId: string, action: NotificationListAction) => void
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
                onAction?.(item.id, action)
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
              onAction?.(item.id, action)
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

export type NotificationListItemProps = {
  item: NotificationListItemModel
  compact?: boolean
  onSelect?: () => void
  onAction?: (notificationId: string, action: NotificationListAction) => void
}

export function NotificationListItem({
  item,
  compact = false,
  onSelect,
  onAction,
}: NotificationListItemProps) {
  const hasActions = Boolean(item.actions?.length)

  const mainContent = item.useIconPresentation ? (
    <SystemNotificationContent item={item} compact={compact} />
  ) : (
    <PersonNotificationContent
      item={{ ...item, sender: item.sender! }}
      compact={compact}
    />
  )

  const rowClass = cn(
    "w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[#F9F8F5]",
    !item.read && "bg-[#FAFAF8]",
  )

  const inner = hasActions ? (
    <div className="flex items-center justify-between gap-4">
      {item.href ? (
        <Link
          href={item.href}
          className="flex min-w-0 flex-1 gap-3 rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#1A5345]/20"
          onClick={onSelect}
        >
          {mainContent}
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 gap-3">{mainContent}</div>
      )}
      <NotificationActions
        item={item}
        actions={item.actions!}
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

  if (item.href) {
    return (
      <Link href={item.href} className={cn(rowClass, "flex gap-3")} onClick={onSelect}>
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
