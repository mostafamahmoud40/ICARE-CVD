import { formatDistanceToNow } from "date-fns"
import { ActivityIcon, ClipboardListIcon, PillIcon } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { MedicationTypeBadge } from "../medications/patientMedications.shared"
import type { PatientAiChatHealthContext } from "./patientAiChatContext.types"

type PatientAiChatHealthPanelProps = {
  context: PatientAiChatHealthContext
  isLoading: boolean
}

const riskBadgeStyles = {
  low: "text-emerald-700 bg-emerald-50 border-emerald-200/60",
  moderate: "text-[#CC5533] bg-[#CC5533]/5 border-[#CC5533]/15",
  high: "text-red-700 bg-red-50 border-red-200/60",
} as const

const riskLabels = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
} as const

const labStatusStyles = {
  normal: "text-[#1A5345] bg-[#1A5345]/5",
  high: "text-amber-700 bg-amber-50",
  low: "text-sky-700 bg-sky-50",
  critical: "text-red-700 bg-red-50",
} as const

function formatMeasuredAgo(iso: string | null): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return formatDistanceToNow(date, { addSuffix: true })
}

function formatLabValue(value: string, unit: string | null): string {
  return unit?.trim() ? `${value} ${unit}` : value
}

function PanelSkeleton() {
  return (
    <div className="p-5 space-y-6">
      <Skeleton className="h-36 w-full rounded-2xl" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    </div>
  )
}

