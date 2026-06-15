"use client"

import { AlertCircleIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { AssistantAccount } from "./AssistantAccount"
import {
  MOCK_ACTIVITY_LOG,
  MOCK_SHIFT_SCHEDULE,
  MOCK_WEEKLY_STATS,
  MOCK_WORK_STATS,
} from "./assistantAccount.mock"
import { useAssistantAccount } from "./useAssistantAccount"

function AssistantAccountSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#F9F8F5] px-6 pb-10 pt-6 sm:px-8 sm:pb-12 sm:pt-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <Skeleton className="mb-6 h-56 w-full rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    </div>
  )
}

export function AssistantAccountPageContainer() {
  const { profile, isLoading, isError, error, refetch, saveProfile, isSaving } =
    useAssistantAccount()

  if (isLoading) {
    return <AssistantAccountSkeleton />
  }

  if (isError || !profile) {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-[#F9F8F5] px-6 py-10 sm:px-8">
        <Alert variant="destructive" className="max-w-xl">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Could not load profile</AlertTitle>
          <AlertDescription>
            {error?.message ?? "Something went wrong while loading your account."}
          </AlertDescription>
        </Alert>
        <Button type="button" variant="outline" className="mt-4 w-fit" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    )
  }

  return (
    <AssistantAccount
      profile={profile}
      workStats={MOCK_WORK_STATS}
      activities={MOCK_ACTIVITY_LOG}
      weeklyStats={MOCK_WEEKLY_STATS}
      shifts={MOCK_SHIFT_SCHEDULE}
      onSaveProfile={saveProfile}
      isSaving={isSaving}
    />
  )
}
