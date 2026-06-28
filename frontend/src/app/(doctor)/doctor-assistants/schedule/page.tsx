import type { Metadata } from "next"
import { Suspense } from "react"

import { Skeleton } from "@/components/ui/skeleton"

import { DoctorAssistantScheduleHub } from "../DoctorAssistantScheduleHub"

export const metadata: Metadata = {
  title: "Assistant Schedules | ICARE-CVD",
  description: "Set weekly work schedules for your clinic assistants.",
}

function SchedulePageSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#F9F8F5] px-5 py-6 sm:px-6">
      <Skeleton className="mb-4 h-5 w-72" />
      <Skeleton className="mb-6 h-10 w-96" />
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Skeleton className="h-[320px] rounded-2xl" />
        <Skeleton className="h-[560px] rounded-2xl" />
      </div>
    </div>
  )
}

export default function DoctorAssistantSchedulePage() {
  return (
    <Suspense fallback={<SchedulePageSkeleton />}>
      <DoctorAssistantScheduleHub />
    </Suspense>
  )
}
