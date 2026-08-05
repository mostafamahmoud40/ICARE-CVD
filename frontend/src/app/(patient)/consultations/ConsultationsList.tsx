"use client"

import Image from "next/image"
import Link from "next/link"
import { FileTextIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import type {
  VisitSummary,
  ConsultationStats,
  ConsultationsViewMode,
} from "./consultations.types"
import { ConsultationStats as StatsComponent } from "./ConsultationStats"
import {
  ConsultationRecordStatusBadge,
  ConsultationVisitTypeBadge,
} from "./consultations.shared"
import {
  formatConsultationTime,
  formatConsultationTimeAgo,
  groupVisitsByDate,
  sortVisitsByScheduledAtDesc,
} from "./consultations.utils"

type ConsultationsListProps = {
  visits: VisitSummary[]
  stats: ConsultationStats
  viewMode: ConsultationsViewMode
}

function ReportLinkButton({ visitId }: { visitId: string }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      asChild
      title="View report"
      aria-label="View consultation report"
      className="size-8 border-0 bg-transparent text-muted-foreground shadow-none hover:bg-transparent hover:text-[#1A5345]"
      onClick={(e) => e.stopPropagation()}
    >
      <Link href={`/consultations/${visitId}`}>
        <FileTextIcon className="size-4" strokeWidth={2.5} />
      </Link>
    </Button>
  )
}

