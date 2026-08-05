"use client"

import { AlertCircleIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { DoctorAccount } from "./DoctorAccount"
import { useDoctorAccount } from "./useDoctorAccount"

function DoctorAccountSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#F9F8F5] px-6 pb-10 pt-6 sm:px-8 sm:pb-12 sm:pt-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <Skeleton className="mb-6 h-56 w-full rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-52 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

export function DoctorAccountPageContainer() {
  const {
    profile,
    practiceStats,
    weeklySnapshot,
    reviews,
    isLoading,
    isError,
    error,
    refetch,
    saveProfile,
    isSaving,
  } = useDoctorAccount()

  if (isLoading) {
    return <DoctorAccountSkeleton />
  }

  if (isError || !profile || !practiceStats) {
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
    <DoctorAccount
      profile={profile}
      practiceStats={practiceStats}
      weeklySnapshot={weeklySnapshot}
      reviews={reviews}
      onSaveProfile={saveProfile}
      isSaving={isSaving}
    />
  )
}
