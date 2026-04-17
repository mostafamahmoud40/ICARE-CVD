"use client"

import Link from "next/link"
import { ArrowUpRight, Calendar, CheckCircle2, Clock, Stethoscope, UserRound } from "lucide-react"
import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import type { VisitSummary, ConsultationStats } from "./consultations.types"
import { ConsultationStats as StatsComponent } from "./ConsultationStats"

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    bg: "bg-[#E8F0ED]",
    text: "text-[#1a5345]",
    border: "border-[#C8D9D3]",
    dot: "bg-[#1a5345]",
    ring: "ring-[#C8D9D3]",
  },
  scheduled: {
    icon: Clock,
    bg: "bg-[#E0EFF2]",
    text: "text-[#2d8a9e]",
    border: "border-[#C8E0E6]",
    dot: "bg-[#2d8a9e]",
    ring: "ring-[#C8E0E6]",
  },
  cancelled: {
    icon: Clock,
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-200",
    dot: "bg-red-500",
    ring: "ring-red-200",
  },
  "in-progress": {
    icon: Clock,
    bg: "bg-[#F6EFE4]",
    text: "text-[#9A6B2F]",
    border: "border-[#E5D4B0]",
    dot: "bg-[#E89042]",
    ring: "ring-[#E5D4B0]",
  },
}

const tagStyles = {
  urgency: "bg-[#F5E8E5] text-[#c45d4b] border-[#E8D4CE]",
  stable: "bg-[#E0EFF2] text-[#2d8a9e] border-[#C8E0E6]",
  improving: "bg-[#E8F0ED] text-[#1a5345] border-[#C8D9D3]",
  critical: "bg-red-100 text-red-700 border-red-300",
}

type ConsultationsListProps = {
  visits: VisitSummary[]
  stats: ConsultationStats
}

function VisitCard({ visit }: { visit: VisitSummary }) {
  const status = statusConfig[visit.status]
  const StatusIcon = status.icon

  return (
    <Link href={`/consultations/${visit.id}`}>
      <Card className="group overflow-hidden border-[#E7EFEB] transition-all hover:border-[#1a5345]/30 hover:shadow-sm">
        <CardContent className="p-0">
          <div className="flex items-stretch">
            {/* Status Indicator Bar */}
            <div className={cn("w-1.5 shrink-0", status.dot)} />

            {/* Main Content */}
            <div className="flex flex-1 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
              {/* Date Section */}
              <div className="flex items-center gap-2 sm:w-32 sm:flex-col sm:items-start sm:gap-1">
                <div className="flex items-center gap-1.5 text-[#6B7870] sm:hidden">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="text-xs">Date</span>
                </div>
                <p className="font-semibold text-[#1A1F1E]">{visit.date}</p>
              </div>

              {/* Doctor Section */}
              <div className="flex items-center gap-3 sm:w-44">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8F0ED] text-[#1a5345] ring-1 ring-[#C8D9D3]">
                  <UserRound className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-[#1A1F1E]">{visit.doctor.name}</p>
                  <p className="text-sm text-[#6B7870]">{visit.doctor.specialty}</p>
                </div>
              </div>

              {/* Diagnosis Tags */}
              <div className="flex flex-wrap gap-1.5 sm:flex-1">
                {visit.diagnosis.tags.map((tag, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className={cn("text-xs font-medium", tagStyles[tag.variant])}
                  >
                    {tag.label}
                  </Badge>
                ))}
              </div>

              {/* Status Badge */}
              <div className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium sm:w-28 sm:shrink-0 sm:justify-center",
                status.bg,
                status.text,
                status.border
              )}>
                <StatusIcon className="h-3.5 w-3.5" />
                <span className="capitalize">{visit.status}</span>
              </div>

              {/* Arrow */}
              <div className="hidden w-6 shrink-0 text-[#6B7870] transition-colors group-hover:text-[#1a5345] sm:flex sm:justify-center">
                <ArrowUpRight className="h-5 w-5" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export function ConsultationsList({ visits, stats }: ConsultationsListProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="space-y-6">
      {/* Stats */}
      <StatsComponent stats={stats} />

      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8F0ED] text-[#1a5345] ring-1 ring-[#C8D9D3]">
            <Stethoscope className="h-4 w-4" />
          </div>
          <h2 className="text-lg font-semibold text-[#1A1F1E]">Consultation History</h2>
        </div>
        <p className="text-sm text-[#6B7870]">
          {visits.length} visits total
        </p>
      </div>

      {/* Table Header - Only render after mount to avoid hydration mismatch */}
      {mounted && (
        <div className="hidden sm:flex items-center gap-4 border-b border-[#E8E6E0] bg-[#F9F8F5] px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#6B7870]">
          <div className="w-32 shrink-0">Date</div>
          <div className="w-44 shrink-0">Doctor</div>
          <div className="flex-1 min-w-0">Diagnosis</div>
          <div className="w-28 shrink-0 text-center">Status</div>
          <div className="w-6 shrink-0"></div>
        </div>
      )}

      {/* Consultations Cards */}
      <div className={cn("grid gap-3", mounted && "-mt-2 sm:mt-0")}>
        {visits.map((visit) => (
          <VisitCard key={visit.id} visit={visit} />
        ))}
      </div>
    </div>
  )
}