function ConsultationsTableView({ visits }: { visits: VisitSummary[] }) {
  const sorted = sortVisitsByScheduledAtDesc(visits)

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
      <div className="overflow-x-auto">
        <table className="min-w-[960px] w-full border-collapse bg-white text-left">
          <thead className="sticky top-0 z-10 bg-[#F4F3ED]/90 shadow-[0_1px_0_0_#E8E6E0] backdrop-blur-md">
            <tr className="font-serif text-[15px] font-bold text-[#1A1F1E]">
              <th className="py-4 pl-4 pr-4">Date</th>
              <th className="px-4 py-4">Time</th>
              <th className="px-4 py-4">Doctor</th>
              <th className="px-4 py-4">Visit type</th>
              <th className="px-4 py-4">Report status</th>
              <th className="py-4 pl-4 pr-4 text-right">Report</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E6E0]/40">
            {sorted.map((visit) => {
              const date = new Date(visit.scheduledAt)
              const isToday = new Date().toDateString() === date.toDateString()

              return (
                <tr
                  key={visit.id}
                  className="group cursor-pointer border-t border-[#E8E6E0]/40 transition-colors hover:bg-[#F9F8F5]/50"
                >
                  <td className="py-4 pl-4 pr-4 align-middle">
                    <Link href={`/consultations/${visit.id}`} className="block">
                      <p
                        className={cn(
                          "text-[11px] font-bold uppercase tracking-wide",
                          isToday ? "text-emerald-600" : "text-muted-foreground",
                        )}
                      >
                        {isToday ? "Today" : date.toLocaleDateString("en-US", { month: "short" })}
                      </p>
                      <p className="text-[18px] font-bold tabular-nums leading-none text-[#1A1F1E]">
                        {date.getDate()}
                      </p>
                      <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                        {date.getFullYear()}
                      </p>
                    </Link>
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <Link href={`/consultations/${visit.id}`} className="block">
                      <p className="text-[14px] font-bold tabular-nums text-[#1A1F1E]">
                        {formatConsultationTime(visit.scheduledAt)}
                      </p>
                      <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                        {formatConsultationTimeAgo(visit.scheduledAt)}
                      </p>
                    </Link>
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <Link href={`/consultations/${visit.id}`} className="flex items-start gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E8E6E0]/60 bg-[#F4F3EF]">
                        <Image
                          src={`https://i.pravatar.cc/150?u=${encodeURIComponent(visit.doctor.name)}`}
                          alt=""
                          width={44}
                          height={44}
                          unoptimized
                          className="size-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-serif text-[15px] font-bold leading-snug text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]">
                          {visit.doctor.name}
                        </p>
                        <p className="mt-0.5 truncate text-[12px] font-medium text-muted-foreground">
                          {visit.doctor.specialty}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <Link href={`/consultations/${visit.id}`} className="block">
                      <ConsultationVisitTypeBadge visitType={visit.visitType} />
                    </Link>
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <Link href={`/consultations/${visit.id}`}>
                      <ConsultationRecordStatusBadge status={visit.recordStatus} />
                    </Link>
                  </td>
                  <td className="py-4 pl-4 pr-4 align-middle text-right">
                    <ReportLinkButton visitId={visit.id} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ConsultationsTimelineView({ visits }: { visits: VisitSummary[] }) {
  if (visits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E8E6E0] bg-white py-16 text-center">
        <p className="text-[15px] font-semibold text-[#1A1F1E]">No consultation reports yet</p>
        <p className="mt-2 max-w-sm text-[13px] font-medium text-[#6B7870]">
          After your doctor completes and signs a visit, your clinical summary will appear here.
        </p>
      </div>
    )
  }

  const dateGroups = groupVisitsByDate(visits)

  return (
    <div className="relative flex flex-col gap-10 pt-4">
      <div className="absolute left-[144px] top-12 bottom-0 hidden w-0.5 bg-gradient-to-b from-[#E8E6E0] via-[#E8E6E0] to-transparent md:block" />

      {dateGroups.map((group) => (
        <div
          key={group.dateKey}
          className="group relative flex flex-col gap-6 md:flex-row md:gap-14"
        >
          <div className="relative shrink-0 pt-1 md:w-[130px] md:text-right">
            <p className="text-[17px] font-bold leading-tight tabular-nums text-[#1A1F1E]">
              {group.dateLabel}
            </p>
            <p className="mt-1.5 text-[12px] font-medium text-muted-foreground">
              {group.visits.length} visit{group.visits.length > 1 ? "s" : ""}
            </p>

            <div className="absolute -right-[23px] top-[14px] hidden size-5 items-center justify-center md:flex">
              <div className="size-3.5 rounded-full border-2 border-white bg-[#1A5345] shadow-[0_0_0_2px_rgba(26,83,69,0.1)] transition-transform duration-300 group-hover:scale-125" />
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {group.visits.map((visit) => (
              <div
                key={visit.id}
                className="rounded-xl border border-[#ECEAE4] bg-white p-4 shadow-none transition-all hover:border-[#DDD9D0]"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#E8E6E0]/60 bg-[#F9F8F5]">
                        <Image
                          src={`https://i.pravatar.cc/150?u=${encodeURIComponent(visit.doctor.name)}`}
                          alt=""
                          width={40}
                          height={40}
                          unoptimized
                          className="size-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-serif text-[15px] font-bold text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]">
                          {visit.doctor.name}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                          <span className="text-[13px] font-bold text-[#1A1F1E]">
                            {visit.doctor.specialty}
                          </span>
                          <span className="size-1 rounded-full bg-muted-foreground/30" />
                          <ConsultationVisitTypeBadge visitType={visit.visitType} />
                          <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                            {formatConsultationTime(visit.scheduledAt)}
                          </span>
                          <ConsultationRecordStatusBadge
                            status={visit.recordStatus}
                            className="ml-0.5 shadow-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-1.5 md:shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        title="View report"
                        aria-label="View consultation report"
                        className="size-8 rounded-lg text-[#1A5345] hover:bg-[#F9F8F5] hover:text-[#0F3D32]"
                      >
                        <Link href={`/consultations/${visit.id}`}>
                          <FileTextIcon className="size-4" strokeWidth={2.5} />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function ConsultationsList({ visits, stats, viewMode }: ConsultationsListProps) {
  return (
    <div className="flex flex-col">
      <StatsComponent stats={stats} />

      <div className="mt-6">
        {viewMode === "table" ? (
          <ConsultationsTableView visits={visits} />
        ) : (
          <ConsultationsTimelineView visits={visits} />
        )}
      </div>
    </div>
  )
}
