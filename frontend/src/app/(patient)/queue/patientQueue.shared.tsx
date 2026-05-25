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
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E8E6E0]/60 bg-[#F4F3EF] ring-2 ring-[#E8E6E0]/80",
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

export const queuePanelCardClassName =
  "overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] ring-0"

export const queuePanelHeaderClassName =
  "border-b border-[#E8E6E0]/60 bg-[#F9F8F5] px-5 py-4 sm:px-6 sm:py-5"

export const queuePanelBodyClassName = "p-5 sm:p-6 lg:p-7"

export const queueStatTileClassName =
  "flex items-center gap-3 rounded-xl border border-[#E8E6E0]/60 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"

export const queueInstructionTileClassName =
  "flex items-start gap-4 rounded-xl border border-[#E8E6E0] bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"

export const queuePrimaryButtonClassName =
  "h-8 w-full items-center justify-center gap-1.5 rounded-lg border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-[0_2px_10px_rgba(26,83,69,0.2)] transition-all hover:bg-[#133F34] hover:shadow-[0_4px_14px_rgba(26,83,69,0.25)]"

export const queueOutlineButtonClassName =
  "h-8 w-full items-center justify-center gap-1.5 rounded-lg border-[#E8E6E0] bg-white px-4 text-[12px] font-bold text-[#1A1F1E] shadow-sm transition-all hover:border-[#1A5345]/30 hover:bg-slate-50 hover:text-[#1A5345] hover:shadow-md"

export const queueSelectTriggerClassName =
  "h-9 rounded-lg border-[#E8E6E0] bg-white text-[12px] font-medium text-[#1A1F1E] shadow-sm"

export function QueuePanel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <div className={cn(queuePanelCardClassName, className)}>
      <div className={queuePanelHeaderClassName}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-serif text-[15px] font-bold leading-tight text-[#1A1F1E] sm:text-[16px]">
              {title}
            </h3>
            {description ? (
              <p className="mt-1 text-[12px] font-medium text-muted-foreground sm:text-[13px]">{description}</p>
            ) : null}
          </div>
          {action}
        </div>
      </div>
      <div className={cn(queuePanelBodyClassName, bodyClassName)}>{children}</div>
    </div>
  )
}

export function QueueStatCell({
  icon: Icon,
  value,
  label,
  hint,
  iconColor = "text-[#1A5345]",
  highlight,
  className,
}: {
  icon: ElementType
  value: string
  label: string
  hint?: string | null
  iconColor?: string
  highlight?: boolean
  className?: string
}) {
  return (
    <div className={cn(queueStatTileClassName, className)}>
      <Icon className={cn("size-5 shrink-0", iconColor)} strokeWidth={2} aria-hidden />
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "text-[18px] font-bold leading-none tabular-nums",
            highlight ? "text-[#1A5345]" : "text-[#1A1F1E]",
          )}
        >
          {value}
        </div>
        <p className="mt-1 truncate text-[11px] font-bold text-[#6B7870]">{label}</p>
        {hint ? (
          <p className="mt-0.5 truncate text-[11px] font-medium text-muted-foreground">{hint}</p>
        ) : null}
      </div>
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
