"use client"

import { useEffect, useState } from "react"

import { getAuthUser } from "@/lib/auth-tokens"

import { PatientQueue } from "./PatientQueue"
import { usePatientQueue } from "./usePatientQueue"

export function PatientQueuePageContainer() {
  const { data, isLoading, isError, error, refetch, isFetching } = usePatientQueue()
  const [patientDisplayName, setPatientDisplayName] = useState("Patient")

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate-safe read from localStorage after mount only
    setPatientDisplayName(getAuthUser()?.name ?? "Patient")
  }, [])

  return (
    <PatientQueue
      patientDisplayName={patientDisplayName}
      page={data?.page}
      visit={data?.visit}
      isLoading={isLoading}
      isError={isError}
      error={error ?? null}
      onRetry={() => void refetch()}
      isFetching={isFetching}
    />
  )
}
