import type { Metadata } from "next"

import { DoctorNotificationsPage } from "../../doctor-notifications/DoctorNotificationsPage"

export const metadata: Metadata = {
  title: "Notifications | ICARE-CVD",
  description: "Doctor notifications and alerts.",
}

export default function DoctorAccountNotificationsPage() {
  return <DoctorNotificationsPage />
}
