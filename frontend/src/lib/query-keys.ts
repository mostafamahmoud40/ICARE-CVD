/** TanStack Query key factories — keep invalidation consistent (DIP). */

export const chatKeys = {
  all: ["chat"] as const,
  conversations: () => [...chatKeys.all, "conversations"] as const,
  directory: () => [...chatKeys.all, "directory"] as const,
}

export const doctorKeys = {
  account: () => ["doctor", "account"] as const,
}

export const assistantKeys = {
  procedures: () => ["assistant-procedures"] as const,
  procedureOrdersDashboard: () => ["assistant-procedures-orders-dashboard"] as const,
  procedureSchedule: (dateKey: string) =>
    ["assistant-procedures-schedule", dateKey] as const,
  procedureHistory: (dateFilter: string, searchTerm: string) =>
    ["assistant-procedures-history", dateFilter, searchTerm] as const,
  medicationProfile: (patientId: string) =>
    ["assistant-medication-profile", patientId] as const,
  dashboard: () => ["assistant-dashboard"] as const,
  patientQueue: () => ["assistant-patient-queue"] as const,
  patientQueueHistory: () => [...assistantKeys.patientQueue(), "history"] as const,
}

export const patientKeys = {
  appointments: () => ["patient-appointments"] as const,
  doctorRecord: (patientId: string) => ["doctor-patient-record", patientId] as const,
  consultationReport: (patientId: string, visitId: string) =>
    ["consultation-report", patientId, visitId] as const,
  medicationAdherence: (medicationId: string) =>
    ["doctor-medication-adherence", medicationId] as const,
}
