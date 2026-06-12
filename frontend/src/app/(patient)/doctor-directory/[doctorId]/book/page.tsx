import type { Metadata } from "next"

import { DoctorBookingPageContainer } from "./DoctorBookingPageContainer"

export const metadata: Metadata = {
  title: "Book appointment | ICARE-CVD",
  description: "Book a visit with your selected specialist.",
}

export default function DoctorBookingPage() {
  return <DoctorBookingPageContainer />
}
