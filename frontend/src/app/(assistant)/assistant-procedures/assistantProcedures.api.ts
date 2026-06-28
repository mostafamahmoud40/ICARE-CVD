import { apiClient } from "@/lib/api-client"
import type { ProcedureOrder, ProcedureStats } from "./assistantProcedures.types"
import type { ScheduledOperation } from "./assistantProcedures.types"

export async function fetchAssistantProcedureOrders(): Promise<ProcedureOrder[]> {
  const { data } = await apiClient.get<ProcedureOrder[]>("/assistant/procedures")
  return data
}

export async function fetchAssistantProcedureStats(): Promise<ProcedureStats> {
  const { data } = await apiClient.get<ProcedureStats>("/assistant/procedures/stats")
  return data
}

export async function fetchAssistantProcedureSchedule(
  date: string,
  search?: string,
): Promise<ScheduledOperation[]> {
  const { data } = await apiClient.get<ScheduledOperation[]>("/assistant/procedures/schedule", {
    params: { date, search: search?.trim() || undefined },
  })
  return data
}

export async function fetchAssistantProcedureHistory(
  range: string,
  search?: string,
): Promise<ScheduledOperation[]> {
  const { data } = await apiClient.get<ScheduledOperation[]>("/assistant/procedures/history", {
    params: { range, search: search?.trim() || undefined },
  })
  return data
}

export async function fetchDoctorProcedureOrders(): Promise<ProcedureOrder[]> {
  const { data } = await apiClient.get<ProcedureOrder[]>("/doctor/procedures")
  return data
}