function EmptyCard({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[#E8E6E0]/80 bg-[#FAFAF8] px-3.5 py-4 text-[12px] font-medium text-muted-foreground">
      {message}
    </div>
  )
}

export function PatientAiChatHealthPanel({ context, isLoading }: PatientAiChatHealthPanelProps) {
  const { profile, riskScore, riskNote, vitals, medications, labResults } = context
  const bp = vitals.current.bloodPressure
  const hr = vitals.current.heartRate
  const measuredAgo = formatMeasuredAgo(vitals.lastMeasuredAt)

  return (
    <div className="hidden lg:flex w-80 shrink-0 border-l border-[#E8E6E0]/60 bg-white flex-col overflow-y-auto custom-scrollbar relative z-10">
      <div className="relative p-5 border-b border-[#E8E6E0]/60 bg-gradient-to-br from-white via-[#FFFCFA] to-[#E8F0EE]/30">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#1A5345]/15 via-[#CC5533]/35 to-[#1A5345]/15"
          aria-hidden
        />
        <div className="flex items-center gap-2 mb-2">
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
            <span className="relative flex size-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/60 opacity-75" />
              <span className="relative inline-flex rounded-full size-1.5 bg-white" />
            </span>
            Active Context
          </div>
        </div>
        <div className="border-l-[3px] border-[#1A5345] pl-3 space-y-0.5">
          <h3 className="font-serif text-[16px] font-bold text-[#1A1F1E] tracking-tight">
            {profile?.fullName ?? "Health Profile"}
          </h3>
          <p className="text-[11px] font-medium text-[#6B7870]">
            Live EHR data · agent can act on your appointments
          </p>
        </div>
      </div>

      {isLoading ? (
        <PanelSkeleton />
      ) : (
        <div className="p-5 space-y-6">
          <div className="rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-xs relative overflow-hidden group hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                10-Year ASCVD Risk
              </span>
              {profile ? (
                <span
                  className={cn(
                    "text-[11px] font-bold px-2 py-0.5 rounded-md border",
                    riskBadgeStyles[profile.riskLevel],
                  )}
                >
                  {riskLabels[profile.riskLevel]}
                </span>
              ) : null}
            </div>
            {riskScore != null ? (
              <div className="mt-3 flex items-baseline gap-2">
                <h3 className="font-serif text-[32px] font-bold text-[#1A1F1E]">{riskScore}%</h3>
                {profile?.age != null ? (
                  <span className="text-[11px] text-[#6B7870] font-medium">Age {profile.age}</span>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 text-[13px] font-medium text-muted-foreground">Risk data unavailable</p>
            )}
            {riskNote ? (
              <p className="mt-2 text-[12px] font-medium text-muted-foreground leading-relaxed">
                {riskNote}
              </p>
            ) : null}
          </div>

          <div className="space-y-3">
            <h4 className="font-serif text-[14px] font-bold text-[#1A1F1E] flex items-center gap-1.5 border-b border-[#E8E6E0]/40 pb-2">
              <ActivityIcon className="size-4 text-[#1A5345]" />
              Recent Vitals
            </h4>
            {bp.systolic != null && bp.diastolic != null ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#E8E6E0]/60 bg-white p-3.5 shadow-2xs hover:shadow-md transition-all duration-300">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Blood Pressure
                  </span>
                  <span className="font-serif text-[20px] font-bold text-[#1A1F1E] mt-1 block">
                    {bp.systolic}/{bp.diastolic}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {vitals.kpiBadges.bloodPressure ? (
                      <span className="text-[#1A5345] font-bold text-[9px] bg-[#1A5345]/5 px-1.5 py-0.5 rounded-md">
                        {vitals.kpiBadges.bloodPressure}
                      </span>
                    ) : null}
                    {measuredAgo ? (
                      <span className="text-[9px] text-[#6B7870] font-medium">{measuredAgo}</span>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-xl border border-[#E8E6E0]/60 bg-white p-3.5 shadow-2xs hover:shadow-md transition-all duration-300">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Heart Rate
                  </span>
                  {hr.value != null ? (
                    <span className="font-serif text-[20px] font-bold text-[#1A1F1E] mt-1 block">
                      {hr.value}{" "}
                      <span className="text-[11px] font-sans font-medium text-[#6B7870]">bpm</span>
                    </span>
                  ) : (
                    <span className="font-serif text-[16px] font-bold text-muted-foreground mt-1 block">—</span>
                  )}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {vitals.kpiBadges.heartRate ? (
                      <span className="text-[#6B7870] font-bold text-[9px] bg-slate-100 px-1.5 py-0.5 rounded-md">
                        {vitals.kpiBadges.heartRate}
                      </span>
                    ) : null}
                    {measuredAgo ? (
                      <span className="text-[9px] text-[#6B7870] font-medium">{measuredAgo}</span>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyCard message="No vitals recorded yet. Log readings from the Vitals page." />
            )}
          </div>

          <div className="space-y-3">
            <h4 className="font-serif text-[14px] font-bold text-[#1A1F1E] flex items-center gap-1.5 border-b border-[#E8E6E0]/40 pb-2">
              <PillIcon className="size-4 text-[#1A5345]" />
              Active Medications
            </h4>
            {medications.length > 0 ? (
              <div className="space-y-3">
                {medications.map((med) => (
                  <div
                    key={med.id}
                    className="rounded-xl border border-[#E8E6E0]/60 bg-white p-3.5 shadow-2xs hover:shadow-md transition-all duration-300 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-serif text-[14px] font-bold text-[#1A1F1E] block truncate">
                        {med.name}
                      </span>
                      <span className="text-[12px] font-medium text-muted-foreground block mt-0.5">
                        {med.dose} · {med.frequency}
                      </span>
                    </div>
                    <MedicationTypeBadge type={med.type} className="shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyCard message="No active prescriptions on your record." />
            )}
          </div>

          <div className="space-y-3">
            <h4 className="font-serif text-[14px] font-bold text-[#1A1F1E] flex items-center gap-1.5 border-b border-[#E8E6E0]/40 pb-2">
              <ClipboardListIcon className="size-4 text-[#1A5345]" />
              Key Lab Results
            </h4>
            {labResults.length > 0 ? (
              <div className="rounded-xl border border-[#E8E6E0]/60 bg-white divide-y divide-[#E8E6E0]/40 overflow-hidden shadow-2xs">
                {labResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex justify-between items-center p-3.5 hover:bg-slate-50/50 transition-colors gap-3"
                  >
                    <div className="min-w-0">
                      <span className="font-serif text-[13px] font-bold text-[#1A1F1E] block truncate">
                        {result.testName}
                      </span>
                      {result.referenceRange ? (
                        <span className="text-[11px] font-medium text-muted-foreground mt-0.5 block">
                          Target: {result.referenceRange}
                        </span>
                      ) : null}
                    </div>
                    <span
                      className={cn(
                        "font-serif text-[14px] font-bold px-2.5 py-1 rounded-lg shrink-0",
                        labStatusStyles[result.status],
                      )}
                    >
                      {formatLabValue(result.value, result.unit)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyCard message="No lab results yet. Upload reports from Lab Orders when ready." />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
