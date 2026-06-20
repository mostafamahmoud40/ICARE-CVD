import type { Metadata } from "next"

import { PatientNotificationsPage } from "../../patient-notifications/PatientNotificationsPage"

export const metadata: Metadata = {
  title: "Notifications | ICARE-CVD",
  description: "Patient notifications and care alerts.",
}

export default function PatientAccountNotificationsPage() {
  return <PatientNotificationsPage />
}
