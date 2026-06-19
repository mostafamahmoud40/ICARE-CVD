"use client"

import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { toast, type ExternalToast } from "sonner"

export type IcareToastVariant = "default" | "success" | "destructive"

export type ShowIcareToastParams = {
  title: string
  description?: ReactNode
  icon?: LucideIcon
  /** @deprecated Icon ring is always the canonical green badge from `Toaster`. */
  iconWrapClassName?: string
  duration?: number
  variant?: IcareToastVariant
}

function buildToastOptions({
  description,
  icon,
  duration,
}: Pick<ShowIcareToastParams, "description" | "icon" | "duration">): ExternalToast {
  const options: ExternalToast = { duration }

  if (description != null && description !== "") {
    options.description = description
  }

  if (icon) {
    const Icon = icon
    options.icon = <Icon className="size-[18px]" strokeWidth={2.5} aria-hidden />
  }

  return options
}

/**
 * Styled via the global `Toaster` (`toast.success` / `toast.error` / `toast.info`).
 * See `frontend/AGENTS.md` → Toast notifications (canonical).
 */
export function showIcareToast({
  title,
  description,
  icon,
  duration = 5000,
  variant = "default",
}: ShowIcareToastParams) {
  const options = buildToastOptions({ description, icon, duration })

  if (variant === "success") {
    toast.success(title, options)
    return
  }

  if (variant === "destructive") {
    toast.error(title, options)
    return
  }

  toast.info(title, options)
}

export function showIcareSuccessToast(
  title: string,
  description?: ReactNode,
  options?: { duration?: number },
) {
  showIcareToast({ title, description, variant: "success", duration: options?.duration })
}

export function showIcareErrorToast(
  title: string,
  description?: ReactNode,
  options?: { duration?: number },
) {
  showIcareToast({ title, description, variant: "destructive", duration: options?.duration })
}
