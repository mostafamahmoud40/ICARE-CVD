import type { VisitType } from "./appointments.types"
import { cn } from "@/lib/utils"
import { StepHeading, LucideIcon, appointmentsBookingCardClassName } from "./shared"

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
    <div className={cn(appointmentsBookingCardClassName, className)}>
      <StepHeading step={1} title="Select visit type" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {OPTIONS.map((opt) => {
          const active = selected === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={cn(
                "rounded-xl border-2 p-4 text-left transition-colors sm:p-5",
                active
                  ? "border-[#1A5345] bg-[#E8F0EE]/80"
                  : "border-[#E8E6E0]/80 bg-white hover:border-[#1A5345]/40",
              )}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <LucideIcon
                  name={opt.icon}
                  className={cn(
                    "size-5 shrink-0",
                    active ? "text-[#1A5345]" : "text-muted-foreground",
                  )}
                />
                <div
                  className={cn(
                    "flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    active ? "border-[#1A5345] bg-[#1A5345]" : "border-[#E8E6E0] bg-transparent",
                  )}
                >
                  {active && <div className="size-1.5 rounded-full bg-white" />}
                </div>
              </div>
              <p className="m-0 mb-1 text-[14px] font-bold text-[#1A1F1E]">{opt.label}</p>
              <p className="m-0 text-[13px] font-medium text-muted-foreground">{opt.description}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
