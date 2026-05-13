import type { Metadata } from "next"
import { DoctorDirectoryPageContainer } from "./DoctorDirectoryPageContainer"

export const metadata: Metadata = {
  title: "Doctor Directory | ICARE-CVD",
  description: "Browse and book appointments with top-rated specialists.",
}

export default function DoctorDirectoryPage() {
  return <DoctorDirectoryPageContainer />
}
