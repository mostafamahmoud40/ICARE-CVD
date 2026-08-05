"use client"

import { CalendarDaysIcon, ClipboardListIcon, UsersIcon } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { AssistantMemberAvatar } from "./assistantSchedule.shared"
import type { DoctorAssistantMember } from "./doctorAssistants.types"

type AssistantSchedulePickerListProps = {
  assistants: DoctorAssistantMember[]
  selectedId: number | null
  onSelect: (id: number) => void
  isLoading?: boolean
}

export function AssistantSchedulePickerList({
  assistants,
  selectedId,
  onSelect,
  isLoading = false,
}: AssistantSchedulePickerListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-[72px] animate-pulse rounded-xl border border-[#E8E6E0]/60 bg-white"
          />
        ))}
      </div>
    )
  }

  if (assistants.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[#E5EEEA] bg-white px-4 py-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-[#F5F5F3]">
          <UsersIcon className="size-5 text-[#CC5533]" aria-hidden />
        </div>
        <div className="space-y-1">
          <p className="font-serif text-[15px] font-bold text-[#1A1F1E]">No assistants yet</p>
          <p className="text-[12px] text-muted-foreground">
            Add clinic assistants first, then set their weekly shifts here.
          </p>
        </div>
        <Button
          asChild
          size="sm"
          className="h-8 rounded-lg border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white hover:bg-[#133F34]"
        >
          <Link href="/doctor-assistants">Add assistant</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="mb-3 flex items-center gap-2">
        <ClipboardListIcon className="size-4 text-[#1A5345]" aria-hidden />
        <h2 className="text-[14px] font-bold text-[#1A1F1E]">Select assistant</h2>
      </div>

      {assistants.map((member) => {
        const selected = member.id === selectedId
        return (
          <button
            key={member.id}
            type="button"
            onClick={() => onSelect(member.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all",
              selected
                ? "border-[#1A5345]/35 bg-[#E8F0EE]/80 shadow-sm ring-1 ring-[#1A5345]/10"
                : "border-[#E8E6E0]/70 bg-white hover:border-[#1A5345]/20 hover:shadow-sm",
              !member.isActive && "opacity-70",
            )}
          >
            <AssistantMemberAvatar member={member} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold text-[#1A1F1E]">{member.fullName}</p>
              <p className="truncate text-[11px] font-medium text-muted-foreground">
                Assistant
                {member.department ? ` · ${member.department}` : ""}
              </p>
              <p className="mt-0.5 text-[10px] font-bold text-[#1A5345]">
                {member.isActive ? "Available" : "Inactive"}
              </p>
            </div>
            <CalendarDaysIcon
              className={cn(
                "size-4 shrink-0",
                selected ? "text-[#1A5345]" : "text-muted-foreground",
              )}
              aria-hidden
            />
          </button>
        )
      })}
    </div>
  )
}
