import type { VisitType } from "./appointments.types"
import { cn } from "@/lib/utils"
import { StepHeading, LucideIcon } from "./shared"

type VisitTypeOption = {
  id: VisitType
  icon: string
  label: string
  description: string
}

const OPTIONS: VisitTypeOption[] = [
  { id: "clinic", icon: "building", label: "In-Clinic Visit", description: "Standard check-up at our downtown heart center." },
  { id: "virtual", icon: "video", label: "Virtual Consultation", description: "Secure HD video call for follow-ups." },
]

type VisitTypeSelectorProps = {
  selected: VisitType
  onChange: (v: VisitType) => void
  className?: string
}

export function VisitTypeSelector({ selected, onChange, className }: VisitTypeSelectorProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#E8E6E0] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)]",
        className,
      )}
    >
      <StepHeading step={1} title="Select Visit Type" />
      <div className="grid grid-cols-2 gap-4">
        {OPTIONS.map((opt) => {
          const active = selected === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={cn(
                "rounded-xl border-2 p-5 text-left transition-all",
                active
                  ? "border-[#00392D] bg-[#E8F0EE]"
                  : "border-[#E8E6E0] bg-transparent hover:border-[#A8C4BC]",
              )}
            >
              <div className="mb-2 flex items-start justify-between">
                <div className={cn("flex rounded-lg bg-gray-100 p-2", active ? "text-[#00392D]" : "text-[#6B7870]")}>
                  <LucideIcon name={opt.icon} className="size-5" />
                </div>
                <div
                  className={cn(
                    "flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    active ? "border-[#00392D] bg-[#00392D]" : "border-gray-300 bg-transparent",
                  )}
                >
                  {active && <div className="size-1.5 rounded-full bg-white" />}
                </div>
              </div>
              <p className="m-0 mb-1 text-sm font-semibold text-[#1A1F1E]">{opt.label}</p>
              <p className="m-0 text-[13px] text-[#6B7870]">{opt.description}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
