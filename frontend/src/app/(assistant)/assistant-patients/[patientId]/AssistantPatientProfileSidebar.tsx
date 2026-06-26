"use client"

import {
  AlertCircleIcon,
  AlertTriangleIcon,
  BriefcaseIcon,
  CalendarPlusIcon,
  HeartIcon,
  HistoryIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  ScaleIcon,
  ShieldIcon,
  StethoscopeIcon,
  UsersIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PatientAvatar } from "@/components/shared/PatientAvatar"
import { patientRiskBadgeClassName } from "@/features/patient-record"
import type { AssistantPatientSummary } from "./assistantPatientProfile.types"

type AssistantPatientProfileSidebarProps = {
  patient: AssistantPatientSummary
}

export function AssistantPatientProfileSidebar({ patient }: AssistantPatientProfileSidebarProps) {
  return (
<div className="w-full lg:w-[440px] shrink-0 flex flex-col gap-6">

  {/* Combined Identity & Details Card */}
  <div className="rounded-2xl border border-[#E8E6E0]/80 bg-white shadow-sm overflow-hidden flex flex-col">
    {/* Header section — matching premium Medication style */}
    <div className="h-24 bg-[#F9F8F5] relative border-b border-[#E8E6E0]/60">
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, #1A5345 1px, transparent 0)", backgroundSize: "16px 16px" }}></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/40"></div>
    </div>
    <div className="px-6 pb-6 pt-0 relative flex flex-col items-center text-center">
      <div className="relative size-24 rounded-full border-4 border-white shadow-lg bg-slate-100 overflow-hidden -mt-12 mb-4">
        <PatientAvatar
          name={patient.name}
          avatarUrl={patient.avatarUrl}
          sizes="96px"
          initialsClassName="text-[22px]"
        />
      </div>
      <h2 className="text-[22px] font-bold text-[#1A1F1E] font-serif leading-tight">{patient.name}</h2>
      <div className="mt-1 flex items-center justify-center gap-2 text-[13px] font-medium text-[#6B7870]">
         <span>{patient.age} yrs</span>
         <span className="text-[#E8E6E0]">&bull;</span>
         <span>{patient.gender}</span>
      </div>

      <div className="mt-5 w-full flex items-center justify-center gap-2">
        <Badge className={patientRiskBadgeClassName(patient.riskLevel)}>
          <AlertCircleIcon className="mr-1 size-3.5" />
          {patient.riskLevel}
        </Badge>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F9F8F5] text-[#1A1F1E] border border-[#E8E6E0] shadow-none">
          <span className="text-[11px] font-bold tracking-widest">{patient.bloodType}</span>
        </div>
      </div>
    </div>

    {/* Divider */}
    <div className="px-6">
      <div className="h-px w-full bg-[#E8E6E0]/60" />
    </div>

    {/* Details List */}
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-bold text-[#1A1F1E]">Patient Details</h3>
        <div className="h-px flex-1 ml-4 bg-[#E8E6E0]/60" />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-x-4">
        <div className="flex min-w-0 items-start gap-3 sm:col-span-2">
          <PhoneIcon className="size-4 text-[#1A5345] shrink-0 mt-0.5" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-[11px] font-bold uppercase tracking-tight text-[#6B7870]">Phone</span>
            <span className="text-[14px] font-bold text-[#1A1F1E] tabular-nums">{patient.phone}</span>
          </div>
        </div>

        <div className="flex min-w-0 items-start gap-3 sm:col-span-2">
          <MailIcon className="size-4 text-[#1A5345] shrink-0 mt-0.5" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-[11px] font-bold uppercase tracking-tight text-[#6B7870]">Email</span>
            <a
              href={`mailto:${patient.email}`}
              className="text-[14px] font-bold text-[#1A1F1E] break-words [overflow-wrap:anywhere] hover:text-[#1A5345] transition-colors"
            >
              {patient.email}
            </a>
          </div>
        </div>

        <div className="flex min-w-0 items-start gap-3 sm:col-span-2">
          <MapPinIcon className="size-4 text-[#1A5345] shrink-0 mt-0.5" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-[11px] font-bold uppercase tracking-tight text-[#6B7870]">Address</span>
            <span className="text-[14px] font-bold text-[#1A1F1E] leading-snug">{patient.address}</span>
          </div>
        </div>

        <div className="flex min-w-0 items-start gap-3">
          <HeartIcon className="size-4 text-[#1A5345] shrink-0 mt-0.5" />
          <div className="flex min-w-0 flex-col">
            <span className="text-[11px] font-bold uppercase tracking-tight text-[#6B7870]">Marital</span>
            <span className="text-[14px] font-bold text-[#1A1F1E] truncate">{patient.maritalStatus}</span>
          </div>
        </div>

        <div className="flex min-w-0 items-start gap-3">
          <BriefcaseIcon className="size-4 text-[#1A5345] shrink-0 mt-0.5" />
          <div className="flex min-w-0 flex-col">
            <span className="text-[11px] font-bold uppercase tracking-tight text-[#6B7870]">Occupation</span>
            <span className="text-[14px] font-bold text-[#1A1F1E] truncate">{patient.occupation}</span>
          </div>
        </div>

        <div className="flex min-w-0 items-start gap-3">
          <CalendarPlusIcon className="size-4 text-[#1A5345] shrink-0 mt-0.5" />
          <div className="flex min-w-0 flex-col">
            <span className="text-[11px] font-bold uppercase tracking-tight text-[#6B7870]">Registered</span>
            <span className="text-[14px] font-bold text-[#1A1F1E] tabular-nums truncate">{patient.dateAdded}</span>
          </div>
        </div>

        <div className="flex min-w-0 items-start gap-3">
          <HistoryIcon className="size-4 text-[#1A5345] shrink-0 mt-0.5" />
          <div className="flex min-w-0 flex-col">
            <span className="text-[11px] font-bold uppercase tracking-tight text-[#6B7870]">Last Visit</span>
            <span className="text-[14px] font-bold text-[#1A1F1E] tabular-nums truncate">{patient.lastVisitDate}</span>
          </div>
        </div>

        <div className="flex min-w-0 items-start gap-3 sm:col-span-2">
          <ScaleIcon className="size-4 text-[#1A5345] shrink-0 mt-0.5" />
          <div className="flex min-w-0 flex-col">
            <span className="text-[11px] font-bold uppercase tracking-tight text-[#6B7870]">Height / BMI</span>
            <span className="text-[14px] font-bold text-[#1A1F1E] tabular-nums">{patient.height} &bull; {patient.bmi}</span>
          </div>
        </div>

        <div className="flex min-w-0 items-start gap-3 sm:col-span-2 mt-2 pt-4 border-t border-[#E8E6E0]/60">
          <AlertTriangleIcon className="size-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-[11px] font-bold uppercase tracking-tight text-rose-600">Allergies & Contraindications</span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {patient.allergies.map(allergy => (
                 <Badge key={allergy} className="rounded-lg bg-rose-600 px-2 py-0.5 text-[11px] font-bold text-white shadow-sm border-0">
                   {allergy}
                 </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex min-w-0 items-start gap-3 sm:col-span-2 mt-2 pt-4 border-t border-[#E8E6E0]/60">
          <UsersIcon className="size-4 text-[#1A5345] shrink-0 mt-0.5" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-[11px] font-bold uppercase tracking-tight text-[#6B7870]">Emergency Contact</span>
            <span className="text-[14px] font-bold text-[#1A1F1E]">{patient.emergencyContact.name} <span className="text-[#6B7870] font-medium">({patient.emergencyContact.relation})</span></span>
            <span className="text-[13px] font-bold text-[#1A5345] tabular-nums mt-0.5">{patient.emergencyContact.phone}</span>
          </div>
        </div>

        <div
          id="patient-insurance"
          className="flex min-w-0 scroll-mt-28 items-start gap-3 sm:col-span-2 mt-2 pt-4 border-t border-[#E8E6E0]/60"
        >
          <ShieldIcon className="size-4 text-[#1A5345] shrink-0 mt-0.5" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-[11px] font-bold uppercase tracking-tight text-[#6B7870]">Insurance Info</span>
            <span className="text-[14px] font-bold text-[#1A1F1E]">{patient.insurance.provider}</span>
            <span className="text-[13px] font-medium text-[#6B7870] mt-0.5 uppercase tracking-wider text-[11px] font-bold">Policy: <span className="text-[#1A1F1E] tabular-nums font-bold">{patient.insurance.policyNumber}</span></span>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Care Team */}
  <div className="rounded-2xl border border-[#1A5345]/10 bg-[#F9F8F5]/50 p-5 flex flex-col gap-5 relative overflow-hidden">
    <StethoscopeIcon className="absolute -right-4 -bottom-4 size-24 text-[#1A5345]/5" strokeWidth={1} />
    <div className="z-10 flex items-center justify-between">
      <h3 className="text-[14px] font-bold text-[#1A1F1E]">Care Team</h3>
      <Button variant="ghost" size="sm" className="h-6 rounded-md text-[11px] font-bold text-[#1A5345] hover:bg-[#1A5345]/10 px-2 transition-colors">Message All</Button>
    </div>

    <div className="flex flex-col gap-4 z-10">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-2xl border-2 border-white shadow-sm overflow-hidden bg-slate-100 shrink-0">
           <img src="https://i.pravatar.cc/150?u=dr" alt="Doctor" className="size-full object-cover" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[14px] font-bold text-[#1A1F1E] truncate">{patient.primaryDoctor}</span>
          <span className="text-[11px] font-bold uppercase tracking-tight text-[#1A5345]">Primary Cardiologist</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="size-10 rounded-2xl border-2 border-white shadow-sm overflow-hidden bg-slate-100 shrink-0">
           <img src="https://i.pravatar.cc/150?u=nurse" alt="Nurse" className="size-full object-cover" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[14px] font-bold text-[#1A1F1E] truncate">Emily Watson, RN</span>
          <span className="text-[11px] font-bold uppercase tracking-tight text-[#6B7870]">Cardiac Care Nurse</span>
        </div>
      </div>
    </div>
  </div>

</div>
  )
}
