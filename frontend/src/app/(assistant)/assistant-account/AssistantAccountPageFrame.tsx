import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

type AssistantAccountPageFrameProps = {
  title: string
  description: string
  icon: LucideIcon
  children: ReactNode
}

export function AssistantAccountPageFrame({
  title,
  description,
  icon: Icon,
  children,
}: AssistantAccountPageFrameProps) {
  return (
    <div className="min-h-0 flex-1 bg-[#F9F8F5]">
      <section className="border-b border-[#E5EEEA] bg-gradient-to-b from-white to-[#FAFAF8]/90 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[#E5EEEA] bg-[#E8F0EE] shadow-sm">
              <Icon className="size-5 text-[#1A5345]" aria-hidden />
            </div>
            <div className="min-w-0 space-y-1">
              <h1 className="text-xl font-bold tracking-tight text-[#1A5345] sm:text-2xl">{title}</h1>
              <p className="max-w-xl text-[13px] font-medium leading-relaxed text-[#6B7870] sm:text-[14px]">{description}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</div>
    </div>
  )
}
