import type { DoctorInfo } from "./appointments.types"
import { cn } from "@/lib/utils"
import { LucideIcon } from "./shared"
import { VerifiedIcon, StarIcon, PersonStandingIcon } from "lucide-react"

type SpecialtyProps = {
  icon: string
  label: string
  color: "primary" | "secondary"
}

function SpecialtyBadge({ icon, label, color }: SpecialtyProps) {
  const isPrimary = color === "primary"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium",
        isPrimary
          ? "border-[#A8C4BC] bg-[#E8F0EE] text-[#00392D]"
          : "border-[#DDD0B8] bg-[#F5EFE4] text-[#C5A97B]",
      )}
    >
      <LucideIcon name={icon} className="size-3.5" />
      {label}
    </span>
  )
}

type DoctorCardProps = {
  name: string
  title: string
  experience: string
  rating: number
  specialties: SpecialtyProps[]
  className?: string
}

export function DoctorCard({
  name,
  title,
  experience,
  rating,
  specialties,
  className,
}: DoctorCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#E8E6E0] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)]",
        className,
      )}
    >
      <div className="flex items-start gap-5">
        <div className="relative shrink-0">
          <div className="flex size-20 items-center justify-center rounded-xl border border-[#E8E6E0] bg-gradient-to-br from-sky-100 to-violet-200">
            <PersonStandingIcon className="size-10 text-slate-400" />
          </div>
          <div className="absolute -right-1.5 -bottom-1.5 rounded-full bg-white p-0.5 shadow-sm">
            <VerifiedIcon className="size-[18px] text-[#C5A97B]" />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-[#1A1F1E]">{name}</h2>
              <p className="mt-0.5 text-[13px] font-medium text-[#6B7870]">
                {title} &bull; {experience}
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-md border border-yellow-200 bg-yellow-50 px-2 py-1">
              <StarIcon className="size-4 fill-yellow-400 text-yellow-400" />
              <span className="text-[13px] font-bold text-yellow-700">{rating}</span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {specialties.map((s) => (
              <SpecialtyBadge key={s.label} {...s} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
