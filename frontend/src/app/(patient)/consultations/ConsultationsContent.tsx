"use client"

import { SparklesIcon, Stethoscope } from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"

import { ConsultationsList } from "./ConsultationsList"
import type { VisitSummary, ConsultationStats } from "./consultations.types"

type ConsultationsContentProps = {
  visits: VisitSummary[]
  stats: ConsultationStats
}

export function ConsultationsContent({ visits, stats }: ConsultationsContentProps) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6 lg:p-8">
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

      {/* Header Area */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="mb-1">
          <div className="mb-2 flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-[#1A1F1E] dark:text-foreground">
              Consultation History
            </h1>
            <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#E8F0ED] px-2 py-0.5 border border-[#C8D9D3] dark:border-emerald-900/50 dark:bg-emerald-950/30">
              <SparklesIcon className="size-3 text-[#1a5345] dark:text-emerald-400" />
              <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-[#1a5345] dark:text-emerald-400">
                AI Summary Available
              </span>
            </div>
          </div>
          <p className="m-0 max-w-xl text-[15px] leading-relaxed text-[#6B7870] dark:text-muted-foreground">
            View all your past visits, prescriptions, and AI-generated health insights from your consultations.
          </p>
        </div>
      </div>

      {/* Consultations List */}
      <ConsultationsList visits={visits} stats={stats} />
    </div>
  )
}
