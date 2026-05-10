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

export function MedicalHistory() {
  return (
    <div className="w-full px-4 sm:px-8 py-8 flex flex-col gap-10 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-[24px] font-bold text-[#1A1F1E] tracking-tight font-serif">Medical History</h2>
          <p className="text-[14px] font-medium text-muted-foreground">Comprehensive record of clinical conditions and surgical history.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="h-10 rounded-xl border-[#E8E6E0] bg-white px-4 text-[13px] font-bold text-[#1A1F1E] hover:bg-[#F9F8F5]">
             <HistoryIcon className="mr-2 size-4 text-muted-foreground" />
             View Audit Log
           </Button>
           <Button className="h-10 rounded-xl bg-[#1A5345] px-5 text-[13px] font-bold text-white hover:bg-[#133F34] shadow-md border-0 transition-all hover:-translate-y-0.5">
             <PlusIcon className="mr-2 size-4" />
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
                <div className="size-10 rounded-xl bg-[#1A5345]/10 flex items-center justify-center">
                  <ActivityIcon className="size-5 text-[#1A5345]" />
                </div>
                <h3 className="text-[17px] font-bold text-[#1A1F1E]">Chronic Conditions</h3>
              </div>
              <Badge className="bg-[#1A5345] hover:bg-[#1A5345] rounded-lg px-2.5 py-1 text-[11px] font-bold">{MOCK_CONDITIONS.length} Active</Badge>
            </div>
            <div className="divide-y divide-[#E8E6E0]/60">
              {MOCK_CONDITIONS.map((condition) => (
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
                      "rounded-lg border-[#E8E6E0] bg-white px-2.5 py-0.5 text-[11px] font-bold capitalize",
                      condition.status === "active" ? "text-blue-600 border-blue-100 bg-blue-50/30" : "text-emerald-600 border-emerald-100 bg-emerald-50/30"
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
                <div className="size-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <SyringeIcon className="size-5 text-violet-600" />
                </div>
                <h3 className="text-[17px] font-bold text-[#1A1F1E]">Surgical History</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {MOCK_SURGERIES.map((surgery) => (
                  <div key={surgery.id} className="flex gap-6 p-4 rounded-xl border border-[#E8E6E0]/60 bg-[#FBFDFC] hover:border-[#1A5345]/30 transition-all">
                    <div className="flex flex-col items-center justify-center px-4 border-r border-[#E8E6E0]/60 text-center min-w-[100px]">
                      <span className="text-[13px] font-bold text-[#1A1F1E]">{surgery.date.split(',')[1]}</span>
                      <span className="text-[11px] font-medium text-muted-foreground">{surgery.date.split(',')[0]}</span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="text-[15px] font-bold text-[#1A1F1E]">{surgery.procedure}</h4>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-[12px] font-medium text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <StethoscopeIcon className="size-3.5 text-[#1A5345]" />
                          Surgeon: {surgery.surgeon}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <ZapIcon className="size-3.5 text-amber-500" />
                          Outcome: {surgery.outcome}
                        </span>
                      </div>
                    </div>
                    <ChevronRightIcon className="size-5 self-center text-muted-foreground/30" />
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
                <div className="size-9 rounded-xl bg-red-100 flex items-center justify-center">
                  <ShieldAlertIcon className="size-5 text-red-600" />
                </div>
                <h3 className="text-[16px] font-bold text-[#1A1F1E]">Allergies</h3>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {MOCK_ALLERGIES.map((allergy) => (
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
                <div className="size-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  <UsersIcon className="size-5 text-blue-600" />
                </div>
                <h3 className="text-[16px] font-bold text-[#1A1F1E]">Family History</h3>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {MOCK_FAMILY_HISTORY.map((item, idx) => (
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
                <div className="size-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <HeartIcon className="size-5 text-emerald-600" />
                </div>
                <h3 className="text-[16px] font-bold text-[#1A1F1E]">Lifestyle Factors</h3>
              </div>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-[#F9F8F5] border border-[#E8E6E0]/60 flex flex-col gap-2">
                <FlameIcon className="size-4 text-orange-500" />
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground">Smoking</p>
                  <p className="text-[13px] font-bold text-[#1A1F1E]">Ex-Smoker</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#F9F8F5] border border-[#E8E6E0]/60 flex flex-col gap-2">
                <DumbbellIcon className="size-4 text-blue-500" />
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground">Exercise</p>
                  <p className="text-[13px] font-bold text-[#1A1F1E]">Low Activity</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#F9F8F5] border border-[#E8E6E0]/60 flex flex-col gap-2">
                <SaladIcon className="size-4 text-emerald-500" />
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground">Diet</p>
                  <p className="text-[13px] font-bold text-[#1A1F1E]">Moderate</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#F9F8F5] border border-[#E8E6E0]/60 flex flex-col gap-2">
                <ZapIcon className="size-4 text-purple-500" />
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground">Stress</p>
                  <p className="text-[13px] font-bold text-[#1A1F1E]">High Level</p>
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
