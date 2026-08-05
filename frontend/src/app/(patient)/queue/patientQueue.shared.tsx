import type { ElementType, ReactNode } from "react"
import Image from "next/image"

import { cn } from "@/lib/utils"

export function queueAvatarUrl(seed: string) {
  return `https://i.pravatar.cc/150?u=${encodeURIComponent(seed.replace(/\s+/g, ""))}`
}

export function QueueProfileAvatar({
  seed,
  className,
  size = "lg",
}: {
  seed: string
  className?: string
  size?: "md" | "lg"
}) {
  const px = size === "lg" ? 64 : 44
  const box = size === "lg" ? "size-14 sm:size-16" : "size-11"

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E8E6E0]/60 bg-white ring-1 ring-[#E8E6E0]/80",
        box,
        className,
      )}
    >
      <Image
        src={queueAvatarUrl(seed)}
        alt=""
        width={px}
        height={px}
        unoptimized
        className="size-full object-cover"
      />
    </div>
  )
}

export const queuePanelBodyClassName = "rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm sm:p-6"

export const queueStatTileClassName =
  "flex items-center gap-3 rounded-xl border border-[#E8E6E0]/60 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"

export const queuePrimaryButtonClassName =
  "h-8 w-full items-center justify-center gap-1.5 rounded-lg border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-[0_2px_10px_rgba(26,83,69,0.2)] transition-all hover:bg-[#133F34] hover:shadow-[0_4px_14px_rgba(26,83,69,0.25)]"

export const queueOutlineButtonClassName =
  "h-8 w-full items-center justify-center gap-1.5 rounded-lg border-[#E8E6E0] bg-white px-4 text-[12px] font-bold text-[#1A1F1E] shadow-sm transition-all hover:border-[#1A5345]/30 hover:bg-slate-50 hover:text-[#1A5345] hover:shadow-md"

export const queueSelectTriggerClassName =
  "h-9 rounded-lg border-[#E8E6E0] bg-white text-[12px] font-medium text-[#1A1F1E] shadow-sm"

export function QueueSectionTitle({
  title,
  action,
  dotClassName = "bg-[#1A5345]",
  className,
}: {
  title: string
  action?: ReactNode
  dotClassName?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b border-[#E8E6E0]/60 pb-3",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className={cn("size-2 shrink-0 rounded-full", dotClassName)} aria-hidden />
        <h3 className="font-serif text-[18px] font-bold leading-tight text-[#1A1F1E]">{title}</h3>
      </div>
      {action}
    </div>
  )
}

export function QueuePanel({
  title,
  action,
  children,
  className,
  bodyClassName,
  dotClassName = "bg-[#1A5345]",
}: {
  title: string
  /** @deprecated Descriptions belong in panel body, not the section title row. */
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  dotClassName?: string
}) {
  return (
    <section className={cn("space-y-4", className)}>
      <QueueSectionTitle title={title} action={action} dotClassName={dotClassName} />
      <div className={cn(queuePanelBodyClassName, bodyClassName)}>{children}</div>
    </section>
  )
}

export function QueueStatCell({
  icon: Icon,
  value,
  label,
  hint,
  iconColor = "text-[#1A5345]",
  highlight,
  size = "default",
  className,
}: {
  icon: ElementType
  value: string
  label: string
  hint?: string | null
  iconColor?: string
  highlight?: boolean
  size?: "default" | "compact"
  className?: string
}) {
  const compact = size === "compact"

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-[#E8E6E0]/60 bg-[#F9F8F5]/40 shadow-sm transition-all duration-300 hover:shadow-md",
        compact ? "p-3" : "rounded-2xl bg-white p-4 sm:p-5",
        className,
      )}
    >
      <Icon
        className={cn(
          "absolute right-3 top-3",
          compact ? "size-4" : "right-4 top-4 size-5",
          iconColor,
        )}
        strokeWidth={2}
        aria-hidden
      />
      <p
        className={cn(
          "pr-7 font-bold uppercase tracking-wider text-muted-foreground",
          compact ? "text-[10px]" : "pr-8 text-[11px] sm:text-[12px]",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-1.5 font-bold leading-snug tabular-nums",
          compact
            ? "text-[14px] text-[#1A1F1E] sm:text-[15px]"
            : "mt-2 font-serif text-[26px] leading-none sm:text-[28px]",
          !compact && (highlight ? "text-[#1A5345]" : "text-[#1A1F1E]"),
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-1.5 truncate text-[11px] font-medium text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

export function queueScrollbarCss() {
  return `
    .custom-scrollbar::-webkit-scrollbar { width: 5px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--muted-foreground) / 0.15); border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground) / 0.3); }
  `
}
