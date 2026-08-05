"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  CalendarDaysIcon,
  PencilIcon,
  RefreshCwIcon,
  SearchIcon,
  Trash2Icon,
  UserCheckIcon,
  UserMinusIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react"

import type { DoctorAssistantMember } from "./doctorAssistants.types"
import type { useDoctorAssistants } from "./useDoctorAssistants"
import { DoctorAssistantsForm } from "./DoctorAssistantsForm"
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

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

type DoctorAssistantsViewModel = ReturnType<typeof useDoctorAssistants>

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

export function DoctorAssistants({
  assistants,
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
}: DoctorAssistantsViewModel) {
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<DoctorAssistantMember | null>(null)

  const avgExperience = useMemo(() => {
    if (assistants.length === 0) return 0
    const total = assistants.reduce((sum, member) => sum + member.experienceYears, 0)
    return Math.round(total / assistants.length)
  }, [assistants])

  const filteredAssistants = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return assistants.filter((member) => {
      if (!q) return true
      return (
        member.fullName.toLowerCase().includes(q) ||
        member.email.toLowerCase().includes(q) ||
        (member.department?.toLowerCase().includes(q) ?? false) ||
        (member.phone?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [assistants, searchQuery])

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#F9F8F5] animate-in fade-in duration-500">
      <div className="relative z-20 shrink-0 border-b border-[#E8E6E0]/60 bg-white">
        <div className="flex flex-col px-5 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-5">
          <div className="mb-2 flex items-center gap-2 sm:mb-2.5">
            <Breadcrumb>
              <BreadcrumbList className="text-[10px] sm:text-[11px]">
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link
                      href="/doctor-dashboard"
                      className="text-[10px] font-medium sm:text-[11px]"
                    >
                      Dashboard
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-[10px] font-medium sm:text-[11px]">
                    My assistants
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
            <div className="min-w-0 space-y-0.5">
              <h1 className="font-serif text-[22px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[24px] lg:text-[26px]">
                Clinic assistants
              </h1>
              <p className="text-[13px] font-medium text-muted-foreground sm:text-[14px]">
                Managing{" "}
                <span className="font-bold text-[#1A1F1E]">{assistants.length}</span> assistant
                {assistants.length === 1 ? "" : "s"} on your team
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 gap-2 rounded-lg border border-[#E8E6E0] bg-white px-4 text-[12px] font-bold text-[#1A1F1E] shadow-sm transition-colors hover:bg-slate-50 hover:text-[#1A5345]"
              >
                <Link href="/doctor-assistants/schedule">
                  <CalendarDaysIcon className="size-3.5" strokeWidth={2.5} aria-hidden />
                  Work schedules
                </Link>
              </Button>
              <Button
                size="sm"
                onClick={openCreate}
                className="h-8 gap-2 rounded-lg border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-sm transition-colors hover:bg-[#133F34]"
              >
              <UserPlusIcon className="size-3.5" strokeWidth={2.5} aria-hidden />
              Add assistant
            </Button>
            </div>
          </div>

          <div className="mt-4 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-[#E8E6E0] bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[11px] font-bold uppercase tracking-tight text-[#6B7870]">
                  Team size
                </span>
                <span className="text-[20px] font-bold leading-none tracking-tight text-[#1A1F1E] tabular-nums">
                  {assistants.length}
                </span>
              </div>
              <UsersIcon className="size-5 shrink-0 text-[#CC5533]" strokeWidth={2} aria-hidden />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-[#E8E6E0] bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[11px] font-bold uppercase tracking-tight text-[#6B7870]">
                  Avg. experience
                </span>
                <span className="text-[20px] font-bold leading-none tracking-tight text-[#1A1F1E] tabular-nums">
                  {avgExperience} yrs
                </span>
              </div>
              <UserPlusIcon className="size-5 shrink-0 text-[#1A5345]" strokeWidth={2} aria-hidden />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
            <div className="group relative flex-1 sm:w-[260px] sm:flex-none">
              <SearchIcon
                className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#9CA3AF] transition-colors group-focus-within:text-[#1A5345]"
                strokeWidth={2}
                aria-hidden
              />
              <Input
                type="search"
                placeholder="Search by name, email, or department…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-full rounded-lg border border-[#E8E6E0] bg-white pl-9 pr-3 text-[12px] font-medium text-[#1A1F1E] shadow-sm transition-all placeholder:text-muted-foreground/50 focus-visible:border-[#1A5345]/30 focus-visible:ring-0"
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 border-0 bg-transparent text-[#6B7870] shadow-none transition-colors hover:bg-transparent hover:text-[#1A5345]"
              onClick={() => setSearchQuery("")}
              aria-label="Reset search"
            >
              <RefreshCwIcon className="size-4" strokeWidth={2} aria-hidden />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-5 py-4 sm:px-6">
        <div className="rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse bg-white text-left">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#F4F3ED]/90 font-serif text-[14px] font-bold text-[#1A1F1E] shadow-[0_1px_0_0_#E8E6E0] backdrop-blur-md">
                  <th className="py-4 pl-4 pr-4">Name</th>
                  <th className="px-4 py-4">Email</th>
                  <th className="px-4 py-4">Phone</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Department</th>
                  <th className="px-4 py-4">Experience</th>
                  <th className="px-4 py-4">Joined team</th>
                  <th className="py-4 pl-4 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E6E0]/40">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
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
                        <Skeleton className="h-4 w-12 bg-slate-200" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-4 w-24 bg-slate-200" />
                      </td>
                      <td className="py-4 pl-4 pr-4">
                        <Skeleton className="ml-auto h-8 w-16 bg-slate-200" />
                      </td>
                    </tr>
                  ))
                ) : filteredAssistants.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                        <div className="flex size-14 items-center justify-center rounded-full bg-[#F4F3ED]">
                          <UsersIcon className="size-6 text-[#CC5533]" strokeWidth={2} aria-hidden />
                        </div>
                        <div className="space-y-1">
                          <p className="font-serif text-[16px] font-bold text-[#1A1F1E]">
                            {searchQuery ? "No assistants match your search" : "No assistants yet"}
                          </p>
                          <p className="text-[13px] text-muted-foreground">
                            {searchQuery
                              ? "Try a different name, email, or department."
                              : "Add your first clinic assistant to help manage patients and schedules."}
                          </p>
                        </div>
                        {!searchQuery ? (
                          <Button
                            size="sm"
                            onClick={openCreate}
                            className="mt-1 h-8 gap-2 rounded-lg border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-sm hover:bg-[#133F34]"
                          >
                            <UserPlusIcon className="size-3.5" strokeWidth={2.5} aria-hidden />
                            Add assistant
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAssistants.map((member) => (
                    <tr
                      key={member.id}
                      className={cn("group transition-colors hover:bg-[#FAFAF8]/80", !member.isActive && "opacity-60")}
                    >
                      <td className="py-4 pl-4 pr-4">
                        <div className="flex items-center gap-3">
                          {member.avatarUrl ? (
                            <img src={member.avatarUrl} alt={member.fullName} className="size-10 shrink-0 rounded-full object-cover border border-[#E8E6E0]/60" />
                          ) : (
                            <div
                              className={cn(
                                "flex size-10 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white",
                                "bg-[#CC5533]",
                              )}
                            >
                              {getInitials(member.fullName)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-bold text-[#1A1F1E]">
                              {member.fullName}
                            </p>
                            <span className="inline-flex items-center justify-center rounded-lg bg-[#CC5533] px-2 py-0.5 text-[10px] font-bold text-white">
                              Assistant
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-[13px] font-medium text-[#1A1F1E]">
                        {member.email}
                      </td>
                      <td className="px-4 py-4 text-[13px] font-medium text-[#1A1F1E]">
                        {member.phone ?? "—"}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge isActive={member.isActive} />
                      </td>
                      <td className="px-4 py-4 text-[13px] font-medium text-[#1A1F1E]">
                        {member.department ?? "—"}
                      </td>
                      <td className="px-4 py-4 text-[13px] font-medium tabular-nums text-[#1A1F1E]">
                        {member.experienceYears} yrs
                      </td>
                      <td className="px-4 py-4 text-[13px] font-medium text-muted-foreground">
                        {formatDate(member.linkedAt)}
                      </td>
                      <td className="py-4 pl-4 pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="size-8 border-0 bg-transparent text-muted-foreground shadow-none transition-colors hover:bg-transparent hover:text-[#1A5345]"
                          >
                            <Link
                              href={`/doctor-assistants/schedule?assistant=${member.id}`}
                              aria-label={`Manage shifts for ${member.fullName}`}
                              title="Manage shifts"
                            >
                              <CalendarDaysIcon className="size-4" strokeWidth={2} aria-hidden />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 border-0 bg-transparent text-muted-foreground shadow-none transition-colors hover:bg-transparent hover:text-amber-600"
                            onClick={() => toggleStatus(member.id, !member.isActive)}
                            aria-label={member.isActive ? `Deactivate ${member.fullName}` : `Activate ${member.fullName}`}
                            title={member.isActive ? "Deactivate account" : "Activate account"}
                          >
                            {member.isActive ? (
                              <UserMinusIcon className="size-4" strokeWidth={2} aria-hidden />
                            ) : (
                              <UserCheckIcon className="size-4" strokeWidth={2} aria-hidden />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 border-0 bg-transparent text-muted-foreground shadow-none transition-colors hover:bg-transparent hover:text-[#1A5345]"
                            aria-label={`Edit ${member.fullName}`}
                            onClick={() => openEdit(member)}
                          >
                            <PencilIcon className="size-4" strokeWidth={2} aria-hidden />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 border-0 bg-transparent text-muted-foreground shadow-none transition-colors hover:bg-transparent hover:text-red-600"
                            aria-label={`Remove ${member.fullName}`}
                            onClick={() => setDeleteTarget(member)}
                          >
                            <Trash2Icon className="size-4" strokeWidth={2} aria-hidden />
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border border-[#E8E6E0] bg-white p-0 shadow-xl sm:max-w-[560px]">
          <DialogHeader className="space-y-1 border-b border-[#E8E6E0]/60 px-6 py-5 text-left">
            <DialogTitle className="font-serif text-[18px] font-bold text-[#1A1F1E]">
              {editingMemberId ? "Edit assistant" : "Add assistant"}
            </DialogTitle>
          </DialogHeader>
          <DoctorAssistantsForm
            {...formProps}
            isSubmitting={isSubmitting}
            editingMemberId={editingMemberId}
            submit={formProps.submit}
            onCancel={cancelEdit}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent className="rounded-2xl border border-[#E8E6E0] bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-[18px] font-bold text-[#1A1F1E]">
              Remove assistant from team?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] text-muted-foreground">
              {deleteTarget
                ? `${deleteTarget.fullName} will be unlinked from your clinic. Their account stays active and can still be managed by admin.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg border-[#E8E6E0] bg-white text-[12px] font-bold">
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
              Remove from team
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
