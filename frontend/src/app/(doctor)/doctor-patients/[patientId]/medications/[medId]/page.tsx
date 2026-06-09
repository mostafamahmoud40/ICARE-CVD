"use client"

import React from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  ChevronLeftIcon,
  PillIcon,
  ClockIcon,
  CalendarIcon,
  StethoscopeIcon,
  TrendingUpIcon,
  AlertTriangleIcon,
  DropletsIcon,
  InfoIcon,
  SparklesIcon,
  TruckIcon,
  ActivityIcon,
  CheckCircleIcon,
  XCircleIcon,
  ZapIcon,
  FlagIcon,
  ArrowRightIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// Mock data fetcher (ideally this comes from a central store/query)
const getMockMedication = (id: string) => ({
  id,
  name: "Amlodipine",
  dose: "5 mg",
  frequency: "Twice daily",
  type: "antihypertensives",
  status: "active",
  prescribedBy: "Dr. Sarah Johnson",
  prescribedAt: "2024-03-15",
  startDate: "2024-03-15",
  adherencePercent: 92,
  instructions: "Take with or without food. Avoid grapefruit juice.",
  sideEffects: "May cause mild dizziness or ankle swelling.",
  timeOfDay: ["morning", "evening"],
  adherenceHistory7d: [[true, true], [true, false], [true, true], [true, true], [false, true], [true, true], [true, true]],
  adherenceHistory30d: Array.from({ length: 30 }, (_, i) => i % 12 === 0 ? [true, false] : [true, true]),
  flagReason: "High blood pressure readings persisted last week.",
})

