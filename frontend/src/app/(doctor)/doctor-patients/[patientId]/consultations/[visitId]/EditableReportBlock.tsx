"use client"

import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type EditableReportBlockProps = {
  value: string
  editing: boolean
  onChange: (value: string) => void
  emptyClassName?: string
  rows?: number
  className?: string
}

export function EditableReportBlock({
  value,
  editing,
  onChange,
  emptyClassName,
  rows = 5,
  className,
}: EditableReportBlockProps) {
  if (editing) {
    return (
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className={cn(
          "min-h-[120px] resize-y rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[13px] font-medium leading-relaxed md:text-[14px]",
          className,
        )}
      />
    )
  }

  return (
    <p
      className={cn(
        "whitespace-pre-wrap text-[13px] font-medium leading-relaxed md:text-[14px]",
        className,
        emptyClassName,
      )}
    >
      {value}
    </p>
  )
}
