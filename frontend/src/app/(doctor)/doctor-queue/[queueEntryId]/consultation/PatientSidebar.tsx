"use client"

import type { Allergy, ActiveMedication, FamilyHistoryItem, LifestyleFlag, ExistingCondition, PatientDemographics } from "./consultation.types"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  AlertTriangleIcon,
  ActivityIcon,
  ChevronRightIcon,
  MinusIcon,
  PlusIcon,
  HeartIcon,
  PillIcon,
  ShieldAlertIcon,
  UserRoundIcon,
  UsersIcon,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"

function SectionTitle({ icon: Icon, title, className }: { icon: React.ElementType; title: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Icon className="size-3.5 text-[#1A5345]" />
      <span className="text-[13.5px] font-bold text-[#1A5345]">{title}</span>
    </div>
  )
}

function PatientHeader({
  name,
  age,
  gender,
  bloodType,
  profileHref,
}: {
  name: string
  age: number
  gender: string
  bloodType: string
  profileHref?: string
}) {
  const body = (
    <>
      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#E8F0EE]">
        <UserRoundIcon className="size-5 text-[#1A5345]" />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate font-serif text-[16px] font-bold text-[#102F27]">{name}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-muted-foreground">
          <span>{age} yrs</span>
          <span className="text-[#E8E6E0]">|</span>
          <span className="capitalize">{gender}</span>
          <span className="text-[#E8E6E0]">|</span>
          <span className="rounded-full bg-red-50 px-1.5 py-0.5 font-semibold text-red-600">{bloodType}</span>
        </div>
      </div>
    </>
  )

  if (profileHref) {
    return (
      <Link
        href={profileHref}
        className="flex items-center gap-3 rounded-lg px-1 py-0.5 outline-none transition-colors hover:bg-[#F0F4F2] focus-visible:ring-2 focus-visible:ring-[#1A5345]/35"
        aria-label={`Open full profile for ${name}`}
      >
        {body}
      </Link>
    )
  }

  return <div className="flex items-center gap-3">{body}</div>
}

function AllergiesList({ allergies }: { allergies: Allergy[] }) {
  if (allergies.length === 0) return null
  return (
    <div className="space-y-1.5">
      <SectionTitle icon={ShieldAlertIcon} title="Allergies" />
      <div className="space-y-1">
        {allergies.map((a) => (
          <div key={a.id} className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50/50 px-2 py-1.5">
            <AlertTriangleIcon className="mt-0.5 size-3 shrink-0 text-red-500" />
            <div className="min-w-0">
              <span className="text-[13px] font-medium text-red-700">{a.allergen}</span>
              <span className="ml-1 text-[11px] text-red-500">({a.category})</span>
              <p className="text-[11px] text-red-600">{a.reaction}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MedicationsList({ medications }: { medications: ActiveMedication[] }) {
  if (medications.length === 0) return null
  return (
    <div className="space-y-1.5">
      <SectionTitle icon={PillIcon} title={`Active Medications (${medications.length})`} />
      <div className="space-y-1">
        {medications.map((m) => (
          <div key={m.id} className="rounded-lg border border-[#E5EEEA] bg-[#FBFDFC] px-2 py-1.5">
            <p className="text-[13px] font-medium text-[#102F27]">{m.name}</p>
            <p className="text-[12px] text-muted-foreground">{m.dose} &middot; {m.frequency}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ConditionsList({ conditions }: { conditions: ExistingCondition[] }) {
  if (conditions.length === 0) return null
  return (
    <div className="space-y-1.5">
      <SectionTitle icon={HeartIcon} title={`Existing Conditions (${conditions.length})`} />
      <div className="space-y-1">
        {conditions.map((c) => (
          <div key={c.id} className="rounded-lg border border-[#E5EEEA] bg-[#FBFDFC] px-2 py-1.5">
            <p className="text-[13px] font-medium text-[#102F27]">{c.name}</p>
            <p className="text-[12px] text-muted-foreground">{c.details}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function FamilyHistoryList({ items }: { items: FamilyHistoryItem[] }) {
  if (items.length === 0) return null
  return (
    <div className="space-y-1.5">
      <SectionTitle icon={UsersIcon} title="Family History" />
      <div className="space-y-1">
        {items.map((fh) => (
          <div key={fh.id} className="rounded-lg border border-[#E5EEEA] bg-[#FBFDFC] px-2 py-1.5">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#EEF5F3] px-1.5 py-0.5 text-[11px] font-semibold text-[#2C6A5B]">{fh.relationship}</span>
              <span className="text-[13px] font-semibold text-[#102F27]">{fh.condition}</span>
            </div>
            <p className="mt-0.5 text-[12px] text-muted-foreground">{fh.details}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function LifestyleFlagsList({ flags }: { flags: LifestyleFlag[] }) {
  const riskStyles: Record<LifestyleFlag["riskLevel"], string> = {
    low: "bg-emerald-50 text-emerald-700 border-emerald-100",
    moderate: "bg-amber-50 text-amber-700 border-amber-100",
    high: "bg-red-50 text-red-700 border-red-100",
  }
  const riskDots: Record<LifestyleFlag["riskLevel"], string> = {
    low: "bg-emerald-400",
    moderate: "bg-amber-400",
    high: "bg-red-400",
  }

  return (
    <div className="space-y-1.5">
      <SectionTitle icon={ActivityIcon} title="Lifestyle Risk Factors" />
      <div className="space-y-1">
        {flags.map((f) => (
          <div key={f.label} className={cn("flex items-center justify-between rounded-lg border px-2 py-1.5", riskStyles[f.riskLevel])}>
            <div className="flex items-center gap-1.5">
              <span className={cn("size-1.5 rounded-full", riskDots[f.riskLevel])} />
              <span className="text-[13px] font-semibold">{f.label}</span>
            </div>
            <span className="text-[12px] opacity-80">{f.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export type PatientSidebarProps = {
  demographics: PatientDemographics
  allergies: Allergy[]
  activeMedications: ActiveMedication[]
  familyHistory: FamilyHistoryItem[]
  lifestyleFlags: LifestyleFlag[]
  existingConditions: ExistingCondition[]
  /** When set, the patient header row navigates to the doctor patient profile */
  patientProfileHref?: string
  collapsed: boolean
  onToggle: () => void
  widthPx: number
  onNudgeWidth?: (delta: number) => void
}

export function PatientSidebar({
  demographics,
  allergies,
  activeMedications,
  familyHistory,
  lifestyleFlags,
  existingConditions,
  patientProfileHref,
  collapsed,
  onToggle,
  widthPx,
  onNudgeWidth,
}: PatientSidebarProps) {
  if (collapsed) {
    return (
      <div className="flex w-11 shrink-0 flex-col items-center border-r border-white/20 bg-transparent py-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex size-7 items-center justify-center rounded-md border border-[#E8E6E0] text-[#1A5345] transition-colors hover:bg-[#E8F0EE]"
          aria-label="Expand patient summary"
        >
          <ChevronRightIcon className="size-4" />
        </button>
      </div>
    )
  }

  return (
    <div
      className="flex shrink-0 flex-col border-r border-white/20 bg-transparent"
      style={{ width: widthPx, minWidth: widthPx, maxWidth: widthPx }}
    >
      <div className="flex items-center justify-between gap-1 border-b border-white/10 bg-transparent px-2 py-2 backdrop-blur-sm sm:px-4 sm:py-3">
        <p className="min-w-0 truncate text-[12.5px] font-bold uppercase tracking-wider text-[#6B7870]">Patient Summary</p>
        <div className="flex shrink-0 items-center gap-0.5">
          {onNudgeWidth ? (
            <>
              <button
                type="button"
                onClick={() => onNudgeWidth(-20)}
                className="flex size-7 items-center justify-center rounded-md border border-[#E8E6E0] text-[#1A5345] transition-colors hover:bg-[#E8F0EE]"
                aria-label="Narrow patient panel"
              >
                <MinusIcon className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onNudgeWidth(20)}
                className="flex size-7 items-center justify-center rounded-md border border-[#E8E6E0] text-[#1A5345] transition-colors hover:bg-[#E8F0EE]"
                aria-label="Widen patient panel"
              >
                <PlusIcon className="size-3.5" />
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={onToggle}
            className="flex size-7 items-center justify-center rounded-md border border-[#E8E6E0] text-[#1A5345] transition-colors hover:bg-[#E8F0EE]"
            aria-label="Collapse patient summary"
          >
            <ChevronRightIcon className="size-4 rotate-180" />
          </button>
        </div>
      </div>

      <div className="scrollbar-hide flex-1 space-y-4 overflow-y-auto p-4">
        <PatientHeader
          name={demographics.fullName}
          age={demographics.age}
          gender={demographics.gender}
          bloodType={demographics.bloodType}
          profileHref={patientProfileHref}
        />

        <Separator className="bg-white/20" />

        <AllergiesList allergies={allergies} />

        <Separator className="bg-white/20" />

        <ConditionsList conditions={existingConditions} />

        <Separator className="bg-white/20" />

        <MedicationsList medications={activeMedications} />

        <Separator className="bg-white/20" />

        <FamilyHistoryList items={familyHistory} />

        <Separator className="bg-white/20" />

        <LifestyleFlagsList flags={lifestyleFlags} />
      </div>
    </div>
  )
}