export default function MedicationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const patientId = params.patientId as string
  const medId = params.medId as string
  
  // In a real app, use useQuery(medId)
  const m = getMockMedication(medId)

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  return (
    <div className="flex min-h-screen flex-col bg-[#F9F8F5]">
      {/* Header */}
      <div className="border-b border-[#E8E6E0]/60 bg-white px-6 py-4 sm:px-8">
        <div className="w-full min-w-0">
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/doctor-patients" className="text-[11px] font-medium">Patients</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/doctor-patients/${patientId}`} className="text-[11px] font-medium">Patient Profile</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/doctor-patients/${patientId}/medications`} className="text-[11px] font-medium">Medications</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-[11px] font-bold text-[#1A5345]">{m.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="size-10 rounded-xl border border-[#E8E6E0]/60 hover:bg-[#EEF5F3] hover:text-[#1A5345]"
                onClick={() => router.back()}
              >
                <ChevronLeftIcon className="size-5" />
              </Button>
              <div>
                <h1 className="font-serif text-[24px] font-bold text-[#102F27]">{m.name}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[13px] font-bold text-[#CC5533]">{m.dose}</span>
                  <span className="text-[#E8E6E0]">&bull;</span>
                  <span className="text-[13px] font-medium text-[#6B7870]">{m.frequency}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="h-10 rounded-xl border-[#E8E6E0] font-bold text-[13px] text-[#1A1F1E]">
                Adjust Dosage
              </Button>
              <Button className="h-10 rounded-xl bg-[#1A5345] px-6 font-bold text-white text-[13px] hover:bg-[#133F34] shadow-md">
                Refill Prescription
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 px-6 py-8 sm:px-8">
        <div className="w-full min-w-0 space-y-8">
          
          {/* Top Row: Snapshot Metrics */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="30-Day Adherence" value={`${m.adherencePercent}%`} icon={TrendingUpIcon} color="text-emerald-600" trend="Optimal" />
            <MetricCard label="Days Remaining" value="14" icon={TruckIcon} color="text-amber-600" trend="Refill Soon" />
            <MetricCard label="Doses Taken" value="28/30" icon={CheckCircleIcon} color="text-blue-600" trend="High Consistency" />
            <MetricCard label="Last Taken" value="8:15 AM" icon={ClockIcon} color="text-[#1A5345]" trend="Morning Dose" />
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column: Deep Adherence Analysis */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Interactive Adherence Timeline */}
              <section className="rounded-3xl border border-[#E8E6E0]/60 bg-white p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="font-serif text-[18px] font-bold text-[#102F27]">Detailed Adherence History</h3>
                    <p className="text-[13px] text-[#6B7870] mt-1">Multi-dose tracking for the last 7 clinical days</p>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] font-bold">
                    <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-emerald-500" /> Taken</div>
                    <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-rose-400" /> Missed</div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  {m.adherenceHistory7d.map((dayDoses, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-4">
                      <div className="flex flex-col gap-2">
                        {dayDoses.map((taken, j) => (
                          <div key={j} className={cn(
                            "flex size-11 items-center justify-center rounded-2xl transition-all border-2 border-white bg-white shadow-sm",
                            taken ? "text-emerald-600" : "text-rose-600"
                          )}>
                            {taken ? <CheckCircleIcon className="size-5" /> : <XCircleIcon className="size-5" />}
                          </div>
                        ))}
                      </div>
                      <span className="text-[12px] font-bold text-[#102F27]">{dayNames[i]}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-10 rounded-2xl bg-[#F9FBFB] p-6 border border-[#E8E6E0]/40 flex gap-4">
                  <SparklesIcon className="size-6 text-violet-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[14px] font-bold text-[#102F27]">Clinical Adherence Note</h4>
                    <p className="text-[13px] text-[#4A5568] leading-relaxed mt-1">
                      Patient maintains 100% adherence on weekends but shows a consistent pattern of missing Tuesday evening doses. This may be linked to their weekly late-shift schedule. Consider adjusting the evening dose timing.
                    </p>
                  </div>
                </div>
              </section>

              {/* 30-Day Heatmap Visualization */}
              <section className="rounded-3xl border border-[#E8E6E0]/60 bg-white p-8 shadow-sm">
                <h3 className="font-serif text-[18px] font-bold text-[#102F27] mb-6">Long-term Performance (30 Days)</h3>
                <div className="flex flex-wrap gap-2">
                  {m.adherenceHistory30d.map((dayDoses, i) => {
                    const allTaken = dayDoses.every(v => v);
                    const someTaken = dayDoses.some(v => v);
                    const totalDoses = dayDoses.length;
                    const takenCount = dayDoses.filter(v => v).length;
                    
                    // Simple dose labels based on frequency
                    const getDoseLabel = (idx: number) => {
                      if (totalDoses === 1) return "Daily Dose";
                      if (totalDoses === 2) return idx === 0 ? "Morning" : "Evening";
                      if (totalDoses === 3) return idx === 0 ? "Morning" : idx === 1 ? "Afternoon" : "Evening";
                      return `Dose ${idx + 1}`;
                    };

                    return (
                      <Popover key={i}>
                        <PopoverTrigger asChild>
                          <button 
                            className={cn(
                              "size-8 rounded-lg transition-all flex items-center justify-center hover:scale-110 hover:shadow-md",
                              allTaken ? "bg-emerald-500" : (someTaken ? "bg-amber-400" : "bg-rose-400")
                            )}
                          >
                            <span className="text-[11px] font-extrabold text-white">{i+1}</span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-0 rounded-2xl border-[#E8E6E0] shadow-xl overflow-hidden">
                          <div className="bg-[#F9FBFB] px-4 py-3 border-b border-[#E8E6E0]/60">
                            <p className="text-[12px] font-bold text-[#102F27]">Day {i + 1} Status</p>
                          </div>
                          <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-[#6B7870] font-medium">Compliance</span>
                              <span className={cn(
                                "font-bold",
                                allTaken ? "text-emerald-600" : (someTaken ? "text-amber-600" : "text-rose-600")
                              )}>
                                {allTaken ? "Full" : (someTaken ? "Partial" : "Missed")}
                              </span>
                            </div>
                            <div className="space-y-1.5 pt-1">
                              {dayDoses.map((taken, dIdx) => (
                                <div key={dIdx} className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className={cn("size-1.5 rounded-full", taken ? "bg-emerald-500" : "bg-rose-400")} />
                                    <span className="text-[11px] font-medium text-[#4A5568]">{getDoseLabel(dIdx)}</span>
                                  </div>
                                  {taken ? (
                                    <CheckCircleIcon className="size-3 text-emerald-600" />
                                  ) : (
                                    <XCircleIcon className="size-3 text-rose-600" />
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className="pt-2 border-t border-[#E8E6E0]/40 text-[10px] text-[#6B7870] italic">
                              {takenCount} of {totalDoses} doses recorded
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )
                  })}
                </div>
                <div className="mt-6 flex items-center gap-6 text-[11px] font-bold text-[#6B7870]">
                  <div className="flex items-center gap-2"><div className="size-3 rounded-md bg-emerald-500" /> Full Adherence</div>
                  <div className="flex items-center gap-2"><div className="size-3 rounded-md bg-amber-400" /> Partial (Missed 1 Dose)</div>
                  <div className="flex items-center gap-2"><div className="size-3 rounded-md bg-rose-400" /> Complete Miss</div>
                </div>
              </section>

              {/* Clinical Risk Analysis */}
              <section className="rounded-3xl border border-rose-100 bg-rose-50/20 p-8 shadow-sm">
                <div className="flex items-start gap-4">
                  <AlertTriangleIcon className="size-6 text-rose-600 shrink-0 mt-1" />
                  <div className="space-y-2">
                    <h3 className="font-serif text-[18px] font-bold text-rose-900">Therapeutic Risk Profile</h3>
                    <p className="text-[13px] font-medium text-rose-800 leading-relaxed">
                      "Partial adherence to {m.name} significantly increases the risk of breakthrough hypertensive events. Current patterns suggest a 15% higher probability of systolic spikes during mid-week. Patient requires immediate counseling on dosing consistency."
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Treatment Protocol */}
            <div className="space-y-8">
              
              {/* Prescriber & Context */}
              <section className="rounded-3xl border border-[#E8E6E0]/60 bg-white p-6 shadow-sm space-y-4">
                <h4 className="text-[12px] font-bold text-[#6B7870] uppercase tracking-wider">Prescription Context</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-[#EEF5F3] text-[#1A5345]">
                      <StethoscopeIcon className="size-5" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-[#102F27]">{m.prescribedBy}</p>
                      <p className="text-[11px] text-[#6B7870]">Primary Care Physician</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-[#F9F8F5] text-[#6B7870]">
                      <CalendarIcon className="size-5" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-[#102F27]">{fmtDate(m.prescribedAt)}</p>
                      <p className="text-[11px] text-[#6B7870]">Date Prescribed</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Strategic Clinical Notes */}
              <section className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50/50 to-white p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <SparklesIcon className="size-4 text-violet-600" />
                  <h4 className="text-[12px] font-bold text-violet-700 uppercase tracking-wider">Strategic Next Steps</h4>
                </div>
                <div className="space-y-3">
                  <div className="rounded-2xl bg-white/80 p-4 border border-violet-100 shadow-sm">
                    <h5 className="text-[13px] font-bold text-[#102F27] mb-1">Follow-up Assessment</h5>
                    <p className="text-[13px] text-[#4A5568] leading-relaxed">
                      Evaluate for peripheral edema at the next visit on Aug 12. Monitor creatinine levels if BP remains elevated.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/80 p-4 border border-violet-100 shadow-sm">
                    <h5 className="text-[13px] font-bold text-[#102F27] mb-1">Dosing Optimization</h5>
                    <p className="text-[13px] text-[#4A5568] leading-relaxed">
                      If Tuesday misses continue, consider switching to a long-acting once-daily calcium channel blocker.
                    </p>
                  </div>
                </div>
              </section>

              {/* Mandatory Patient Guidelines */}
              <section className="rounded-3xl border border-[#E8E6E0]/60 bg-white p-6 shadow-sm space-y-4">
                <h4 className="text-[12px] font-bold text-[#6B7870] uppercase tracking-wider">Required Guidelines</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-blue-50/30 border border-blue-100">
                    <DropletsIcon className="size-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-[13px] font-bold text-[#102F27]">Maintain Hydration</p>
                      <p className="text-[11px] text-[#4A5568]">Ensure 2L water intake daily to support renal clearance.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-amber-50/30 border border-amber-100">
                    <ZapIcon className="size-5 text-amber-500 mt-0.5" />
                    <div>
                      <p className="text-[13px] font-bold text-[#102F27]">Dietary Interaction</p>
                      <p className="text-[11px] text-[#4A5568]">Strictly avoid grapefruit juice as it increases drug serum levels.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Therapeutic Goal */}
              <section className="rounded-3xl border border-[#E8E6E0]/60 bg-[#FAFAFA] p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <InfoIcon className="size-4 text-[#1A5345]" />
                  <h4 className="text-[12px] font-bold text-[#102F27] uppercase tracking-wider">Therapeutic Goal</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-[#6B7870]">Primary Objective</span>
                    <span className="font-bold text-[#102F27]">BP Control</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-[#6B7870]">Target Metric</span>
                    <span className="font-bold text-emerald-600">SBP &lt; 130 mmHg</span>
                  </div>
                  <div className="pt-2 border-t border-[#E8E6E0]/60">
                    <p className="text-[11px] text-[#6B7870] leading-relaxed">
                      Combined therapy target is to reduce 5-year MACE risk by 12% through consistent vascular protection.
                    </p>
                  </div>
                </div>
              </section>

            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function MetricCard({ label, value, icon: Icon, color, trend }: any) {
  return (
    <div className="rounded-3xl border border-[#E8E6E0]/60 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <Icon className={cn("size-5", color)} />
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-[#6B7870]")}>{trend}</span>
      </div>
      <div>
        <p className="text-[24px] font-bold text-[#102F27] leading-none tabular-nums">{value}</p>
        <p className="text-[11px] font-bold text-[#6B7870] mt-2 uppercase tracking-wider">{label}</p>
      </div>
    </div>
  )
}

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso))
}
