import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UsersIcon, ArrowRightIcon, PlusIcon, MessageCircleIcon, MapPinIcon, ClockIcon } from "lucide-react"
import type { DoctorProfile, DoctorStatus, LoadLevel } from "./assistantDoctors.types"
import Image from "next/image"

const STATUS_CONFIG: Record<DoctorStatus, { label: string; dot: string; text: string }> = {
  "available": { label: "Available", dot: "bg-emerald-500", text: "text-emerald-700" },
  "in-consultation": { label: "In Consult", dot: "bg-amber-500", text: "text-amber-700" },
  "away": { label: "Away", dot: "bg-gray-400", text: "text-gray-600" },
}

const LOAD_CONFIG: Record<LoadLevel, { label: string; style: string }> = {
  "optimal": { label: "Optimal", style: "text-[#1A5345]" },
  "moderate": { label: "Moderate", style: "text-amber-600" },
  "high": { label: "High Load", style: "text-red-600" },
  "inactive": { label: "Inactive", style: "text-[#6B7870]" },
}

export function DoctorCard({ doctor }: { doctor: DoctorProfile }) {
  const statusCfg = STATUS_CONFIG[doctor.status]
  const loadCfg = LOAD_CONFIG[doctor.loadLevel]

  return (
    <Card className="flex flex-col p-5 border-[#E8E6E0]/60 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      {/* Header: Avatar + Info */}
      <div className="flex items-start gap-4 mb-5">
        <div className="relative size-14 shrink-0 rounded-full overflow-hidden bg-[#F5F5F3] border border-[#E8E6E0]">
          <Image
            src={doctor.avatarUrl || `https://i.pravatar.cc/150?u=${doctor.id}`}
            alt={doctor.name}
            fill
            className="object-cover"
            unoptimized
          />
        </div>

        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[15px] font-bold text-[#1A1F1E] truncate">{doctor.name}</h3>
            {/* Minimal Status */}
            <div className={`flex items-center gap-1.5 ${statusCfg.text}`}>
              <span className={`size-1.5 rounded-full ${statusCfg.dot}`} />
              <span className="text-[11px] font-medium leading-none">{statusCfg.label}</span>
            </div>
          </div>
          <p className="text-[12px] text-[#6B7870] mt-0.5">{doctor.specialty}</p>
          {doctor.room && (
            <div className="flex items-center gap-1 text-[11px] font-medium text-[#4F6D64] mt-1.5">
              <MapPinIcon className="size-3.5" />
              {doctor.room}
            </div>
          )}
        </div>
      </div>

      {/* Internal Divider */}
      <div className="h-px w-full bg-[#E8E6E0]/60 mb-4" />

      {/* Stats Section - No Box, Just clean text */}
      <div className="flex items-center justify-between text-[12px] mb-5">
        <div className="flex items-center gap-1.5 text-[#1A1F1E]">
          <UsersIcon className="size-4 text-[#6B7870]" />
          <span className="font-bold">{doctor.patientsWaiting}</span>
          <span className="text-[#6B7870]">waiting</span>
        </div>
        
        <div className="flex items-center gap-1.5 text-[#6B7870]">
          <ClockIcon className="size-4" />
          <span>{doctor.shiftStart}-{doctor.shiftEnd}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto">
        <Button
          variant="outline"
          className="flex-1 h-9 rounded-lg text-[13px] font-semibold border-[#E8E6E0] text-[#1A1F1E] hover:bg-[#F9F8F5] hover:text-[#1A5345] transition-colors shadow-none"
        >
          View Profile
          <ArrowRightIcon className="size-3.5 ml-1.5" />
        </Button>
        <Button variant="outline" size="icon" className="size-9 rounded-lg border-[#E8E6E0] text-[#6B7870] hover:text-[#1A5345] hover:bg-[#F9F8F5] shadow-none">
          <MessageCircleIcon className="size-4" />
        </Button>
      </div>
    </Card>
  )
}

export function AddPractitionerCard() {
  return (
    <Card className="flex flex-col items-center justify-center p-5 border border-dashed border-[#E8E6E0] bg-[#F9F8F5]/30 rounded-2xl text-center shadow-none hover:bg-[#F9F8F5] hover:border-[#1A5345]/30 transition-all cursor-pointer group min-h-[220px]">
      <div className="size-12 rounded-full bg-white border border-[#E8E6E0] flex items-center justify-center text-[#6B7870] mb-4 group-hover:text-[#1A5345] group-hover:border-[#1A5345]/30 group-hover:shadow-sm transition-all">
        <PlusIcon className="size-5" />
      </div>
      <h3 className="text-[15px] font-bold text-[#1A1F1E] mb-1">Add Doctor</h3>
      <p className="text-[12px] text-[#6B7870] max-w-[160px]">
        Register a new practitioner to the directory
      </p>
    </Card>
  )
}
