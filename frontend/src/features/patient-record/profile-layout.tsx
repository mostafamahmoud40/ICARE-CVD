import type { ElementType, ReactNode } from "react"
import Link from "next/link"
import { XIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function ProfileInfoRow({
  icon: Icon,
  label,
  value,
  valueClassName,
}: {
  icon: ElementType
  label: string
  value: string | null | undefined
  valueClassName?: string
}) {
  if (!value) return null
  return (
    <div className="flex items-center gap-2 py-1">
      <Icon className="size-3.5 shrink-0 text-muted-foreground sm:size-4" />
      <span className="text-[11px] text-muted-foreground sm:text-[12px]">{label}:</span>
      <span
        className={cn(
          "text-[12px] font-medium text-[#102F27] sm:text-[13px]",
          valueClassName,
        )}
      >
        {value}
      </span>
    </div>
  )
}

export function ProfileSection({
  title,
  icon: Icon,
  children,
  action,
}: {
  title: string
  icon: ElementType
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="group rounded-xl border border-[#E5EEEA] bg-white p-3 transition-all duration-300 hover:shadow-md sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-[#CC5533] sm:size-5" />
          <h3 className="text-[13px] font-bold text-[#102F27] transition-colors duration-300 group-hover:text-[#CC5533] sm:text-[14px]">
            {title}
          </h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

export function ProfileTagList({
  items,
  variant,
  onRemove,
}: {
  items: string[]
  variant: "red" | "blue"
  onRemove?: (idx: number) => void
}) {
  if (items.length === 0) {
    return (
      <p className="text-[11px] text-muted-foreground sm:text-[12px]">None reported</p>
    )
  }
  const s =
    variant === "red"
      ? "bg-red-500 text-white shadow-sm"
      : "bg-[#1A5345] text-white shadow-sm"
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, idx) => (
        <span
          key={item}
          className={cn(
            "group/tag flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium sm:text-[11px]",
            s,
          )}
        >
          {item}
          {onRemove ? (
            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="ml-1 hidden rounded-full hover:bg-white/20 group-hover/tag:block"
            >
              <XIcon className="size-2.5" />
            </button>
          ) : null}
        </span>
      ))}
    </div>
  )
}

export type ProfileAllergyEntry = {
  id: string
  category: "drug" | "food" | "other"
  allergen: string
  reaction?: string | null
}

const ALLERGY_CATEGORY_LABELS: Record<ProfileAllergyEntry["category"], string> = {
  drug: "Drug",
  food: "Food",
  other: "Other",
}

export function ProfileAllergyPreview({ items }: { items: ProfileAllergyEntry[] }) {
  if (items.length === 0) {
    return (
      <p className="text-[11px] text-muted-foreground sm:text-[12px]">None reported</p>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((entry) => (
        <div
          key={entry.id}
          className="rounded-lg border border-rose-100 bg-rose-50/60 px-3 py-2.5"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-lg border-0 bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-none hover:bg-rose-600">
              {entry.allergen}
            </Badge>
            <span className="text-[11px] font-medium text-rose-600/80 sm:text-[12px]">
              {ALLERGY_CATEGORY_LABELS[entry.category]}
            </span>
          </div>
          {entry.reaction ? (
            <p className="mt-1 text-[11px] leading-relaxed text-rose-700 sm:text-[12px]">
              {entry.reaction}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  )
}

export type ProfileFamilyHistoryEntry = {
  id: string
  relationship: string
  condition: string
  details?: string | null
}

export function ProfileFamilyHistoryPreview({
  items,
}: {
  items: ProfileFamilyHistoryEntry[]
}) {
  if (items.length === 0) {
    return (
      <p className="text-[11px] text-muted-foreground sm:text-[12px]">None reported</p>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((entry) => (
        <div
          key={entry.id}
          className="rounded-lg border border-[#E8E6E0]/60 bg-[#FAFAF8] px-3 py-2.5"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-lg border-0 bg-[#1A5345] px-2 py-0.5 text-[10px] font-bold text-white shadow-none hover:bg-[#1A5345]">
              {entry.relationship}
            </Badge>
            <span className="text-[12px] font-bold text-[#1A1F1E] sm:text-[13px]">
              {entry.condition}
            </span>
          </div>
          {entry.details ? (
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground sm:text-[12px]">
              {entry.details}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  )
}

export function ProfileRecordCard({
  icon: Icon,
  iconColor,
  title,
  subtitle,
  href,
}: {
  icon: ElementType
  iconColor?: string
  title: string
  subtitle: string
  count: number | string
  href: string
}) {
  return (
    <Link href={href} className="group">
      <div className="flex items-center gap-3.5 rounded-xl border border-[#E8E6E0]/60 bg-white p-3.5 transition-all duration-300 hover:shadow-md">
        <Icon
          className={cn(
            "size-5 shrink-0 transition-colors duration-300",
            iconColor || "text-[#1A5345]",
          )}
        />
        <div className="min-w-0 flex-1">
          <h4 className="text-[13px] font-bold text-[#1A1F1E] transition-colors duration-300 group-hover:text-[#1A5345]">
            {title}
          </h4>
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </Link>
  )
}
