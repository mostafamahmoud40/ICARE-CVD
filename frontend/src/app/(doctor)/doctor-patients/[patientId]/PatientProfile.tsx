"use client"

import { useEffect, useMemo, useState } from "react"
import { useDoctorAvailableSlots } from "@/app/(doctor)/doctor-appointments/useDoctorAppointments"
import type { PatientFullRecord, FamilyHistoryEntry, PatientAllergyEntry, PatientCareGoal, PatientClinicalNote } from "../doctorPatients.types"
import { formatMaritalStatus, formatSmokingStatus, patientDisplayId } from "../doctorPatients.utils"
import { useUpdateDoctorPatientProfile } from "../useUpdateDoctorPatientProfile"
import { usePatientProfileExtras } from "../usePatientProfileExtras"
import {
  PATIENT_AVATAR_OPTIONS,
  PATIENT_BLOOD_TYPES,
  PATIENT_GENDERS,
  PATIENT_MARITAL_STATUSES,
  PATIENT_SMOKING_STATUSES,
} from "../patientProfile.constants"
import { showIcareErrorToast } from "@/components/shared/icare-toast"
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
  CalendarIcon,
  CalendarPlusIcon,
  ChevronRightIcon,
  Loader2Icon,
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
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
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
  low: { label: "Low Risk", dot: "bg-emerald-100", badge: "bg-emerald-500 text-white shadow-sm" },
  moderate: { label: "Moderate Risk", dot: "bg-amber-100", badge: "bg-amber-500 text-white shadow-sm" },
  high: { label: "High Risk", dot: "bg-red-100", badge: "bg-red-500 text-white shadow-sm" },
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
      <Icon className="size-3.5 shrink-0 text-muted-foreground sm:size-4" />
      <span className="text-[11px] text-muted-foreground sm:text-[12px]">{label}:</span>
      <span className={cn("text-[12px] font-medium text-[#102F27] sm:text-[13px]", valueClassName)}>{value}</span>
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
    <div className="rounded-xl border border-[#E5EEEA] bg-white p-3 transition-all duration-300 hover:shadow-md sm:p-4 group">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-[#CC5533] sm:size-5" />
          <h3 className="text-[13px] font-bold text-[#102F27] transition-colors duration-300 group-hover:text-[#CC5533] sm:text-[14px]">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

const ALLERGY_CATEGORY_LABELS: Record<PatientAllergyEntry["category"], string> = {
  drug: "Drug",
  food: "Food",
  other: "Other",
}

type AllergyForm = {
  category: PatientAllergyEntry["category"]
  allergen: string
  reaction: string
}

function emptyAllergyForm(): AllergyForm {
  return { category: "drug", allergen: "", reaction: "" }
}

const FAMILY_RELATIONSHIP_OPTIONS = [
  "Mother",
  "Father",
  "Sister",
  "Brother",
  "Grandmother",
  "Grandfather",
  "Aunt",
  "Uncle",
  "Daughter",
  "Son",
  "Cousin",
  "Other",
] as const

type FamilyHistoryForm = {
  relationship: string
  condition: string
  details: string
}

function emptyFamilyHistoryForm(): FamilyHistoryForm {
  return { relationship: "", condition: "", details: "" }
}

function TagList({ items, variant, onRemove }: {
  items: string[]
  variant: "red" | "blue"
  onRemove?: (idx: number) => void
}) {
  if (items.length === 0) return <p className="text-[11px] text-muted-foreground sm:text-[12px]">None reported</p>
  const s = variant === "red" ? "bg-red-500 text-white shadow-sm" : "bg-[#1A5345] text-white shadow-sm"
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, idx) => (
        <span key={item} className={cn("group/tag flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium sm:text-[11px]", s)}>
          {item}
          {onRemove && (
            <button type="button" onClick={() => onRemove(idx)} className="ml-1 hidden rounded-full hover:bg-white/20 group-hover/tag:block">
              <XIcon className="size-2.5" />
            </button>
          )}
        </span>
      ))}
    </div>
  )
}

