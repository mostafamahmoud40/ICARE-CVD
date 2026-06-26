"use client"

import Link from "next/link"
import { PatientAvatar } from "@/components/shared/PatientAvatar"
import { useParams } from "next/navigation"
import { useMemo, useState } from "react"
import {
  BellIcon,
  BrainCircuitIcon,
  CalendarIcon,
  CheckCircle2Icon,
  CheckIcon,
  ClockIcon,
  ExternalLinkIcon,
  FileTextIcon,
  FlagIcon,
  MessageSquareTextIcon,
  MoreVerticalIcon,
  PauseIcon,
  PencilLineIcon,
  PillIcon,
  PlayIcon,
  PlusIcon,
  SparklesIcon,
  StethoscopeIcon,
  StopCircleIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"

import type { PatientMedicationProfile } from "@/app/(assistant)/assistant-medications/assistantMedications.types"
import { MedicationRecordDialog } from "@/app/(assistant)/assistant-medications/MedicationRecordDialog"
import { MedicationReminderDialog } from "@/app/(assistant)/assistant-medications/MedicationReminderDialog"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { AddPrescriptionDialog } from "./AddPrescriptionDialog"
import { EditPrescriptionDialog } from "./EditPrescriptionDialog"
import { PrescriptionDetailDialog } from "./PrescriptionDetailDialog"
import {
  getDoctorPatientClinicalContext,
  computeAgeFromDob,
  deriveAdherenceHistory7d,
} from "./doctorPrescriptionsClinical.mock"
import {
  AdherencePill,
  MedicationDots,
  MedicationSnapshotCard,
  PrescriptionStatusBadge,
  RiskBadge,
  TYPE_LABELS,
  formatDate,
  formatDateTime,
  prescriptionsScrollbarCss,
} from "./doctorPrescriptions.shared"
import type { PatientPrescription } from "./doctorPrescriptions.types"
import { useDoctorPrescriptions } from "./useDoctorPrescriptions"

type DoctorPrescriptionsPatientDetailProps = {
  patientId?: string
}

function formatTimeOnly(iso: string) {
  return new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date(iso))
}

