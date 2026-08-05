"use client"

import Link from "next/link"
import { ArrowLeftIcon, DownloadIcon, EditIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { AssistantPatientHubNavKey, AssistantPatientSummary } from "./assistantPatientProfile.types"

type HubNavItem = Readonly<{
  key: AssistantPatientHubNavKey
  label: string
  href: string
}>

type AssistantPatientProfileHeaderProps = {
  patient: Pick<AssistantPatientSummary, "name" | "status" | "mrn">
  hubNavItems: readonly HubNavItem[]
  hubNavActive: (key: AssistantPatientHubNavKey) => boolean
}

export function AssistantPatientProfileHeader({
  patient,
  hubNavItems,
  hubNavActive,
}: AssistantPatientProfileHeaderProps) {
  return (
<div className="flex-none z-20 border-b border-[#E8E6E0]/60 bg-white">
  <div className="flex w-full items-center justify-between px-5 py-4 sm:px-8">
    <div className="flex items-center gap-4">
      <Link href="/assistant-patients">
        <Button variant="ghost" size="icon" className="size-8 rounded-lg text-[#6B7870] hover:bg-slate-50 hover:text-[#1A5345] border border-[#E8E6E0]/60 transition-all shadow-sm">
          <ArrowLeftIcon className="size-4" strokeWidth={2.5} />
        </Button>
      </Link>
      <div className="flex flex-col space-y-0.5">
        <div className="flex items-center gap-2.5">
          <h1 className="font-serif text-[20px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[24px]">
            {patient.name}
          </h1>
          <Badge className="rounded-lg bg-[#1A5345] px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
            {patient.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground sm:text-[14px]">
          <span>Patient Profile</span>
          <span className="text-[#E8E6E0]">&bull;</span>
          <span className="font-bold text-[#1A1F1E] tabular-nums tracking-tight">{patient.mrn}</span>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <Button variant="outline" className="h-8 gap-2 rounded-lg border border-[#E8E6E0] bg-white px-4 text-[12px] font-bold text-[#1A1F1E] shadow-sm transition-colors hover:bg-slate-50 hover:text-[#1A5345]">
        <DownloadIcon className="size-3.5 text-muted-foreground" />
        Export
      </Button>
      <Button className="h-8 gap-2 rounded-lg bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-sm transition-colors hover:bg-[#133F34] border-0">
        <EditIcon className="size-3.5" />
        Edit Profile
      </Button>
    </div>
  </div>

  <nav
    className="border-t border-[#E8E6E0]/50 px-8 pb-3 pt-2"
    aria-label="Patient record sections"
  >
    <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-0.5 [-webkit-mask-image:linear-gradient(to_right,black_calc(100%_-_12px),transparent)] [mask-image:linear-gradient(to_right,black_calc(100%_-_12px),transparent)] sm:[mask-image:none]">
      {hubNavItems.map((item) => {
        const active = hubNavActive(item.key)
        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "inline-flex shrink-0 items-center rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A5345]/35 focus-visible:ring-offset-2",
              active
                ? "bg-[#1A5345] text-white shadow-sm"
                : "border border-slate-200 bg-white text-[#1A1F1E] hover:border-[#1A5345]/25 hover:bg-slate-50"
            )}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        )
      })}
    </div>
  </nav>
</div>
  )
}
