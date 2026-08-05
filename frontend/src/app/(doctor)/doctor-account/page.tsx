import type { Metadata } from "next"

import { DoctorAccountPageContainer } from "./DoctorAccountPageContainer"

export const metadata: Metadata = {
  title: "My Profile | ICARE-CVD",
  description: "Doctor profile and practice overview.",
}

export default function DoctorAccountPage() {
  return <DoctorAccountPageContainer />
}
