"use client"

import { ArrowRightIcon, BrainCircuitIcon, SparklesIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

export type AiAnalysisItem = {
  id: string
  title: string
  description: string
  /** When set, the insight needs a follow-up action (e.g. send to doctor). */
  action?: { label: string }
}

export type VitalsAiAnalysisSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  updatedText?: string
  items: AiAnalysisItem[]
}

export function VitalsAiAnalysisSheet({
  open,
  onOpenChange,
  title = "AI vitals analysis",
  updatedText = "Updated just now",
  items,
}: VitalsAiAnalysisSheetProps) {
  const actionCount = items.filter((i) => i.action).length

  const handleAction = (item: AiAnalysisItem) => {
    toast.message(item.action!.label, {
      description: "Preview — this will connect to your care team when the API is ready.",
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton
        className="flex h-full w-full flex-col gap-0 border-l border-[#E8E6E0]/60 bg-[#F9F8F5] p-0 shadow-2xl sm:max-w-md"
      >
        <SheetHeader className="shrink-0 space-y-0 border-b border-[#E8E6E0]/60 bg-white px-5 py-4 pr-12 text-left sm:px-6">
          <div className="flex items-start gap-3">
            <BrainCircuitIcon className="mt-0.5 size-5 shrink-0 text-[#1A5345]" aria-hidden />
            <div className="min-w-0 flex-1 space-y-1">
              <SheetTitle className="font-serif text-[18px] font-bold text-[#1A1F1E]">
                {title}
              </SheetTitle>
              <SheetDescription className="text-[13px] font-medium text-[#6B7870]">
                Insights from your readings. Some items suggest an action; others are for your
                awareness only.
              </SheetDescription>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="rounded-lg border border-[#E8E6E0] bg-[#F9F8F5] px-2 py-0.5 text-[10px] font-bold text-[#6B7870]">
                  {updatedText}
                </span>
                {actionCount > 0 ? (
                  <span className="rounded-lg bg-[#CC5533] px-2 py-0.5 text-[10px] font-bold text-white">
                    {actionCount} suggested action{actionCount === 1 ? "" : "s"}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <ul className="space-y-3 p-5 sm:p-6">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border border-[#E8E6E0]/60 bg-white p-4 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[14px] font-bold text-[#1A1F1E]">{item.title}</p>
                      {!item.action ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#E8F0EE] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#1A5345]">
                          <SparklesIcon className="size-2.5" aria-hidden />
                          Insight
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[13px] font-medium leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
                {item.action ? (
                  <div className="mt-3 flex justify-end border-t border-[#E8E6E0]/40 pt-3">
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 rounded-lg border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white hover:bg-[#133F34]"
                      onClick={() => handleAction(item)}
                    >
                      {item.action.label}
                      <ArrowRightIcon className="ml-1.5 size-3.5" aria-hidden />
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export const VITALS_AI_ANALYSIS_ITEMS: AiAnalysisItem[] = [
  {
    id: "bp-trend",
    title: "Positive trend in blood pressure",
    description:
      "The gradual reduction aligns with the effect of Lisinopril prescribed by your doctor.",
  },
  {
    id: "weight",
    title: "Weight loss faster than target",
    description:
      "Losing 4.5 kg in one month may relate to medication. You may want your doctor to review this.",
    action: { label: "Review & send to doctor" },
  },
  {
    id: "missed",
    title: "Missed measurement",
    description:
      "Blood pressure log scheduled for April 12 was not recorded. Add it when you can.",
    action: { label: "Add missing reading" },
  },
  {
    id: "compare",
    title: "Compared to similar patients",
    description:
      "Your readings are better than 73% of patients your age at the same treatment stage.",
  },
]
