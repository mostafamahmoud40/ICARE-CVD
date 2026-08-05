import type { PatientNotificationKind } from "./patientNotifications.types"

/** Notification kinds wired to the live API + realtime socket. Expand over time. */
export const PATIENT_NOTIFICATION_LIVE_KINDS = ["appointment"] as const satisfies readonly PatientNotificationKind[]

export type PatientNotificationLiveKind = (typeof PATIENT_NOTIFICATION_LIVE_KINDS)[number]

export function isPatientNotificationLiveKind(
  kind: string,
): kind is PatientNotificationLiveKind {
  return (PATIENT_NOTIFICATION_LIVE_KINDS as readonly string[]).includes(kind)
}

/** DB-backed notification rows use numeric ids; mock/demo rows use string ids like `pn1`. */
export function isLivePatientNotificationId(id: string) {
  return /^\d+$/.test(id)
}