export function DoctorPrescriptionsPatientDetail({
  patientId: patientIdFromRoute,
}: DoctorPrescriptionsPatientDetailProps = {}) {
  const params = useParams()
  const patientIdParam = patientIdFromRoute ?? params.patientId
  const patientId =
    typeof patientIdParam === "string"
      ? patientIdParam
      : Array.isArray(patientIdParam)
        ? (patientIdParam[0] ?? "")
        : ""

  const {
    data,
    isLoading,
    addPrescription,
    updatePrescription,
    pausePrescription,
    resumePrescription,
    discontinuePrescription,
    deletePrescription,
  } = useDoctorPrescriptions()

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedPrescription, setSelectedPrescription] = useState<PatientPrescription | null>(null)
  const [editingPrescription, setEditingPrescription] = useState<PatientPrescription | null>(null)
  const [medicationsTab, setMedicationsTab] = useState<"active" | "past">("active")
  const [searchQuery, setSearchQuery] = useState("")
  const [resolvedFlagIds, setResolvedFlagIds] = useState<Set<string>>(new Set())
  const [dismissedInsightIds, setDismissedInsightIds] = useState<Set<string>>(new Set())
  const [reviewedEscalationIds, setReviewedEscalationIds] = useState<Set<string>>(new Set())
  const [reminderOpen, setReminderOpen] = useState(false)
  const [reminderMedSummary, setReminderMedSummary] = useState<string | null>(null)
  const [recordRx, setRecordRx] = useState<PatientPrescription | null>(null)
  const [reminderPending, setReminderPending] = useState(false)

  const openEdit = (rx: PatientPrescription) => {
    setSelectedPrescription(null)
    setEditingPrescription(rx)
  }

  const handleReactivate = async (rx: PatientPrescription) => {
    const wasDiscontinued = rx.status === "discontinued"
    await resumePrescription(rx.id)
    setSelectedPrescription(null)
    setMedicationsTab("active")
    toast.success(wasDiscontinued ? "Prescription reactivated" : "Prescription resumed", {
      description: `${rx.name} is active again for this patient.`,
    })
  }

  const patient = data.patients.find((p) => p.id === patientId) ?? null

  const patientRxs = useMemo(() => {
    let filtered = data.prescriptions.filter((r) => r.patientId === patientId)
    if (medicationsTab === "active") {
      filtered = filtered.filter((r) => r.status === "active" || r.status === "paused")
    } else {
      filtered = filtered.filter((r) => r.status === "discontinued")
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.dose.toLowerCase().includes(q) ||
          (TYPE_LABELS[r.type] ?? "").toLowerCase().includes(q) ||
          (r.instructions ?? "").toLowerCase().includes(q),
      )
    }
    return filtered.sort((a, b) => {
      if (a.status === "active" && b.status !== "active") return -1
      if (a.status !== "active" && b.status === "active") return 1
      return a.name.localeCompare(b.name)
    })
  }, [data.prescriptions, patientId, medicationsTab, searchQuery])

  const activeRxs = data.prescriptions.filter(
    (r) => r.patientId === patientId && r.status === "active",
  )
  const poorCount = activeRxs.filter((r) => r.compliance === "poor").length
  const avgAdherence =
    activeRxs.length > 0
      ? Math.round(activeRxs.reduce((sum, r) => sum + r.adherencePercent, 0) / activeRxs.length)
      : 0

  const clinical = useMemo(() => {
    if (!patient) return null
    return getDoctorPatientClinicalContext(patient.id, patient.fullName, poorCount, avgAdherence)
  }, [patient, poorCount, avgAdherence])

  const openFlags = useMemo(
    () => clinical?.flags.filter((f) => f.status === "open" && !resolvedFlagIds.has(f.id)) ?? [],
    [clinical, resolvedFlagIds],
  )
  const visibleInsights = useMemo(
    () => clinical?.aiInsights.filter((i) => !dismissedInsightIds.has(i.id)) ?? [],
    [clinical, dismissedInsightIds],
  )
  const pendingEscalations = useMemo(
    () => clinical?.escalations.filter((e) => !reviewedEscalationIds.has(e.id)) ?? [],
    [clinical, reviewedEscalationIds],
  )

  const reminderProfile: PatientMedicationProfile | null = useMemo(() => {
    if (!patient || !clinical) return null
    return {
      id: patient.id,
      fullName: patient.fullName,
      age: computeAgeFromDob(patient.dateOfBirth) ?? 0,
      phone: clinical.phone,
      riskTier: clinical.riskTier,
      overallAdherencePct: avgAdherence,
      medications: [],
      flags: [],
      aiInsights: [],
      contactHistory: [],
      escalations: [],
    }
  }, [patient, clinical, avgAdherence])

  const currentPrescription = selectedPrescription
    ? (data.prescriptions.find((r) => r.id === selectedPrescription.id) ?? null)
    : null

  const openPatientReminder = () => {
    setReminderMedSummary(null)
    setReminderOpen(true)
  }

  const openMedReminder = (rx: PatientPrescription) => {
    setReminderMedSummary(`${rx.name} ${rx.dose}`)
    setReminderOpen(true)
  }

  const resolveFlag = (flagId: string) => {
    setResolvedFlagIds((prev) => new Set(prev).add(flagId))
    toast.success("Flag marked resolved", {
      description: "Preview — workflow sync with care team when API is ready.",
    })
  }

  const reviewEscalation = (escalationId: string) => {
    setReviewedEscalationIds((prev) => new Set(prev).add(escalationId))
    toast.success("Escalation reviewed", {
      description: "Assistant team will be notified when the API is connected.",
    })
  }

  const dismissInsight = (insightId: string) => {
    setDismissedInsightIds((prev) => new Set(prev).add(insightId))
  }

  if (!patientId) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center gap-4 bg-[#F9F8F5] p-8 text-center">
        <p className="text-sm text-muted-foreground">Missing patient.</p>
        <Button asChild className="rounded-xl">
          <Link href="/doctor-prescriptions">Back to prescriptions</Link>
        </Button>
      </div>
    )
  }

  const patientAge = patient ? computeAgeFromDob(patient.dateOfBirth) : null

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#F9F8F5]">
      <header className="shrink-0 border-b border-[#E8E6E0]/60 bg-white px-6 py-4 sm:px-8">
        <Breadcrumb>
          <BreadcrumbList className="text-[10px] sm:text-[11px]">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/doctor-prescriptions" className="text-[10px] font-medium sm:text-[11px]">
                  Patient prescriptions
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="max-w-[min(100vw-12rem,28rem)] truncate text-[10px] font-medium text-foreground sm:text-[11px]">
                {patient ? patient.fullName : isLoading ? "Loading…" : "Patient"}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex min-h-0 flex-1 flex-col bg-white">
        {isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
            Loading patient…
          </div>
        ) : !patient || !clinical ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-12 text-center">
            <PillIcon className="size-12 text-muted-foreground/30" />
            <h2 className="text-lg font-bold text-[#1A1F1E]">Patient not found</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              This patient is not in your list or the link is invalid.
            </p>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/doctor-prescriptions">Back to prescriptions</Link>
            </Button>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden animate-in fade-in duration-300">
            <div className="z-10 flex flex-wrap items-center justify-between gap-4 border-b border-[#E8E6E0]/60 bg-[#F9F8F5] px-6 py-6 sm:px-8">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center overflow-hidden rounded-2xl border border-[#E8E6E0]/60 bg-white shadow-sm">
                  <PatientAvatar
                    name={patient.fullName}
                    avatarUrl={patient.avatarUrl}
                    sizes="48px"
                    initialsClassName="text-[14px]"
                  />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-[20px] font-bold tracking-tight text-[#1A1F1E]">
                      {patient.fullName}
                    </h2>
                    <RiskBadge tier={clinical.riskTier} />
                  </div>
                  <p className="mt-0.5 text-[13px] font-medium capitalize text-muted-foreground">
                    {patient.gender}
                    {patientAge != null ? ` · ${patientAge} years old` : ""}
                    {clinical.phone ? ` · ${clinical.phone}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg border border-[#E8E6E0] bg-white px-4 text-[12px] font-bold text-[#1A1F1E] shadow-sm hover:bg-[#F9F8F5]"
                >
                  <Link href={`/doctor-patients/${patient.id}`}>
                    <ExternalLinkIcon className="mr-2 size-4 text-[#1A5345]" />
                    Patient chart
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg border border-[#E8E6E0] bg-white px-4 text-[12px] font-bold text-[#1A5345] shadow-sm hover:bg-[#F9F8F5]"
                  onClick={() =>
                    toast.message("Adherence report", {
                      description: `Preparing report for ${patient.fullName}…`,
                    })
                  }
                >
                  <FileTextIcon className="mr-2 size-4" />
                  Adherence report
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg border border-[#E8E6E0] bg-white px-4 text-[12px] font-bold text-[#1A1F1E] shadow-sm hover:bg-[#F9F8F5]"
                  onClick={openPatientReminder}
                >
                  <BellIcon className="mr-2 size-4 text-[#1A5345]" />
                  Send nudge
                </Button>
                <Button
                  size="sm"
                  className="h-8 rounded-lg border-0 bg-[#1A5345] px-5 text-[12px] font-bold text-white shadow-sm hover:bg-[#133F34]"
                  onClick={() => setShowAddDialog(true)}
                >
                  <PlusIcon className="mr-2 size-4" />
                  Add prescription
                </Button>
              </div>
            </div>

            <ScrollArea className="custom-scrollbar flex-1">
              <div className="space-y-10 p-6 sm:p-8">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  <MedicationSnapshotCard label="Adherence score">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[18px] font-bold leading-none tabular-nums text-[#1A1F1E]">
                        {avgAdherence}%
                      </span>
                      {activeRxs.length > 0 ? <AdherencePill pct={avgAdherence} /> : null}
                    </div>
                  </MedicationSnapshotCard>
                  <MedicationSnapshotCard label="Active prescriptions">
                    <div className="flex items-center gap-2">
                      <span className="text-[18px] font-bold leading-none tabular-nums text-[#1A5345]">
                        {activeRxs.length}
                      </span>
                      <PillIcon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
                    </div>
                  </MedicationSnapshotCard>
                  <MedicationSnapshotCard label="Follow-up items">
                    <p className="text-[18px] font-bold leading-none tabular-nums text-amber-600">
                      {clinical.followUpCount}
                    </p>
                  </MedicationSnapshotCard>
                  <MedicationSnapshotCard label="Active flags">
                    <div className="flex items-center gap-2">
                      <span className="text-[18px] font-bold leading-none tabular-nums text-rose-600">
                        {openFlags.length}
                      </span>
                      <FlagIcon className="size-5 shrink-0 text-rose-600" aria-hidden />
                    </div>
                  </MedicationSnapshotCard>
                  <MedicationSnapshotCard label="Last contact">
                    {clinical.contactHistory[0] ? (
                      <div className="space-y-1.5">
                        <div className="flex min-w-0 items-center gap-2">
                          <CalendarIcon className="size-4 shrink-0 text-[#1A5345]/70" aria-hidden />
                          <span className="text-[13px] font-bold leading-none text-[#1A1F1E]">
                            {formatDate(clinical.contactHistory[0].createdAt)}
                          </span>
                        </div>
                        <div className="flex min-w-0 items-center gap-2">
                          <ClockIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                          <span className="min-w-0 text-[11px] font-medium tabular-nums text-[#6B7870]">
                            {formatTimeOnly(clinical.contactHistory[0].createdAt)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[13px] font-medium text-[#6B7870]">No history</p>
                    )}
                  </MedicationSnapshotCard>
                </div>

                <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
                  <div className="space-y-8 xl:col-span-2">
                    <section>
                      <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                          <div className="flex items-center gap-2">
                            <PillIcon className="size-5 text-[#1A5345]" aria-hidden />
                            <h3 className="text-[18px] font-bold text-[#1A1F1E]">Prescriptions</h3>
                          </div>
                          <div className="flex items-center rounded-lg border border-[#E8E6E0] bg-[#F9F8F5] p-0.5 shadow-sm">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setMedicationsTab("active")}
                              className={cn(
                                "h-7 rounded-md px-3 text-[11px] font-bold transition-all",
                                medicationsTab === "active"
                                  ? "bg-white text-[#1A1F1E] shadow-sm"
                                  : "text-muted-foreground hover:text-[#1A1F1E]",
                              )}
                            >
                              Active
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setMedicationsTab("past")}
                              className={cn(
                                "h-7 rounded-md px-3 text-[11px] font-bold transition-all",
                                medicationsTab === "past"
                                  ? "bg-white text-[#1A1F1E] shadow-sm"
                                  : "text-muted-foreground hover:text-[#1A1F1E]",
                              )}
                            >
                              Past &amp; history
                            </Button>
                          </div>
                        </div>
                        <input
                          type="search"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search prescriptions…"
                          className="h-9 w-full max-w-[220px] rounded-xl border border-[#E8E6E0]/80 bg-[#F9F8F5] px-3 text-[12px] font-medium text-[#1A1F1E] placeholder:text-muted-foreground/55 focus-visible:border-[#1A5345]/50 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A5345]/12"
                        />
                      </div>

                      <div className="overflow-hidden rounded-2xl border border-[#E8E6E0]/80 bg-white shadow-sm">
                        {patientRxs.length === 0 ? (
                          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                            <PillIcon className="mb-4 size-12 stroke-[1.25] text-muted-foreground/40" />
                            <p className="text-[16px] font-bold text-[#1A1F1E]">
                              {searchQuery ? "No prescriptions match" : "No prescriptions on record"}
                            </p>
                            {!searchQuery && medicationsTab === "active" ? (
                              <Button
                                size="sm"
                                className="mt-4 h-8 rounded-lg bg-[#1A5345] text-[12px] font-bold text-white hover:bg-[#133F34]"
                                onClick={() => setShowAddDialog(true)}
                              >
                                <PlusIcon className="mr-1.5 size-3.5" />
                                Add first prescription
                              </Button>
                            ) : null}
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="min-w-[820px] w-full border-collapse text-left">
                              <thead>
                                <tr className="border-b border-[#E8E6E0]/60 bg-[#F9F8F5]">
                                  <th className="px-5 py-4 text-[13px] font-bold text-[#1A1F1E]">Drug name</th>
                                  <th className="px-5 py-4 text-[13px] font-bold text-[#1A1F1E]">Dosage</th>
                                  <th className="px-5 py-4 text-[13px] font-bold text-[#1A1F1E]">7-day adherence</th>
                                  <th className="px-5 py-4 text-[13px] font-bold text-[#1A1F1E]">Status</th>
                                  <th className="px-5 py-4 text-right text-[13px] font-bold text-[#1A1F1E]">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#E8E6E0]/40">
                                {patientRxs.map((rx) => {
                                  const history7d = deriveAdherenceHistory7d(rx.adherencePercent)
                                  return (
                                    <tr key={rx.id} className="group transition-colors hover:bg-[#F9F8F5]/30">
                                      <td className="px-5 py-4">
                                        <button
                                          type="button"
                                          onClick={() => setSelectedPrescription(rx)}
                                          className="text-left"
                                        >
                                          <p className="text-[14px] font-bold text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]">
                                            {rx.name}
                                          </p>
                                          <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                                            {TYPE_LABELS[rx.type] ?? rx.type}
                                          </p>
                                        </button>
                                      </td>
                                      <td className="px-5 py-4">
                                        <p className="max-w-[220px] text-[13px] font-medium leading-relaxed text-[#1A1F1E]/80">
                                          {rx.dose} · {rx.frequency}
                                        </p>
                                        {rx.instructions ? (
                                          <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                                            {rx.instructions}
                                          </p>
                                        ) : null}
                                      </td>
                                      <td className="px-5 py-4">
                                        {rx.status === "discontinued" ? (
                                          <Badge
                                            variant="secondary"
                                            className="border-0 bg-slate-100 text-[10px] font-bold text-slate-600"
                                          >
                                            Discontinued
                                          </Badge>
                                        ) : (
                                          <div className="flex max-w-[148px] flex-col gap-1.5">
                                            <MedicationDots history={history7d} />
                                            <div className="flex items-center gap-2">
                                              <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-[#E8E6E0]">
                                                <div
                                                  className={cn(
                                                    "h-full rounded-full bg-emerald-500",
                                                    rx.adherencePercent < 85 && "bg-amber-500",
                                                    rx.adherencePercent < 65 && "bg-rose-500",
                                                  )}
                                                  style={{ width: `${rx.adherencePercent}%` }}
                                                />
                                              </div>
                                              <span className="shrink-0 text-[10px] font-bold tabular-nums text-muted-foreground">
                                                {rx.adherencePercent}%
                                              </span>
                                            </div>
                                          </div>
                                        )}
                                      </td>
                                      <td className="px-5 py-4">
                                        <PrescriptionStatusBadge status={rx.status} />
                                      </td>
                                      <td className="px-5 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 border-0 bg-transparent text-[#1A5345] shadow-none hover:bg-transparent hover:text-[#133F34]"
                                            title="Edit prescription"
                                            onClick={() => openEdit(rx)}
                                          >
                                            <PencilLineIcon className="size-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 border-0 bg-transparent text-[#1A5345] shadow-none hover:bg-transparent hover:text-[#0F3D32]"
                                            title="Send reminder"
                                            onClick={() => openMedReminder(rx)}
                                          >
                                            <BellIcon className="size-4" />
                                          </Button>
                                          {rx.status === "active" ? (
                                            <>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 border-0 bg-transparent text-muted-foreground shadow-none hover:bg-transparent hover:text-[#1A5345]"
                                                title="Pause"
                                                onClick={() => pausePrescription(rx.id)}
                                              >
                                                <PauseIcon className="size-4" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 border-0 bg-transparent text-amber-600 shadow-none hover:bg-transparent hover:text-amber-700"
                                                title="Discontinue"
                                                onClick={() => discontinuePrescription(rx.id)}
                                              >
                                                <StopCircleIcon className="size-4" />
                                              </Button>
                                            </>
                                          ) : rx.status === "paused" ? (
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="size-8 border-0 bg-transparent text-[#1A5345] shadow-none hover:bg-transparent hover:text-[#0F3D32]"
                                              title="Resume"
                                              onClick={() => void handleReactivate(rx)}
                                            >
                                              <PlayIcon className="size-4" />
                                            </Button>
                                          ) : rx.status === "discontinued" ? (
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="size-8 border-0 bg-transparent text-[#1A5345] shadow-none hover:bg-transparent hover:text-[#0F3D32]"
                                              title="Reactivate prescription"
                                              onClick={() => void handleReactivate(rx)}
                                            >
                                              <PlayIcon className="size-4" />
                                            </Button>
                                          ) : null}
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 border-0 bg-transparent text-muted-foreground shadow-none hover:bg-transparent hover:text-[#1A1F1E]"
                                              >
                                                <MoreVerticalIcon className="size-4" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                              align="end"
                                              className="w-52 rounded-xl border-[#E8E6E0]/60 p-1.5 shadow-lg"
                                            >
                                              <DropdownMenuItem onClick={() => setSelectedPrescription(rx)}>
                                                <FileTextIcon className="mr-2 size-3.5" />
                                                View details
                                              </DropdownMenuItem>
                                              <DropdownMenuItem onClick={() => openEdit(rx)}>
                                                <PencilLineIcon className="mr-2 size-3.5" />
                                                Edit prescription
                                              </DropdownMenuItem>
                                              <DropdownMenuItem onClick={() => setRecordRx(rx)}>
                                                <ClockIcon className="mr-2 size-3.5" />
                                                View dose history
                                              </DropdownMenuItem>
                                              {rx.status === "discontinued" ? (
                                                <DropdownMenuItem onClick={() => void handleReactivate(rx)}>
                                                  <PlayIcon className="mr-2 size-3.5" />
                                                  Reactivate prescription
                                                </DropdownMenuItem>
                                              ) : null}
                                              {rx.status === "paused" ? (
                                                <DropdownMenuItem onClick={() => void handleReactivate(rx)}>
                                                  <PlayIcon className="mr-2 size-3.5" />
                                                  Resume prescription
                                                </DropdownMenuItem>
                                              ) : null}
                                              <DropdownMenuItem
                                                className="text-rose-600 focus:text-rose-600"
                                                onClick={() => deletePrescription(rx.id)}
                                              >
                                                <Trash2Icon className="mr-2 size-3.5" />
                                                Delete prescription
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </div>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </section>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <section className="space-y-4">
                        <h3 className="flex items-center gap-2 text-[15px] font-bold text-[#1A1F1E]">
                          <MessageSquareTextIcon className="size-4 text-[#1A5345]" />
                          Recent activity
                        </h3>
                        <div className="space-y-3">
                          {clinical.contactHistory.length === 0 ? (
                            <p className="px-2 text-[12px] italic text-muted-foreground">No activity logged.</p>
                          ) : (
                            clinical.contactHistory.slice(0, 3).map((event) => (
                              <div
                                key={event.id}
                                className="space-y-2 rounded-xl border border-[#E8E6E0]/80 bg-[#F9F8F5]/30 p-4"
                              >
                                <div className="flex items-center justify-between">
                                  <Badge variant="outline" className="bg-white text-[9px] font-bold">
                                    {event.channel}
                                  </Badge>
                                  <span className="text-[10px] font-medium text-muted-foreground">
                                    {formatDateTime(event.createdAt).split(",")[0]}
                                  </span>
                                </div>
                                <p className="text-[13px] font-bold text-[#1A1F1E]">{event.summary}</p>
                                <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                                  {event.messagePreview}
                                </p>
                                <p className="text-[10px] font-medium text-muted-foreground">
                                  By {event.createdByLabel}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </section>

                      <section className="space-y-4">
                        <h3 className="flex items-center gap-2 text-[15px] font-bold text-[#1A1F1E]">
                          <StethoscopeIcon className="size-4 text-[#1A5345]" />
                          Assistant escalations
                        </h3>
                        <div className="space-y-3">
                          {pendingEscalations.length === 0 ? (
                            <p className="px-2 text-[12px] italic text-muted-foreground">No pending escalations.</p>
                          ) : (
                            pendingEscalations.slice(0, 3).map((event) => (
                              <div
                                key={event.id}
                                className="space-y-2 rounded-xl border border-[#E8E6E0]/80 bg-[#FBFDFC] p-4"
                              >
                                <div className="flex items-center justify-between">
                                  <Badge className="rounded-lg border-0 bg-[#CC5533] text-[10px] font-bold text-white shadow-sm">
                                    {event.priority}
                                  </Badge>
                                  <span className="text-[10px] font-medium text-muted-foreground">
                                    {formatDateTime(event.createdAt).split(",")[0]}
                                  </span>
                                </div>
                                <p className="text-[13px] font-bold text-[#1A1F1E]">{event.reason}</p>
                                <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                                  {event.note}
                                </p>
                                <Button
                                  variant="outline"
                                  className="h-9 w-full rounded-xl border-[#1A5345]/30 text-[12px] font-bold text-[#1A5345] hover:bg-[#E8F0EE]"
                                  onClick={() => reviewEscalation(event.id)}
                                >
                                  <CheckIcon className="mr-2 size-3.5" />
                                  Mark reviewed
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                      </section>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <section className="space-y-4">
                      <div className="flex items-center gap-2">
                        <BrainCircuitIcon className="size-5 text-[#1A5345]" />
                        <h3 className="text-[16px] font-bold text-[#1A1F1E]">Safety insights</h3>
                      </div>
                      <div className="space-y-3">
                        {visibleInsights.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-[#E8E6E0] bg-[#F9F8F5]/30 p-8 text-center">
                            <SparklesIcon className="mx-auto mb-2 size-6 text-muted-foreground/20" />
                            <p className="text-[12px] font-medium text-muted-foreground">No active AI alerts</p>
                          </div>
                        ) : (
                          visibleInsights.map((insight) => (
                            <div
                              key={insight.id}
                              className="group relative overflow-hidden rounded-2xl border border-[#E8E6E0] bg-gradient-to-br from-[#E8F0EE]/50 to-white p-5 shadow-sm"
                            >
                              <div className="absolute right-0 top-0 p-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 rounded-lg text-[#1A5345]/50 opacity-0 transition-opacity hover:bg-[#E8F0EE] hover:text-[#1A5345] group-hover:opacity-100"
                                  onClick={() => dismissInsight(insight.id)}
                                >
                                  <XIcon className="size-3.5" />
                                </Button>
                              </div>
                              <div className="mb-3 flex items-center gap-2">
                                <Badge className="rounded-lg border-0 bg-[#1A5345] text-[10px] font-bold text-white shadow-sm">
                                  {insight.kind}
                                </Badge>
                                <span className="text-[10px] font-bold tracking-tight text-[#1A5345]/60">
                                  {insight.confidencePct}% match
                                </span>
                              </div>
                              <h4 className="mb-1 text-[14px] font-bold text-[#1A1F1E]">{insight.title}</h4>
                              <p className="text-[12px] leading-relaxed text-[#1A5345]/80">{insight.detail}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </section>

                    <section className="space-y-4">
                      <div className="flex items-center gap-2">
                        <FlagIcon className="size-5 text-rose-600" />
                        <h3 className="text-[16px] font-bold text-[#1A1F1E]">Risk flags</h3>
                      </div>
                      <div className="space-y-3">
                        {openFlags.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-[#E8E6E0] bg-[#F9F8F5]/30 p-8 text-center">
                            <CheckCircle2Icon className="mx-auto mb-2 size-6 text-emerald-500/20" />
                            <p className="text-[12px] font-medium text-muted-foreground">No active risk flags</p>
                          </div>
                        ) : (
                          openFlags.map((flag) => (
                            <div
                              key={flag.id}
                              className="space-y-3 rounded-2xl border border-rose-100 bg-white p-5 shadow-sm"
                            >
                              <div className="flex items-center justify-between">
                                <Badge
                                  className={cn(
                                    "rounded-lg border-0 text-[10px] font-bold shadow-sm",
                                    flag.severity === "critical"
                                      ? "bg-rose-600 text-white"
                                      : "bg-amber-600 text-white",
                                  )}
                                >
                                  {flag.severity}
                                </Badge>
                                <span className="text-[10px] font-medium text-muted-foreground">
                                  {formatDateTime(flag.createdAt).split(",")[0]}
                                </span>
                              </div>
                              <div>
                                <p className="text-[13px] font-bold text-[#1A1F1E]">{flag.reason}</p>
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                  Logged by {flag.createdByLabel}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                className="h-9 w-full rounded-xl border-rose-200 text-[12px] font-bold text-rose-600 hover:bg-rose-50"
                                onClick={() => resolveFlag(flag.id)}
                              >
                                <CheckIcon className="mr-2 size-3.5" />
                                Mark as resolved
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </section>

                    <section className="rounded-2xl border border-[#E8E6E0]/80 bg-[#F9F8F5]/40 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[#6B7870]">
                        Prescriber controls
                      </p>
                      <ul className="mt-3 space-y-2 text-[12px] font-medium text-[#1A1F1E]">
                        <li className="flex items-center gap-2">
                          <CheckIcon className="size-3.5 text-[#1A5345]" />
                          Add, edit, pause, resume, or discontinue prescriptions
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckIcon className="size-3.5 text-[#1A5345]" />
                          Resolve assistant flags and review escalations
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckIcon className="size-3.5 text-[#1A5345]" />
                          Send patient nudges and export adherence reports
                        </li>
                      </ul>
                    </section>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {patient ? (
        <AddPrescriptionDialog
          open={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          patientName={patient.fullName}
          patientId={patient.id}
          onAdd={async (payload) => {
            await addPrescription(payload)
            setShowAddDialog(false)
          }}
        />
      ) : null}

      <PrescriptionDetailDialog
        prescription={currentPrescription}
        onClose={() => setSelectedPrescription(null)}
        onEdit={(rx) => openEdit(rx)}
        onReactivate={(rx) => void handleReactivate(rx)}
      />

      <EditPrescriptionDialog
        open={!!editingPrescription}
        onClose={() => setEditingPrescription(null)}
        prescription={editingPrescription}
        onSave={updatePrescription}
      />

      {reminderOpen && reminderProfile ? (
        <MedicationReminderDialog
          open={reminderOpen}
          onOpenChange={setReminderOpen}
          profile={reminderProfile}
          medicationSummary={reminderMedSummary}
          isPending={reminderPending}
          onSubmit={async (values) => {
            setReminderPending(true)
            try {
              await new Promise((resolve) => setTimeout(resolve, 400))
              toast.success("Reminder sent", {
                description: `${values.channel.toUpperCase()} · ${values.templateLabel ?? "Custom message"}`,
              })
            } finally {
              setReminderPending(false)
            }
          }}
        />
      ) : null}

      {recordRx ? (
        <MedicationRecordDialog
          open={!!recordRx}
          onOpenChange={(open) => !open && setRecordRx(null)}
          medicationId={recordRx.id}
          medicationName={recordRx.name}
          strength={recordRx.dose}
          type="pill"
          dosageInstructions={recordRx.instructions ?? `${recordRx.dose} · ${recordRx.frequency}`}
          frequencyLabel={recordRx.frequency}
          apiPrefix="doctor"
        />
      ) : null}

      <style dangerouslySetInnerHTML={{ __html: prescriptionsScrollbarCss() }} />
    </div>
  )
}
