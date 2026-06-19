"use client"

import { AlertCircleIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PatientAccount } from "./PatientAccount"
import { usePatientAccount } from "./usePatientAccount"

function PatientAccountSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-6 p-4 sm:p-6 lg:p-8">
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
      <Skeleton className="h-32 w-full rounded-2xl" />
    </div>
  )
}

export function PatientAccountPageContainer() {
  const t = useTranslations("patient.account")
  const { profile, isLoading, isError, error, refetch, saveProfile, isSaving } = usePatientAccount()

  if (isLoading) {
    return <PatientAccountSkeleton />
  }

  if (isError || !profile) {
    return (
      <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-6 lg:p-8">
        <Alert variant="destructive" className="max-w-xl">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>{t("loadErrorTitle")}</AlertTitle>
          <AlertDescription>
            {error?.message ?? t("loadErrorDescription")}
          </AlertDescription>
        </Alert>
        <Button type="button" variant="outline" className="mt-4 w-fit" onClick={() => refetch()}>
          {t("tryAgain")}
        </Button>
      </div>
    )
  }

  return <PatientAccount profile={profile} onSaveProfile={saveProfile} isSaving={isSaving} />
}
