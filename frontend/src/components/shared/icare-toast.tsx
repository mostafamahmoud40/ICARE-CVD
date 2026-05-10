"use client"

import type { LucideIcon } from "lucide-react"
import { InfoIcon } from "lucide-react"
import type { ReactNode } from "react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"

const CARD_CLASS =
  "flex w-[min(460px,calc(100vw-2rem))] max-w-[460px] items-start gap-3.5 rounded-2xl border border-[#E8E6E0]/80 bg-white px-5 py-4 shadow-[0_12px_40px_-8px_rgba(26,83,69,0.12)] ring-1 ring-[#1A5345]/5"

const ICON_WRAP_CLASS =
  "flex size-10 shrink-0 items-center justify-center rounded-full bg-[#1A5345]/10 text-[#1A5345] ring-4 ring-[#1A5345]/5 mt-0.5"

export type ShowIcareToastParams = {
  title: string
  description?: ReactNode
  icon?: LucideIcon
  iconWrapClassName?: string
  duration?: number
}

/**
 * Sonner toast styled like the assistant “Visit Scheduled” card (white panel, green accent ring).
 */
export function showIcareToast({
  title,
  description,
  icon: Icon = InfoIcon,
  iconWrapClassName,
  duration = 5000,
}: ShowIcareToastParams) {
  toast.custom(
    () => (
      <div className={CARD_CLASS}>
        <div className={cn(ICON_WRAP_CLASS, iconWrapClassName)}>
          <Icon className="size-[18px]" strokeWidth={2.5} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-[14.5px] font-bold tracking-tight text-[#1A1F1E]">{title}</span>
          {description != null && description !== "" ? (
            <div className="text-[13px] font-medium leading-[1.6] text-muted-foreground">{description}</div>
          ) : null}
        </div>
      </div>
    ),
    { duration }
  )
}
