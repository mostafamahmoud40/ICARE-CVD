"use client"

import Image from "next/image"
import Link from "next/link"
import * as React from "react"
import {
  ArrowRightIcon,
  BabyIcon,
  BoneIcon,
  BrainIcon,
  Building2Icon,
  CalendarIcon,
  ClockIcon,
  EyeIcon,
  FilterIcon,
  LayoutGridIcon,
  ListIcon,
  MapPinIcon,
  SearchIcon,
  StarIcon,
  StethoscopeIcon,
  VerifiedIcon,
  VideoIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { medicationsListSearchInputClassName } from "@/app/(assistant)/assistant-medications/assistantMedications.shared"

import type {
  Doctor,
  DoctorAvailability,
  DoctorAvailabilityFilter,
  DoctorVisitChannels,
  Specialty,
} from "./doctorDirectory.types"
import { DOCTOR_SORT_OPTIONS, DOCTOR_VISIT_CHANNELS_LABELS } from "./doctorDirectory.utils"
import { useDoctorDirectory } from "./useDoctorDirectory"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Brain: BrainIcon,
  Baby: BabyIcon,
  Stethoscope: StethoscopeIcon,
  Bone: BoneIcon,
  Eye: EyeIcon,
}

const AVAILABILITY_DISPLAY: Record<DoctorAvailability, { label: string; badge: string }> = {
  Available: { label: "Available", badge: "bg-emerald-500" },
  Limited: { label: "Limited slots", badge: "bg-amber-500" },
  Unavailable: { label: "Fully booked", badge: "bg-slate-500" },
}

function AvailabilityIndicator({ availability }: { availability: DoctorAvailability }) {
  const cfg = AVAILABILITY_DISPLAY[availability]
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[10px] font-bold leading-none whitespace-nowrap text-white shadow-sm",
        cfg.badge,
      )}
    >
      {cfg.label}
    </span>
  )
}

function VisitChannelsIndicator({ channels }: { channels: DoctorVisitChannels }) {
  const label = DOCTOR_VISIT_CHANNELS_LABELS[channels]
  const showClinic = channels === "clinic" || channels === "both"
  const showVirtual = channels === "virtual" || channels === "both"

  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-medium text-[#6B7870]"
      title={label}
    >
      {showClinic ? (
        <Building2Icon className="size-3 shrink-0 text-[#1A5345]" aria-hidden />
      ) : null}
      {showVirtual ? (
        <VideoIcon className="size-3 shrink-0 text-[#1A5345]" aria-hidden />
      ) : null}
      <span className="whitespace-nowrap">{label}</span>
    </span>
  )
}

function SpecialtyIcon({ specialty }: { specialty: Specialty }) {
  if (specialty.emoji) {
    return (
      <span className="text-[14px] leading-none" aria-hidden>
        {specialty.emoji}
      </span>
    )
  }
  const Icon = iconMap[specialty.icon] || StethoscopeIcon
  return (
    <Icon className="size-3 shrink-0" style={{ color: specialty.color }} aria-hidden />
  )
}

function SpecialtyBadge({ specialty }: { specialty: Specialty }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-bold"
      style={{ color: specialty.color }}
    >
      <SpecialtyIcon specialty={specialty} />
      {specialty.name}
    </span>
  )
}

/** Toolbar sort — matches assistant-medications list typography (13px medium, rounded-xl). */
const directoryToolbarSelectTriggerClassName =
  "h-9 w-full min-w-0 shrink-0 rounded-xl border border-[#E8E6E0]/80 bg-white px-3 text-[13px] font-medium text-[#1A1F1E] shadow-none transition-[border-color,background-color] hover:bg-[#F9F8F5] focus-visible:border-[#1A5345]/50 focus-visible:ring-2 focus-visible:ring-[#1A5345]/12 sm:h-10 sm:w-[9.75rem] [&_span]:truncate"

const directoryToolbarSelectItemClassName =
  "cursor-pointer py-2 text-[13px] font-medium text-[#1A1F1E] focus:bg-[#F4F3EF] focus:text-[#1A1F1E]"

