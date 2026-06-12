import type { Metadata } from "next"

import { AddStaffPageContainer } from "./AddStaffPageContainer"

export const metadata: Metadata = {
  title: "Staff Directory | ICARE-CVD",
  description: "Manage doctor and assistant accounts from the admin portal.",
}

export default function AddStaffPage() {
  return <AddStaffPageContainer />
}
