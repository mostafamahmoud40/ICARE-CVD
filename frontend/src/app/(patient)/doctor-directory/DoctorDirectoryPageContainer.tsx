"use client"

import { DoctorDirectory } from "./DoctorDirectory"

export function DoctorDirectoryPageContainer() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[#F9F8F5] animate-in fade-in duration-500">
      <DoctorDirectory />
    </div>
  )
}
