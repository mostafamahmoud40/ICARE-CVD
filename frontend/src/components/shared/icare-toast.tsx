"use client"

import type { LucideIcon } from "lucide-react"
import { CircleCheckIcon, InfoIcon, OctagonXIcon } from "lucide-react"
import type { ReactNode } from "react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"

const CARD_CLASS =
  "flex w-[min(460px,calc(100vw-2rem))] max-w-[460px] items-start gap-3.5 rounded-2xl border border-[#E8E6E0]/80 bg-white px-5 py-4 shadow-[0_12px_40px_-8px_rgba(26,83,69,0.12)] ring-1 ring-[#1A5345]/5"

const ICON_WRAP_BASE =
  "flex size-10 shrink-0 items-center justify-center rounded-full ring-4 mt-0.5"

const ICON_WRAP_DEFAULT = cn(ICON_WRAP_BASE, "bg-[#1A5345]/10 text-[#1A5345] ring-[#1A5345]/5")

const ICON_WRAP_SUCCESS = ICON_WRAP_DEFAULT

const ICON_WRAP_ERROR = cn(ICON_WRAP_BASE, "bg-red-50 text-red-600 ring-red-500/10")

export type IcareToastVariant = "default" | "success" | "destructive"

export type ShowIcareToastParams = {
  title: string
  description?: ReactNode
  icon?: LucideIcon
  iconWrapClassName?: string
  duration?: number
  /** Controls default icon + icon ring when `icon` / `iconWrapClassName` are not set. */
  variant?: IcareToastVariant
}

function resolveIcon(variant: IcareToastVariant, icon?: LucideIcon): LucideIcon {
  if (icon) return icon
  if (variant === "destructive") return OctagonXIcon
  if (variant === "success") return CircleCheckIcon
  return InfoIcon
}

function resolveIconWrap(variant: IcareToastVariant, iconWrapClassName?: string): string {
  if (iconWrapClassName) return cn(ICON_WRAP_BASE, iconWrapClassName)
  if (variant === "destructive") return ICON_WRAP_ERROR
  if (variant === "success") return ICON_WRAP_SUCCESS
  return ICON_WRAP_DEFAULT
}

/**
 * Sonner toast styled like the assistant “Visit Scheduled” card (white panel, green accent ring).
 * Use across assistant routes instead of `toast.success` / `toast.error` for a consistent look.
 */
export function showIcareToast({
  title,
  description,
  icon,
  iconWrapClassName,
  duration = 5000,
  variant = "default",
}: ShowIcareToastParams) {
  const Icon = resolveIcon(variant, icon)
  const wrapClass = resolveIconWrap(variant, iconWrapClassName)

  toast.custom(
    () => (
      <div className={CARD_CLASS}>
        <div className={wrapClass}>
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

export function showIcareSuccessToast(
  title: string,
  description?: ReactNode,
  options?: { duration?: number }
) {
  showIcareToast({ title, description, variant: "success", duration: options?.duration })
}

export function showIcareErrorToast(
  title: string,
  description?: ReactNode,
  options?: { duration?: number }
) {
  showIcareToast({ title, description, variant: "destructive", duration: options?.duration })
}
