"use client"

import type {
  Allergy,
  ActiveMedication,
  FamilyHistoryItem,
  LifestyleFlag,
  ExistingCondition,
  PatientDemographics,
} from "./consultation.types"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  ActivityIcon,
  AlertTriangleIcon,
  ChevronRightIcon,
  HeartIcon,
  MinusIcon,
  PillIcon,
  PlusIcon,
  ShieldAlertIcon,
  UsersIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const PANEL_CARD = "rounded-2xl border border-[#E8E6E0]/60 bg-white p-4 shadow-sm"
const SECTION_TITLE = "flex items-center gap-2 text-[14px] font-bold text-[#1A1F1E]"
const ITEM_CARD = "rounded-xl border border-[#E8E6E0]/60 bg-[#F9F8F5]/40 p-3"

function SectionHeader({ icon: Icon, title, count }: { icon: React.ElementType; title: string; count?: number }) {
  return (
    <div className={SECTION_TITLE}>
      <Icon className="size-4 shrink-0 text-[#1A5345]" aria-hidden />
      <span>{title}</span>
      {count != null && count > 0 ? (
        <Badge
          variant="default"
          className="rounded-lg border-0 bg-[#1A5345] px-2 py-0.5 text-[10px] font-bold text-white shadow-none hover:bg-[#1A5345]"
        >
          {count}
        </Badge>
      ) : null}
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
  const avatar = (
    <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#E8E6E0]/60 bg-white shadow-sm">
      <Image
        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.replace(/\s+/g, ""))}`}
        alt=""
        width={44}
        height={44}
        unoptimized
        className="size-full object-cover"
      />
    </div>
  )

  const body = (
    <>
      {avatar}
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate font-serif text-[16px] font-bold text-[#1A1F1E]">{name}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12px] font-medium text-muted-foreground">
          <span>{age} years old</span>
          <span className="text-[#E8E6E0]">·</span>
          <span className="capitalize">{gender}</span>
          <span className="text-[#E8E6E0]">·</span>
          <Badge
            variant="default"
            className="rounded-lg border-0 bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-none hover:bg-rose-500"
          >
            {bloodType}
          </Badge>
        </p>
      </div>
    </>
  )

  if (profileHref) {
    return (
      <Link
        href={profileHref}
        className="flex items-center gap-3 rounded-xl outline-none transition-colors hover:bg-[#F9F8F5]/60 focus-visible:ring-2 focus-visible:ring-[#1A5345]/35"
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
    <section className={cn(PANEL_CARD, "space-y-3")}>
      <SectionHeader icon={ShieldAlertIcon} title="Allergies" count={allergies.length} />
      <div className="space-y-2">
        {allergies.map((a) => (
          <div key={a.id} className="space-y-2 rounded-xl border border-rose-100 bg-rose-50/60 p-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge className="rounded-lg border-0 bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm hover:bg-rose-600">
                {a.allergen}
              </Badge>
              <span className="text-[11px] font-medium text-rose-600/80">({a.category})</span>
            </div>
            <div className="flex items-start gap-1.5">
              <AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0 text-rose-500" aria-hidden />
              <p className="text-[12px] leading-relaxed text-rose-700">{a.reaction}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function MedicationsList({ medications }: { medications: ActiveMedication[] }) {
  if (medications.length === 0) return null
  return (
    <section className={cn(PANEL_CARD, "space-y-3")}>
      <SectionHeader icon={PillIcon} title="Active medications" count={medications.length} />
      <div className="space-y-2">
        {medications.map((m) => (
          <div key={m.id} className={ITEM_CARD}>
            <p className="text-[13px] font-bold text-[#1A1F1E]">{m.name}</p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              {m.dose} · {m.frequency}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

function ConditionsList({ conditions }: { conditions: ExistingCondition[] }) {
  if (conditions.length === 0) return null
  return (
    <section className={cn(PANEL_CARD, "space-y-3")}>
      <SectionHeader icon={HeartIcon} title="Existing conditions" count={conditions.length} />
      <div className="space-y-2">
        {conditions.map((c) => (
          <div key={c.id} className={ITEM_CARD}>
            <p className="text-[13px] font-bold text-[#1A1F1E]">{c.name}</p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">{c.details}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function FamilyHistoryList({ items }: { items: FamilyHistoryItem[] }) {
  if (items.length === 0) return null
  return (
    <section className={cn(PANEL_CARD, "space-y-3")}>
      <SectionHeader icon={UsersIcon} title="Family history" count={items.length} />
      <div className="space-y-2">
        {items.map((fh) => (
          <div key={fh.id} className={ITEM_CARD}>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="default"
                className="rounded-lg border-0 bg-[#1A5345] px-2 py-0.5 text-[10px] font-bold text-white shadow-none hover:bg-[#1A5345]"
              >
                {fh.relationship}
              </Badge>
              <span className="text-[13px] font-bold text-[#1A1F1E]">{fh.condition}</span>
            </div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">{fh.details}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function LifestyleFlagsList({ flags }: { flags: LifestyleFlag[] }) {
  if (flags.length === 0) return null

  const riskBadge: Record<LifestyleFlag["riskLevel"], string> = {
    low: "bg-emerald-500 hover:bg-emerald-500",
    moderate: "bg-amber-500 hover:bg-amber-500",
    high: "bg-rose-500 hover:bg-rose-500",
  }

  return (
    <section className={cn(PANEL_CARD, "space-y-3")}>
      <SectionHeader icon={ActivityIcon} title="Lifestyle risk factors" count={flags.length} />
      <div className="space-y-2">
        {flags.map((f) => (
          <div key={f.label} className={cn(ITEM_CARD, "flex items-center justify-between gap-2")}>
            <div className="flex min-w-0 items-center gap-2">
              <Badge
                variant="default"
                className={cn("rounded-lg border-0 px-2 py-0.5 text-[10px] font-bold text-white shadow-none", riskBadge[f.riskLevel])}
              >
                {f.riskLevel}
              </Badge>
              <span className="truncate text-[13px] font-bold text-[#1A1F1E]">{f.label}</span>
            </div>
            <span className="shrink-0 text-[12px] font-medium text-muted-foreground">{f.value}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

const panelControlClass =
  "flex size-7 items-center justify-center rounded-lg border border-[#E8E6E0]/60 bg-white text-[#1A5345] shadow-sm transition-colors hover:bg-[#F9F8F5]"

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
      <div className="flex w-11 shrink-0 flex-col items-center border-r border-[#E8E6E0]/60 bg-[#F9F8F5] py-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="size-8 border border-[#E8E6E0]/60 bg-white text-[#1A5345] shadow-sm hover:bg-[#F9F8F5]"
          aria-label="Expand patient summary"
        >
          <ChevronRightIcon className="size-4" />
        </Button>
      </div>
    )
  }

  return (
    <div
      className="flex shrink-0 flex-col border-r border-[#E8E6E0]/60 bg-[#F9F8F5]"
      style={{ width: widthPx, minWidth: widthPx, maxWidth: widthPx }}
    >
      <div className="flex items-center justify-between gap-2 border-b border-[#E8E6E0]/60 bg-white px-4 py-3">
        <p className="min-w-0 truncate font-serif text-[14px] font-bold text-[#1A1F1E]">Patient summary</p>
        <div className="flex shrink-0 items-center gap-1">
          {onNudgeWidth ? (
            <>
              <button
                type="button"
                onClick={() => onNudgeWidth(-20)}
                className={panelControlClass}
                aria-label="Narrow patient panel"
              >
                <MinusIcon className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onNudgeWidth(20)}
                className={panelControlClass}
                aria-label="Widen patient panel"
              >
                <PlusIcon className="size-3.5" />
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={onToggle}
            className={panelControlClass}
            aria-label="Collapse patient summary"
          >
            <ChevronRightIcon className="size-4 rotate-180" />
          </button>
        </div>
      </div>

      <div className="scrollbar-hide flex-1 space-y-3 overflow-y-auto p-4">
        <div className={PANEL_CARD}>
          <PatientHeader
            name={demographics.fullName}
            age={demographics.age}
            gender={demographics.gender}
            bloodType={demographics.bloodType}
            profileHref={patientProfileHref}
          />
        </div>

        <AllergiesList allergies={allergies} />
        <ConditionsList conditions={existingConditions} />
        <MedicationsList medications={activeMedications} />
        <FamilyHistoryList items={familyHistory} />
        <LifestyleFlagsList flags={lifestyleFlags} />
      </div>
    </div>
  )
}
