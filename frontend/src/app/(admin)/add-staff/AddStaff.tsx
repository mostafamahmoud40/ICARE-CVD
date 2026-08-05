"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  PencilIcon,
  RefreshCwIcon,
  SearchIcon,
  StethoscopeIcon,
  Trash2Icon,
  UserCheckIcon,
  UserMinusIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react"

import type { CreatedStaffMember, DoctorAcceptedVisitModes } from "./addStaff.types"
import type { useAddStaff } from "./useAddStaff"
import { AddStaffForm } from "./AddStaffForm"
import { StaffMemberDetailDialog } from "./StaffMemberDetailDialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type AddStaffViewModel = ReturnType<typeof useAddStaff>

type RoleFilter = "all" | "doctor" | "assistant"

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

const VISIT_MODE_LABELS: Record<DoctorAcceptedVisitModes, string> = {
  clinic: "Clinic only",
  virtual: "Online only",
  both: "Clinic & online",
}

function VisitModesBadge({ modes }: { modes: DoctorAcceptedVisitModes | null }) {
  if (!modes) return <span className="text-[13px] text-muted-foreground">—</span>
  return (
    <span className="inline-flex items-center justify-center rounded-lg bg-[#E8F0EE] px-2 py-0.5 text-[10px] font-bold text-[#1A5345]">
      {VISIT_MODE_LABELS[modes]}
    </span>
  )
}

function RoleBadge({ role }: { role: CreatedStaffMember["role"] }) {
  const isDoctor = role === "doctor"
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-2 py-0.5 text-[10px] font-bold capitalize",
        isDoctor ? "bg-[#1A5345] text-white" : "bg-[#CC5533] text-white",
      )}
    >
      {role}
    </span>
  )
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-2 py-0.5 text-[10px] font-bold capitalize",
        isActive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600",
      )}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  )
}

