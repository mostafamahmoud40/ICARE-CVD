"use client"

import Link from "next/link"
import {
  ActivityIcon,
  AlertTriangleIcon,
  CalendarClockIcon,
  CalendarDaysIcon,
  ClipboardCheckIcon,
  FileTextIcon,
  FlaskConicalIcon,
  HeartPulseIcon,
  MailIcon,
  MapPinIcon,
  MessageSquareIcon,
  PencilIcon,
  PhoneIcon,
  PillIcon,
  PlusIcon,
  ScaleIcon,
  ShieldAlertIcon,
  StethoscopeIcon,
  TargetIcon,
  UserRoundIcon,
  UsersIcon,
  BriefcaseIcon,
  CalendarPlusIcon,
  CigaretteIcon,
  CreditCardIcon,
  HeartIcon,
  XIcon,
} from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { PatientAvatar } from "@/components/shared/PatientAvatar"
import {
  ProfileAllergyPreview,
  ProfileFamilyHistoryPreview,
  ProfileInfoRow,
  ProfileRecordCard,
  ProfileSection,
} from "@/features/patient-record"
import { formatProfileDate } from "@/features/patient-record"
import { formatMaritalStatus, patientDisplayId } from "../doctorPatients.utils"
import { cn } from "@/lib/utils"
import type { PatientProfileState } from "./usePatientProfile"
import { PatientProfileDialogs } from "./PatientProfileDialogs"

