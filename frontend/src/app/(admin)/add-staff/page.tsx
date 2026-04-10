import type { Metadata } from "next"

import { AddStaffPageContainer } from "./AddStaffPageContainer"

export const metadata: Metadata = {
  title: "Add Staff | ICARE-CVD",
  description: "Create doctor and assistant accounts from admin dashboard.",
}

export default function AddStaffPage() {
  return <AddStaffPageContainer />
}