export function AddStaff({
  staff,
  isLoading,
  isSubmitting,
  editingMemberId,
  dialogOpen,
  setDialogOpen,
  openCreate,
  openEdit,
  cancelEdit,
  deleteMember,
  toggleStatus,
  ...formProps
}: AddStaffViewModel) {
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all")
  const [deleteTarget, setDeleteTarget] = useState<CreatedStaffMember | null>(null)
  const [detailMember, setDetailMember] = useState<CreatedStaffMember | null>(null)

  useEffect(() => {
    if (!detailMember) return
    const updated = staff.find((member) => member.id === detailMember.id)
    if (updated) {
      setDetailMember(updated)
    } else {
      setDetailMember(null)
    }
  }, [staff, detailMember?.id])

  const doctorCount = staff.filter((m) => m.role === "doctor").length
  const assistantCount = staff.filter((m) => m.role === "assistant").length

  const filteredStaff = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return staff.filter((member) => {
      const matchesRole = roleFilter === "all" || member.role === roleFilter
      const matchesSearch =
        !q ||
        member.fullName.toLowerCase().includes(q) ||
        member.email.toLowerCase().includes(q) ||
        (member.specialty?.toLowerCase().includes(q) ?? false) ||
        (member.phone?.toLowerCase().includes(q) ?? false)
      return matchesRole && matchesSearch
    })
  }, [staff, searchQuery, roleFilter])

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#F9F8F5] animate-in fade-in duration-500">
      {/* Header */}
      <div className="relative z-20 shrink-0 border-b border-[#E8E6E0]/60 bg-white">
        <div className="flex flex-col px-5 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-5">
          <div className="mb-2 flex items-center gap-2 sm:mb-2.5">
            <Breadcrumb>
              <BreadcrumbList className="text-[10px] sm:text-[11px]">
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link
                      href="/admin/admin-dashboard"
                      className="text-[10px] font-medium sm:text-[11px]"
                    >
                      Dashboard
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-[10px] font-medium sm:text-[11px]">
                    Staff directory
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
            <div className="min-w-0 space-y-0.5">
              <h1 className="font-serif text-[22px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[24px] lg:text-[26px]">
                Doctors &amp; Assistants
              </h1>
              <p className="text-[13px] font-medium text-muted-foreground sm:text-[14px]">
                Managing{" "}
                <span className="font-bold text-[#1A1F1E]">{staff.length}</span> staff
                accounts across the platform
              </p>
            </div>

            <Button
              size="sm"
              onClick={openCreate}
              className="h-8 gap-2 self-start rounded-lg border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-sm transition-colors hover:bg-[#133F34]"
            >
              <UserPlusIcon className="size-3.5" strokeWidth={2.5} aria-hidden />
              Add doctor or assistant
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-4 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-[#E8E6E0] bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[11px] font-bold uppercase tracking-tight text-[#6B7870]">
                  Total staff
                </span>
                <span className="text-[20px] font-bold leading-none tracking-tight text-[#1A1F1E] tabular-nums">
                  {staff.length}
                </span>
              </div>
              <UsersIcon className="size-5 shrink-0 text-[#1A5345]" strokeWidth={2} aria-hidden />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-[#E8E6E0] bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[11px] font-bold uppercase tracking-tight text-[#6B7870]">
                  Doctors
                </span>
                <span className="text-[20px] font-bold leading-none tracking-tight text-[#1A1F1E] tabular-nums">
                  {doctorCount}
                </span>
              </div>
              <StethoscopeIcon className="size-5 shrink-0 text-[#1A5345]" strokeWidth={2} aria-hidden />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-[#E8E6E0] bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[11px] font-bold uppercase tracking-tight text-[#6B7870]">
                  Assistants
                </span>
                <span className="text-[20px] font-bold leading-none tracking-tight text-[#1A1F1E] tabular-nums">
                  {assistantCount}
                </span>
              </div>
              <UsersIcon className="size-5 shrink-0 text-[#CC5533]" strokeWidth={2} aria-hidden />
            </div>
          </div>

          {/* Toolbar */}
          <div className="mt-4 flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
            <div className="group relative flex-1 sm:w-[260px] sm:flex-none">
              <SearchIcon
                className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#9CA3AF] transition-colors group-focus-within:text-[#1A5345]"
                strokeWidth={2}
                aria-hidden
              />
              <Input
                type="search"
                placeholder="Search by name, email, or specialty…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-full rounded-lg border border-[#E8E6E0] bg-white pl-9 pr-3 text-[12px] font-medium text-[#1A1F1E] shadow-sm transition-all placeholder:text-muted-foreground/50 focus-visible:border-[#1A5345]/30 focus-visible:ring-0"
              />
            </div>

            <div className="flex items-center gap-2">
              <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
                <SelectTrigger className="h-8 w-full rounded-lg border border-[#E8E6E0] bg-white px-3 text-[12px] font-bold text-[#1A1F1E] shadow-sm transition-all hover:bg-slate-50 focus:ring-0 sm:w-[140px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent className="rounded-lg border border-[#cfd9d5] bg-white shadow-lg">
                  <SelectItem value="all" className="h-10 cursor-pointer text-[#152a24]">
                    All roles
                  </SelectItem>
                  <SelectItem value="doctor" className="h-10 cursor-pointer text-[#152a24]">
                    Doctors
                  </SelectItem>
                  <SelectItem value="assistant" className="h-10 cursor-pointer text-[#152a24]">
                    Assistants
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 border-0 bg-transparent text-[#6B7870] shadow-none transition-colors hover:bg-transparent hover:text-[#1A5345]"
                onClick={() => {
                  setSearchQuery("")
                  setRoleFilter("all")
                }}
                aria-label="Reset filters"
              >
                <RefreshCwIcon className="size-4" strokeWidth={2} aria-hidden />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-5 py-4 sm:px-6">
        <div className="rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1020px] border-collapse bg-white text-left">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#F4F3ED]/90 font-serif text-[14px] font-bold text-[#1A1F1E] shadow-[0_1px_0_0_#E8E6E0] backdrop-blur-md">
                  <th className="py-4 pl-4 pr-4">Name</th>
                  <th className="px-4 py-4">Email</th>
                  <th className="px-4 py-4">Phone</th>
                  <th className="px-4 py-4">Role</th>
                  <th className="px-4 py-4">Joined</th>
                  <th className="px-4 py-4">Visit types</th>
                  <th className="px-4 py-4">Specialty / Dept.</th>
                  <th className="px-4 py-4">Experience</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="py-4 pl-4 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E6E0]/40">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td className="py-4 pl-4 pr-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="size-10 shrink-0 rounded-full bg-slate-200" />
                          <Skeleton className="h-4 w-32 bg-slate-200" />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-4 w-40 bg-slate-200" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-4 w-28 bg-slate-200" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-6 w-16 rounded-lg bg-slate-200" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-4 w-24 bg-slate-200" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-6 w-24 rounded-lg bg-slate-200" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-4 w-32 bg-slate-200" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-4 w-12 bg-slate-200" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-6 w-16 rounded-lg bg-slate-200" />
                      </td>
                      <td className="py-4 pl-4 pr-4 text-right">
                        <Skeleton className="ml-auto size-8 rounded-lg bg-slate-200" />
                      </td>
                    </tr>
                  ))
                ) : filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center animate-in fade-in duration-500">
                        <div className="mb-4 flex size-14 items-center justify-center rounded-full border border-[#E8E6E0]/60 bg-slate-50 ring-4 ring-slate-50/50">
                          <SearchIcon className="size-5 text-muted-foreground/60" aria-hidden />
                        </div>
                        <h3 className="text-[15px] font-bold text-[#1A1F1E]">No staff found</h3>
                        <p className="mt-1 text-[14px] font-medium text-muted-foreground">
                          {staff.length === 0
                            ? "Add your first doctor or assistant to get started."
                            : "Try adjusting your search or filters."}
                        </p>
                        {staff.length === 0 ? (
                          <Button
                            size="sm"
                            onClick={openCreate}
                            className="mt-4 h-8 gap-2 rounded-lg border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white hover:bg-[#133F34]"
                          >
                            <UserPlusIcon className="size-3.5" aria-hidden />
                            Add doctor or assistant
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((member) => (
                    <tr
                      key={member.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setDetailMember(member)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          setDetailMember(member)
                        }
                      }}
                      className={cn(
                        "group cursor-pointer transition-colors duration-200 hover:bg-slate-50/80 focus-visible:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1A5345]/30",
                        !member.isActive && "opacity-60",
                      )}
                    >
                      <td className="py-4 pl-4 pr-4">
                        <div className="flex items-center gap-3">
                          {member.avatarUrl ? (
                            <img src={member.avatarUrl} alt={member.fullName} className="size-10 shrink-0 rounded-full object-cover border border-[#E8E6E0]/60" />
                          ) : (
                            <div
                              className={cn(
                                "flex size-10 shrink-0 items-center justify-center rounded-full text-[12px] font-bold",
                                member.role === "doctor"
                                  ? "bg-[#E8F0EE] text-[#1A5345]"
                                  : "bg-orange-50 text-[#CC5533]",
                              )}
                            >
                              {getInitials(member.fullName) || "NA"}
                            </div>
                          )}
                          <span className="truncate text-[14px] font-bold text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]">
                            {member.fullName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[13px] font-medium text-muted-foreground">
                          {member.email}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[13px] font-medium text-[#1A1F1E]">
                          {member.phone ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <RoleBadge role={member.role} />
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[13px] font-medium text-muted-foreground">
                          {formatDate(member.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <VisitModesBadge
                          modes={
                            member.role === "doctor" ? (member.acceptedVisitModes ?? "both") : null
                          }
                        />
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[13px] font-medium text-[#1A1F1E]">
                          {member.specialty ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[13px] font-medium tabular-nums text-[#1A1F1E]">
                          {member.experienceYears > 0
                            ? `${member.experienceYears} yr${member.experienceYears === 1 ? "" : "s"}`
                            : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge isActive={member.isActive} />
                      </td>
                      <td className="py-4 pl-4 pr-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => event.stopPropagation()}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 border-0 bg-transparent text-muted-foreground shadow-none hover:bg-transparent hover:text-[#1A5345]"
                            onClick={() => openEdit(member)}
                            aria-label={`Edit ${member.fullName}`}
                          >
                            <PencilIcon className="size-3.5" aria-hidden />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 border-0 bg-transparent text-muted-foreground shadow-none hover:bg-transparent hover:text-amber-600"
                            onClick={() => toggleStatus(member.id, !member.isActive)}
                            aria-label={member.isActive ? `Deactivate ${member.fullName}` : `Activate ${member.fullName}`}
                            title={member.isActive ? "Deactivate account" : "Activate account"}
                          >
                            {member.isActive ? (
                              <UserMinusIcon className="size-3.5" aria-hidden />
                            ) : (
                              <UserCheckIcon className="size-3.5" aria-hidden />
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 border-0 bg-transparent text-muted-foreground shadow-none hover:bg-transparent hover:text-red-600"
                            onClick={() => setDeleteTarget(member)}
                            aria-label={`Delete ${member.fullName}`}
                          >
                            <Trash2Icon className="size-3.5" aria-hidden />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <StaffMemberDetailDialog
        member={detailMember}
        open={detailMember !== null}
        onOpenChange={(open) => {
          if (!open) setDetailMember(null)
        }}
        onEdit={openEdit}
        onToggleStatus={toggleStatus}
        onDelete={setDeleteTarget}
      />

      {/* Add / Edit dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) cancelEdit()
          else setDialogOpen(true)
        }}
      >
        <DialogContent className="gap-0 overflow-hidden rounded-2xl border border-[#E8E6E0]/80 bg-[#F9F8F5] p-0 shadow-[0_20px_60px_-12px_rgba(26,83,69,0.18)] sm:max-w-[560px]">
          <DialogHeader className="border-b border-[#E8E6E0]/60 bg-white px-6 py-4 text-left">
            <DialogTitle className="font-serif text-[18px] font-bold text-[#1A1F1E]">
              {editingMemberId ? "Edit staff member" : "Add doctor or assistant"}
            </DialogTitle>
            <DialogDescription className="text-[13px] font-medium text-muted-foreground">
              {editingMemberId
                ? "Update account details. A new password is required to save changes."
                : "Create a new account. Credentials will be stored in the system database."}
            </DialogDescription>
          </DialogHeader>

          <AddStaffForm
            {...formProps}
            isSubmitting={isSubmitting}
            editingMemberId={editingMemberId}
            onCancel={cancelEdit}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent className="rounded-2xl border border-[#E8E6E0]/80 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-[17px] font-bold text-[#1A1F1E]">
              Remove staff member?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] font-medium text-muted-foreground">
              {deleteTarget
                ? `This will permanently remove ${deleteTarget.fullName}'s account. This action cannot be undone.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg border-[#E8E6E0] text-[12px] font-bold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-lg border-0 bg-red-600 text-[12px] font-bold text-white hover:bg-red-700"
              onClick={() => {
                if (deleteTarget) {
                  deleteMember(deleteTarget.id)
                  setDeleteTarget(null)
                }
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
