import type { Metadata } from "next"

import { AdminDashboardPageContainer } from "./AdminDashboardPageContainer"

export const metadata: Metadata = {
  title: "Admin Dashboard | ICARE-CVD",
  description: "Platform administration overview.",
}

export default function AdminDashboardPage() {
  return <AdminDashboardPageContainer />
}
