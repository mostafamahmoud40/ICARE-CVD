"use client"

import { DoctorDirectory } from "./DoctorDirectory"

export function DoctorDirectoryPageContainer() {
  // In a real app, we would fetch data here
  // const { data, isLoading } = useDoctorDirectoryQuery()
  
  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <DoctorDirectory />
    </div>
  )
}