const AVAILABILITY_FILTER_OPTIONS: { value: DoctorAvailabilityFilter; label: string }[] = [
  { value: "all", label: "Any availability" },
  { value: "Available", label: "Available now" },
  { value: "Limited", label: "Limited slots" },
  { value: "Unavailable", label: "Fully booked" },
]

function DoctorRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-px">
        {[...Array(5)].map((_, i) => (
          <StarIcon
            key={i}
            className={cn(
              "size-3",
              i < Math.floor(rating) ? "fill-amber-400 text-amber-400" : "text-slate-200",
            )}
          />
        ))}
      </div>
      <span className="text-[11px] font-bold text-[#1A1F1E]">{rating}</span>
      <span className="text-[10px] font-medium text-muted-foreground">({count})</span>
    </div>
  )
}

function DoctorPhoto({ doctor }: { doctor: Doctor }) {
  const [imageFailed, setImageFailed] = React.useState(false)
  const initials = doctor.name
    .split(" ")
    .map((n) => n[0])
    .join("")
  const showFallback = !doctor.imageUrl || imageFailed

  if (showFallback) {
    return (
      <div className="flex h-full min-h-[7.5rem] w-full items-center justify-center font-serif text-[22px] font-bold text-[#1A5345] sm:text-[24px]">
        {initials}
      </div>
    )
  }

  return (
    <Image
      src={doctor.imageUrl}
      alt={doctor.name}
      fill
      sizes="(max-width: 768px) 112px, 160px"
      className="object-cover"
      onError={() => setImageFailed(true)}
    />
  )
}

