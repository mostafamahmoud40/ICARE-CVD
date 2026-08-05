import type { Metadata } from "next"

import { AssistantDoctorSchedulePageContainer } from "./AssistantDoctorSchedulePageContainer"

export const metadata: Metadata = {
  title: "Doctor schedule | ICARE-CVD",
  description: "Assistant view of doctor weekly hours, sessions, and pause controls.",
}

export default function AssistantDoctorSchedulePage() {
  return <AssistantDoctorSchedulePageContainer />
}
