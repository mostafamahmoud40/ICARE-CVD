import type { Metadata } from "next"

import { DoctorSchedule } from "./DoctorSchedule"

export const metadata: Metadata = {
  title: "Schedule | ICARE-CVD",
  description: "Set your weekly availability and clinic hours.",
}

export default function DoctorSchedulePage() {
  return <DoctorSchedule />
}
