"use client"

import { useState } from "react"
import type { PatientFullRecord } from "../doctorPatients.types"
import { cn } from "@/lib/utils"
import Link from "next/link"
import {
  ActivityIcon,
  AlertTriangleIcon,
  CalendarClockIcon,
  CalendarDaysIcon,
  CigaretteIcon,
  ClipboardCheckIcon,
  CreditCardIcon,
  FileTextIcon,
  FlaskConicalIcon,
  HeartIcon,
  HeartPulseIcon,
  MailIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
  PillIcon,
  PlusIcon,
  ScaleIcon,
  ShieldAlertIcon,
  StethoscopeIcon,
  TargetIcon,
  TrashIcon,
  UserRoundIcon,
  UsersIcon,
  BriefcaseIcon,
  CalendarPlusIcon,
  ChevronRightIcon,
  MessageSquareIcon,
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const riskConfig: Record<string, { label: string; dot: string; badge: string }> = {
  low: { label: "Low Risk", dot: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-700" },
  moderate: { label: "Moderate Risk", dot: "bg-amber-400", badge: "bg-amber-50 text-amber-700" },
  high: { label: "High Risk", dot: "bg-red-400", badge: "bg-red-50 text-red-700" },
}

function fmt(iso: string | null | undefined) {
  if (!iso) return null
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(iso))
}

function calcAge(dob: string) {
  const today = new Date()
  const birth = new Date(dob)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function InfoRow({ icon: Icon, label, value, valueClassName }: {
  icon: React.ElementType
  label: string
  value: string | null | undefined
  valueClassName?: string
}) {
  if (!value) return null
  return (
    <div className="flex items-center gap-2 py-1">
      <Icon className="size-3 shrink-0 text-muted-foreground sm:size-3.5" />
      <span className="text-[10px] text-muted-foreground sm:text-[11px]">{label}:</span>
      <span className={cn("text-[11px] font-medium text-[#102F27] sm:text-[12px]", valueClassName)}>{value}</span>
    </div>
  )
}

function Section({ title, icon: Icon, children, action }: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-[#E5EEEA] bg-white p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-lg bg-[#E8F0EE] sm:size-7">
            <Icon className="size-3 text-[#1A5345] sm:size-3.5" />
          </div>
          <h3 className="text-[12px] font-semibold text-[#102F27] sm:text-[13px]">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

function TagList({ items, variant, onRemove }: {
  items: string[]
  variant: "red" | "blue"
  onRemove?: (idx: number) => void
}) {
  if (items.length === 0) return <p className="text-[10px] text-muted-foreground">None reported</p>
  const s = variant === "red" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, idx) => (
        <span key={item} className={cn("group/tag flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium sm:text-[10px]", s)}>
          {item}
          {onRemove && (
            <button type="button" onClick={() => onRemove(idx)} className="ml-0.5 hidden rounded-full hover:bg-red-200 group-hover/tag:block">
              <XIcon className="size-2.5" />
            </button>
          )}
        </span>
      ))}
    </div>
  )
}

