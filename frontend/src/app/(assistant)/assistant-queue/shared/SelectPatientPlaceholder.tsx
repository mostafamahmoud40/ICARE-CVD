"use client"

import { UserRoundIcon } from "lucide-react"

export function SelectPatientPlaceholder() {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-[#F5F5F3]">
        <UserRoundIcon className="size-6 text-[#9CA3AF]" />
      </div>
      <p className="text-[11px] font-medium text-muted-foreground">Select a patient</p>
      <p className="mt-1 max-w-[200px] text-[9px] text-muted-foreground">
        Choose a patient from the list to view details and take action.
      </p>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────── */
