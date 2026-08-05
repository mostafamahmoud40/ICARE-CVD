"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Building2Icon,
  CalendarDaysIcon,
  Loader2Icon,
  UserPlusIcon,
} from "lucide-react"

import {
  AccountSectionHeading,
  accountPageCardClassName,
  assistantAccountScrollbarCss,
} from "@/app/(assistant)/assistant-account/assistantAccount.shared"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

import { AssistantMemberAvatar } from "./assistantSchedule.shared"
import { AssistantSchedulePickerList } from "./AssistantSchedulePickerList"
import { normalizeAssistantWeeklyShifts } from "./assistantShifts.utils"
import { DoctorShiftScheduleRow } from "./DoctorShiftScheduleRow"
import type { DoctorAssistantMember } from "./doctorAssistants.types"
import type { AssistantWeeklyShiftDay } from "./doctorAssistants.shifts.types"
import { useAssistantShiftSchedule } from "./useAssistantShiftSchedule"
import { useDoctorAssistants } from "./useDoctorAssistants"

export function DoctorAssistantScheduleHub() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { assistants, isLoading: isTeamLoading } = useDoctorAssistants()

  const assistantParam = searchParams.get("assistant")
  const parsedParam = assistantParam ? Number(assistantParam) : null
  const paramId =
    parsedParam !== null && Number.isFinite(parsedParam) && parsedParam > 0
      ? parsedParam
      : null

  const selectedId = useMemo(() => {
    if (assistants.length === 0) return null
    if (paramId && assistants.some((member) => member.id === paramId)) return paramId
    return assistants[0]?.id ?? null
  }, [assistants, paramId])

  const member = useMemo(
    () => assistants.find((item) => item.id === selectedId),
    [assistants, selectedId],
  )

  const scheduleState = useAssistantShiftSchedule(selectedId)
  const { schedule, isLoading: isScheduleLoading, isSaving, saveShifts } = scheduleState

  const [draftDays, setDraftDays] = useState<AssistantWeeklyShiftDay[]>([])

  useEffect(() => {
    if (!schedule) return
    setDraftDays(normalizeAssistantWeeklyShifts(schedule.days))
  }, [schedule])

  useEffect(() => {
    if (isTeamLoading || selectedId === null) return
    if (paramId === selectedId) return
    const params = new URLSearchParams(searchParams.toString())
    params.set("assistant", String(selectedId))
    router.replace(`/doctor-assistants/schedule?${params.toString()}`, { scroll: false })
  }, [isTeamLoading, paramId, router, searchParams, selectedId])

  const activeShiftCount = useMemo(
    () => draftDays.filter((day) => day.status !== "holiday").length,
    [draftDays],
  )

  const handleSelect = (id: number) => {
    router.push(`/doctor-assistants/schedule?assistant=${id}`, { scroll: false })
  }

  const updateDay = (weekday: AssistantWeeklyShiftDay["weekday"], next: AssistantWeeklyShiftDay) => {
    setDraftDays((prev) => prev.map((day) => (day.weekday === weekday ? next : day)))
  }

  const handleSave = () => {
    if (!selectedId) return
    saveShifts(draftDays)
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#F9F8F5] animate-in fade-in duration-500">
      <div className="relative z-20 shrink-0 border-b border-[#E8E6E0]/60 bg-white">
        <div className="flex flex-col px-5 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-5">
          <div className="mb-2 flex items-center gap-2 sm:mb-2.5">
            <Breadcrumb>
              <BreadcrumbList className="text-[10px] sm:text-[11px]">
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/doctor-dashboard" className="text-[10px] font-medium sm:text-[11px]">
                      Dashboard
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/doctor-assistants" className="text-[10px] font-medium sm:text-[11px]">
                      Assistants
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-[10px] font-medium sm:text-[11px]">
                    Work schedules
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
            <div className="min-w-0 space-y-0.5">
              <h1 className="font-serif text-[22px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[24px] lg:text-[26px]">
                Assistant work schedules
              </h1>
              <p className="text-[13px] font-medium text-muted-foreground sm:text-[14px]">
                Choose an assistant and set their weekly shifts — the same schedule they see on
                their account.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 gap-2 rounded-lg border border-[#E8E6E0] bg-white px-4 text-[12px] font-bold text-[#1A1F1E] shadow-sm hover:bg-slate-50"
              >
                <Link href="/doctor-assistants">
                  <UserPlusIcon className="size-3.5" aria-hidden />
                  Manage team
                </Link>
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={!member || isScheduleLoading || isSaving}
                className="h-8 gap-2 rounded-lg border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-sm transition-colors hover:bg-[#133F34]"
              >
                {isSaving ? (
                  <>
                    <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
                    Saving…
                  </>
                ) : (
                  "Save schedule"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex-1 overflow-auto bg-[#F9F8F5] px-5 py-4 sm:px-6 account-custom-scrollbar">
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)] lg:gap-5">
          <Card className={cn(accountPageCardClassName, "lg:sticky lg:top-4")}>
            <CardContent className="p-4 sm:p-5">
              <AssistantSchedulePickerList
                assistants={assistants}
                selectedId={selectedId}
                onSelect={handleSelect}
                isLoading={isTeamLoading}
              />
            </CardContent>
          </Card>

          <div className="min-w-0 space-y-4">
            {member ? (
              <Card className={accountPageCardClassName}>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <AssistantMemberAvatar member={member} className="size-12" />
                      <div className="min-w-0">
                        <p className="truncate font-serif text-[17px] font-bold text-[#1A1F1E]">
                          {member.fullName}
                        </p>
                        <p className="text-[12px] font-medium text-muted-foreground">
                          {member.department ?? "Clinic assistant"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8E6E0] bg-white px-2.5 py-1 text-[10px] font-bold text-[#1A5345]">
                        <CalendarDaysIcon className="size-3.5" aria-hidden />
                        {activeShiftCount} active days
                      </span>
                      {schedule?.clinicName ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8E6E0] bg-white px-2.5 py-1 text-[10px] font-bold text-[#2D6B5C]">
                          <Building2Icon className="size-3.5" aria-hidden />
                          {schedule.clinicName}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <section className="flex flex-col space-y-4">
              <AccountSectionHeading icon={CalendarDaysIcon} title="Weekly work schedule" />
              <Card className={cn(accountPageCardClassName, "flex min-h-0 flex-1 flex-col")}>
                <CardContent className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
                  {!member ? (
                    <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 text-center">
                      <CalendarDaysIcon className="size-8 text-muted-foreground/40" aria-hidden />
                      <p className="text-[13px] font-medium text-muted-foreground">
                        Select an assistant to edit their schedule.
                      </p>
                    </div>
                  ) : isScheduleLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 7 }).map((_, index) => (
                        <Skeleton key={index} className="h-[132px] w-full rounded-xl" />
                      ))}
                    </div>
                  ) : (
                    <div className="min-h-0 flex-1 space-y-2">
                      {draftDays.map((day) => (
                        <DoctorShiftScheduleRow
                          key={day.weekday}
                          day={day}
                          clinicName={schedule?.clinicName}
                          onChange={(next) => updateDay(day.weekday, next)}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: assistantAccountScrollbarCss() }} />
    </div>
  )
}