function DoctorCard({ doctor }: { doctor: Doctor }) {
  return (
    <div className="group relative flex min-h-[7.5rem] gap-3 overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white p-2 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] transition-all hover:border-[#1A5345]/30 hover:shadow-md sm:min-h-[8.25rem] sm:gap-4 sm:p-3">
      <div className="relative w-28 shrink-0 self-stretch overflow-hidden rounded-2xl bg-[#F4F3EF] sm:w-36 md:w-40">
        <DoctorPhoto doctor={doctor} />
        {doctor.rating >= 4.8 ? (
          <div className="absolute bottom-2 left-2 flex w-fit max-w-[calc(100%-1rem)] items-center gap-1 rounded-lg border border-[#E8E6E0]/60 bg-white/95 px-1.5 py-0.5 shadow-sm backdrop-blur-sm">
            <VerifiedIcon className="size-3 shrink-0 text-[#1A5345]" aria-hidden />
            <span className="text-[9px] font-bold tracking-tight text-[#1A5345] whitespace-nowrap">
              TOP RATED
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center py-1 pr-1 sm:py-0.5 sm:pr-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <h3 className="min-w-0 truncate font-serif text-[15px] font-bold leading-snug text-[#1A1F1E] sm:text-[16px]">
                  {doctor.name}
                </h3>
                <AvailabilityIndicator availability={doctor.availability} />
              </div>
              <p className="mt-0.5 truncate text-[12px] font-medium text-muted-foreground">
                {doctor.title}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-serif text-[17px] font-bold leading-none text-[#1A1F1E] sm:text-[18px]">
                ${doctor.fee}
              </div>
              <p className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-[#6B7870]">
                Consultation
              </p>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <SpecialtyBadge specialty={doctor.specialty} />
            <VisitChannelsIndicator channels={doctor.visitChannels} />
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
              <ClockIcon className="size-3 shrink-0" aria-hidden />
              {doctor.experience} yrs
            </span>
            <span className="inline-flex min-w-0 items-center gap-1 text-[11px] font-medium text-[#6B7870]">
              <MapPinIcon className="size-3 shrink-0 text-[#1A5345]" aria-hidden />
              <span className="truncate">
                {doctor.hospital}, {doctor.location}
              </span>
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#6B7870]">
              <CalendarIcon className="size-3 shrink-0 text-[#1A5345]" aria-hidden />
              <span className="whitespace-nowrap">
                Next:{" "}
                <span className="font-bold text-[#1A1F1E]">
                  {new Date(doctor.nextAvailableSlot).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </span>
            </span>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-[#E8E6E0]/60 pt-2.5">
            <DoctorRating rating={doctor.rating} count={doctor.reviewCount} />
            <div className="flex items-center gap-1.5 sm:ml-auto">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2.5 text-[11px] font-bold text-[#1A5345] hover:bg-[#F4F3EF] hover:text-[#1A5345]"
              >
                View Profile
              </Button>
              <Button
                size="sm"
                className="h-7 gap-1 rounded-lg border-0 bg-[#1A5345] px-3 text-[11px] font-bold text-white shadow-sm transition-all hover:bg-[#133F34]"
              >
                Book Now
                <ArrowRightIcon className="size-3" />
              </Button>
            </div>
          </div>
        </div>
    </div>
  )
}

function DoctorGridCard({ doctor }: { doctor: Doctor }) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] transition-all hover:border-[#1A5345]/30 hover:shadow-md">
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-[#F4F3EF]">
        <DoctorPhoto doctor={doctor} />
        {doctor.rating >= 4.8 ? (
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-lg border border-[#E8E6E0]/60 bg-white/95 px-1.5 py-0.5 shadow-sm backdrop-blur-sm">
            <VerifiedIcon className="size-3 shrink-0 text-[#1A5345]" aria-hidden />
            <span className="text-[9px] font-bold tracking-tight text-[#1A5345] whitespace-nowrap">
              TOP RATED
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 flex-1 truncate font-serif text-[17px] font-bold leading-snug text-[#1A1F1E]">
              {doctor.name}
            </h3>
            <AvailabilityIndicator availability={doctor.availability} />
          </div>
          <p className="truncate text-[12px] font-medium text-muted-foreground">
            {doctor.title}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <SpecialtyBadge specialty={doctor.specialty} />
          <DoctorRating rating={doctor.rating} count={doctor.reviewCount} />
        </div>

        <div className="mt-4 flex flex-col gap-2 border-t border-[#E8E6E0]/60 pt-4">
          <div className="flex items-start gap-2 text-[12px] font-medium text-[#6B7870]">
            <MapPinIcon className="mt-0.5 size-3.5 shrink-0 text-[#1A5345]" aria-hidden />
            <span className="line-clamp-2 leading-tight">
              {doctor.hospital}, {doctor.location}
            </span>
          </div>
          <div className="flex items-start gap-2 text-[12px] font-medium text-[#6B7870]">
            <CalendarIcon className="mt-0.5 size-3.5 shrink-0 text-[#1A5345]" aria-hidden />
            <span className="line-clamp-2 leading-tight">
              Next:{" "}
              <span className="font-bold text-[#1A1F1E]">
                {new Date(doctor.nextAvailableSlot).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </span>
          </div>
          <div className="flex items-start gap-2">
            <VisitChannelsIndicator channels={doctor.visitChannels} />
          </div>
        </div>

        <div className="mt-auto pt-5">
          <div className="flex items-center justify-between border-t border-[#E8E6E0]/60 pt-4">
            <div className="flex flex-col">
              <div className="font-serif text-[18px] font-bold leading-none text-[#1A1F1E]">
                ${doctor.fee}
              </div>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-[#6B7870]">
                Consultation
              </p>
            </div>
            <Button
              size="sm"
              className="h-8 gap-1.5 rounded-lg border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-[0_2px_10px_rgba(26,83,69,0.2)] transition-all hover:bg-[#133F34] hover:shadow-[0_4px_14px_rgba(26,83,69,0.25)]"
            >
              Book Now
              <ArrowRightIcon className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function DoctorDirectory() {
  const [viewMode, setViewMode] = React.useState<"list" | "grid">("grid")
  const {
    doctors,
    specialties,
    searchQuery,
    setSearchQuery,
    selectedSpecialty,
    setSelectedSpecialty,
    availabilityFilter,
    setAvailabilityFilter,
    sortBy,
    setSortBy,
    resetFilters,
  } = useDoctorDirectory()

  const selectedSpecialtyName = specialties.find((s) => s.id === selectedSpecialty)?.name
  const advancedFilterCount =
    (selectedSpecialty ? 1 : 0) + (availabilityFilter !== "all" ? 1 : 0)

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="relative z-20 shrink-0 border-b border-[#E8E6E0]/60 bg-white">
        <div className="flex flex-col px-5 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-5">
          <div className="mb-2 flex items-center gap-2 sm:mb-2.5">
            <Breadcrumb>
              <BreadcrumbList className="text-[10px] sm:text-[11px]">
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/dashboard" className="text-[10px] font-medium sm:text-[11px]">
                      Dashboard
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-[10px] font-medium sm:text-[11px]">
                    Doctor directory
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
            <div className="min-w-0 space-y-0.5">
              <h1 className="font-serif text-[22px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[24px] lg:text-[26px]">
                Doctor directory
              </h1>
              <p className="text-[13px] font-medium text-muted-foreground sm:text-[14px]">
                Find verified specialists and book the right clinician for your care.
              </p>
            </div>
            <div className="hidden shrink-0 flex-col items-end gap-0.5 xl:flex">
              <span className="text-[10px] font-bold text-muted-foreground sm:text-[11px]">
                Available now
              </span>
              <span className="font-serif text-[18px] font-bold leading-none tabular-nums text-[#1A5345] sm:text-[20px]">
                {doctors.filter((d) => d.availability === "Available").length}
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2 pt-1 sm:mt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
            <div className="group relative w-full sm:min-w-0 sm:max-w-[min(100%,360px)] sm:flex-1 lg:max-w-[400px]">
              <SearchIcon
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#1A5345]/35 transition-colors group-focus-within:text-[#1A5345] sm:left-4"
                strokeWidth={2}
                aria-hidden
              />
              <Input
                type="search"
                placeholder="Search by name, specialty, hospital…"
                className={medicationsListSearchInputClassName}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex w-full items-center justify-end gap-2 sm:ml-auto sm:w-auto">
              <div className="hidden items-center rounded-xl border border-[#E8E6E0]/80 bg-[#F4F3EF]/50 p-0.5 sm:flex">
                <button
                  type="button"
                  aria-label="List view"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "rounded-[10px] p-2 transition-all",
                    viewMode === "list"
                      ? "bg-white text-[#1A5345] shadow-sm border border-[#E8E6E0]"
                      : "text-[#6B7870] border border-transparent hover:text-[#1A1F1E]"
                  )}
                >
                  <ListIcon className="size-4" strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  aria-label="Grid view"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "rounded-[10px] p-2 transition-all",
                    viewMode === "grid"
                      ? "bg-white text-[#1A5345] shadow-sm border border-[#E8E6E0]"
                      : "text-[#6B7870] border border-transparent hover:text-[#1A1F1E]"
                  )}
                >
                  <LayoutGridIcon className="size-4" strokeWidth={2.5} />
                </button>
              </div>

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger
                  className={directoryToolbarSelectTriggerClassName}
                  aria-label="Sort doctors"
                >
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent
                  align="end"
                  className="rounded-xl border border-[#E8E6E0]/60 bg-white shadow-lg"
                >
                  {DOCTOR_SORT_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className={directoryToolbarSelectItemClassName}
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    title="Filter directory"
                    aria-label="Filter directory"
                    className={cn(
                      "relative size-8 shrink-0 rounded-lg border-0 bg-transparent text-[#6B7870] shadow-none hover:bg-transparent hover:text-[#1A5345]",
                      advancedFilterCount > 0 && "text-[#1A5345]",
                    )}
                  >
                    <FilterIcon
                      className="size-4"
                      strokeWidth={advancedFilterCount > 0 ? 2.5 : 2}
                      aria-hidden
                    />
                    {advancedFilterCount > 0 ? (
                      <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-[#1A5345] text-[9px] font-bold text-white">
                        {advancedFilterCount}
                      </span>
                    ) : null}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[min(100vw-2rem,340px)] overflow-hidden rounded-2xl border border-[#E8E6E0]/60 bg-white p-0 shadow-2xl"
                  align="end"
                  sideOffset={8}
                >
                  <div className="flex items-center justify-between border-b border-[#E8E6E0]/60 bg-[#F9F8F5] px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <FilterIcon className="size-4 text-[#1A5345]" aria-hidden />
                      <h4 className="font-serif text-[15px] font-bold text-[#1A1F1E]">Filters</h4>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 rounded-md px-2 text-[11px] font-bold text-[#6B7870] hover:bg-transparent hover:text-[#1A5345]"
                      onClick={resetFilters}
                    >
                      Reset all
                    </Button>
                  </div>
                  <div className="space-y-5 bg-white p-5 sm:p-6">
                    <div className="space-y-2">
                      <Label className="text-[12px] font-bold text-[#1A1F1E]">Specialty</Label>
                      <Select
                        value={selectedSpecialty ?? "all"}
                        onValueChange={(v) => setSelectedSpecialty(v === "all" ? null : v)}
                      >
                        <SelectTrigger className="h-10 w-full rounded-lg border-[#E8E6E0] bg-white text-[13px]">
                          <SelectValue placeholder="All specialties" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="text-[13px]">
                            All specialties
                          </SelectItem>
                          {specialties.map((s) => (
                            <SelectItem key={s.id} value={s.id} className="text-[13px]">
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[12px] font-bold text-[#1A1F1E]">Availability</Label>
                      <Select
                        value={availabilityFilter}
                        onValueChange={(v) => setAvailabilityFilter(v as DoctorAvailabilityFilter)}
                      >
                        <SelectTrigger className="h-10 w-full rounded-lg border-[#E8E6E0] bg-white text-[13px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABILITY_FILTER_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-[13px]">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-auto bg-[#F9F8F5] px-5 sm:px-6">
        <div className="w-full space-y-4 pb-8 pt-4 sm:pt-6">
          <div className="flex flex-wrap items-center gap-2 px-1">
            <p className="text-[13px] font-medium text-muted-foreground">
              Showing <span className="font-bold text-[#1A1F1E]">{doctors.length}</span> verified
              specialists
            </p>
            {selectedSpecialtyName ? (
              <Badge
                variant="secondary"
                className="border-0 bg-[#E8F0EE] text-[11px] font-bold text-[#1A5345] hover:bg-[#E8F0EE]"
              >
                {selectedSpecialtyName}
              </Badge>
            ) : null}
            {availabilityFilter !== "all" ? (
              <Badge
                variant="secondary"
                className="border-0 bg-[#E8F0EE] text-[11px] font-bold text-[#1A5345] hover:bg-[#E8F0EE]"
              >
                {availabilityFilter}
              </Badge>
            ) : null}
          </div>

          {doctors.length > 0 ? (
            <div
              className={cn(
                "grid gap-4",
                viewMode === "grid"
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "grid-cols-1"
              )}
            >
              {doctors.map((doctor) =>
                viewMode === "grid" ? (
                  <DoctorGridCard key={doctor.id} doctor={doctor} />
                ) : (
                  <DoctorCard key={doctor.id} doctor={doctor} />
                )
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E8E6E0] bg-white py-20 text-center shadow-sm">
              <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-[#F4F3EF]">
                <SearchIcon className="size-7 text-[#1A5345]/60" />
              </div>
              <h3 className="font-serif text-[18px] font-bold text-[#1A1F1E]">No doctors found</h3>
              <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
                We couldn&apos;t find any specialists matching your current search or filters.
              </p>
              <Button
                variant="outline"
                className="mt-5 h-8 items-center justify-center gap-1.5 rounded-lg border-[#E8E6E0] bg-white px-4 text-[12px] font-bold text-[#1A1F1E] shadow-sm transition-all hover:border-[#1A5345]/30 hover:bg-slate-50 hover:text-[#1A5345] hover:shadow-md"
                onClick={resetFilters}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