export function PatientProfile(state: PatientProfileState) {
  const {
    p,
    risk,
    age,
    activeMeds,
    basePath,
    bloodTypeDisplay,
    contact,
    personal,
    lifestyle,
    allergies,
    familyHistory,
    clinicalNotes,
    careGoals,
    profileExtras,
    smokingDisplay,
    profileAvatarUrl,
    openDemographicsDialog,
    openAllergiesDialog,
    openFamilyHistoryDialog,
    openAppointmentDialog,
    setEditDialog,
    setClinicalNoteDialog,
    setCareGoalDialog,
    removeClinicalNote,
    removeCareGoal,
    record: patientRecord,
  } = state

  return (
    <main className="flex-1 overflow-y-auto bg-[#F9F8F5] p-3 sm:p-4 lg:p-5 animate-in fade-in duration-700">
      <div className="space-y-4 sm:space-y-5">
        <div className="flex items-center gap-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/doctor-patients" className="text-[10px] sm:text-[11px]">Patients</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-[10px] font-medium sm:text-[11px]">{p.fullName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="rounded-xl border border-[#E5EEEA] bg-white p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="flex size-20 items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-4 ring-white shadow-sm sm:size-24 lg:size-28">
                <PatientAvatar
                  key={profileAvatarUrl ?? "no-avatar"}
                  name={p.fullName}
                  avatarUrl={profileAvatarUrl}
                  sizes="112px"
                  initialsClassName="text-[22px] sm:text-[26px]"
                />
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="absolute bottom-0 right-0 size-8 rounded-full border border-[#E8E6E0] bg-white p-0 shadow-sm hover:bg-slate-50"
                onClick={openDemographicsDialog}
                aria-label="Edit profile photo and demographics"
              >
                <PencilIcon className="size-3.5 text-[#1A5345]" />
              </Button>
            </div>

            {/* Patient Info */}
            <div className="min-w-0 flex-1">
              {/* Name & Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[17px] font-bold text-[#102F27] sm:text-[20px] lg:text-[22px]">{p.fullName}</h1>
                <span className={cn("rounded-full px-2.5 py-0.5 text-[9px] font-medium sm:text-[10px]", risk.badge)}>
                  <span className={cn("mr-1 inline-block size-1.5 rounded-full", risk.dot)} />
                  {risk.label}
                </span>
                <span className="rounded-full bg-[#F5F5F3] px-2.5 py-0.5 font-mono text-[9px] font-semibold text-[#1A5345] sm:text-[10px]">
                  ID: {patientDisplayId(p)}
                </span>
              </div>

              {/* Demographics */}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground sm:gap-2.5 sm:text-[13px]">
                <span className="font-medium text-[#102F27]">{age} yrs</span>
                <span className="text-[#D1D5DB]">·</span>
                <span className="capitalize">{p.gender}</span>
                <span className="text-[#D1D5DB]">·</span>
                <span className="rounded-full bg-[#E8F0EE] px-2 py-0.5 text-[12px] font-medium text-[#1A5345] sm:text-[13px]">
                  {bloodTypeDisplay}
                </span>
                {p.condition && (
                  <>
                    <span className="text-[#D1D5DB]">·</span>
                    <span className="font-medium text-[#102F27]">{p.condition}</span>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-[#EEF5F3] px-3 py-1 text-[11px] font-medium text-[#2C6A5B] sm:text-[12px]">
                  <PillIcon className="size-3" />{activeMeds} active medications
                </span>
                <span className="rounded-full bg-[#F5F5F3] px-3 py-1 text-[11px] text-[#6B7870] sm:text-[12px]">{p.totalVisits} total visits</span>
                {p.poorComplianceCount > 0 && (
                  <span className="flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-[11px] font-bold text-white shadow-sm sm:text-[12px]">
                    <AlertTriangleIcon className="size-3" />{p.poorComplianceCount} compliance alerts
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 sm:flex-col sm:gap-1.5 lg:flex-row">
              <Link href={`${basePath}/medications`}>
                <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-lg border-[#E8E6E0] bg-white px-3 text-[11px] font-bold text-[#1A1F1E] shadow-sm transition-all hover:border-[#1A5345]/30 hover:bg-slate-50 hover:text-[#1A5345] hover:shadow-md group sm:text-[12px]">
                  <PillIcon className="size-3.5 transition-transform group-hover:scale-110" />
                  <span className="sm:hidden">Meds</span>
                  <span className="hidden sm:inline">Medications</span>
                </Button>
              </Link>
              <Link href={`/doctor-queue`}>
                <Button size="sm" className="h-8 gap-1.5 rounded-lg border-0 bg-[#1A5345] px-3 text-[11px] font-bold text-white shadow-[0_2px_8px_rgba(26,83,69,0.2)] transition-all hover:bg-[#133F34] hover:shadow-[0_4px_12px_rgba(26,83,69,0.25)] group sm:text-[12px]">
                  <StethoscopeIcon className="size-3.5 transition-transform group-hover:scale-110" />
                  <span className="sm:hidden">Consult</span>
                  <span className="hidden sm:inline">Start Consultation</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Info — Editable */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ProfileSection title="Contact" icon={PhoneIcon}
            action={<Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setEditDialog("contact")}><PencilIcon className="size-3 text-muted-foreground" /></Button>}>
            <ProfileInfoRow icon={PhoneIcon} label="Phone" value={contact.phone} />
            <ProfileInfoRow icon={MailIcon} label="Email" value={contact.email} />
            <ProfileInfoRow icon={MapPinIcon} label="Address" value={contact.address} />
          </ProfileSection>
          <ProfileSection title="Personal" icon={UserRoundIcon}
            action={<Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setEditDialog("personal")}><PencilIcon className="size-3 text-muted-foreground" /></Button>}>
            <ProfileInfoRow icon={CalendarDaysIcon} label="DOB" value={formatProfileDate(p.dateOfBirth)} />
            <ProfileInfoRow icon={HeartIcon} label="Status" value={formatMaritalStatus(personal.maritalStatus)} />
            <ProfileInfoRow icon={BriefcaseIcon} label="Occupation" value={personal.occupation} />
            <ProfileInfoRow icon={CreditCardIcon} label="National ID" value={personal.nationalId} />
          </ProfileSection>
          <ProfileSection title="Lifestyle" icon={HeartPulseIcon}
            action={<Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setEditDialog("lifestyle")}><PencilIcon className="size-3 text-muted-foreground" /></Button>}>
            {lifestyle.bmi && (
              <ProfileInfoRow icon={ScaleIcon} label="BMI" value={`${lifestyle.bmi} (${lifestyle.bmi >= 30 ? "Obese" : lifestyle.bmi >= 25 ? "Overweight" : "Normal"})`}
                valueClassName={lifestyle.bmi >= 30 ? "text-red-600" : lifestyle.bmi >= 25 ? "text-amber-600" : "text-emerald-600"} />
            )}
            <ProfileInfoRow icon={CigaretteIcon} label="Smoking" value={smokingDisplay}
              valueClassName={lifestyle.smokingStatus?.startsWith("current") ? "text-red-600" : lifestyle.smokingStatus?.startsWith("former") ? "text-amber-600" : lifestyle.smokingStatus ? "text-emerald-600" : undefined} />
            <ProfileInfoRow icon={CalendarClockIcon} label="Patient since" value={formatProfileDate(p.patientSince)} />
          </ProfileSection>
          <ProfileSection title="Allergies" icon={ShieldAlertIcon}
            action={<Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={openAllergiesDialog}><PencilIcon className="size-3 text-muted-foreground" /></Button>}>
            <ProfileAllergyPreview items={allergies} />
          </ProfileSection>
          <ProfileSection title="Family History" icon={UsersIcon}
            action={<Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={openFamilyHistoryDialog}><PencilIcon className="size-3 text-muted-foreground" /></Button>}>
            <ProfileFamilyHistoryPreview items={familyHistory} />
          </ProfileSection>
          <ProfileSection title="Upcoming" icon={CalendarClockIcon}
            action={
                  <Button size="sm" variant="ghost" className="h-7 gap-1 px-1.5 text-[11px] text-[#CC5533] hover:bg-[#CC5533]/5 sm:text-[12px]" onClick={openAppointmentDialog}>
                <CalendarPlusIcon className="size-3.5" />Book
              </Button>
            }>
            {p.upcomingAppointmentDate ? (
              <ProfileInfoRow icon={CalendarClockIcon} label="Next appointment" value={formatProfileDate(p.upcomingAppointmentDate)} valueClassName="text-[#1A5345]" />
            ) : (
              <p className="text-[11px] text-muted-foreground sm:text-[12px]">No upcoming appointments</p>
            )}
            <ProfileInfoRow icon={CalendarClockIcon} label="Last visit" value={formatProfileDate(p.lastVisitDate)} />
          </ProfileSection>
        </div>

        {/* Clinical Notes and Care Plan - Side by Side */}
        <div className="grid gap-3 lg:grid-cols-2">
          {/* Clinical Notes */}
          <div className="rounded-xl border border-[#E5EEEA] bg-white p-4 transition-all duration-300 hover:shadow-md sm:p-5 group">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquareIcon className="size-4 text-[#CC5533] sm:size-5" />
                <h3 className="text-[13px] font-bold text-[#102F27] transition-colors duration-300 group-hover:text-[#CC5533] sm:text-[14px]">Clinical Notes</h3>
                <span className="rounded-md bg-[#CC5533]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#CC5533] sm:text-[11px]">{clinicalNotes.length}</span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 gap-1 px-1.5 text-[11px] text-[#CC5533] hover:bg-[#CC5533]/5 sm:text-[12px]"
                onClick={() => setClinicalNoteDialog(true)}
              >
                <PlusIcon className="size-3.5" />
                Add
              </Button>
            </div>
            {clinicalNotes.length === 0 ? (
              <p className="text-[11px] text-muted-foreground sm:text-[12px]">No clinical notes yet</p>
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {clinicalNotes.map((note) => (
                  <div key={note.id} className="flex items-start gap-2 rounded-lg border border-[#E5EEEA] bg-[#FBFDFC] p-2 sm:p-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] leading-relaxed text-[#102F27] sm:text-[13px]">{note.text}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground sm:text-[11px]">{formatProfileDate(note.date)} &middot; {note.author}</p>
                    </div>
                    {note.canDelete ? (
                      <button
                        type="button"
                        onClick={() => void removeClinicalNote(note.id)}
                        disabled={profileExtras.isDeletingNote}
                        className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        aria-label="Delete clinical note"
                      >
                        <XIcon className="size-3.5" />
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Care Plan */}
          <div className="rounded-xl border border-[#E5EEEA] bg-white p-4 transition-all duration-300 hover:shadow-md sm:p-5 group">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TargetIcon className="size-4 text-[#CC5533] sm:size-5" />
                <h3 className="text-[13px] font-bold text-[#102F27] transition-colors duration-300 group-hover:text-[#CC5533] sm:text-[14px]">Care Plan & Goals</h3>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 gap-1 px-1.5 text-[11px] text-[#CC5533] hover:bg-[#CC5533]/5 sm:text-[12px]"
                onClick={() => setCareGoalDialog(true)}
              >
                <PlusIcon className="size-3.5" />
                Add
              </Button>
            </div>
            {careGoals.length === 0 ? (
              <p className="text-[11px] text-muted-foreground sm:text-[12px]">No care goals set</p>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2">
                {careGoals.map((goal) => {
                  const statusStyles: Record<string, string> = {
                    "on-track": "bg-emerald-50 text-emerald-700 font-bold",
                    "off-track": "bg-red-50 text-red-700 font-bold",
                    "achieved": "bg-[#1A5345]/10 text-[#1A5345] font-bold",
                  }
                  return (
                    <div key={goal.id} className="flex items-center gap-3 rounded-lg border border-[#E5EEEA] bg-white p-2 transition-all duration-300 hover:shadow-md sm:p-2.5">
                      <TargetIcon className="size-4 shrink-0 text-[#CC5533] sm:size-5" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[12px] font-semibold text-[#102F27] sm:text-[13px]">{goal.metric}</span>
                          <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] uppercase tracking-wider sm:text-[11px]", statusStyles[goal.status])}>
                            {goal.status.replace("-", " ")}
                          </span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] sm:text-[12px]">
                          <span className="text-muted-foreground">Target: <span className="font-medium text-[#102F27]">{goal.target}</span></span>
                          {goal.current && (
                            <>
                              <span className="text-[#E8E6E0]">&middot;</span>
                              <span className="text-muted-foreground">Current: <span className="font-medium text-[#102F27]">{goal.current}</span></span>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void removeCareGoal(goal.id)}
                        disabled={profileExtras.isDeletingGoal}
                        className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        aria-label={`Remove ${goal.metric} goal`}
                      >
                        <XIcon className="size-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Record Navigation */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ProfileRecordCard
            icon={ActivityIcon}
            iconColor="text-blue-600"
            title="Vitals & Readings"
            subtitle="Blood pressure, heart rate, SpO\u2082, blood sugar"
            count={patientRecord.vitalReadings.length}
            href={`${basePath}/vitals`}
          />
          <ProfileRecordCard
            icon={PillIcon}
            iconColor="text-emerald-600"
            title="Medications"
            subtitle="Active prescriptions, adherence, side effects"
            count={activeMeds}
            href={`${basePath}/medications`}
          />
          <ProfileRecordCard
            icon={ClipboardCheckIcon}
            iconColor="text-indigo-600"
            title="Diagnoses & Conditions"
            subtitle="ICD-10 coded diagnoses, severity, status"
            count={patientRecord.diagnoses.length}
            href={`${basePath}/diagnoses`}
          />
          <ProfileRecordCard
            icon={FlaskConicalIcon}
            iconColor="text-violet-600"
            title="Lab Results"
            subtitle="Blood work, panels, pathology reports"
            count={patientRecord.labResults.length}
            href={`${basePath}/lab-results`}
          />
          <ProfileRecordCard
            icon={FileTextIcon}
            iconColor="text-orange-600"
            title="Documents & Files"
            subtitle="ECGs, imaging, referrals, prescriptions"
            count={patientRecord.documents.length}
            href={`${basePath}/documents`}
          />
          <ProfileRecordCard
            icon={CalendarDaysIcon}
            iconColor="text-sky-600"
            title="Consultation History"
            subtitle="Past consultations, reports, follow-ups"
            count={patientRecord.visits.length}
            href={`${basePath}/consultations`}
          />
        </div>


        <PatientProfileDialogs state={state} />
      </div>
    </main>
  )
}