function RecordCard({ icon: Icon, title, subtitle, count, href }: {
  icon: React.ElementType
  title: string
  subtitle: string
  count: number | string
  href: string
}) {
  return (
    <Link href={href} className="group">
      <div className="flex items-center gap-3 rounded-xl border border-[#E5EEEA] bg-white p-3 transition-colors group-hover:border-[#1A5345]/30 group-hover:bg-[#F6FBF9] sm:p-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#E8F0EE] sm:size-10">
          <Icon className="size-4 text-[#1A5345] sm:size-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-[#102F27] sm:text-[12px]">{title}</p>
          <p className="text-[9px] text-muted-foreground sm:text-[10px]">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#EEF5F3] px-2 py-0.5 text-[10px] font-semibold text-[#1A5345] sm:text-[11px]">{count}</span>
          <ChevronRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-[#1A5345]" />
        </div>
      </div>
    </Link>
  )
}

type CareGoal = {
  id: string
  metric: string
  target: string
  current?: string
  status: "on-track" | "off-track" | "achieved"
}

type ClinicalNote = {
  id: string
  date: string
  text: string
  author: string
}

type PatientProfileProps = {
  record: PatientFullRecord
}

export function PatientProfile({ record }: PatientProfileProps) {
  const p = record.patient
  const risk = riskConfig[p.riskLevel]
  const age = calcAge(p.dateOfBirth)
  const activeMeds = record.medications.filter((m) => m.status === "active").length
  const basePath = `/doctor-patients/${p.id}`

  const [contact, setContact] = useState({ phone: p.phone, email: p.email, address: p.address })
  const [lifestyle, setLifestyle] = useState({ smokingStatus: p.smokingStatus, bmi: p.bmi })
  const [allergies, setAllergies] = useState<string[]>(p.allergies)
  const [familyHistory, setFamilyHistory] = useState<string[]>(p.familyHistory)

  const [editDialog, setEditDialog] = useState<"contact" | "personal" | "lifestyle" | "allergies" | "family" | null>(null)
  const [newAllergy, setNewAllergy] = useState("")
  const [newFamily, setNewFamily] = useState("")

  const [appointmentDialog, setAppointmentDialog] = useState(false)
  const [appointmentForm, setAppointmentForm] = useState({ date: "", time: "", type: "follow-up", notes: "" })

  const [clinicalNotes, setClinicalNotes] = useState<ClinicalNote[]>([
    { id: "n-1", date: "2026-04-15", text: "Patient reports increased stress levels. Monitor BP closely.", author: "Dr. Mahmoud" },
    { id: "n-2", date: "2026-03-20", text: "Discussed Ramadan fasting plan. Adjusted medication schedule.", author: "Dr. Mahmoud" },
  ])
  const [noteDialog, setNoteDialog] = useState(false)
  const [noteText, setNoteText] = useState("")

  const [careGoals, setCareGoals] = useState<CareGoal[]>([
    { id: "g-1", metric: "Blood Pressure", target: "< 130/80 mmHg", current: "148/92 mmHg", status: "off-track" },
    { id: "g-2", metric: "HbA1c", target: "< 7.0%", current: "7.2%", status: "off-track" },
    { id: "g-3", metric: "LDL Cholesterol", target: "< 100 mg/dL", current: "160 mg/dL", status: "off-track" },
    { id: "g-4", metric: "Weight", target: "< 80 kg", current: "87 kg", status: "off-track" },
    { id: "g-5", metric: "Exercise", target: "30 min/day, 5x/week", status: "on-track" },
  ])
  const [goalDialog, setGoalDialog] = useState(false)
  const [goalForm, setGoalForm] = useState({ metric: "", target: "", current: "" })

  function addNote() {
    if (!noteText.trim()) return
    setClinicalNotes((prev) => [
      { id: `n-${Date.now()}`, date: new Date().toISOString().slice(0, 10), text: noteText, author: "Dr. Mahmoud" },
      ...prev,
    ])
    setNoteText("")
    setNoteDialog(false)
  }

  function removeNote(id: string) {
    setClinicalNotes((prev) => prev.filter((n) => n.id !== id))
  }

  function addGoal() {
    if (!goalForm.metric || !goalForm.target) return
    setCareGoals((prev) => [
      ...prev,
      { id: `g-${Date.now()}`, metric: goalForm.metric, target: goalForm.target, current: goalForm.current || undefined, status: "on-track" as const },
    ])
    setGoalForm({ metric: "", target: "", current: "" })
    setGoalDialog(false)
  }

  function removeGoal(id: string) {
    setCareGoals((prev) => prev.filter((g) => g.id !== id))
  }

  return (
    <main className="flex-1 overflow-y-auto bg-[#F9F8F5] p-3 sm:p-4 lg:p-5">
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
            <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E8F0EE] sm:size-24 lg:size-28">
              {p.profileImageUrl ? (
                <img src={p.profileImageUrl} alt={p.fullName} className="size-full object-cover" />
              ) : (
                <UserRoundIcon className="size-10 text-[#1A5345] sm:size-12 lg:size-14" />
              )}
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
                  ID: {p.id}
                </span>
              </div>

              {/* Demographics */}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground sm:gap-2.5 sm:text-[12px]">
                <span className="font-medium text-[#102F27]">{age} yrs</span>
                <span className="text-[#D1D5DB]">·</span>
                <span className="capitalize">{p.gender}</span>
                <span className="text-[#D1D5DB]">·</span>
                <span className="rounded-full bg-[#E8F0EE] px-2 py-0.5 font-medium text-[#1A5345]">{p.bloodType}</span>
                {p.condition && (
                  <>
                    <span className="text-[#D1D5DB]">·</span>
                    <span className="text-[11px] sm:text-[12px]">{p.condition}</span>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-[#EEF5F3] px-3 py-1 text-[10px] font-medium text-[#2C6A5B] sm:text-[11px]">
                  <PillIcon className="size-3" />{activeMeds} active medications
                </span>
                <span className="rounded-full bg-[#F5F5F3] px-3 py-1 text-[10px] text-[#6B7870] sm:text-[11px]">{p.totalVisits} total visits</span>
                {p.poorComplianceCount > 0 && (
                  <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[10px] font-medium text-amber-600 sm:text-[11px]">
                    <AlertTriangleIcon className="size-3" />{p.poorComplianceCount} compliance alerts
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 sm:flex-col sm:gap-2 lg:flex-row">
              <Link href={`${basePath}/medications`}>
                <Button size="sm" variant="outline" className="h-9 gap-1 text-[11px] sm:text-[12px]">
                  <PillIcon className="size-3.5" />
                  <span className="sm:hidden">Meds</span>
                  <span className="hidden sm:inline">Medications</span>
                </Button>
              </Link>
              <Link href={`/doctor-queue`}>
                <Button size="sm" className="h-9 gap-1 bg-[#1A5345] text-[11px] hover:bg-[#0F3D32] sm:text-[12px]">
                  <StethoscopeIcon className="size-3.5" />
                  <span className="sm:hidden">Consult</span>
                  <span className="hidden sm:inline">Start Consultation</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Info — Editable */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Section title="Contact" icon={PhoneIcon}
            action={<Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setEditDialog("contact")}><PencilIcon className="size-3 text-muted-foreground" /></Button>}>
            <InfoRow icon={PhoneIcon} label="Phone" value={contact.phone} />
            <InfoRow icon={MailIcon} label="Email" value={contact.email} />
            <InfoRow icon={MapPinIcon} label="Address" value={contact.address} />
          </Section>
          <Section title="Personal" icon={UserRoundIcon}>
            <InfoRow icon={CalendarDaysIcon} label="DOB" value={fmt(p.dateOfBirth)} />
            <InfoRow icon={HeartIcon} label="Status" value={p.maritalStatus} />
            <InfoRow icon={BriefcaseIcon} label="Occupation" value={p.occupation} />
            <InfoRow icon={CreditCardIcon} label="National ID" value={p.nationalId} />
          </Section>
          <Section title="Lifestyle" icon={HeartPulseIcon}
            action={<Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setEditDialog("lifestyle")}><PencilIcon className="size-3 text-muted-foreground" /></Button>}>
            {lifestyle.bmi && (
              <InfoRow icon={ScaleIcon} label="BMI" value={`${lifestyle.bmi} (${lifestyle.bmi >= 30 ? "Obese" : lifestyle.bmi >= 25 ? "Overweight" : "Normal"})`}
                valueClassName={lifestyle.bmi >= 30 ? "text-red-600" : lifestyle.bmi >= 25 ? "text-amber-600" : "text-emerald-600"} />
            )}
            <InfoRow icon={CigaretteIcon} label="Smoking" value={lifestyle.smokingStatus}
              valueClassName={lifestyle.smokingStatus.startsWith("Current") ? "text-red-600" : lifestyle.smokingStatus.startsWith("Former") ? "text-amber-600" : "text-emerald-600"} />
            <InfoRow icon={CalendarClockIcon} label="Patient since" value={fmt(p.patientSince)} />
          </Section>
          <Section title="Allergies" icon={ShieldAlertIcon}
            action={<Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setNewAllergy(""); setEditDialog("allergies") }}><PencilIcon className="size-3 text-muted-foreground" /></Button>}>
            <TagList items={allergies} variant="red" onRemove={(idx) => setAllergies((prev) => prev.filter((_, i) => i !== idx))} />
          </Section>
          <Section title="Family History" icon={UsersIcon}
            action={<Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setNewFamily(""); setEditDialog("family") }}><PencilIcon className="size-3 text-muted-foreground" /></Button>}>
            <TagList items={familyHistory} variant="blue" onRemove={(idx) => setFamilyHistory((prev) => prev.filter((_, i) => i !== idx))} />
          </Section>
          <Section title="Upcoming" icon={CalendarClockIcon}
            action={
              <Button size="sm" variant="ghost" className="h-6 gap-1 px-1 text-[9px] text-[#1A5345] sm:text-[10px]" onClick={() => setAppointmentDialog(true)}>
                <CalendarPlusIcon className="size-3" />Book
              </Button>
            }>
            {p.upcomingAppointmentDate ? (
              <InfoRow icon={CalendarClockIcon} label="Next appointment" value={fmt(p.upcomingAppointmentDate)} valueClassName="text-[#1A5345]" />
            ) : (
              <p className="text-[10px] text-muted-foreground">No upcoming appointments</p>
            )}
            <InfoRow icon={CalendarClockIcon} label="Last visit" value={fmt(p.lastVisitDate)} />
          </Section>
        </div>

        {/* Clinical Notes and Care Plan - Side by Side */}
        <div className="grid gap-3 lg:grid-cols-2">
          {/* Clinical Notes */}
          <div className="rounded-xl border border-[#E5EEEA] bg-white p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-lg bg-[#E8F0EE] sm:size-7">
                  <MessageSquareIcon className="size-3 text-[#1A5345] sm:size-3.5" />
                </div>
                <h3 className="text-[12px] font-semibold text-[#102F27] sm:text-[13px]">Clinical Notes</h3>
                <span className="rounded-full bg-[#F5F5F3] px-1.5 py-0.5 text-[9px] text-[#6B7870]">{clinicalNotes.length}</span>
              </div>
              <Button size="sm" variant="ghost" className="h-6 gap-1 px-1 text-[9px] text-[#1A5345] sm:text-[10px]" onClick={() => setNoteDialog(true)}>
                <PlusIcon className="size-3" />Add Note
              </Button>
            </div>
            {clinicalNotes.length === 0 ? (
              <p className="text-[10px] text-muted-foreground">No clinical notes yet</p>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2">
                {clinicalNotes.map((note) => (
                  <div key={note.id} className="group flex items-start gap-2 rounded-lg border border-[#E5EEEA] bg-[#FBFDFC] p-2 sm:p-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] leading-relaxed text-[#102F27] sm:text-[11px]">{note.text}</p>
                      <p className="mt-1 text-[9px] text-muted-foreground">{fmt(note.date)} &middot; {note.author}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="hidden h-6 w-6 shrink-0 p-0 group-hover:flex" onClick={() => removeNote(note.id)}>
                      <TrashIcon className="size-3 text-muted-foreground hover:text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Care Plan */}
          <div className="rounded-xl border border-[#E5EEEA] bg-white p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-lg bg-[#E8F0EE] sm:size-7">
                  <TargetIcon className="size-3 text-[#1A5345] sm:size-3.5" />
                </div>
                <h3 className="text-[12px] font-semibold text-[#102F27] sm:text-[13px]">Care Plan & Goals</h3>
              </div>
              <Button size="sm" variant="ghost" className="h-6 gap-1 px-1 text-[9px] text-[#1A5345] sm:text-[10px]" onClick={() => setGoalDialog(true)}>
                <PlusIcon className="size-3" />Add Goal
              </Button>
            </div>
            {careGoals.length === 0 ? (
              <p className="text-[10px] text-muted-foreground">No care goals set</p>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2">
                {careGoals.map((goal) => {
                  const statusStyles: Record<string, string> = {
                    "on-track": "bg-emerald-50 text-emerald-700",
                    "off-track": "bg-red-50 text-red-700",
                    "achieved": "bg-[#EEF5F3] text-[#1A5345]",
                  }
                  return (
                    <div key={goal.id} className="group flex items-center gap-3 rounded-lg border border-[#E5EEEA] bg-[#FBFDFC] p-2 sm:p-2.5">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#E8F0EE] sm:size-8">
                        <TargetIcon className="size-3.5 text-[#1A5345] sm:size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-[#102F27] sm:text-[12px]">{goal.metric}</span>
                          <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-medium", statusStyles[goal.status])}>
                            {goal.status.replace("-", " ")}
                          </span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="text-muted-foreground">Target: <span className="font-medium text-[#102F27]">{goal.target}</span></span>
                          {goal.current && (
                            <>
                              <span className="text-[#E8E6E0]">&middot;</span>
                              <span className="text-muted-foreground">Current: <span className="font-medium text-[#102F27]">{goal.current}</span></span>
                            </>
                          )}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="hidden h-6 w-6 shrink-0 p-0 group-hover:flex" onClick={() => removeGoal(goal.id)}>
                        <TrashIcon className="size-3 text-muted-foreground hover:text-red-500" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Record Navigation */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <RecordCard
            icon={ActivityIcon}
            title="Vitals & Readings"
            subtitle="Blood pressure, heart rate, SpO\u2082, blood sugar"
            count={record.vitalReadings.length}
            href={`${basePath}/vitals`}
          />
          <RecordCard
            icon={PillIcon}
            title="Medications"
            subtitle="Active prescriptions, adherence, side effects"
            count={activeMeds}
            href={`${basePath}/medications`}
          />
          <RecordCard
            icon={ClipboardCheckIcon}
            title="Diagnoses & Conditions"
            subtitle="ICD-10 coded diagnoses, severity, status"
            count={record.diagnoses.length}
            href={`${basePath}/diagnoses`}
          />
          <RecordCard
            icon={FlaskConicalIcon}
            title="Lab Results"
            subtitle="Blood work, panels, pathology reports"
            count={record.labResults.length}
            href={`${basePath}/lab-results`}
          />
          <RecordCard
            icon={FileTextIcon}
            title="Documents & Files"
            subtitle="ECGs, imaging, referrals, prescriptions"
            count={record.documents.length}
            href={`${basePath}/documents`}
          />
          <RecordCard
            icon={CalendarDaysIcon}
            title="Consultation History"
            subtitle="Past consultations, reports, follow-ups"
            count={record.visits.length}
            href={`${basePath}/consultations`}
          />
        </div>

        {/* Edit Contact Dialog */}
        <Dialog open={editDialog === "contact"} onOpenChange={(open) => { if (!open) setEditDialog(null) }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[13px] font-semibold text-[#102F27] sm:text-[14px]">Edit Contact Info</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-[10px] text-muted-foreground sm:text-[11px]">Phone</Label>
                <Input value={contact.phone} onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))} className="mt-1 h-8 text-[11px] sm:h-9 sm:text-[12px]" />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground sm:text-[11px]">Email</Label>
                <Input value={contact.email} onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))} className="mt-1 h-8 text-[11px] sm:h-9 sm:text-[12px]" />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground sm:text-[11px]">Address</Label>
                <Input value={contact.address} onChange={(e) => setContact((c) => ({ ...c, address: e.target.value }))} className="mt-1 h-8 text-[11px] sm:h-9 sm:text-[12px]" />
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditDialog(null)} className="text-[10px] sm:text-[11px]">Cancel</Button>
                <Button size="sm" onClick={() => setEditDialog(null)} className="bg-[#1A5345] text-[10px] hover:bg-[#0F3D32] sm:text-[11px]">Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Lifestyle Dialog */}
        <Dialog open={editDialog === "lifestyle"} onOpenChange={(open) => { if (!open) setEditDialog(null) }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[13px] font-semibold text-[#102F27] sm:text-[14px]">Edit Lifestyle</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-[10px] text-muted-foreground sm:text-[11px]">Smoking Status</Label>
                <Select value={lifestyle.smokingStatus} onValueChange={(v) => setLifestyle((l) => ({ ...l, smokingStatus: v }))}>
                  <SelectTrigger className="mt-1 h-8 text-[11px] sm:h-9 sm:text-[12px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Never">Never</SelectItem>
                    <SelectItem value="Former (quit 5 yrs ago, 20 pack-years)">Former</SelectItem>
                    <SelectItem value="Current (10 cig/day)">Current (Light)</SelectItem>
                    <SelectItem value="Current (20 cig/day)">Current (Moderate)</SelectItem>
                    <SelectItem value="Current (30+ cig/day)">Current (Heavy)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground sm:text-[11px]">BMI</Label>
                <Input type="number" step="0.1" value={lifestyle.bmi ?? ""} onChange={(e) => setLifestyle((l) => ({ ...l, bmi: e.target.value ? Number(e.target.value) : null }))} className="mt-1 h-8 text-[11px] sm:h-9 sm:text-[12px]" />
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditDialog(null)} className="text-[10px] sm:text-[11px]">Cancel</Button>
                <Button size="sm" onClick={() => setEditDialog(null)} className="bg-[#1A5345] text-[10px] hover:bg-[#0F3D32] sm:text-[11px]">Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Allergies Dialog */}
        <Dialog open={editDialog === "allergies"} onOpenChange={(open) => { if (!open) setEditDialog(null) }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[13px] font-semibold text-[#102F27] sm:text-[14px]">Manage Allergies</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1">
                {allergies.map((a, idx) => (
                  <span key={idx} className="flex items-center gap-0.5 rounded-full bg-red-50 px-2 py-0.5 text-[10px] text-red-600 sm:text-[11px]">
                    {a}
                    <button type="button" onClick={() => setAllergies((prev) => prev.filter((_, i) => i !== idx))} className="ml-1 rounded-full hover:bg-red-200"><XIcon className="size-3" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newAllergy} onChange={(e) => setNewAllergy(e.target.value)} placeholder="e.g. Penicillin (Rash)" className="h-8 text-[11px] sm:h-9 sm:text-[12px]" onKeyDown={(e) => { if (e.key === "Enter" && newAllergy.trim()) { setAllergies((prev) => [...prev, newAllergy.trim()]); setNewAllergy("") } }} />
                <Button size="sm" variant="outline" onClick={() => { if (newAllergy.trim()) { setAllergies((prev) => [...prev, newAllergy.trim()]); setNewAllergy("") } }} className="text-[10px] sm:text-[11px]">Add</Button>
              </div>
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setEditDialog(null)} className="bg-[#1A5345] text-[10px] hover:bg-[#0F3D32] sm:text-[11px]">Done</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Family History Dialog */}
        <Dialog open={editDialog === "family"} onOpenChange={(open) => { if (!open) setEditDialog(null) }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[13px] font-semibold text-[#102F27] sm:text-[14px]">Manage Family History</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1">
                {familyHistory.map((f, idx) => (
                  <span key={idx} className="flex items-center gap-0.5 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] text-blue-600 sm:text-[11px]">
                    {f}
                    <button type="button" onClick={() => setFamilyHistory((prev) => prev.filter((_, i) => i !== idx))} className="ml-1 rounded-full hover:bg-blue-200"><XIcon className="size-3" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newFamily} onChange={(e) => setNewFamily(e.target.value)} placeholder="e.g. Father — MI at 52" className="h-8 text-[11px] sm:h-9 sm:text-[12px]" onKeyDown={(e) => { if (e.key === "Enter" && newFamily.trim()) { setFamilyHistory((prev) => [...prev, newFamily.trim()]); setNewFamily("") } }} />
                <Button size="sm" variant="outline" onClick={() => { if (newFamily.trim()) { setFamilyHistory((prev) => [...prev, newFamily.trim()]); setNewFamily("") } }} className="text-[10px] sm:text-[11px]">Add</Button>
              </div>
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setEditDialog(null)} className="bg-[#1A5345] text-[10px] hover:bg-[#0F3D32] sm:text-[11px]">Done</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Schedule Appointment Dialog */}
        <Dialog open={appointmentDialog} onOpenChange={setAppointmentDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[13px] font-semibold text-[#102F27] sm:text-[14px]">Schedule Appointment</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] text-muted-foreground sm:text-[11px]">Date</Label>
                  <Input type="date" value={appointmentForm.date} onChange={(e) => setAppointmentForm((f) => ({ ...f, date: e.target.value }))} className="mt-1 h-8 text-[11px] sm:h-9 sm:text-[12px]" />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground sm:text-[11px]">Time</Label>
                  <Input type="time" value={appointmentForm.time} onChange={(e) => setAppointmentForm((f) => ({ ...f, time: e.target.value }))} className="mt-1 h-8 text-[11px] sm:h-9 sm:text-[12px]" />
                </div>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground sm:text-[11px]">Type</Label>
                <Select value={appointmentForm.type} onValueChange={(v) => setAppointmentForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger className="mt-1 h-8 text-[11px] sm:h-9 sm:text-[12px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="follow-up">Follow-up</SelectItem>
                    <SelectItem value="new">New Consultation</SelectItem>
                    <SelectItem value="post-procedure">Post-Procedure</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground sm:text-[11px]">Notes</Label>
                <Textarea value={appointmentForm.notes} onChange={(e) => setAppointmentForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." className="mt-1 min-h-[50px] text-[11px] sm:text-[12px]" />
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setAppointmentDialog(false)} className="text-[10px] sm:text-[11px]">Cancel</Button>
                <Button size="sm" onClick={() => setAppointmentDialog(false)} className="bg-[#1A5345] text-[10px] hover:bg-[#0F3D32] sm:text-[11px]" disabled={!appointmentForm.date || !appointmentForm.time}>
                  Schedule
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Clinical Note Dialog */}
        <Dialog open={noteDialog} onOpenChange={setNoteDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[13px] font-semibold text-[#102F27] sm:text-[14px]">Add Clinical Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Enter clinical note, observation, or flag..." className="min-h-[80px] text-[11px] sm:text-[12px]" />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setNoteDialog(false)} className="text-[10px] sm:text-[11px]">Cancel</Button>
                <Button size="sm" onClick={addNote} className="bg-[#1A5345] text-[10px] hover:bg-[#0F3D32] sm:text-[11px]" disabled={!noteText.trim()}>Save Note</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Care Goal Dialog */}
        <Dialog open={goalDialog} onOpenChange={setGoalDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[13px] font-semibold text-[#102F27] sm:text-[14px]">Add Care Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-[10px] text-muted-foreground sm:text-[11px]">Metric</Label>
                <Input value={goalForm.metric} onChange={(e) => setGoalForm((f) => ({ ...f, metric: e.target.value }))} placeholder="e.g. Blood Pressure, HbA1c, Weight" className="mt-1 h-8 text-[11px] sm:h-9 sm:text-[12px]" />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground sm:text-[11px]">Target</Label>
                <Input value={goalForm.target} onChange={(e) => setGoalForm((f) => ({ ...f, target: e.target.value }))} placeholder="e.g. < 130/80 mmHg" className="mt-1 h-8 text-[11px] sm:h-9 sm:text-[12px]" />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground sm:text-[11px]">Current Value (optional)</Label>
                <Input value={goalForm.current} onChange={(e) => setGoalForm((f) => ({ ...f, current: e.target.value }))} placeholder="e.g. 148/92 mmHg" className="mt-1 h-8 text-[11px] sm:h-9 sm:text-[12px]" />
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setGoalDialog(false)} className="text-[10px] sm:text-[11px]">Cancel</Button>
                <Button size="sm" onClick={addGoal} className="bg-[#1A5345] text-[10px] hover:bg-[#0F3D32] sm:text-[11px]" disabled={!goalForm.metric || !goalForm.target}>Add Goal</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}
