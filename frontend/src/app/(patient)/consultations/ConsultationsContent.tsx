"use client"

import { useState } from "react"
import { ClockIcon, ListIcon, SparklesIcon, Stethoscope } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { cn } from "@/lib/utils"

import { ConsultationsList } from "./ConsultationsList"
import type {
  VisitSummary,
  ConsultationStats,
  ConsultationsViewMode,
} from "./consultations.types"

type ConsultationsContentProps = {
  visits: VisitSummary[]
  stats: ConsultationStats
}

export function ConsultationsContent({ visits, stats }: ConsultationsContentProps) {
  const [viewMode, setViewMode] = useState<ConsultationsViewMode>("table")

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[#F9F8F5] animate-in fade-in duration-500">
      <div className="relative z-20 shrink-0 border-b border-[#E8E6E0]/60 bg-white">
        <div className="flex flex-col px-5 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-5">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard" className="flex items-center gap-1.5 text-[#6B7870] hover:text-[#1a5345]">
              <Stethoscope className="h-4 w-4" />
              Consultations
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbPage className="text-[#1A1F1E] font-medium">History</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-0.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-[22px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[24px] lg:text-[26px]">
              Consultation History
            </h1>
            <div className="flex shrink-0 items-center gap-1.5 rounded-md border border-[#1A5345]/10 bg-[#1A5345]/5 px-2 py-0.5">
              <SparklesIcon className="size-3 text-[#1A5345]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-[#1A5345]">
                AI Summary Available
              </span>
            </div>
          </div>
          <p className="text-[13px] font-medium text-muted-foreground sm:text-[14px]">
            View all your past visits, prescriptions, and AI-generated health insights from your consultations.
          </p>
        </div>

        <div className="flex shrink-0 items-center rounded-xl border border-[#E8E6E0] bg-white p-0.5 shadow-sm">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("table")}
            className={cn(
              "h-8 gap-1.5 rounded-lg px-2.5 text-[12px] font-bold transition-all",
              viewMode === "table"
                ? "bg-[#1A5345] text-white shadow-sm"
                : "text-muted-foreground hover:bg-slate-50",
            )}
          >
            <ListIcon className="size-3.5" aria-hidden />
            List
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("timeline")}
            className={cn(
              "h-8 gap-1.5 rounded-lg px-2.5 text-[12px] font-bold transition-all",
              viewMode === "timeline"
                ? "bg-[#1A5345] text-white shadow-sm"
                : "text-muted-foreground hover:bg-slate-50",
            )}
          >
            <ClockIcon className="size-3.5" aria-hidden />
            Timeline
          </Button>
        </div>
      </div>
      </div>
      </div>

      <div className="relative flex-1 overflow-auto bg-[#F9F8F5] px-6 sm:px-8">
        <div className="custom-scrollbar w-full pb-6 pt-4">

      {/* Consultations List */}
      <ConsultationsList visits={visits} stats={stats} viewMode={viewMode} />
        </div>
      </div>
    </div>
  )
}
