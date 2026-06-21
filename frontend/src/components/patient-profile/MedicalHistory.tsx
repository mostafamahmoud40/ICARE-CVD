"use client"

import * as React from "react"
import {
  ActivityIcon,
  AlertCircleIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  ClipboardListIcon,
  DumbbellIcon,
  FileTextIcon,
  FlameIcon,
  HeartIcon,
  HistoryIcon,
  InfoIcon,
  PlusIcon,
  SaladIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  StethoscopeIcon,
  SyringeIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Condition {
  id: string
  name: string
  status: "active" | "resolved" | "chronic"
  diagnosedDate: string
  notes: string
  severity: "low" | "moderate" | "high"
}

interface Surgery {
  id: string
  procedure: string
  date: string
  hospital: string
  surgeon: string
  outcome: string
}

interface Allergy {
  id: string
  allergen: string
  reaction: string
  severity: "mild" | "moderate" | "severe"
}

interface FamilyHistory {
  relation: string
  condition: string
  ageOfOnset?: string
}

const MOCK_CONDITIONS: Condition[] = [
  {
    id: "c1",
    name: "Hypertension",
    status: "chronic",
    diagnosedDate: "Jan 12, 2020",
    notes: "Managed with Lisinopril. Regular BP monitoring required.",
    severity: "moderate",
  },
  {
    id: "c2",
    name: "Type 2 Diabetes Mellitus",
    status: "active",
    diagnosedDate: "Mar 05, 2022",
    notes: "HbA1c currently 6.8%. Diet and Metformin regimen.",
    severity: "high",
  },
  {
    id: "c3",
    name: "Hyperlipidemia",
    status: "chronic",
    diagnosedDate: "Nov 20, 2019",
    notes: "Stable on Atorvastatin 40mg.",
    severity: "low",
  },
]

const MOCK_SURGERIES: Surgery[] = [
  {
    id: "s1",
    procedure: "Coronary Artery Bypass Graft (CABG)",
    date: "Aug 15, 2024",
    hospital: "Mayo Clinic",
    surgeon: "Dr. Robert Chen",
    outcome: "Successful, following cardiac rehab",
  },
  {
    id: "s2",
    procedure: "Appendectomy",
    date: "May 10, 2010",
    hospital: "City General Hospital",
    surgeon: "Dr. Sarah Lee",
    outcome: "Routine, no complications",
  },
]

const MOCK_ALLERGIES: Allergy[] = [
  {
    id: "a1",
    allergen: "Penicillin",
    reaction: "Urticaria and anaphylaxis risk",
    severity: "severe",
  },
  {
    id: "a2",
    allergen: "Latex",
    reaction: "Contact dermatitis",
    severity: "mild",
  },
]

const MOCK_FAMILY_HISTORY: FamilyHistory[] = [
  { relation: "Father", condition: "Myocardial Infarction", ageOfOnset: "52" },
  { relation: "Mother", condition: "Type 2 Diabetes", ageOfOnset: "60" },
  { relation: "Brother", condition: "Hypertension", ageOfOnset: "45" },
]

export function MedicalHistory({
  conditions = [],
  surgeries = [],
  allergies = [],
  familyHistory = [],
  emptyMessage = "No medical history recorded for this patient yet.",
}: {
  conditions?: Condition[]
  surgeries?: Surgery[]
  allergies?: Allergy[]
  familyHistory?: FamilyHistory[]
  emptyMessage?: string
}) {
  return (
    <div className="w-full px-4 sm:px-8 py-8 flex flex-col gap-10 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-[24px] font-bold text-[#1A1F1E] tracking-tight font-serif">Medical History</h2>
          <p className="text-[14px] font-medium text-muted-foreground">Comprehensive record of clinical conditions and surgical history.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="h-8 rounded-lg border-[#E8E6E0] bg-white px-4 text-[12px] font-bold text-[#1A1F1E] hover:bg-[#F9F8F5] transition-all shadow-sm">
             <HistoryIcon className="mr-2 size-3.5 text-muted-foreground" strokeWidth={2.5} />
             View Audit Log
           </Button>
           <Button className="h-8 rounded-lg bg-[#1A5345] px-5 text-[12px] font-bold text-white hover:bg-[#133F34] shadow-sm border-0 transition-all">
             <PlusIcon className="mr-2 size-3.5" strokeWidth={2.5} />
             Update History
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Chronic Conditions & Surgeries */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Chronic Conditions Section */}
          <section className="bg-white rounded-2xl border border-[#E8E6E0]/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="px-6 py-5 border-b border-[#E8E6E0]/60 flex items-center justify-between bg-[#FAFAF8]/50">
              <div className="flex items-center gap-3">
                <ActivityIcon className="size-5 text-[#1A5345]" strokeWidth={2.5} />
                <h3 className="text-[17px] font-bold text-[#1A1F1E]">Chronic Conditions</h3>
              </div>
              <Badge className="bg-[#1A5345] hover:bg-[#1A5345] rounded-lg px-2.5 py-1 text-[11px] font-bold">{conditions.length} Active</Badge>
            </div>
            <div className="divide-y divide-[#E8E6E0]/60">
              {conditions.length === 0 ? (
                <p className="p-6 text-[14px] font-medium text-muted-foreground">{emptyMessage}</p>
              ) : conditions.map((condition) => (
                <div key={condition.id} className="p-6 hover:bg-[#F9F8F5]/30 transition-colors group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-[16px] font-bold text-[#1A1F1E] group-hover:text-[#1A5345] transition-colors">{condition.name}</h4>
                        <span className={cn(
                          "size-1.5 rounded-full",
                          condition.severity === "high" ? "bg-red-500" : condition.severity === "moderate" ? "bg-amber-500" : "bg-emerald-500"
                        )} />
                      </div>
                      <p className="text-[12px] font-medium text-muted-foreground flex items-center gap-1.5">
                        <CalendarIcon className="size-3.5" />
                        Diagnosed: {condition.diagnosedDate}
                      </p>
                    </div>
                    <Badge variant="outline" className={cn(
                      "rounded-lg px-2.5 py-0.5 text-[11px] font-bold capitalize border-0 shadow-sm",
                      condition.status === "active" ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"
                    )}>
                      {condition.status}
                    </Badge>
                  </div>
                  <div className="relative pl-4 border-l-2 border-[#E8E6E0] mt-4">
                    <p className="text-[14px] leading-relaxed text-[#1A1F1E]/80 italic">
                      <InfoIcon className="inline-block size-3.5 mr-1.5 -mt-0.5 text-muted-foreground/60" />
                      {condition.notes}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Surgical History Section */}
          <section className="bg-white rounded-2xl border border-[#E8E6E0]/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="px-6 py-5 border-b border-[#E8E6E0]/60 flex items-center justify-between bg-[#FAFAF8]/50">
              <div className="flex items-center gap-3">
                <SyringeIcon className="size-5 text-violet-600" strokeWidth={2.5} />
                <h3 className="text-[17px] font-bold text-[#1A1F1E]">Surgical History</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="flex flex-col gap-4">
                {surgeries.length === 0 ? (
                  <p className="p-6 text-[14px] font-medium text-muted-foreground">No surgical history recorded.</p>
                ) : surgeries.map((surgery) => (
                  <div 
                    key={surgery.id} 
                    className="flex flex-col sm:flex-row gap-0 overflow-hidden rounded-2xl border border-[#E8E6E0]/80 bg-white shadow-sm transition-all hover:shadow-md hover:border-[#1A5345]/20 group"
                  >
                    {/* Date Sidebar — matching premium medical style */}
                    <div className="flex flex-row sm:flex-col items-center justify-center gap-2 sm:gap-1 px-5 py-4 bg-[#F9F8F5] border-b sm:border-b-0 sm:border-r border-[#E8E6E0]/60 min-w-[110px]">
                      <span className="text-[16px] font-black text-[#1A5345] tabular-nums tracking-tight">{surgery.date.split(',')[1].trim()}</span>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-[#6B7870]">{surgery.date.split(',')[0].trim()}</span>
                    </div>

                    <div className="flex-1 p-5 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="text-[16px] font-bold text-[#1A1F1E] group-hover:text-[#1A5345] transition-colors leading-tight">{surgery.procedure}</h4>
                        <div className="size-8 rounded-lg bg-[#F9F8F5] flex items-center justify-center shrink-0 border border-[#E8E6E0]/40">
                          <StethoscopeIcon className="size-4 text-[#1A5345]" />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-y-2 gap-x-5 mt-auto">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-bold uppercase tracking-tight text-[#6B7870]">Lead Surgeon</span>
                           <span className="text-[13px] font-bold text-[#1A1F1E]">{surgery.surgeon}</span>
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[10px] font-bold uppercase tracking-tight text-[#6B7870]">Outcome Status</span>
                           <div className="flex items-center gap-1.5 mt-0.5">
                             <CheckCircle2Icon className="size-3.5 text-emerald-600" />
                             <span className="text-[13px] font-bold text-emerald-700">{surgery.outcome.split(',')[0]}</span>
                           </div>
                        </div>
                        <div className="flex flex-col hidden lg:flex">
                           <span className="text-[10px] font-bold uppercase tracking-tight text-[#6B7870]">Facility</span>
                           <span className="text-[13px] font-bold text-[#1A1F1E]">{surgery.hospital}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="hidden sm:flex items-center pr-4">
                      <ChevronRightIcon className="size-5 text-muted-foreground/20 group-hover:text-[#1A5345]/40 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>

        {/* Right Column: Allergies, Family History, Lifestyle */}
        <div className="space-y-8">
          
          {/* Allergies Section */}
          <section className="bg-white rounded-2xl border border-[#E8E6E0]/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="px-6 py-5 border-b border-[#E8E6E0]/60 bg-red-50/30">
              <div className="flex items-center gap-3">
                <ShieldAlertIcon className="size-5 text-red-600" strokeWidth={2.5} />
                <h3 className="text-[16px] font-bold text-[#1A1F1E]">Allergies</h3>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {allergies.length === 0 ? (
                <p className="p-6 text-[14px] font-medium text-muted-foreground">No allergies recorded.</p>
              ) : allergies.map((allergy) => (
                <div key={allergy.id} className="p-3 rounded-xl bg-red-50/20 border border-red-100/50 flex items-start gap-3">
                  <div className="size-2 rounded-full bg-red-500 mt-2 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-[14px] font-bold text-[#1A1F1E]">{allergy.allergen}</p>
                    <p className="text-[12px] font-medium text-red-600/80">{allergy.reaction}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Family History Section */}
          <section className="bg-white rounded-2xl border border-[#E8E6E0]/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="px-6 py-5 border-b border-[#E8E6E0]/60">
              <div className="flex items-center gap-3">
                <UsersIcon className="size-5 text-blue-600" strokeWidth={2.5} />
                <h3 className="text-[16px] font-bold text-[#1A1F1E]">Family History</h3>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {familyHistory.length === 0 ? (
                <p className="p-6 text-[14px] font-medium text-muted-foreground">No family history recorded.</p>
              ) : familyHistory.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-slate-50 flex items-center justify-center text-[11px] font-bold text-[#1A5345]">
                      {item.relation[0]}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-[#1A1F1E]">{item.condition}</p>
                      <p className="text-[11px] font-medium text-muted-foreground">{item.relation}</p>
                    </div>
                  </div>
                  {item.ageOfOnset && (
                    <Badge variant="outline" className="text-[10px] border-[#E8E6E0] font-bold text-[#1A5345]">
                      Onset: {item.ageOfOnset}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Lifestyle Summary Section */}
          <section className="bg-white rounded-2xl border border-[#E8E6E0]/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="px-6 py-5 border-b border-[#E8E6E0]/60">
              <div className="flex items-center gap-3">
                <HeartIcon className="size-5 text-emerald-600" strokeWidth={2.5} />
                <h3 className="text-[16px] font-bold text-[#1A1F1E]">Lifestyle Factors</h3>
              </div>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-white border border-[#E8E6E0]/60 flex flex-col gap-3 shadow-sm transition-all hover:shadow-md">
                <div className="size-8 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-full overflow-visible">
                    <g className="animate-pulse duration-[3000ms]">
                      <path d="M15 7C15 5 17 4.5 17 2.5" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
                      <path d="M18 9C18 7 20 6.5 20 4.5" stroke="#CBD5E1" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
                    </g>
                    <rect x="3" y="15.5" width="15" height="1.5" rx="0.75" fill="#1A5345" opacity="0.08" />
                    <rect x="2" y="12.5" width="16" height="4" rx="1" fill="white" stroke="#E2E8F0" strokeWidth="0.5" />
                    <path d="M2 13.5a1 1 0 0 1 1-1h4v4h-4a1 1 0 0 1-1-1v-2z" fill="#D9772B" />
                    <rect x="16" y="12.5" width="2" height="4" fill="#475569" />
                    <g className="animate-pulse duration-1000">
                      <rect x="18" y="12.5" width="1.5" height="4" rx="0.5" fill="#F43F5E" />
                      <circle cx="19" cy="14.5" r="2.5" fill="#F43F5E" opacity="0.2" />
                    </g>
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-tight text-[#6B7870]">Smoking</p>
                  <p className="text-[14px] font-bold text-emerald-600">Ex-Smoker</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-[#E8E6E0]/60 flex flex-col gap-3 shadow-sm transition-all hover:shadow-md">
                <DumbbellIcon className="size-5 text-[#1A5345]" strokeWidth={2.5} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-tight text-[#6B7870]">Exercise</p>
                  <p className="text-[14px] font-bold text-rose-600">Low Activity</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-[#E8E6E0]/60 flex flex-col gap-3 shadow-sm transition-all hover:shadow-md">
                <SaladIcon className="size-5 text-[#1A5345]" strokeWidth={2.5} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-tight text-[#6B7870]">Diet</p>
                  <p className="text-[14px] font-bold text-[#D9772B]">Moderate</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-[#E8E6E0]/60 flex flex-col gap-3 shadow-sm transition-all hover:shadow-md">
                <ZapIcon className="size-5 text-[#1A5345]" strokeWidth={2.5} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-tight text-[#6B7870]">Stress</p>
                  <p className="text-[14px] font-bold text-rose-600">High Level</p>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
      
      {/* Footer Info */}
      <div className="mt-4 p-6 rounded-2xl bg-[#1A5345]/[0.02] border border-[#1A5345]/10 flex items-start gap-4">
        <ShieldCheckIcon className="size-6 text-[#1A5345] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-[14px] font-bold text-[#1A1F1E]">Confidential Medical Record</p>
          <p className="text-[12px] font-medium text-muted-foreground leading-relaxed">
            This medical history is strictly confidential and protected by health privacy laws. Access is limited to authorized medical personnel only. Last verified on May 08, 2026 by Dr. Sarah Jenkins.
          </p>
        </div>
      </div>
    </div>
  )
}
