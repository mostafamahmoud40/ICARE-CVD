"use client"

import { useMemo, useState } from "react"
import type {
  PatientInfo,
  PatientPrescription,
  PrescriptionType,
} from "./doctorPrescriptions.types"
import { cn } from "@/lib/utils"
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClockIcon,
  Edit3Icon,
  FileTextIcon,
  MoonIcon,
  PauseIcon,
  PlayIcon,
  PillIcon,
  PlusIcon,
  SearchIcon,
  StopCircleIcon,
  SunriseIcon,
  SunIcon,
  Trash2Icon,
  UserRoundIcon,
  XIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

const TYPE_LABELS: Record<string, string> = {
  antihypertensives: "Anti-hypertensives",
  antiplatelets: "Antiplatelets",
  anticoagulants: "Anticoagulants",
  statins: "Statins",
  antiarrhythmics: "Antiarrhythmics",
  diuretics: "Diuretics",
  diabetes_medications: "Diabetes",
}

const TIME_ICONS: Record<string, React.ElementType> = {
  morning: SunriseIcon,
  afternoon: SunIcon,
  evening: MoonIcon,
}

function formatTimeOnly(iso: string) {
  return new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date(iso))
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(iso))
}

type PatientRxCardProps = {
  prescription: PatientPrescription
  onPause: (id: string) => void
  onResume: (id: string) => void
  onDiscontinue: (id: string) => void
  onDelete: (id: string) => void
  onClick: () => void
}

