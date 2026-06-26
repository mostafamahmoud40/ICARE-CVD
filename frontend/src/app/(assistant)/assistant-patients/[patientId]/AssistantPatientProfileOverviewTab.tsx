"use client"

import {
  ActivityIcon,
  AlertTriangleIcon,
  BrainIcon,
  CheckCircle2Icon,
  DropletsIcon,
  HeartPulseIcon,
  MoonIcon,
  PillIcon,
  QrCodeIcon,
  SaladIcon,
  ShieldAlertIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { patientRiskAccentClassName, patientRiskBadgeClassName } from "@/features/patient-record"
import type { AssistantPatientSummary } from "./assistantPatientProfile.types"

type AssistantPatientProfileOverviewTabProps = {
  patient: AssistantPatientSummary
}

export function AssistantPatientProfileOverviewTab({ patient }: AssistantPatientProfileOverviewTabProps) {
  return (
  <div className="flex flex-col gap-8 animate-in fade-in duration-300">

    {/* Current Condition */}
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[16px] font-bold text-[#1A1F1E] flex items-center gap-2">
          <HeartPulseIcon className="size-5 text-[#E8345E]" />
          Primary Diagnosis
        </h3>
        <Button variant="ghost" size="sm" className="h-8 gap-2 text-[12px] font-semibold text-[#1A5345] hover:bg-[#1A5345]/10">
          <QrCodeIcon className="size-3.5" />
          Patient Portal Link
        </Button>
      </div>
      <div className="p-5 rounded-xl bg-[#F8F9FA] border border-[#E8E6E0]/60 flex flex-col gap-2.5">
        <span className="text-[15px] font-bold text-[#1A1F1E]">{patient.condition}</span>
        <p className="text-[14px] text-muted-foreground leading-relaxed">
          Patient presented with stable angina. Scheduled for a follow-up stress test. Currently adhering to medication protocol without reported side effects.
        </p>
      </div>
    </div>

    {/* Widgets Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Risk & Adherence */}
      <div className="flex flex-col gap-4">
        {/* Risk Score */}
        <div className="flex min-h-[168px] flex-col justify-between rounded-xl border border-[#E8E6E0]/80 bg-white p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2.5">
              <ShieldAlertIcon className={cn("size-5 shrink-0", patientRiskAccentClassName(patient.riskLevel))} strokeWidth={2.5} aria-hidden />
              <div className="min-w-0">
                <h4 className="text-[14px] font-bold leading-snug text-[#1A1F1E]">CVD risk score</h4>
                <p className="mt-0.5 text-[11px] font-medium leading-snug text-muted-foreground">
                  Estimated 10-year cardiovascular risk
                </p>
              </div>
            </div>
            <Badge className={patientRiskBadgeClassName(patient.riskLevel)}>
              {patient.riskLevel}
            </Badge>
          </div>

          <div className="mt-4 flex flex-col gap-4 sm:mt-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
            <div className="flex items-baseline gap-1" aria-live="polite">
              <span className="text-[40px] font-black tabular-nums leading-none tracking-tight text-[#1A1F1E]">
                {patient.riskScore}
              </span>
              <span className="pb-1 text-[18px] font-bold text-muted-foreground">%</span>
            </div>

            <div className="min-w-0 flex-1 sm:max-w-[min(100%,280px)]">
              <p className="mb-2 text-[10px] font-semibold tracking-wide text-muted-foreground">
                Risk spectrum
              </p>
              <div className="relative px-0.5 pt-0.5">
                <div
                  className="h-2.5 w-full rounded-full bg-gradient-to-r from-emerald-200 via-amber-200 to-rose-300 shadow-inner ring-1 ring-black/[0.06]"
                  role="presentation"
                />
                <div
                  className="absolute top-1/2 h-4 w-1 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-[#1A1F1E] shadow-md ring-2 ring-white"
                  style={{ left: `${Math.min(100, Math.max(0, patient.riskScore))}%` }}
                  aria-hidden
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[10px] font-medium text-muted-foreground">
                <span>Low</span>
                <span>Moderate</span>
                <span>High</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-3 rounded-xl border border-[#E8E6E0]/60 bg-[#F9F8F5] p-3">
            <AlertTriangleIcon
              className="mt-0.5 size-4 shrink-0 text-amber-600"
              strokeWidth={2}
              aria-hidden
            />
            <p className="text-[12px] font-medium leading-relaxed text-[#1A1F1E]/90">
              Elevated risk due to hypertension and history of smoking. Strict monitoring required.
            </p>
          </div>
        </div>

        {/* Medication Adherence */}
        <div className="flex min-h-[168px] flex-col justify-between rounded-xl border border-[#E8E6E0]/80 bg-white p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
          <div className="flex min-w-0 items-start gap-2.5">
            <PillIcon className="size-5 text-emerald-600 shrink-0" strokeWidth={2.5} aria-hidden />
            <div className="min-w-0">
              <h4 className="text-[14px] font-bold leading-snug text-[#1A1F1E]">Medication adherence</h4>
              <p className="mt-0.5 text-[11px] font-medium leading-snug text-muted-foreground">
                Pharmacy fills and self-report (mock)
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-4 sm:mt-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
            <div className="flex items-baseline gap-1" aria-live="polite">
              <span className="text-[40px] font-black tabular-nums leading-none tracking-tight text-[#1A1F1E]">
                {patient.adherence}
              </span>
              <span className="pb-1 text-[18px] font-bold text-muted-foreground">%</span>
            </div>

            <div className="min-w-0 flex-1 sm:max-w-[min(100%,280px)]">
              <p className="mb-2 text-[10px] font-semibold tracking-wide text-muted-foreground">
                Adherence bar
              </p>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner ring-1 ring-black/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-[width] duration-300"
                  style={{
                    width: `${Math.min(100, Math.max(0, patient.adherence))}%`,
                  }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[10px] font-medium text-muted-foreground">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-3 rounded-xl border border-[#E8E6E0]/60 bg-[#F9F8F5] p-3">
            <CheckCircle2Icon
              className="mt-0.5 size-4 shrink-0 text-emerald-600"
              strokeWidth={2}
              aria-hidden
            />
            <p className="text-[12px] font-medium leading-relaxed text-[#1A1F1E]/90">
              Patient has been consistently taking prescribed statins.
            </p>
          </div>
        </div>
      </div>

      {/* Next Steps & Lifestyle */}
      <div className="flex flex-col gap-4">
        {/* Next Steps / Action Items */}
        <div className="rounded-xl border border-[#E8E6E0] bg-white p-5">
          <h4 className="text-[14px] font-bold text-[#1A1F1E] mb-4 flex items-center gap-2">
            <CheckCircle2Icon className="size-[18px] text-[#1A5345]" strokeWidth={2} />
            Action Items
          </h4>
          <ul className="flex flex-col gap-3.5">
            <li className="flex items-center gap-2.5 text-[13px]">
              <div className="size-[5px] rounded-full bg-[#D9772B] shrink-0" />
              <span className="text-[#1A1F1E] font-medium leading-snug">Schedule follow-up stress test</span>
            </li>
            <li className="flex items-center gap-2.5 text-[13px]">
              <div className="size-[5px] rounded-full bg-[#1A5345] shrink-0" />
              <span className="text-[#1A1F1E] font-medium leading-snug">Review latest lipid panel results</span>
            </li>
            <li className="flex items-center gap-2.5 text-[13px]">
              <div className="size-[5px] rounded-full bg-[#1A5345] shrink-0" />
              <span className="text-[#1A1F1E] font-medium leading-snug">Discuss smoking cessation programs</span>
            </li>
          </ul>
        </div>

        {/* Lifestyle */}
        {/* Lifestyle & risk factors */}
        <div className="rounded-xl border border-[#E8E6E0] bg-white p-5">
          <h4 className="text-[14px] font-bold text-[#1A1F1E] mb-4 flex items-center gap-2">
            <ActivityIcon className="size-4 text-[#1A1F1E]" />
            Lifestyle & risk factors
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="flex flex-col items-center justify-center text-center p-3 rounded-xl bg-white border border-[#E8E6E0]/60 shadow-sm min-h-[90px] transition-shadow hover:shadow-md group/smoke">
              <div className="mb-2 relative size-8 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-full overflow-visible">
                  {/* Enhanced Smoke Trails */}
                  <g className="animate-pulse duration-[3000ms]">
                    <path d="M15 7C15 5 17 4.5 17 2.5" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
                    <path d="M18 9C18 7 20 6.5 20 4.5" stroke="#CBD5E1" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
                  </g>

                  {/* Cigarette Shadow for UI depth */}
                  <rect x="3" y="15.5" width="15" height="1.5" rx="0.75" fill="#1A5345" opacity="0.08" />

                  {/* Main Body Construction */}
                  <rect x="2" y="12.5" width="16" height="4" rx="1" fill="white" stroke="#E2E8F0" strokeWidth="0.5" />

                  {/* Professional Filter Design */}
                  <path d="M2 13.5a1 1 0 0 1 1-1h4v4h-4a1 1 0 0 1-1-1v-2z" fill="#D9772B" />
                  <rect x="6.5" y="12.5" width="0.5" height="4" fill="#000" opacity="0.05" />

                  {/* The Burning Tip (Ash) */}
                  <path d="M16 12.5h2v4h-2v-4z" fill="#475569" />

                  {/* The Ember Glow (Core UX improvement) */}
                  <g className="animate-pulse duration-1000">
                    <rect x="18" y="12.5" width="1.5" height="4" rx="0.5" fill="#F43F5E" />
                    <circle cx="19" cy="14.5" r="2.5" fill="#F43F5E" opacity="0.2" />
                  </g>
                </svg>
              </div>
              <span className={`text-[13px] font-bold ${patient.lifestyle.smoking.status.includes('Ex') || patient.lifestyle.smoking.status.includes('Never') ? 'text-emerald-600' : 'text-rose-600'}`}>{patient.lifestyle.smoking.status}</span>
              <span className="text-[11px] font-medium text-muted-foreground mt-0.5">{patient.lifestyle.smoking.detail}</span>
            </div>

            <div className="flex flex-col items-center justify-center text-center p-3 rounded-xl bg-white border border-[#E8E6E0]/60 shadow-sm min-h-[90px] transition-shadow hover:shadow-md">
              <ActivityIcon className="size-5 mb-2 text-[#1A5345]" strokeWidth={2.5} />
              <span className={`text-[13px] font-bold ${['Low', 'Sedentary'].includes(patient.lifestyle.exercise.status) ? 'text-rose-600' : ['Moderate'].includes(patient.lifestyle.exercise.status) ? 'text-[#D9772B]' : 'text-emerald-600'}`}>{patient.lifestyle.exercise.status}</span>
              <span className="text-[11px] font-medium text-muted-foreground mt-0.5">{patient.lifestyle.exercise.detail}</span>
            </div>

            <div className="flex flex-col items-center justify-center text-center p-3 rounded-xl bg-white border border-[#E8E6E0]/60 shadow-sm min-h-[90px] transition-shadow hover:shadow-md">
              <SaladIcon className="size-5 mb-2 text-[#1A5345]" strokeWidth={2.5} />
              <span className={`text-[13px] font-bold ${['Poor', 'High Sodium'].includes(patient.lifestyle.diet.status) ? 'text-rose-600' : ['Moderate'].includes(patient.lifestyle.diet.status) ? 'text-[#D9772B]' : 'text-emerald-600'}`}>{patient.lifestyle.diet.status}</span>
              <span className="text-[11px] font-medium text-muted-foreground mt-0.5">{patient.lifestyle.diet.detail}</span>
            </div>

            <div className="flex flex-col items-center justify-center text-center p-3 rounded-xl bg-white border border-[#E8E6E0]/60 shadow-sm min-h-[90px] transition-shadow hover:shadow-md">
              <DropletsIcon className="size-5 mb-2 text-[#1A5345]" strokeWidth={2.5} />
              <span className={`text-[13px] font-bold ${['High', 'Heavy'].includes(patient.lifestyle.alcohol.status) ? 'text-rose-600' : ['None', 'Social', 'Low'].includes(patient.lifestyle.alcohol.status) ? 'text-emerald-600' : 'text-[#D9772B]'}`}>{patient.lifestyle.alcohol.status}</span>
              <span className="text-[11px] font-medium text-muted-foreground mt-0.5">{patient.lifestyle.alcohol.detail}</span>
            </div>

            <div className="flex flex-col items-center justify-center text-center p-3 rounded-xl bg-white border border-[#E8E6E0]/60 shadow-sm min-h-[90px] transition-shadow hover:shadow-md">
              <MoonIcon className="size-5 mb-2 text-[#1A5345]" strokeWidth={2.5} />
              <span className={`text-[13px] font-bold ${['<4 hrs', '4-5 hrs'].includes(patient.lifestyle.sleep.status) ? 'text-rose-600' : ['5-6 hrs', '6-7 hrs'].includes(patient.lifestyle.sleep.status) ? 'text-[#D9772B]' : 'text-emerald-600'}`}>{patient.lifestyle.sleep.status}</span>
              <span className="text-[11px] font-medium text-muted-foreground mt-0.5">{patient.lifestyle.sleep.detail}</span>
            </div>

            <div className="flex flex-col items-center justify-center text-center p-3 rounded-xl bg-white border border-[#E8E6E0]/60 shadow-sm min-h-[90px] transition-shadow hover:shadow-md">
              <BrainIcon className="size-5 mb-2 text-[#1A5345]" strokeWidth={2.5} />
              <span className={`text-[13px] font-bold ${['High', 'Very High'].includes(patient.lifestyle.stress.status) ? 'text-rose-600' : ['Moderate'].includes(patient.lifestyle.stress.status) ? 'text-[#D9772B]' : 'text-emerald-600'}`}>{patient.lifestyle.stress.status}</span>
              <span className="text-[11px] font-medium text-muted-foreground mt-0.5">{patient.lifestyle.stress.detail}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
  )
}
