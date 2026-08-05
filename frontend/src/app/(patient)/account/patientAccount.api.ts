import { apiClient } from "@/lib/api-client"
import type { PatientAccountApiResponse } from "./patientAccount.types"
import type { PatientProfileEditValues } from "./patientAccount.schema"

export async function fetchPatientAccount(): Promise<PatientAccountApiResponse> {
  const { data } = await apiClient.get<PatientAccountApiResponse>("/patient/account")
  return data
}

export async function updatePatientAccount(
  values: PatientProfileEditValues,
): Promise<PatientAccountApiResponse> {
  const { data } = await apiClient.patch<PatientAccountApiResponse>("/patient/account", {
    fullName: values.fullName,
    email: values.email,
    phone: values.phone,
    address: values.address,
    occupation: values.occupation,
    avatarUrl: values.avatarUrl ?? null,
    maritalStatus: values.maritalStatus ? values.maritalStatus : null,
  })
  return data
}
