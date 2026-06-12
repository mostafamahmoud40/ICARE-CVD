"use client"

import type { ElementType, ReactNode } from "react"
import {
  BriefcaseIcon,
  CalendarIcon,
  MailIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
  StethoscopeIcon,
  Trash2Icon,
  UserCheckIcon,
  UserMinusIcon,
} from "lucide-react"

import type { CreatedStaffMember, DoctorAcceptedVisitModes } from "./addStaff.types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const VISIT_MODE_LABELS: Record<DoctorAcceptedVisitModes, string> = {
  clinic: "Clinic only",
  virtual: "Online only",
  both: "Clinic & online",
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function formatDate(isoDate: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(isoDate))
}

type DetailCellProps = {
  icon: ElementType
  label: string
  value: ReactNode
  className?: string
  valueClassName?: string
}

function DetailCell({ icon: Icon, label, value, className, valueClassName }: DetailCellProps) {
  return (
    <div
      className={cn(
        "flex min-h-[76px] flex-col justify-between rounded-xl border border-[#E8E6E0]/80 bg-white p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className="size-3.5 shrink-0 text-[#1A5345]" strokeWidth={2} aria-hidden />
        <span className="text-[10px] font-bold uppercase tracking-wide text-[#6B7870]">{label}</span>
      </div>
      <div
        className={cn(
          "mt-2 text-[13px] font-semibold leading-snug text-[#1A1F1E] break-words",
          valueClassName,
        )}
      >
        {value}
      </div>
    </div>
  )
}

type StaffMemberDetailDialogProps = {
  member: CreatedStaffMember | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (member: CreatedStaffMember) => void
  onToggleStatus: (id: number, isActive: boolean) => void
  onDelete: (member: CreatedStaffMember) => void
}

export function StaffMemberDetailDialog({
  member,
  open,
  onOpenChange,
  onEdit,
  onToggleStatus,
  onDelete,
}: StaffMemberDetailDialogProps) {
  if (!member) return null

  const isDoctor = member.role === "doctor"
  const experienceLabel =
    member.experienceYears > 0
      ? `${member.experienceYears} yr${member.experienceYears === 1 ? "" : "s"}`
      : "—"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden rounded-2xl border border-[#E8E6E0]/80 bg-[#F9F8F5] p-0 shadow-[0_20px_60px_-12px_rgba(26,83,69,0.18)] sm:max-w-[540px]">
        {/* Header */}
        <div className="border-b border-[#E8E6E0]/60 bg-white px-6 py-5">
          <div className="flex items-center gap-4">
            {member.avatarUrl ? (
              <img
                src={member.avatarUrl}
                alt={member.fullName}
                className="size-[72px] shrink-0 rounded-full border-2 border-[#E8E6E0]/60 object-cover"
              />
            ) : (
              <div
                className={cn(
                  "flex size-[72px] shrink-0 items-center justify-center rounded-full border-2 border-white text-[20px] font-bold shadow-sm ring-2",
                  isDoctor
                    ? "bg-[#E8F0EE] text-[#1A5345] ring-[#1A5345]/15"
                    : "bg-orange-50 text-[#CC5533] ring-[#CC5533]/15",
                )}
              >
                {getInitials(member.fullName) || "NA"}
              </div>
            )}

            <div className="min-w-0 flex-1 pr-5">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="font-serif text-[22px] font-bold leading-tight text-[#1A1F1E]">
                  {member.fullName}
                </DialogTitle>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center justify-center rounded-lg px-2.5 py-0.5 text-[10px] font-bold capitalize",
                    member.isActive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600",
                  )}
                >
                  {member.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <DialogDescription className="text-[12px] font-medium text-muted-foreground">
                  Staff ID #{member.id}
                </DialogDescription>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center justify-center rounded-lg px-2.5 py-0.5 text-[10px] font-bold capitalize",
                    isDoctor ? "bg-[#1A5345] text-white" : "bg-[#CC5533] text-white",
                  )}
                >
                  {member.role}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailCell
              icon={MailIcon}
              label="Email"
              value={member.email}
              className="sm:col-span-1"
            />
            <DetailCell icon={PhoneIcon} label="Phone" value={member.phone ?? "—"} />

            <DetailCell
              icon={isDoctor ? StethoscopeIcon : BriefcaseIcon}
              label={isDoctor ? "Specialty" : "Department"}
              value={member.specialty ?? "—"}
            />
            <DetailCell icon={CalendarIcon} label="Experience" value={experienceLabel} />

            {isDoctor ? (
              <DetailCell
                icon={MapPinIcon}
                label="Visit types"
                value={
                  <span className="inline-flex w-fit items-center rounded-lg bg-[#E8F0EE] px-2 py-0.5 text-[11px] font-bold text-[#1A5345]">
                    {VISIT_MODE_LABELS[member.acceptedVisitModes ?? "both"]}
                  </span>
                }
              />
            ) : null}

            <DetailCell
              icon={CalendarIcon}
              label="Joined"
              value={formatDate(member.createdAt)}
              className={isDoctor ? undefined : "sm:col-span-1"}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-[#E8E6E0]/60 bg-white px-6 py-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
            <Button
              type="button"
              onClick={() => {
                onEdit(member)
                onOpenChange(false)
              }}
              className="h-9 w-full gap-2 rounded-lg border-0 bg-[#1A5345] text-[12px] font-bold text-white shadow-sm hover:bg-[#133F34]"
            >
              <PencilIcon className="size-3.5" aria-hidden />
              Edit profile
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onToggleStatus(member.id, !member.isActive)}
              className="h-9 w-full gap-2 rounded-lg border border-[#E8E6E0] bg-white text-[12px] font-bold text-[#1A1F1E] shadow-sm hover:bg-slate-50"
            >
              {member.isActive ? (
                <>
                  <UserMinusIcon className="size-3.5 text-amber-600" aria-hidden />
                  Deactivate
                </>
              ) : (
                <>
                  <UserCheckIcon className="size-3.5 text-emerald-600" aria-hidden />
                  Activate
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                onDelete(member)
                onOpenChange(false)
              }}
              className="h-9 w-full gap-2 rounded-lg border-0 bg-transparent text-[12px] font-bold text-red-600 shadow-none hover:bg-red-50 hover:text-red-700 sm:w-auto sm:px-3"
            >
              <Trash2Icon className="size-3.5" aria-hidden />
              <span className="sm:hidden">Remove account</span>
              <span className="hidden sm:inline">Remove</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