function PatientRxCard({
  prescription,
  onPause,
  onResume,
  onDiscontinue,
  onDelete,
  onClick,
}: PatientRxCardProps) {
  const isActive = prescription.status === "active"
  const isPaused = prescription.status === "paused"
  const isDiscontinued = prescription.status === "discontinued"
  const isPoorCompliance = prescription.compliance === "poor" && isActive

  return (
    <div
      className={cn(
        "rounded-xl border-2 bg-white p-4 transition-all",
        isPoorCompliance
          ? "border-amber-300"
          : isPaused
            ? "border-[#E5EEEA] opacity-75"
            : isDiscontinued
              ? "border-[#E5EEEA] opacity-50"
              : "border-[#E5EEEA] hover:border-[#A8C4BC]",
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            isDiscontinued
              ? "bg-[#EEF2EF] text-[#738678]"
              : isPaused
                ? "bg-[#F6EFE4] text-[#9A6B2F]"
                : "bg-[#E8F0EE] text-[#1A5345]",
          )}
        >
          <PillIcon className="size-5" />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={onClick} className="font-semibold text-[#102F27] hover:underline">
              {prescription.name}
            </button>
            <span className="text-sm text-muted-foreground">{prescription.dose}</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-medium",
                isActive
                  ? "bg-[#E8F0EE] text-[#1A5345]"
                  : isPaused
                    ? "bg-[#F6EFE4] text-[#9A6B2F]"
                    : "bg-[#EEF2EF] text-[#738678]",
              )}
            >
              {prescription.status}
            </span>
            <span className="rounded-full bg-[#F5F5F3] px-2 py-0.5 text-[11px] text-[#6B7870]">
              {TYPE_LABELS[prescription.type] ?? prescription.type}
            </span>
            {isPoorCompliance && (
              <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-600">
                <AlertTriangleIcon className="size-3" />
                Poor compliance
              </span>
            )}
          </div>

          <div className="mt-1 text-sm text-muted-foreground">
            {prescription.frequency} &middot;{" "}
            {prescription.timeOfDay.map((tod) => {
              const Icon = TIME_ICONS[tod]
              return (
                <span key={tod} className="mr-1 inline-flex items-center gap-0.5">
                  <Icon className="size-3" />
                  {tod}
                </span>
              )
            })}
            {prescription.duration && (
              <span className="ml-1 rounded-full bg-[#F0F7F5] px-1.5 py-0.5 text-[11px] text-[#1A5345]">
                {prescription.duration}
              </span>
            )}
          </div>

          {/* Adherence bar */}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">Adherence:</span>
            <div className="h-1.5 w-20 rounded-full bg-[#E8E6E0]">
              <div
                className={cn(
                  "h-1.5 rounded-full",
                  prescription.adherencePercent >= 80
                    ? "bg-[#1A5345]"
                    : prescription.adherencePercent >= 50
                      ? "bg-amber-400"
                      : "bg-red-400",
                )}
                style={{ width: `${prescription.adherencePercent}%` }}
              />
            </div>
            <span
              className={cn(
                "text-[11px] font-medium",
                prescription.adherencePercent >= 80
                  ? "text-[#1A5345]"
                  : prescription.adherencePercent >= 50
                    ? "text-amber-500"
                    : "text-red-500",
              )}
            >
              {prescription.adherencePercent}%
            </span>
          </div>

          {prescription.sideEffects && (
            <p className="mt-1 text-[12px] text-muted-foreground">
              <span className="font-medium">Side effects:</span> {prescription.sideEffects}
            </p>
          )}

          {prescription.lastTakenAt && (
            <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
              <ClockIcon className="size-3" />
              Last taken: {formatTimeOnly(prescription.lastTakenAt)}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-0.5">
          {isActive ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-[#6B7870] hover:text-[#1A5345]"
                onClick={(e) => { e.stopPropagation(); onPause(prescription.id) }}
                title="Pause"
              >
                <PauseIcon className="size-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                onClick={(e) => { e.stopPropagation(); onDiscontinue(prescription.id) }}
                title="Stop"
              >
                <StopCircleIcon className="size-4" />
              </Button>
            </>
          ) : isPaused ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-[#1A5345] hover:bg-[#E8F0EE]"
              onClick={(e) => { e.stopPropagation(); onResume(prescription.id) }}
              title="Resume"
            >
              <PlayIcon className="size-4" />
            </Button>
          ) : null}

          <div className="mx-1 h-4 w-px bg-[#E5EEEA]" />

          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-[#6B7870] hover:text-red-500 hover:bg-red-50"
            onClick={(e) => { e.stopPropagation(); onDelete(prescription.id) }}
            title="Delete"
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

type PatientPrescriptionPanelProps = {
  patient: PatientInfo
  prescriptions: PatientPrescription[]
  onAddPrescription: () => void
  onPause: (id: string) => void
  onResume: (id: string) => void
  onDiscontinue: (id: string) => void
  onDelete: (id: string) => void
  onSelectPrescription: (prescription: PatientPrescription) => void
  className?: string
}

export function PatientPrescriptionPanel({
  patient,
  prescriptions,
  onAddPrescription,
  onPause,
  onResume,
  onDiscontinue,
  onDelete,
  onSelectPrescription,
  className,
}: PatientPrescriptionPanelProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | PrescriptionType>("all")

  const patientRxs = useMemo(() => {
    let filtered = prescriptions.filter((r) => r.patientId === patient.id)

    if (typeFilter !== "all") {
      filtered = filtered.filter((r) => r.type === typeFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.dose.toLowerCase().includes(q) ||
          (TYPE_LABELS[r.type] ?? "").toLowerCase().includes(q),
      )
    }

    return filtered.sort((a, b) => {
      if (a.status === "active" && b.status !== "active") return -1
      if (a.status !== "active" && b.status === "active") return 1
      if (a.compliance === "poor" && b.compliance !== "poor") return -1
      return a.name.localeCompare(b.name)
    })
  }, [prescriptions, patient.id, typeFilter, searchQuery])

  const availableTypes = useMemo(() => {
    const types = new Set(
      prescriptions.filter((r) => r.patientId === patient.id).map((r) => r.type),
    )
    return Array.from(types)
  }, [prescriptions, patient.id])

  const activeCount = patientRxs.filter((r) => r.status === "active").length
  const poorCompliance = patientRxs.filter(
    (r) => r.compliance === "poor" && r.status === "active",
  ).length

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Patient Header */}
      <div className="border-b border-[#E8E6E0] bg-[#FAFAF8] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-[#E8F0EE]">
              <UserRoundIcon className="size-5 text-[#1A5345]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#1A1F1E]">{patient.fullName}</h3>
              <p className="text-[12px] text-muted-foreground">
                {patient.age}y, {patient.gender} &middot; {patient.condition}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="h-8 gap-1.5 bg-[#1A5345] px-3 text-[12px] hover:bg-[#0F3D32]"
            onClick={onAddPrescription}
          >
            <PlusIcon className="size-3.5" />
            Add Prescription
          </Button>
        </div>

        {/* Quick stats */}
        <div className="mt-3 flex items-center gap-3">
          <span className="rounded-full bg-[#E8F0EE] px-2.5 py-0.5 text-[11px] font-medium text-[#1A5345]">
            {activeCount} active
          </span>
          {poorCompliance > 0 && (
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-600">
              {poorCompliance} poor compliance
            </span>
          )}
        </div>

        {/* Search + Filter */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="relative w-full md:w-64">
            <SearchIcon className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#9CA3AF]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prescriptions..."
              className="h-7 border-[#E8E6E0] bg-white pl-8 text-[12px] placeholder:text-[#9CA3AF]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7870]"
              >
                <XIcon className="size-3" />
              </button>
            )}
          </div>
          <div className="scrollbar-hide flex gap-1 overflow-x-auto">
            <button
              onClick={() => setTypeFilter("all")}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                typeFilter === "all"
                  ? "bg-[#1A5345] text-white"
                  : "bg-[#E8E6E0]/50 text-[#6B7870] hover:bg-[#E8E6E0]",
              )}
            >
              All
            </button>
            {availableTypes.map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                  typeFilter === type
                    ? "bg-[#1A5345] text-white"
                    : "bg-[#E8E6E0]/50 text-[#6B7870] hover:bg-[#E8E6E0]",
                )}
              >
                {TYPE_LABELS[type] ?? type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Prescriptions List */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {patientRxs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-[#F5F5F3]">
              <PillIcon className="size-6 text-[#9CA3AF]" />
            </div>
            <p className="text-[13px] text-[#6B7870]">
              {searchQuery ? "No prescriptions match your search." : "No prescriptions on record."}
            </p>
            {!searchQuery && (
              <Button
                size="sm"
                variant="outline"
                className="mt-3 gap-1.5 text-[12px]"
                onClick={onAddPrescription}
              >
                <PlusIcon className="size-3.5" />
                Add First Prescription
              </Button>
            )}
          </div>
        ) : (
          patientRxs.map((rx) => (
            <PatientRxCard
              key={rx.id}
              prescription={rx}
              onPause={onPause}
              onResume={onResume}
              onDiscontinue={onDiscontinue}
              onDelete={onDelete}
              onClick={() => onSelectPrescription(rx)}
            />
          ))
        )}
      </div>
    </div>
  )
}
