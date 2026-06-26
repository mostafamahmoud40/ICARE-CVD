"use client"

import { useQuery } from "@tanstack/react-query"

import { doctorKeys } from "@/lib/query-keys"
import { fetchDoctorAccount } from "@/app/(doctor)/doctor-account/doctorAccount.api"

export function useDoctorInsetHeaderAccount() {
  return useQuery({
    queryKey: doctorKeys.account(),
    queryFn: fetchDoctorAccount,
    staleTime: 5 * 60 * 1000,
  })
}
