"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  BellIcon,
  BrainCircuitIcon,
  CalendarIcon,
  CheckCircle2Icon,
  CheckIcon,
  ClockIcon,
  FlagIcon,
  MessageSquareTextIcon,
  MoreVerticalIcon,
  PencilLineIcon,
  FileTextIcon,
  PillIcon,
  SyringeIcon,
  BeakerIcon,
  SparklesIcon,
  StethoscopeIcon,
  XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { MedicationLine } from "./assistantMedications.types";
import {
  AdherencePill,
  formatDate,
  formatDateTime,
  MedicationDots,
  MedicationSnapshotCard,
  medicationsScrollbarCss,
  RiskBadge,
} from "./assistantMedications.shared";
import { useAssistantMedications } from "./useAssistantMedications";
import { FlagMedicationDialog } from "./FlagMedicationDialog";
import { MedicationReminderDialog } from "./MedicationReminderDialog";
import { EditMedicationInstructionsDialog } from "./EditMedicationInstructionsDialog";
import { EscalateMedicationDialog } from "./EscalateMedicationDialog";
import { MedicationRecordDialog } from "./MedicationRecordDialog";

type AssistantMedicationsPatientDetailProps = {
  /** Resolved in `page.tsx` via `await params` (Next.js 15+). */
  patientId?: string
}

