"use client"

import Link from "next/link"
import { useMemo } from "react"
import {
  ArrowLeftIcon,
  BrainCircuitIcon,
  ChevronRightIcon,
  SparklesIcon,
} from "lucide-react"

import { mockBriefingPatientSummary } from "./consultation.mock"
import {
  DEFAULT_BRIEFING_TREND_DATA,
  DEFAULT_BRIEFING_VISIT_STATS,
  DEFAULT_BRIEFING_VITAL_PROGRESS,
  DEFAULT_MEDICATION_ADHERENCE_TREND,
  DEFAULT_MEDICATION_MISSED_BREAKDOWN,
} from "./briefing.constants"
import { useBriefingPatientAvatar } from "./useBriefingPatientAvatar"
import { usePatientBriefing } from "./usePatientBriefing"
import { useQueueEntryId } from "./useQueueEntryId"
import { useStartConsultationFromBriefing } from "./useStartConsultationFromBriefing"
import {
  BriefingPreparation,
  PatientBriefingReportContent,
} from "./PatientBriefingReportView"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function PatientBriefingPage() {
  const queueEntryId = useQueueEntryId()
  const summary = mockBriefingPatientSummary
  const { data: patientAvatarUrl } = useBriefingPatientAvatar(queueEntryId)
  const { report, isReady, prepStep } = usePatientBriefing(summary, queueEntryId)
  const startConsultation = useStartConsultationFromBriefing(queueEntryId)

  const displayReport = useMemo(
    () => (patientAvatarUrl ? { ...report, avatarUrl: patientAvatarUrl } : report),
    [report, patientAvatarUrl],
  )

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-[#F9F8F5]">
      <header className="shrink-0 border-b border-[#E8E6E0]/60 bg-white px-3 py-4 sm:px-4 lg:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-9 gap-1.5 rounded-lg border border-[#E8E6E0]/60 bg-white px-3 text-[12px] font-semibold text-[#1A5345] shadow-sm hover:bg-[#F9F8F5]"
            >
              <Link href="/doctor-queue">
                <ArrowLeftIcon className="size-4" aria-hidden />
                Queue
              </Link>
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <BrainCircuitIcon className="size-5 shrink-0 text-violet-600" aria-hidden />
                <h1 className="truncate font-serif text-[18px] font-bold text-[#1A1F1E]">
                  Pre-visit briefing
                </h1>
              </div>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                {isReady
                  ? "AI report is ready — review before starting the consultation"
                  : "AI is preparing the patient report…"}
              </p>
            </div>
          </div>
          <Badge className="rounded-lg border-0 bg-violet-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-none hover:bg-violet-600">
            AI · Groq
          </Badge>
        </div>
      </header>

      <main className="scrollbar-hide flex-1 overflow-y-auto bg-[#F9F8F5] p-3 sm:p-4 lg:p-5">
        <div className="space-y-4 sm:space-y-5">
          {!isReady ? (
            <div className="rounded-2xl border border-[#E8E6E0]/60 bg-white shadow-sm">
              <BriefingPreparation prepStep={prepStep} />
            </div>
          ) : (
            <PatientBriefingReportContent
              report={displayReport}
              trendData={DEFAULT_BRIEFING_TREND_DATA}
              visitStats={DEFAULT_BRIEFING_VISIT_STATS}
              vitalProgressData={DEFAULT_BRIEFING_VITAL_PROGRESS}
              medicationAdherenceTrendData={DEFAULT_MEDICATION_ADHERENCE_TREND}
              medicationMissedBreakdownData={DEFAULT_MEDICATION_MISSED_BREAKDOWN}
            />
          )}
        </div>
      </main>

      {isReady ? (
        <footer className="shrink-0 border-t border-[#E8E6E0]/60 bg-white px-3 py-4 sm:px-4 lg:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <SparklesIcon className="size-3.5 text-violet-500" aria-hidden />
              <span>Live AI suggestions will appear in the right panel during consultation</span>
            </div>
            <Button
              type="button"
              onClick={() => void startConsultation()}
              className="h-10 gap-1.5 rounded-lg border-0 bg-[#1A5345] px-5 text-[13px] font-bold text-white shadow-sm hover:bg-[#133F34]"
            >
              Start consultation
              <ChevronRightIcon className="size-4" aria-hidden />
            </Button>
          </div>
        </footer>
      ) : null}
    </div>
  )
}