function AllergyPreview({ items }: { items: PatientAllergyEntry[] }) {
  if (items.length === 0) {
    return <p className="text-[11px] text-muted-foreground sm:text-[12px]">None reported</p>
  }

  return (
    <div className="space-y-2">
      {items.map((entry) => (
        <div
          key={entry.id}
          className="rounded-lg border border-rose-100 bg-rose-50/60 px-3 py-2.5"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-lg border-0 bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-none hover:bg-rose-600">
              {entry.allergen}
            </Badge>
            <span className="text-[11px] font-medium text-rose-600/80 sm:text-[12px]">
              {ALLERGY_CATEGORY_LABELS[entry.category]}
            </span>
          </div>
          {entry.reaction ? (
            <p className="mt-1 text-[11px] leading-relaxed text-rose-700 sm:text-[12px]">{entry.reaction}</p>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function FamilyHistoryPreview({ items }: { items: FamilyHistoryEntry[] }) {
  if (items.length === 0) {
    return <p className="text-[11px] text-muted-foreground sm:text-[12px]">None reported</p>
  }

  return (
    <div className="space-y-2">
      {items.map((entry) => (
        <div
          key={entry.id}
          className="rounded-lg border border-[#E8E6E0]/60 bg-[#FAFAF8] px-3 py-2.5"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-lg border-0 bg-[#1A5345] px-2 py-0.5 text-[10px] font-bold text-white shadow-none hover:bg-[#1A5345]">
              {entry.relationship}
            </Badge>
            <span className="text-[12px] font-bold text-[#1A1F1E] sm:text-[13px]">{entry.condition}</span>
          </div>
          {entry.details ? (
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground sm:text-[12px]">{entry.details}</p>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function RecordCard({ icon: Icon, iconColor, title, subtitle, href }: {
  icon: React.ElementType
  iconColor?: string
  title: string
  subtitle: string
  count: number | string
  href: string
}) {
  return (
    <Link href={href} className="group">
      <div className="flex items-center gap-3.5 rounded-xl border border-[#E8E6E0]/60 bg-white p-3.5 transition-all duration-300 hover:shadow-md">
        <Icon className={cn("size-5 shrink-0 transition-colors duration-300", iconColor || "text-[#1A5345]") } />
        <div className="min-w-0 flex-1">
          <h4 className="text-[13px] font-bold text-[#1A1F1E] transition-colors duration-300 group-hover:text-[#1A5345]">{title}</h4>
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </Link>
  )
}

type DisplayClinicalNote = PatientClinicalNote & { canDelete: boolean }

function buildClinicalNotesFromVisits(record: PatientFullRecord): PatientClinicalNote[] {
  return record.visits
    .flatMap((visit) => {
      const items: PatientClinicalNote[] = []
      if (visit.notes?.trim()) {
        items.push({
          id: `${visit.id}-notes`,
          date: visit.date,
          text: visit.notes.trim(),
          author: visit.doctorName,
        })
      }
      if (visit.chiefComplaint?.trim()) {
        items.push({
          id: `${visit.id}-complaint`,
          date: visit.date,
          text: visit.chiefComplaint.trim(),
          author: visit.doctorName,
        })
      }
      return items
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

function buildAllClinicalNotes(record: PatientFullRecord): DisplayClinicalNote[] {
  const profileNotes = record.profileClinicalNotes.map((note) => ({
    ...note,
    canDelete: true,
  }))
  const visitNotes = buildClinicalNotesFromVisits(record).map((note) => ({
    ...note,
    canDelete: false,
  }))
  return [...profileNotes, ...visitNotes].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )
}

const CARE_GOAL_STATUS_OPTIONS: Array<{ value: PatientCareGoal["status"]; label: string }> = [
  { value: "on-track", label: "On track" },
  { value: "off-track", label: "Off track" },
  { value: "achieved", label: "Achieved" },
]

function emptyCareGoalForm() {
  return {
    metric: "",
    target: "",
    current: "",
    status: "on-track" as PatientCareGoal["status"],
  }
}

type PatientProfileProps = {
  record: PatientFullRecord
}

export function PatientProfile({ record }: PatientProfileProps) {
  const p = record.patient
  const { updateProfile, isUpdating } = useUpdateDoctorPatientProfile(p.id)
  const profileExtras = usePatientProfileExtras(p.id)
  const risk = riskConfig[p.riskLevel]
  const age = calcAge(p.dateOfBirth)
  const activeMeds = record.medications.filter((m) => m.status === "active").length
  const basePath = `/doctor-patients/${p.id}`
  const bloodTypeDisplay = p.bloodType && p.bloodType !== "—" ? p.bloodType : "—"

  const [contact, setContact] = useState({ phone: p.phone, email: p.email, address: p.address })
  const [personal, setPersonal] = useState({
    maritalStatus: p.maritalStatus,
    occupation: p.occupation,
    nationalId: p.nationalId,
  })
  const [demographics, setDemographics] = useState({
    profileImageUrl: p.profileImageUrl ?? "",
    gender: p.gender,
    bloodType: bloodTypeDisplay === "—" ? "" : bloodTypeDisplay,
  })
  const [lifestyle, setLifestyle] = useState({ smokingStatus: p.smokingStatus, bmi: p.bmi })
  const [allergies, setAllergies] = useState<PatientAllergyEntry[]>(p.allergies)
  const [familyHistory, setFamilyHistory] = useState<FamilyHistoryEntry[]>(p.familyHistory)

  useEffect(() => {
    const nextBloodType = p.bloodType && p.bloodType !== "—" ? p.bloodType : ""
    setContact({ phone: p.phone, email: p.email, address: p.address })
    setPersonal({
      maritalStatus: p.maritalStatus,
      occupation: p.occupation,
      nationalId: p.nationalId,
    })
    setDemographics({
      profileImageUrl: p.profileImageUrl ?? "",
      gender: p.gender,
      bloodType: nextBloodType,
    })
    setLifestyle({ smokingStatus: p.smokingStatus, bmi: p.bmi })
    setAllergies(p.allergies)
    setFamilyHistory(p.familyHistory)
  }, [p])

  const clinicalNotes = useMemo(() => buildAllClinicalNotes(record), [record])
  const careGoals = record.careGoals

  const [clinicalNoteDialog, setClinicalNoteDialog] = useState(false)
  const [careGoalDialog, setCareGoalDialog] = useState(false)
  const [newClinicalNote, setNewClinicalNote] = useState("")
  const [newCareGoal, setNewCareGoal] = useState(emptyCareGoalForm())

  const [editDialog, setEditDialog] = useState<
    "contact" | "personal" | "lifestyle" | "demographics" | "allergies" | "family" | null
  >(null)
  const [newAllergy, setNewAllergy] = useState<AllergyForm>(emptyAllergyForm())
  const [newFamily, setNewFamily] = useState<FamilyHistoryForm>(emptyFamilyHistoryForm())

  const [appointmentDialog, setAppointmentDialog] = useState(false)
  const [appointmentForm, setAppointmentForm] = useState({ date: "", time: "", type: "follow-up", notes: "" })
  const appointmentSlotsQuery = useDoctorAvailableSlots(appointmentForm.date, {
    enabled: appointmentDialog && Boolean(appointmentForm.date),
  })

  function openAppointmentDialog() {
    setAppointmentForm({ date: "", time: "", type: "follow-up", notes: "" })
    setAppointmentDialog(true)
  }

  function addAllergyEntry() {
    if (!newAllergy.allergen.trim()) return
    setAllergies((prev) => [
      ...prev,
      {
        id: `al-${Date.now()}`,
        category: newAllergy.category,
        allergen: newAllergy.allergen.trim(),
        reaction: newAllergy.reaction.trim(),
      },
    ])
    setNewAllergy(emptyAllergyForm())
  }

  function openAllergiesDialog() {
    setNewAllergy(emptyAllergyForm())
    setEditDialog("allergies")
  }

  function addFamilyHistoryEntry() {
    if (!newFamily.relationship.trim() || !newFamily.condition.trim()) return
    setFamilyHistory((prev) => [
      ...prev,
      {
        id: `fh-${Date.now()}`,
        relationship: newFamily.relationship.trim(),
        condition: newFamily.condition.trim(),
        details: newFamily.details.trim(),
      },
    ])
    setNewFamily(emptyFamilyHistoryForm())
  }

  function openFamilyHistoryDialog() {
    setNewFamily(emptyFamilyHistoryForm())
    setEditDialog("family")
  }

  async function saveClinicalNote() {
    const body = newClinicalNote.trim()
    if (!body) return
    try {
      await profileExtras.createClinicalNote({ body })
      setNewClinicalNote("")
      setClinicalNoteDialog(false)
    } catch {
      /* toast handled in hook */
    }
  }

  async function removeClinicalNote(noteId: string) {
    try {
      await profileExtras.deleteClinicalNote(noteId)
    } catch {
      /* toast handled in hook */
    }
  }

  async function saveCareGoal() {
    if (!newCareGoal.metric.trim() || !newCareGoal.target.trim()) return
    try {
      await profileExtras.createCareGoal({
        metric: newCareGoal.metric.trim(),
        target: newCareGoal.target.trim(),
        current: newCareGoal.current.trim() || undefined,
        status: newCareGoal.status,
      })
      setNewCareGoal(emptyCareGoalForm())
      setCareGoalDialog(false)
    } catch {
      /* toast handled in hook */
    }
  }

  async function removeCareGoal(goalId: string) {
    try {
      await profileExtras.deleteCareGoal(goalId)
    } catch {
      /* toast handled in hook */
    }
  }

  async function saveContact() {
    try {
      await updateProfile({
        phone: contact.phone.trim(),
        email: contact.email.trim(),
        address: contact.address.trim(),
      })
      setEditDialog(null)
    } catch {
      showIcareErrorToast("Could not save", "Contact details could not be updated.")
    }
  }

  async function savePersonal() {
    try {
      await updateProfile({
        maritalStatus: personal.maritalStatus
          ? (personal.maritalStatus as "single" | "married" | "divorced" | "widowed")
          : null,
        occupation: personal.occupation.trim(),
        nationalId: personal.nationalId.trim(),
      })
      setEditDialog(null)
    } catch {
      showIcareErrorToast("Could not save", "Personal details could not be updated.")
    }
  }

  async function saveDemographics() {
    try {
      await updateProfile({
        avatarUrl: demographics.profileImageUrl,
        gender: demographics.gender,
        bloodType: demographics.bloodType
          ? (demographics.bloodType as "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-")
          : null,
      })
      setEditDialog(null)
    } catch {
      showIcareErrorToast("Could not save", "Profile photo and demographics could not be updated.")
    }
  }

  async function saveLifestyle() {
    try {
      await updateProfile({
        smokingStatus: lifestyle.smokingStatus
          ? (lifestyle.smokingStatus as
              | "never"
              | "former-5"
              | "former-10"
              | "former-15"
              | "former-20"
              | "current-5"
              | "current-10"
              | "current-15"
              | "current-20")
          : null,
      })
      setEditDialog(null)
    } catch {
      showIcareErrorToast("Could not save", "Lifestyle details could not be updated.")
    }
  }

  const smokingDisplay = formatSmokingStatus(lifestyle.smokingStatus)

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
                {demographics.profileImageUrl ? (
                  <img
                    src={demographics.profileImageUrl}
                    alt={p.fullName}
                    className="size-full object-cover"
                  />
                ) : (
                  <UserRoundIcon className="size-10 text-slate-400 sm:size-12" aria-hidden />
                )}
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="absolute bottom-0 right-0 size-8 rounded-full border border-[#E8E6E0] bg-white p-0 shadow-sm hover:bg-slate-50"
                onClick={() => setEditDialog("demographics")}
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
          <Section title="Contact" icon={PhoneIcon}
            action={<Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setEditDialog("contact")}><PencilIcon className="size-3 text-muted-foreground" /></Button>}>
            <InfoRow icon={PhoneIcon} label="Phone" value={contact.phone} />
            <InfoRow icon={MailIcon} label="Email" value={contact.email} />
            <InfoRow icon={MapPinIcon} label="Address" value={contact.address} />
          </Section>
          <Section title="Personal" icon={UserRoundIcon}
            action={<Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setEditDialog("personal")}><PencilIcon className="size-3 text-muted-foreground" /></Button>}>
            <InfoRow icon={CalendarDaysIcon} label="DOB" value={fmt(p.dateOfBirth)} />
            <InfoRow icon={HeartIcon} label="Status" value={formatMaritalStatus(personal.maritalStatus)} />
            <InfoRow icon={BriefcaseIcon} label="Occupation" value={personal.occupation} />
            <InfoRow icon={CreditCardIcon} label="National ID" value={personal.nationalId} />
          </Section>
          <Section title="Lifestyle" icon={HeartPulseIcon}
            action={<Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setEditDialog("lifestyle")}><PencilIcon className="size-3 text-muted-foreground" /></Button>}>
            {lifestyle.bmi && (
              <InfoRow icon={ScaleIcon} label="BMI" value={`${lifestyle.bmi} (${lifestyle.bmi >= 30 ? "Obese" : lifestyle.bmi >= 25 ? "Overweight" : "Normal"})`}
                valueClassName={lifestyle.bmi >= 30 ? "text-red-600" : lifestyle.bmi >= 25 ? "text-amber-600" : "text-emerald-600"} />
            )}
            <InfoRow icon={CigaretteIcon} label="Smoking" value={smokingDisplay}
              valueClassName={lifestyle.smokingStatus?.startsWith("current") ? "text-red-600" : lifestyle.smokingStatus?.startsWith("former") ? "text-amber-600" : lifestyle.smokingStatus ? "text-emerald-600" : undefined} />
            <InfoRow icon={CalendarClockIcon} label="Patient since" value={fmt(p.patientSince)} />
          </Section>
          <Section title="Allergies" icon={ShieldAlertIcon}
            action={<Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={openAllergiesDialog}><PencilIcon className="size-3 text-muted-foreground" /></Button>}>
            <AllergyPreview items={allergies} />
          </Section>
          <Section title="Family History" icon={UsersIcon}
            action={<Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={openFamilyHistoryDialog}><PencilIcon className="size-3 text-muted-foreground" /></Button>}>
            <FamilyHistoryPreview items={familyHistory} />
          </Section>
          <Section title="Upcoming" icon={CalendarClockIcon}
            action={
                  <Button size="sm" variant="ghost" className="h-7 gap-1 px-1.5 text-[11px] text-[#CC5533] hover:bg-[#CC5533]/5 sm:text-[12px]" onClick={openAppointmentDialog}>
                <CalendarPlusIcon className="size-3.5" />Book
              </Button>
            }>
            {p.upcomingAppointmentDate ? (
              <InfoRow icon={CalendarClockIcon} label="Next appointment" value={fmt(p.upcomingAppointmentDate)} valueClassName="text-[#1A5345]" />
            ) : (
              <p className="text-[11px] text-muted-foreground sm:text-[12px]">No upcoming appointments</p>
            )}
            <InfoRow icon={CalendarClockIcon} label="Last visit" value={fmt(p.lastVisitDate)} />
          </Section>
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
                      <p className="mt-1 text-[10px] text-muted-foreground sm:text-[11px]">{fmt(note.date)} &middot; {note.author}</p>
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
          <RecordCard
            icon={ActivityIcon}
            iconColor="text-blue-600"
            title="Vitals & Readings"
            subtitle="Blood pressure, heart rate, SpO\u2082, blood sugar"
            count={record.vitalReadings.length}
            href={`${basePath}/vitals`}
          />
          <RecordCard
            icon={PillIcon}
            iconColor="text-emerald-600"
            title="Medications"
            subtitle="Active prescriptions, adherence, side effects"
            count={activeMeds}
            href={`${basePath}/medications`}
          />
          <RecordCard
            icon={ClipboardCheckIcon}
            iconColor="text-indigo-600"
            title="Diagnoses & Conditions"
            subtitle="ICD-10 coded diagnoses, severity, status"
            count={record.diagnoses.length}
            href={`${basePath}/diagnoses`}
          />
          <RecordCard
            icon={FlaskConicalIcon}
            iconColor="text-violet-600"
            title="Lab Results"
            subtitle="Blood work, panels, pathology reports"
            count={record.labResults.length}
            href={`${basePath}/lab-results`}
          />
          <RecordCard
            icon={FileTextIcon}
            iconColor="text-orange-600"
            title="Documents & Files"
            subtitle="ECGs, imaging, referrals, prescriptions"
            count={record.documents.length}
            href={`${basePath}/documents`}
          />
          <RecordCard
            icon={CalendarDaysIcon}
            iconColor="text-sky-600"
            title="Consultation History"
            subtitle="Past consultations, reports, follow-ups"
            count={record.visits.length}
            href={`${basePath}/consultations`}
          />
        </div>

        {/* Edit Contact Dialog */}
        <Dialog open={editDialog === "contact"} onOpenChange={(open) => { if (!open) setEditDialog(null) }}>
          <DialogContent
            aria-describedby={undefined}
            className="w-full max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl border-[#E8E6E0]/60 bg-white p-0 shadow-2xl sm:max-w-[480px]"
          >
            <div className="flex flex-col gap-4 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <PhoneIcon className="size-5 shrink-0 text-[#1A5345] sm:size-6" aria-hidden />
                <DialogTitle className="text-left font-serif text-[17px] font-bold leading-tight text-[#1A1F1E]">
                  Edit contact info
                </DialogTitle>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="contact-phone" className="text-[12px] font-bold text-[#1A1F1E]">
                    Phone
                  </Label>
                  <Input
                    id="contact-phone"
                    value={contact.phone}
                    onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                    className="h-10 rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[13px] shadow-sm focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="contact-email" className="text-[12px] font-bold text-[#1A1F1E]">
                    Email
                  </Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={contact.email}
                    onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                    className="h-10 rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[13px] shadow-sm focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="contact-address" className="text-[12px] font-bold text-[#1A1F1E]">
                    Address
                  </Label>
                  <Input
                    id="contact-address"
                    value={contact.address}
                    onChange={(e) => setContact((c) => ({ ...c, address: e.target.value }))}
                    className="h-10 rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[13px] shadow-sm focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-xl border-[#E8E6E0]/80 px-3.5 text-[12px] font-semibold text-[#1A1F1E] shadow-sm hover:bg-[#FAFAF8]"
                  onClick={() => setEditDialog(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-9 rounded-xl border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-sm hover:bg-[#133F34] disabled:opacity-50"
                  onClick={saveContact}
                  disabled={isUpdating}
                >
                  {isUpdating ? <Loader2Icon className="size-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Demographics Dialog */}
        <Dialog open={editDialog === "demographics"} onOpenChange={(open) => { if (!open) setEditDialog(null) }}>
          <DialogContent
            aria-describedby={undefined}
            className="w-full max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl border-[#E8E6E0]/60 bg-white p-0 shadow-2xl sm:max-w-[480px]"
          >
            <div className="flex flex-col gap-4 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <UserRoundIcon className="size-5 shrink-0 text-[#1A5345] sm:size-6" aria-hidden />
                <DialogTitle className="text-left font-serif text-[17px] font-bold leading-tight text-[#1A1F1E]">
                  Edit profile photo & demographics
                </DialogTitle>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label className="text-[12px] font-bold text-[#1A1F1E]">Profile photo</Label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setDemographics((d) => ({ ...d, profileImageUrl: "" }))}
                      className={cn(
                        "flex size-14 items-center justify-center rounded-full border-2 bg-slate-50 transition-colors",
                        !demographics.profileImageUrl
                          ? "border-[#1A5345] ring-2 ring-[#1A5345]/20"
                          : "border-[#E8E6E0] hover:border-[#1A5345]/40",
                      )}
                      aria-label="No photo"
                    >
                      <UserRoundIcon className="size-6 text-slate-400" />
                    </button>
                    {PATIENT_AVATAR_OPTIONS.map((avatar) => (
                      <button
                        key={avatar}
                        type="button"
                        onClick={() => setDemographics((d) => ({ ...d, profileImageUrl: avatar }))}
                        className={cn(
                          "size-14 overflow-hidden rounded-full border-2 transition-colors",
                          demographics.profileImageUrl === avatar
                            ? "border-[#1A5345] ring-2 ring-[#1A5345]/20"
                            : "border-[#E8E6E0] hover:border-[#1A5345]/40",
                        )}
                      >
                        <img src={avatar} alt="" className="size-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="demographics-gender" className="text-[12px] font-bold text-[#1A1F1E]">
                    Gender
                  </Label>
                  <Select
                    value={demographics.gender}
                    onValueChange={(value) =>
                      setDemographics((d) => ({
                        ...d,
                        gender: value as typeof d.gender,
                      }))
                    }
                  >
                    <SelectTrigger
                      id="demographics-gender"
                      className="h-10 rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[13px] shadow-sm focus:ring-[#1A5345]/20"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-[#E8E6E0]">
                      {PATIENT_GENDERS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="demographics-blood-type" className="text-[12px] font-bold text-[#1A1F1E]">
                    Blood type
                  </Label>
                  <Select
                    value={demographics.bloodType || "unset"}
                    onValueChange={(value) =>
                      setDemographics((d) => ({
                        ...d,
                        bloodType: value === "unset" ? "" : value,
                      }))
                    }
                  >
                    <SelectTrigger
                      id="demographics-blood-type"
                      className="h-10 rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[13px] shadow-sm focus:ring-[#1A5345]/20"
                    >
                      <SelectValue placeholder="Not set" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-[#E8E6E0]">
                      <SelectItem value="unset">Not set</SelectItem>
                      {PATIENT_BLOOD_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-xl border-[#E8E6E0]/80 px-3.5 text-[12px] font-semibold text-[#1A1F1E] shadow-sm hover:bg-[#FAFAF8]"
                  onClick={() => setEditDialog(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-9 rounded-xl border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-sm hover:bg-[#133F34] disabled:opacity-50"
                  onClick={saveDemographics}
                  disabled={isUpdating}
                >
                  {isUpdating ? <Loader2Icon className="size-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Personal Dialog */}
        <Dialog open={editDialog === "personal"} onOpenChange={(open) => { if (!open) setEditDialog(null) }}>
          <DialogContent
            aria-describedby={undefined}
            className="w-full max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl border-[#E8E6E0]/60 bg-white p-0 shadow-2xl sm:max-w-[480px]"
          >
            <div className="flex flex-col gap-4 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <UserRoundIcon className="size-5 shrink-0 text-[#1A5345] sm:size-6" aria-hidden />
                <DialogTitle className="text-left font-serif text-[17px] font-bold leading-tight text-[#1A1F1E]">
                  Edit personal info
                </DialogTitle>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="personal-marital" className="text-[12px] font-bold text-[#1A1F1E]">
                    Marital status
                  </Label>
                  <Select
                    value={personal.maritalStatus || "unset"}
                    onValueChange={(value) =>
                      setPersonal((prev) => ({
                        ...prev,
                        maritalStatus: value === "unset" ? "" : value,
                      }))
                    }
                  >
                    <SelectTrigger
                      id="personal-marital"
                      className="h-10 rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[13px] shadow-sm focus:ring-[#1A5345]/20"
                    >
                      <SelectValue placeholder="Not set" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-[#E8E6E0]">
                      <SelectItem value="unset">Not set</SelectItem>
                      {PATIENT_MARITAL_STATUSES.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="personal-occupation" className="text-[12px] font-bold text-[#1A1F1E]">
                    Occupation
                  </Label>
                  <Input
                    id="personal-occupation"
                    value={personal.occupation}
                    onChange={(e) => setPersonal((prev) => ({ ...prev, occupation: e.target.value }))}
                    className="h-10 rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[13px] shadow-sm focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="personal-national-id" className="text-[12px] font-bold text-[#1A1F1E]">
                    National ID
                  </Label>
                  <Input
                    id="personal-national-id"
                    value={personal.nationalId}
                    onChange={(e) => setPersonal((prev) => ({ ...prev, nationalId: e.target.value }))}
                    className="h-10 rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[13px] shadow-sm focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-xl border-[#E8E6E0]/80 px-3.5 text-[12px] font-semibold text-[#1A1F1E] shadow-sm hover:bg-[#FAFAF8]"
                  onClick={() => setEditDialog(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-9 rounded-xl border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-sm hover:bg-[#133F34] disabled:opacity-50"
                  onClick={savePersonal}
                  disabled={isUpdating}
                >
                  {isUpdating ? <Loader2Icon className="size-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Lifestyle Dialog */}
        <Dialog open={editDialog === "lifestyle"} onOpenChange={(open) => { if (!open) setEditDialog(null) }}>
          <DialogContent
            aria-describedby={undefined}
            className="w-full max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl border-[#E8E6E0]/60 bg-white p-0 shadow-2xl sm:max-w-[480px]"
          >
            <div className="flex flex-col gap-4 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <CigaretteIcon className="size-5 shrink-0 text-[#1A5345] sm:size-6" aria-hidden />
                <DialogTitle className="text-left font-serif text-[17px] font-bold leading-tight text-[#1A1F1E]">
                  Edit lifestyle
                </DialogTitle>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="lifestyle-smoking" className="text-[12px] font-bold text-[#1A1F1E]">
                    Smoking status
                  </Label>
                  <Select
                    value={lifestyle.smokingStatus || "unset"}
                    onValueChange={(value) =>
                      setLifestyle((l) => ({
                        ...l,
                        smokingStatus: value === "unset" ? "" : value,
                      }))
                    }
                  >
                    <SelectTrigger
                      id="lifestyle-smoking"
                      className="h-10 rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[13px] shadow-sm focus:ring-[#1A5345]/20"
                    >
                      <SelectValue placeholder="Not set" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-[#E8E6E0]">
                      <SelectItem value="unset">Not set</SelectItem>
                      {PATIENT_SMOKING_STATUSES.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {lifestyle.bmi != null ? (
                  <p className="text-[12px] text-muted-foreground">
                    BMI is calculated from height and weight in vitals ({lifestyle.bmi}).
                  </p>
                ) : null}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-xl border-[#E8E6E0]/80 px-3.5 text-[12px] font-semibold text-[#1A1F1E] shadow-sm hover:bg-[#FAFAF8]"
                  onClick={() => setEditDialog(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-9 rounded-xl border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-sm hover:bg-[#133F34] disabled:opacity-50"
                  onClick={saveLifestyle}
                  disabled={isUpdating}
                >
                  {isUpdating ? <Loader2Icon className="size-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Allergies Dialog */}
        <Dialog
          open={editDialog === "allergies"}
          onOpenChange={(open) => {
            if (!open) {
              setEditDialog(null)
              setNewAllergy(emptyAllergyForm())
            }
          }}
        >
          <DialogContent
            aria-describedby={undefined}
            className="w-full max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl border-[#E8E6E0]/60 bg-white p-0 shadow-2xl sm:max-w-[520px]"
          >
            <div className="flex flex-col gap-4 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <ShieldAlertIcon className="size-5 shrink-0 text-rose-600 sm:size-6" aria-hidden />
                <DialogTitle className="text-left font-serif text-[17px] font-bold leading-tight text-[#1A1F1E]">
                  Manage allergies
                </DialogTitle>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label className="text-[12px] font-bold text-[#1A1F1E]">Current allergies</Label>
                  {allergies.length > 0 ? (
                    <div className="space-y-2">
                      {allergies.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-start justify-between gap-3 rounded-xl border border-rose-100 bg-rose-50/60 px-3 py-2.5"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className="rounded-lg border-0 bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-none hover:bg-rose-600">
                                {entry.allergen}
                              </Badge>
                              <span className="text-[11px] font-medium text-rose-600/80">
                                {ALLERGY_CATEGORY_LABELS[entry.category]}
                              </span>
                            </div>
                            {entry.reaction ? (
                              <p className="mt-1 text-[12px] leading-relaxed text-rose-700">{entry.reaction}</p>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            onClick={() => setAllergies((prev) => prev.filter((item) => item.id !== entry.id))}
                            className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                            aria-label={`Remove ${entry.allergen}`}
                          >
                            <XIcon className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[13px] font-medium text-muted-foreground">No allergies recorded.</p>
                  )}
                </div>

                <div className="rounded-xl border border-[#E8E6E0]/60 bg-[#FAFAF8] p-4">
                  <p className="mb-3 text-[13px] font-bold text-[#1A1F1E]">Add allergy</p>
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="allergy-category" className="text-[12px] font-bold text-[#1A1F1E]">
                          Category
                        </Label>
                        <Select
                          value={newAllergy.category}
                          onValueChange={(value) =>
                            setNewAllergy((prev) => ({
                              ...prev,
                              category: value as PatientAllergyEntry["category"],
                            }))
                          }
                        >
                          <SelectTrigger
                            id="allergy-category"
                            className="h-10 rounded-xl border-[#E8E6E0] bg-white text-[13px] shadow-sm focus:ring-[#1A5345]/20"
                          >
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-[#E8E6E0]">
                            <SelectItem value="drug">Drug</SelectItem>
                            <SelectItem value="food">Food</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="allergy-allergen" className="text-[12px] font-bold text-[#1A1F1E]">
                          Allergen
                        </Label>
                        <Input
                          id="allergy-allergen"
                          value={newAllergy.allergen}
                          onChange={(e) => setNewAllergy((prev) => ({ ...prev, allergen: e.target.value }))}
                          placeholder="e.g. Penicillin"
                          className="h-10 rounded-xl border-[#E8E6E0] bg-white text-[13px] shadow-sm focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="allergy-reaction" className="text-[12px] font-bold text-[#1A1F1E]">
                        Reaction <span className="font-medium text-muted-foreground">(optional)</span>
                      </Label>
                      <Input
                        id="allergy-reaction"
                        value={newAllergy.reaction}
                        onChange={(e) => setNewAllergy((prev) => ({ ...prev, reaction: e.target.value }))}
                        placeholder="e.g. Anaphylaxis, rash"
                        className="h-10 rounded-xl border-[#E8E6E0] bg-white text-[13px] shadow-sm focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 w-full rounded-xl border-[#E8E6E0]/80 bg-white text-[12px] font-semibold text-[#1A1F1E] shadow-sm hover:bg-[#F9F8F5]"
                      onClick={addAllergyEntry}
                      disabled={!newAllergy.allergen.trim()}
                    >
                      <PlusIcon className="size-3.5" aria-hidden />
                      Add allergy
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  className="h-9 rounded-xl border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-sm hover:bg-[#133F34]"
                  onClick={() => setEditDialog(null)}
                >
                  Done
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Family History Dialog */}
        <Dialog
          open={editDialog === "family"}
          onOpenChange={(open) => {
            if (!open) {
              setEditDialog(null)
              setNewFamily(emptyFamilyHistoryForm())
            }
          }}
        >
          <DialogContent
            aria-describedby={undefined}
            className="w-full max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl border-[#E8E6E0]/60 bg-white p-0 shadow-2xl sm:max-w-[520px]"
          >
            <div className="flex flex-col gap-4 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <UsersIcon className="size-5 shrink-0 text-[#1A5345] sm:size-6" aria-hidden />
                <DialogTitle className="text-left font-serif text-[17px] font-bold leading-tight text-[#1A1F1E]">
                  Manage family history
                </DialogTitle>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label className="text-[12px] font-bold text-[#1A1F1E]">Recorded conditions</Label>
                  {familyHistory.length > 0 ? (
                    <div className="space-y-2">
                      {familyHistory.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-start justify-between gap-3 rounded-xl border border-[#E8E6E0]/60 bg-[#FAFAF8] px-3 py-2.5"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className="rounded-lg border-0 bg-[#1A5345] px-2 py-0.5 text-[10px] font-bold text-white shadow-none hover:bg-[#1A5345]">
                                {entry.relationship}
                              </Badge>
                              <span className="text-[13px] font-bold text-[#1A1F1E]">{entry.condition}</span>
                            </div>
                            {entry.details ? (
                              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{entry.details}</p>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            onClick={() => setFamilyHistory((prev) => prev.filter((item) => item.id !== entry.id))}
                            className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                            aria-label={`Remove ${entry.relationship} — ${entry.condition}`}
                          >
                            <XIcon className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[13px] font-medium text-muted-foreground">No family history recorded.</p>
                  )}
                </div>

                <div className="rounded-xl border border-[#E8E6E0]/60 bg-[#FAFAF8] p-4">
                  <p className="mb-3 text-[13px] font-bold text-[#1A1F1E]">Add family member</p>
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="family-relationship" className="text-[12px] font-bold text-[#1A1F1E]">
                          Relationship
                        </Label>
                        <Select
                          value={newFamily.relationship}
                          onValueChange={(value) => setNewFamily((prev) => ({ ...prev, relationship: value }))}
                        >
                          <SelectTrigger
                            id="family-relationship"
                            className="h-10 rounded-xl border-[#E8E6E0] bg-white text-[13px] shadow-sm focus:ring-[#1A5345]/20"
                          >
                            <SelectValue placeholder="Select relationship" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-[#E8E6E0]">
                            {FAMILY_RELATIONSHIP_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="family-condition" className="text-[12px] font-bold text-[#1A1F1E]">
                          Condition
                        </Label>
                        <Input
                          id="family-condition"
                          value={newFamily.condition}
                          onChange={(e) => setNewFamily((prev) => ({ ...prev, condition: e.target.value }))}
                          placeholder="e.g. Diabetes"
                          className="h-10 rounded-xl border-[#E8E6E0] bg-white text-[13px] shadow-sm focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="family-details" className="text-[12px] font-bold text-[#1A1F1E]">
                        Additional details <span className="font-medium text-muted-foreground">(optional)</span>
                      </Label>
                      <Input
                        id="family-details"
                        value={newFamily.details}
                        onChange={(e) => setNewFamily((prev) => ({ ...prev, details: e.target.value }))}
                        placeholder="e.g. Diagnosed at age 52"
                        className="h-10 rounded-xl border-[#E8E6E0] bg-white text-[13px] shadow-sm focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 w-full rounded-xl border-[#E8E6E0]/80 bg-white text-[12px] font-semibold text-[#1A1F1E] shadow-sm hover:bg-[#F9F8F5]"
                      onClick={addFamilyHistoryEntry}
                      disabled={!newFamily.relationship.trim() || !newFamily.condition.trim()}
                    >
                      <PlusIcon className="size-3.5" aria-hidden />
                      Add family member
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  className="h-9 rounded-xl border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-sm hover:bg-[#133F34]"
                  onClick={() => setEditDialog(null)}
                >
                  Done
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Schedule Appointment Dialog */}
        <Dialog
          open={appointmentDialog}
          onOpenChange={(open) => {
            setAppointmentDialog(open)
            if (!open) {
              setAppointmentForm({ date: "", time: "", type: "follow-up", notes: "" })
            }
          }}
        >
          <DialogContent
            aria-describedby={undefined}
            className="w-full max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl border-[#E8E6E0]/60 bg-white p-0 shadow-2xl sm:max-w-[480px]"
          >
            <div className="flex flex-col gap-4 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <CalendarPlusIcon className="size-5 shrink-0 text-[#1A5345] sm:size-6" aria-hidden />
                <DialogTitle className="text-left font-serif text-[17px] font-bold leading-tight text-[#1A1F1E]">
                  Schedule appointment
                </DialogTitle>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="appointment-date" className="text-[12px] font-bold text-[#1A1F1E]">
                    Date
                  </Label>
                  <Input
                    id="appointment-date"
                    type="date"
                    value={appointmentForm.date}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setAppointmentForm((f) => ({ ...f, date: e.target.value, time: "" }))}
                    className="h-10 rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[13px] shadow-sm focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-[12px] font-bold text-[#1A1F1E]">Available slots</Label>
                  {appointmentForm.date ? (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                      {appointmentSlotsQuery.isLoading ? (
                        <div className="flex h-[88px] items-center justify-center rounded-xl border border-dashed border-[#E8E6E0] bg-[#FAFAF8]">
                          <span className="text-[13px] font-medium text-muted-foreground">Loading slots…</span>
                        </div>
                      ) : appointmentSlotsQuery.isError ? (
                        <div className="flex h-[88px] items-center justify-center rounded-xl border border-dashed border-red-200 bg-red-50/40 px-4 text-center">
                          <span className="text-[13px] font-medium text-red-600">Could not load slots for this date.</span>
                        </div>
                      ) : (appointmentSlotsQuery.data?.length ?? 0) > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {appointmentSlotsQuery.data!.map((slot) => (
                            <button
                              key={slot.value}
                              type="button"
                              onClick={() => setAppointmentForm((f) => ({ ...f, time: slot.value }))}
                              className={cn(
                                "h-10 rounded-xl border text-[13px] font-semibold transition-colors",
                                appointmentForm.time === slot.value
                                  ? "border-[#1A5345] bg-[#1A5345] text-white shadow-[0_2px_10px_rgba(26,83,69,0.2)]"
                                  : "border-[#E8E6E0]/80 bg-white text-[#6B7870] hover:border-[#1A5345]/40 hover:bg-[#1A5345]/5 hover:text-[#1A5345]",
                              )}
                            >
                              {slot.label}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex h-[88px] items-center justify-center rounded-xl border border-dashed border-[#E8E6E0] bg-[#FAFAF8] px-4 text-center">
                          <span className="text-[13px] font-medium text-muted-foreground">No available slots on this date.</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-[88px] items-center justify-center rounded-xl border border-dashed border-[#E8E6E0] bg-[#FAFAF8]">
                      <span className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
                        <CalendarIcon className="size-4 opacity-50" aria-hidden />
                        Select a date to see available slots
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="appointment-type" className="text-[12px] font-bold text-[#1A1F1E]">
                    Type
                  </Label>
                  <Select
                    value={appointmentForm.type}
                    onValueChange={(v) => setAppointmentForm((f) => ({ ...f, type: v }))}
                  >
                    <SelectTrigger
                      id="appointment-type"
                      className="h-10 rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[13px] shadow-sm focus:ring-[#1A5345]/20"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-[#E8E6E0]">
                      <SelectItem value="follow-up">Follow-up</SelectItem>
                      <SelectItem value="new">New consultation</SelectItem>
                      <SelectItem value="post-procedure">Post-procedure</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="appointment-notes" className="text-[12px] font-bold text-[#1A1F1E]">
                    Notes <span className="font-medium text-muted-foreground">(optional)</span>
                  </Label>
                  <Textarea
                    id="appointment-notes"
                    value={appointmentForm.notes}
                    onChange={(e) => setAppointmentForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Optional notes..."
                    className="min-h-[80px] resize-none rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[13px] shadow-sm focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-xl border-[#E8E6E0]/80 px-3.5 text-[12px] font-semibold text-[#1A1F1E] shadow-sm hover:bg-[#FAFAF8]"
                  onClick={() => setAppointmentDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-9 rounded-xl border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-sm hover:bg-[#133F34] disabled:opacity-50"
                  onClick={() => setAppointmentDialog(false)}
                  disabled={!appointmentForm.date || !appointmentForm.time}
                >
                  Schedule
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={clinicalNoteDialog}
          onOpenChange={(open) => {
            setClinicalNoteDialog(open)
            if (!open) setNewClinicalNote("")
          }}
        >
          <DialogContent
            aria-describedby={undefined}
            className="w-full max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl border-[#E8E6E0]/60 bg-white p-0 shadow-2xl sm:max-w-[520px]"
          >
            <div className="flex flex-col gap-4 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <MessageSquareIcon className="size-5 shrink-0 text-[#CC5533] sm:size-6" aria-hidden />
                <DialogTitle className="text-left font-serif text-[17px] font-bold leading-tight text-[#1A1F1E]">
                  Add clinical note
                </DialogTitle>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="clinical-note-body" className="text-[12px] font-bold text-[#1A1F1E]">
                  Note
                </Label>
                <Textarea
                  id="clinical-note-body"
                  value={newClinicalNote}
                  onChange={(e) => setNewClinicalNote(e.target.value)}
                  placeholder="Document observations, follow-up reminders, or care context…"
                  className="min-h-[120px] rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[13px] shadow-sm focus-visible:border-[#CC5533] focus-visible:ring-[#CC5533]/20"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-xl border-[#E8E6E0]/80 px-3.5 text-[12px] font-semibold"
                  onClick={() => setClinicalNoteDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-9 gap-1.5 rounded-xl border-0 bg-[#CC5533] px-4 text-[12px] font-bold text-white hover:bg-[#B84A2D] disabled:opacity-50"
                  onClick={() => void saveClinicalNote()}
                  disabled={!newClinicalNote.trim() || profileExtras.isSavingNote}
                >
                  {profileExtras.isSavingNote ? (
                    <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <PlusIcon className="size-3.5" aria-hidden />
                  )}
                  Save note
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={careGoalDialog}
          onOpenChange={(open) => {
            setCareGoalDialog(open)
            if (!open) setNewCareGoal(emptyCareGoalForm())
          }}
        >
          <DialogContent
            aria-describedby={undefined}
            className="w-full max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl border-[#E8E6E0]/60 bg-white p-0 shadow-2xl sm:max-w-[520px]"
          >
            <div className="flex flex-col gap-4 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <TargetIcon className="size-5 shrink-0 text-[#CC5533] sm:size-6" aria-hidden />
                <DialogTitle className="text-left font-serif text-[17px] font-bold leading-tight text-[#1A1F1E]">
                  Add care goal
                </DialogTitle>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label htmlFor="care-goal-metric" className="text-[12px] font-bold text-[#1A1F1E]">
                    Metric
                  </Label>
                  <Input
                    id="care-goal-metric"
                    value={newCareGoal.metric}
                    onChange={(e) => setNewCareGoal((prev) => ({ ...prev, metric: e.target.value }))}
                    placeholder="e.g. HbA1c, Blood pressure"
                    className="h-10 rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[13px]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="care-goal-target" className="text-[12px] font-bold text-[#1A1F1E]">
                    Target
                  </Label>
                  <Input
                    id="care-goal-target"
                    value={newCareGoal.target}
                    onChange={(e) => setNewCareGoal((prev) => ({ ...prev, target: e.target.value }))}
                    placeholder="e.g. < 7%"
                    className="h-10 rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[13px]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="care-goal-current" className="text-[12px] font-bold text-[#1A1F1E]">
                    Current (optional)
                  </Label>
                  <Input
                    id="care-goal-current"
                    value={newCareGoal.current}
                    onChange={(e) => setNewCareGoal((prev) => ({ ...prev, current: e.target.value }))}
                    placeholder="e.g. 7.4%"
                    className="h-10 rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[13px]"
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label className="text-[12px] font-bold text-[#1A1F1E]">Status</Label>
                  <Select
                    value={newCareGoal.status}
                    onValueChange={(value) =>
                      setNewCareGoal((prev) => ({
                        ...prev,
                        status: value as PatientCareGoal["status"],
                      }))
                    }
                  >
                    <SelectTrigger className="h-10 rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-[#E8E6E0]">
                      {CARE_GOAL_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-xl border-[#E8E6E0]/80 px-3.5 text-[12px] font-semibold"
                  onClick={() => setCareGoalDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-9 gap-1.5 rounded-xl border-0 bg-[#CC5533] px-4 text-[12px] font-bold text-white hover:bg-[#B84A2D] disabled:opacity-50"
                  onClick={() => void saveCareGoal()}
                  disabled={
                    !newCareGoal.metric.trim() ||
                    !newCareGoal.target.trim() ||
                    profileExtras.isSavingGoal
                  }
                >
                  {profileExtras.isSavingGoal ? (
                    <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <PlusIcon className="size-3.5" aria-hidden />
                  )}
                  Save goal
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}