function MedicationIcon({ type, className }: { type?: "pill" | "injection" | "solution"; className?: string }) {
  if (type === "injection") return <SyringeIcon className={cn("text-sky-500", className)} />;
  if (type === "solution") return <BeakerIcon className={cn("text-purple-500", className)} />;
  return (
    <svg 
      className={cn("drop-shadow-sm", className)} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="rotate(-45 12 12)">
        <path d="M7 12V8C7 5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8V12H7Z" fill="#3B82F6" />
        <path d="M7 12V16C7 18.7614 9.23858 21 12 21C14.7614 21 17 18.7614 17 16V12H7Z" fill="#EF4444" />
        <line x1="7" y1="12" x2="17" y2="12" stroke="white" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

export function AssistantMedicationsPatientDetail({ patientId: patientIdFromRoute }: AssistantMedicationsPatientDetailProps = {}) {
  const params = useParams();
  const patientIdParam = patientIdFromRoute ?? params.patientId;
  const patientId =
    typeof patientIdParam === "string" ? patientIdParam : Array.isArray(patientIdParam) ? patientIdParam[0] ?? "" : "";

  const vm = useAssistantMedications({ routePatientId: patientId });

  const [flagMedId, setFlagMedId] = useState<string | null>(null);
  const [editLine, setEditLine] = useState<MedicationLine | null>(null);
  const [recordMedName, setRecordMedName] = useState<string | null>(null);
  const [recordMedStrength, setRecordMedStrength] = useState<string | null>(null);
  const [recordMedType, setRecordMedType] = useState<MedicationLine["type"] | undefined>(undefined);
  const [recordMedDosage, setRecordMedDosage] = useState<string | null>(null);
  const [recordMedFrequency, setRecordMedFrequency] = useState<string | null>(null);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderMedSummary, setReminderMedSummary] = useState<string | null>(null);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [escalateMedicationId, setEscalateMedicationId] = useState<string | null>(null);
  const [escalationReason, setEscalationReason] = useState("");
  const [medicationsTab, setMedicationsTab] = useState<"active" | "past">("active");

  const flagMedication = useMemo(() => 
    vm.selectedProfile?.medications.find((m) => m.id === flagMedId) ?? null,
    [vm.selectedProfile, flagMedId]
  );

  const openPatientReminder = () => {
    setReminderMedSummary(null);
    setReminderOpen(true);
  };

  const openMedReminder = (line: MedicationLine) => {
    setReminderMedSummary(`${line.name} ${line.strength}`);
    setReminderOpen(true);
  };

  const openEscalation = (line: MedicationLine | null, reason = "") => {
    setEscalateMedicationId(line?.id ?? null);
    setEscalationReason(reason);
    setEscalateOpen(true);
  };

  if (!patientId) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center gap-4 bg-[#F9F8F5] p-8 text-center">
        <p className="text-sm text-muted-foreground">Missing patient.</p>
        <Button asChild className="rounded-xl">
          <Link href="/assistant-medications">Back to list</Link>
        </Button>
      </div>
    );
  }

  const bcProfile = vm.selectedProfile;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#F9F8F5]">
      <header className="shrink-0 border-b border-[#E8E6E0]/60 bg-white px-6 py-4 sm:px-8">
        <Breadcrumb>
          <BreadcrumbList className="text-[10px] sm:text-[11px]">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/assistant-medications" className="text-[10px] font-medium sm:text-[11px]">
                  Medication adherence
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="max-w-[min(100vw-12rem,28rem)] truncate text-[10px] font-medium text-foreground sm:text-[11px]">
                {bcProfile
                  ? bcProfile.fullName
                  : vm.isLoading
                    ? "Loading…"
                    : "Patient"}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex min-h-0 flex-1 flex-col bg-white">
        {vm.isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
            Loading patient…
          </div>
        ) : !vm.selectedProfile ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-12 text-center">
            <PillIcon className="size-12 text-muted-foreground/30" />
            <h2 className="text-lg font-bold text-[#1A1F1E]">Patient not found</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              This patient is not in the adherence list or the link is invalid.
            </p>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/assistant-medications">Back to medication adherence</Link>
            </Button>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden animate-in fade-in duration-300">
              {/* Detail Header */}
              <div className="z-10 flex flex-wrap items-center justify-between gap-4 border-b border-[#E8E6E0]/60 bg-[#F9F8F5] px-8 py-6">
                 <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-white flex items-center justify-center border border-[#E8E6E0]/60 overflow-hidden shadow-sm">
                       <Image
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(vm.selectedProfile.fullName.replace(/\s+/g, ""))}`}
                          alt=""
                          width={48}
                          height={48}
                          unoptimized
                          className="size-full object-cover"
                       />
                    </div>
                    <div>
                       <div className="flex items-center gap-3">
                          <h2 className="text-[20px] font-bold text-[#1A1F1E] tracking-tight">{vm.selectedProfile.fullName}</h2>
                          <RiskBadge tier={vm.selectedProfile.riskTier} />
                       </div>
                       <p className="text-[13px] font-medium text-muted-foreground mt-0.5">
                          {vm.selectedProfile.age} years old · {vm.selectedProfile.phone || "No phone provided"}
                       </p>
                    </div>
                 </div>
                 <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-8 rounded-lg border border-[#E8E6E0] bg-white px-4 text-[12px] font-bold text-[#1A1F1E] shadow-sm transition-colors hover:bg-slate-50 hover:text-[#1A5345]"
                      onClick={() => openEscalation(null, "Medication workflow needs doctor review.")}
                    >
                       <StethoscopeIcon className="size-4 mr-2 text-violet-600" />
                       Escalate review
                    </Button>
                    <Button 
                      size="sm"
                      className="h-8 rounded-lg bg-[#1A5345] px-5 text-[12px] font-bold text-white shadow-sm border-0 transition-colors hover:bg-[#133F34]"
                      onClick={openPatientReminder}
                    >
                       <BellIcon className="size-4 mr-2" />
                       Send nudge
                    </Button>
                 </div>
              </div>

              {/* Detail Content */}
              <ScrollArea className="flex-1 custom-scrollbar">
                <div className="p-8 space-y-10">
                   
                   {/* Workflow Snapshot Cards */}
                   <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                      <MedicationSnapshotCard label="Adherence score">
                         <div className="flex items-baseline gap-2">
                            <span className="text-[18px] font-bold leading-none tabular-nums text-[#1A1F1E]">
                              {vm.selectedProfile.overallAdherencePct}%
                            </span>
                            <AdherencePill pct={vm.selectedProfile.overallAdherencePct} />
                         </div>
                      </MedicationSnapshotCard>
                      <MedicationSnapshotCard label="Medications">
                         <div className="flex items-center gap-2">
                            <span className="text-[18px] font-bold leading-none tabular-nums text-[#1A5345]">
                              {vm.selectedProfile.medications.length}
                            </span>
                            <PillIcon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
                         </div>
                      </MedicationSnapshotCard>
                      <MedicationSnapshotCard label="Follow-up items">
                         <p className="text-[18px] font-bold leading-none tabular-nums text-amber-600">
                           {vm.selectedFollowUpItems.length}
                         </p>
                      </MedicationSnapshotCard>
                      <MedicationSnapshotCard label="Active flags" className="space-y-2">
                         <div className="flex items-center gap-2">
                            <span className="text-[18px] font-bold leading-none tabular-nums text-rose-600">
                               {vm.selectedProfile.flags.filter((f) => f.status === "open").length}
                            </span>
                            <FlagIcon className="size-5 shrink-0 text-rose-600" aria-hidden />
                         </div>
                      </MedicationSnapshotCard>
                      <MedicationSnapshotCard label="Last contact" className="space-y-2">
                         {vm.selectedProfile.contactHistory[0] ? (
                           <div className="space-y-1.5">
                             <div className="flex min-w-0 items-center gap-2">
                               <CalendarIcon className="size-4 shrink-0 text-[#1A5345]/70" aria-hidden />
                               <span className="text-[13px] font-bold leading-none text-[#1A1F1E]">
                                 {formatDate(vm.selectedProfile.contactHistory[0].createdAt)}
                               </span>
                             </div>
                             <div className="flex min-w-0 items-center gap-2">
                               <ClockIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                               <span className="min-w-0 text-[11px] font-medium tabular-nums text-[#6B7870]">
                                 {new Intl.DateTimeFormat("en-US", {
                                   hour: "numeric",
                                   minute: "2-digit",
                                   hour12: true,
                                 }).format(new Date(vm.selectedProfile.contactHistory[0].createdAt))}
                               </span>
                             </div>
                           </div>
                         ) : (
                           <p className="text-[13px] font-medium text-[#6B7870]">No history</p>
                         )}
                      </MedicationSnapshotCard>
                   </div>

                   {/* Main Sections Grid */}
                   <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                      
                      {/* Left Side: Medications Table */}
                      <div className="xl:col-span-2 space-y-8">
                         <section>
                             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                                   <div className="flex items-center gap-2">
                                      <PillIcon className="size-5 text-[#1A5345]" />
                                      <h3 className="text-[18px] font-bold text-[#1A1F1E]">Medications</h3>
                                   </div>
                                   <div className="flex items-center rounded-lg border border-[#E8E6E0] bg-[#F9F8F5] p-0.5 shadow-sm">
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => setMedicationsTab("active")}
                                        className={cn("h-7 rounded-md px-3 text-[11px] font-bold transition-all", medicationsTab === "active" ? "bg-white text-[#1A1F1E] shadow-sm" : "text-muted-foreground hover:text-[#1A1F1E]")}
                                      >
                                         Active
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => setMedicationsTab("past")}
                                        className={cn("h-7 rounded-md px-3 text-[11px] font-bold transition-all", medicationsTab === "past" ? "bg-white text-[#1A1F1E] shadow-sm" : "text-muted-foreground hover:text-[#1A1F1E]")}
                                      >
                                         Past & History
                                      </Button>
                                   </div>
                                </div>
                                <div className="flex items-center gap-2">
                                   <Button onClick={() => alert('Preparing Adherence Report for ' + vm.selectedProfile?.fullName + '...')} variant="outline" size="sm" className="h-8 rounded-lg border-[#E8E6E0] bg-white text-[12px] font-bold text-[#1A5345] hover:bg-[#F9F8F5] shadow-sm">
                                      <FileTextIcon className="size-3.5 mr-1.5" />
                                      Adherence report
                                   </Button>
                                </div>
                             </div>
                            
                            <div className="rounded-2xl border border-[#E8E6E0]/80 bg-white overflow-hidden shadow-sm">
                               <div className="overflow-x-auto">
                                  <table className="w-full text-left border-collapse min-w-[700px]">
                                     <thead>
                                        <tr className="bg-[#F9F8F5] border-b border-[#E8E6E0]/60">
                                           <th className="px-5 py-4 text-[13px] font-bold tracking-normal text-[#1A1F1E]">Drug name</th>
                                           <th className="px-5 py-4 text-[13px] font-bold tracking-normal text-[#1A1F1E]">Dosage</th>
                                           <th className="px-5 py-4 text-[13px] font-bold tracking-normal text-[#1A1F1E]">7-day adherence</th>
                                           <th className="px-5 py-4 text-right text-[13px] font-bold tracking-normal text-[#1A1F1E]">Actions</th>
                                        </tr>
                                     </thead>
                                     <tbody className="divide-y divide-[#E8E6E0]/40">
                                        {medicationsTab === "active" ? vm.selectedProfile.medications.map((m) => (
                                           <tr key={m.id} className="group hover:bg-[#F9F8F5]/30 transition-colors">
                                              <td className="px-5 py-4">
                                                 <div className="flex items-center gap-2">
                                                    <p className="text-[14px] font-bold text-[#1A1F1E] group-hover:text-[#1A5345] transition-colors">{m.name}</p>
                                                    <MedicationIcon type={m.type} className="size-[18px] shrink-0 opacity-90" />
                                                 </div>
                                                 <p className="text-[11px] font-medium text-muted-foreground mt-0.5">{m.strength}</p>
                                              </td>
                                              <td className="px-5 py-4">
                                                 <p className="text-[13px] font-medium text-[#1A1F1E]/80 leading-relaxed max-w-[200px]">{m.dosageInstructions}</p>
                                              </td>
                                              <td className="px-5 py-4">
                                                 <div className="flex max-w-[148px] flex-col gap-1.5">
                                                    <MedicationDots history={m.adherenceHistory7d} />
                                                    <div className="flex items-center gap-2">
                                                       <div className="h-1 min-w-0 flex-1 rounded-full bg-[#E8E6E0] overflow-hidden">
                                                          <div
                                                             className={cn(
                                                               "h-full rounded-full bg-emerald-500",
                                                               m.adherencePct7d < 85 && "bg-amber-500",
                                                               m.adherencePct7d < 65 && "bg-rose-500"
                                                             )}
                                                             style={{ width: `${m.adherencePct7d}%` }}
                                                          />
                                                       </div>
                                                       <span className="shrink-0 text-[10px] font-bold tabular-nums text-muted-foreground">
                                                          {m.adherencePct7d}%
                                                       </span>
                                                    </div>
                                                 </div>
                                              </td>
                                              <td className="px-5 py-4 text-right">
                                                 <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="size-8 border-0 bg-transparent text-rose-600 hover:bg-transparent hover:text-rose-700 shadow-none transition-colors" onClick={() => setFlagMedId(m.id)}>
                                                       <FlagIcon className="size-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="size-8 border-0 bg-transparent text-violet-600 hover:bg-transparent hover:text-violet-700 shadow-none transition-colors" onClick={() => openEscalation(m, `${m.name} ${m.strength} needs review.`)}>
                                                       <StethoscopeIcon className="size-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="size-8 border-0 bg-transparent text-[#1A5345] hover:bg-transparent hover:text-[#0F3D32] shadow-none transition-colors" onClick={() => openMedReminder(m)}>
                                                       <BellIcon className="size-4" />
                                                    </Button>
                                                    <DropdownMenu>
                                                       <DropdownMenuTrigger asChild>
                                                          <Button variant="ghost" size="icon" className="size-8 border-0 bg-transparent text-muted-foreground hover:bg-transparent hover:text-[#1A1F1E] shadow-none transition-colors">
                                                             <MoreVerticalIcon className="size-4" />
                                                          </Button>
                                                       </DropdownMenuTrigger>
                                                       <DropdownMenuContent align="end" className="rounded-xl p-1.5 w-48 shadow-lg border-[#E8E6E0]/60">
                                                          <DropdownMenuItem onClick={() => setEditLine(m)}>
                                                             <PencilLineIcon className="size-3.5 mr-2" />
                                                             Edit care note
                                                          </DropdownMenuItem>
                                                          <DropdownMenuItem onClick={() => { setRecordMedName(m.name); setRecordMedStrength(m.strength); setRecordMedType(m.type); setRecordMedDosage(m.dosageInstructions); setRecordMedFrequency(m.frequencyLabel); }}>
                                                             <ClockIcon className="size-3.5 mr-2" />
                                                             View history
                                                          </DropdownMenuItem>
                                                       </DropdownMenuContent>
                                                    </DropdownMenu>
                                                 </div>
                                              </td>
                                           </tr>
                                        )) : (
                                           <tr className="group hover:bg-[#F9F8F5]/30 transition-colors">
                                              <td className="px-5 py-4">
                                                 <div className="flex items-center gap-2">
                                                    <p className="text-[14px] font-bold text-[#1A1F1E] group-hover:text-[#1A5345] transition-colors">Lisinopril</p>
                                                    <MedicationIcon type="pill" className="size-[18px] shrink-0 opacity-60 grayscale" />
                                                 </div>
                                                 <p className="text-[11px] font-medium text-muted-foreground mt-0.5">10 mg</p>
                                              </td>
                                              <td className="px-5 py-4">
                                                 <p className="text-[13px] font-medium text-[#1A1F1E]/80 leading-relaxed max-w-[200px]">1 tablet daily. Discontinued on Feb 10, 2026 due to dry cough.</p>
                                              </td>
                                              <td className="px-5 py-4">
                                                 <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-0 text-[10px] font-bold">Discontinued</Badge>
                                              </td>
                                              <td className="px-5 py-4 text-right">
                                                 <Button variant="ghost" size="sm" onClick={() => { setRecordMedName("Lisinopril"); setRecordMedStrength("10 mg"); setRecordMedType("pill"); setRecordMedDosage("1 tablet every morning"); setRecordMedFrequency("QD AM"); }} className="h-8 rounded-lg text-[11px] font-bold text-[#1A5345] hover:bg-[#1A5345]/5">
                                                    <ClockIcon className="size-3.5 mr-1.5" />
                                                    View record
                                                 </Button>
                                              </td>
                                           </tr>
                                        )}
                                     </tbody>
                                  </table>
                               </div>
                            </div>
                         </section>

                         {/* Contact & Escalation History - Dual Lists */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <section className="space-y-4">
                               <h3 className="text-[15px] font-bold text-[#1A1F1E] flex items-center gap-2">
                                  <MessageSquareTextIcon className="size-4 text-[#1A5345]" />
                                  Recent activity
                               </h3>
                               <div className="space-y-3">
                                  {vm.selectedProfile.contactHistory.length === 0 ? (
                                    <p className="text-[12px] text-muted-foreground italic px-2">No activity logged.</p>
                                  ) : (
                                    vm.selectedProfile.contactHistory.slice(0, 3).map(event => (
                                      <div key={event.id} className="p-4 rounded-xl border border-[#E8E6E0]/80 bg-[#F9F8F5]/30 space-y-2">
                                         <div className="flex items-center justify-between">
                                            <Badge variant="outline" className="text-[9px] font-bold bg-white">{event.channel}</Badge>
                                            <span className="text-[10px] font-medium text-muted-foreground">{formatDateTime(event.createdAt).split(',')[0]}</span>
                                         </div>
                                         <p className="text-[13px] font-bold text-[#1A1F1E]">{event.summary}</p>
                                         <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{event.messagePreview}</p>
                                      </div>
                                    ))
                                  )}
                               </div>
                            </section>

                            <section className="space-y-4">
                               <h3 className="text-[15px] font-bold text-[#1A1F1E] flex items-center gap-2">
                                  <StethoscopeIcon className="size-4 text-violet-600" />
                                  Escalation logs
                               </h3>
                               <div className="space-y-3">
                                  {vm.selectedProfile.escalations.length === 0 ? (
                                    <p className="text-[12px] text-muted-foreground italic px-2">No active escalations.</p>
                                  ) : (
                                    vm.selectedProfile.escalations.slice(0, 3).map(event => (
                                      <div key={event.id} className="p-4 rounded-xl border border-[#E8E6E0]/80 bg-[#FBFDFC] space-y-2">
                                         <div className="flex items-center justify-between">
                                            <Badge className="bg-violet-50 text-violet-700 border-violet-100 text-[10px] font-bold rounded-lg shadow-sm">Waiting</Badge>
                                            <span className="text-[10px] font-medium text-muted-foreground">{formatDateTime(event.createdAt).split(',')[0]}</span>
                                         </div>
                                         <p className="text-[13px] font-bold text-[#1A1F1E]">{event.reason}</p>
                                         <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{event.note}</p>
                                      </div>
                                    ))
                                  )}
                               </div>
                            </section>
                         </div>
                      </div>

                      {/* Right Side: AI Insights & Flags */}
                      <div className="space-y-8">
                         
                         {/* AI Insights - Modern Design */}
                         <section className="space-y-4">
                            <div className="flex items-center gap-2">
                               <BrainCircuitIcon className="size-5 text-violet-600" />
                               <h3 className="text-[16px] font-bold text-[#1A1F1E]">Safety insights</h3>
                            </div>
                            <div className="space-y-3">
                               {vm.selectedProfile.aiInsights.length === 0 ? (
                                 <div className="p-8 rounded-2xl border border-dashed border-[#E8E6E0] text-center bg-[#F9F8F5]/30">
                                    <SparklesIcon className="size-6 text-muted-foreground/20 mx-auto mb-2" />
                                    <p className="text-[12px] font-medium text-muted-foreground">No active AI alerts</p>
                                 </div>
                               ) : (
                                 vm.selectedProfile.aiInsights.map(insight => (
                                   <div key={insight.id} className="group relative p-5 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/50 to-white shadow-sm overflow-hidden">
                                      <div className="absolute top-0 right-0 p-2">
                                         <Button 
                                           variant="ghost" 
                                           size="icon" 
                                           className="size-7 rounded-lg hover:bg-violet-100 text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                           onClick={() => vm.dismissInsightMutation.mutate({ patientId: vm.selectedProfile!.id, insightId: insight.id })}
                                         >
                                            <XIcon className="size-3.5" />
                                         </Button>
                                      </div>
                                      <div className="flex items-center gap-2 mb-3">
                                         <Badge className="bg-violet-600 text-[10px] font-bold text-white border-0 rounded-lg shadow-sm">{insight.kind}</Badge>
                                         <span className="text-[10px] font-bold text-violet-600/60 tracking-tight">{insight.confidencePct}% match</span>
                                      </div>
                                      <h4 className="text-[14px] font-bold text-[#1A1F1E] mb-1">{insight.title}</h4>
                                      <p className="text-[12px] text-violet-900/70 leading-relaxed">{insight.detail}</p>
                                   </div>
                                 ))
                               )}
                            </div>
                         </section>

                         {/* Active Flags - High Priority */}
                         <section className="space-y-4">
                            <div className="flex items-center gap-2">
                               <FlagIcon className="size-5 text-rose-600" />
                               <h3 className="text-[16px] font-bold text-[#1A1F1E]">Risk flags</h3>
                            </div>
                            <div className="space-y-3">
                               {vm.selectedProfile.flags.filter(f => f.status === 'open').length === 0 ? (
                                 <div className="p-8 rounded-2xl border border-dashed border-[#E8E6E0] text-center bg-[#F9F8F5]/30">
                                    <CheckCircle2Icon className="size-6 text-emerald-500/20 mx-auto mb-2" />
                                    <p className="text-[12px] font-medium text-muted-foreground">No active risk flags</p>
                                 </div>
                               ) : (
                                 vm.selectedProfile.flags.filter(f => f.status === 'open').map(flag => (
                                   <div key={flag.id} className="p-5 rounded-2xl border border-rose-100 bg-white shadow-sm space-y-3">
                                      <div className="flex items-center justify-between">
                                         <Badge className={cn(
                                           "text-[10px] font-bold border-0 rounded-lg shadow-sm",
                                           flag.severity === 'critical' ? "bg-rose-600 text-white" : "bg-amber-600 text-white"
                                         )}>
                                            {flag.severity}
                                         </Badge>
                                         <span className="text-[10px] font-medium text-muted-foreground">{formatDateTime(flag.createdAt).split(',')[0]}</span>
                                      </div>
                                      <div>
                                         <p className="text-[13px] font-bold text-[#1A1F1E]">{flag.reason}</p>
                                         <p className="text-[11px] text-muted-foreground mt-1">Logged by {flag.createdByLabel}</p>
                                      </div>
                                      <Button 
                                        variant="outline" 
                                        className="w-full rounded-xl h-9 text-[12px] font-bold border-rose-200 text-rose-600 hover:bg-rose-50"
                                        onClick={() => vm.resolveFlagMutation.mutate({ patientId: vm.selectedProfile!.id, flagId: flag.id })}
                                      >
                                         <CheckIcon className="size-3.5 mr-2" />
                                         Mark as resolved
                                      </Button>
                                   </div>
                                 ))
                               )}
                            </div>
                         </section>

                      </div>
                   </div>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

      {/* Dialogs - Functionality Maintained, IDs provided for logic */}
      {flagMedication && (
        <FlagMedicationDialog
          open={true}
          onOpenChange={(v) => !v && setFlagMedId(null)}
          medicationLabel={`${flagMedication.name} ${flagMedication.strength}`}
          patientLabel={vm.selectedProfile?.fullName ?? ""}
          isPending={vm.flagMedicationMutation.isPending}
          onSubmit={async (values) => {
            if (!vm.selectedProfile) return;
            await vm.flagMedicationMutation.mutateAsync({
              patientId: vm.selectedProfile.id,
              medicationLineId: flagMedication.id,
              severity: values.severity,
              reason: values.reason,
            });
          }}
        />
      )}

      {editLine && (
        <EditMedicationInstructionsDialog
          open={true}
          onOpenChange={(v) => !v && setEditLine(null)}
          medicationLabel={`${editLine.name} ${editLine.strength}`}
          patientLabel={vm.selectedProfile?.fullName ?? ""}
          initialInstructions={editLine.dosageInstructions}
          isPending={vm.updateInstructionsMutation.isPending}
          onSubmit={async (dosageInstructions) => {
            if (!vm.selectedProfile) return;
            await vm.updateInstructionsMutation.mutateAsync({
              patientId: vm.selectedProfile.id,
              medicationLineId: editLine.id,
              dosageInstructions,
            });
          }}
        />
      )}

      {reminderOpen && (
        <MedicationReminderDialog
          open={true}
          onOpenChange={setReminderOpen}
          profile={vm.selectedProfile}
          medicationSummary={reminderMedSummary}
          isPending={vm.sendReminderMutation.isPending}
          onSubmit={async (values) => {
            if (!vm.selectedProfile) return;
            await vm.sendReminderMutation.mutateAsync({
              patientId: vm.selectedProfile.id,
              channel: values.channel,
              message: values.message,
              medicationSummary: reminderMedSummary,
              templateLabel: values.templateLabel,
            });
          }}
        />
      )}

      {escalateOpen && (
        <EscalateMedicationDialog
          open={true}
          onOpenChange={setEscalateOpen}
          profile={vm.selectedProfile}
          initialMedicationLineId={escalateMedicationId}
          suggestedReason={escalationReason}
          isPending={vm.escalateToDoctorMutation.isPending}
          onSubmit={async (values) => {
            if (!vm.selectedProfile) return;
            await vm.escalateToDoctorMutation.mutateAsync({
              patientId: vm.selectedProfile.id,
              medicationLineId: values.medicationLineId,
              priority: values.priority,
              reason: values.reason,
              note: values.note,
            });
          }}
        />
      )}

      {recordMedName && (
        <MedicationRecordDialog
          open={true}
          onOpenChange={(v) => !v && setRecordMedName(null)}
          medicationName={recordMedName}
          strength={recordMedStrength ?? undefined}
          type={recordMedType}
          dosageInstructions={recordMedDosage ?? undefined}
          frequencyLabel={recordMedFrequency ?? undefined}
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: medicationsScrollbarCss() }} />
    </div>
  );
}
