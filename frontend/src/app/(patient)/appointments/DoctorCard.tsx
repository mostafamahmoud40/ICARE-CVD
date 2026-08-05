"use client"

import { useState } from "react"
import { VerifiedIcon } from "lucide-react"

import { cn } from "@/lib/utils"

import { LucideIcon, appointmentsBookingCardClassName } from "./shared"

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
        "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold",
        isPrimary ? "bg-[#E8F0EE] text-[#1A5345]" : "bg-[#F5EFE4] text-[#9A6B2F]",
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
  specialties: SpecialtyProps[]
  avatarUrl?: string
  className?: string
}

export function DoctorCard({
  name,
  title,
  experience,
  specialties,
  avatarUrl,
  className,
}: DoctorCardProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
  const showFallback = !avatarUrl || imageFailed

  return (
    <div className={cn(appointmentsBookingCardClassName, className)}>
      <div className="flex items-start gap-4 sm:gap-5">
        <div className="relative shrink-0">
          <div className="flex size-16 items-center justify-center overflow-hidden rounded-full border border-[#E8E6E0]/60 bg-[#F4F3EF] sm:size-[72px]">
            {showFallback ? (
              <span className="font-serif text-[18px] font-bold text-[#1A5345]">{initials}</span>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                width={72}
                height={72}
                className="size-full object-cover"
                onError={() => setImageFailed(true)}
              />
            )}
          </div>
          <VerifiedIcon
            className="absolute -right-0.5 -bottom-0.5 size-[18px] rounded-full bg-white text-[#1A5345]"
            aria-hidden
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-serif text-[18px] font-bold leading-snug text-[#1A1F1E] sm:text-[20px]">
                {name}
              </h2>
              <p className="mt-0.5 text-[13px] font-medium text-muted-foreground">{title}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#E8F0EE] px-2.5 py-1 text-[12px] font-bold text-[#1A5345]">
              {experience}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {specialties.map((s) => (
              <SpecialtyBadge key={s.label} {...s} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
