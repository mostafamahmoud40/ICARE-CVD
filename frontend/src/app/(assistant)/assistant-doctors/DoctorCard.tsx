import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UsersIcon, ArrowRightIcon, MessageCircleIcon, MapPinIcon, ClockIcon } from "lucide-react"
import type { AssistantDoctorDirectoryItem, DoctorStatus, LoadLevel } from "./assistantDoctors.types"
import { AssistantProfileAvatar } from "@/app/(assistant)/AssistantProfileAvatar"
import { assistantDoctorChatHref } from "@/components/shared/chat/use-chat-deep-link"

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

type DoctorCardProps = {
  doctor: AssistantDoctorDirectoryItem
}

export function DoctorCard({ doctor }: DoctorCardProps) {
  const statusCfg = STATUS_CONFIG[doctor.status]
  const loadCfg = LOAD_CONFIG[doctor.loadLevel]
  const shiftLabel =
    doctor.shiftStart && doctor.shiftEnd
      ? `${doctor.shiftStart}-${doctor.shiftEnd}`
      : "Off today"

  return (
    <Card className="flex flex-col p-5 border-[#E8E6E0]/60 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4 mb-5">
        <AssistantProfileAvatar
          name={doctor.name}
          avatarUrl={doctor.avatarUrl}
          className="size-14 shrink-0 rounded-full border border-[#E8E6E0]"
          sizes="56px"
          initialsClassName="text-[15px]"
        />

        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[15px] font-bold text-[#1A1F1E] truncate">{doctor.name}</h3>
            <div className={`flex items-center gap-1.5 ${statusCfg.text}`}>
              <span className={`size-1.5 rounded-full ${statusCfg.dot}`} />
              <span className="text-[11px] font-medium leading-none">{statusCfg.label}</span>
            </div>
          </div>
          <p className="text-[12px] text-[#6B7870] mt-0.5">{doctor.specialty}</p>
          {doctor.room ? (
            <div className="flex items-center gap-1 text-[11px] font-medium text-[#4F6D64] mt-1.5">
              <MapPinIcon className="size-3.5" />
              {doctor.room}
            </div>
          ) : null}
        </div>
      </div>

      <div className="h-px w-full bg-[#E8E6E0]/60 mb-4" />

      <div className="flex items-center justify-between text-[12px] mb-5">
        <div className="flex items-center gap-1.5 text-[#1A1F1E]">
          <UsersIcon className="size-4 text-[#6B7870]" />
          <span className="font-bold">{doctor.patientsWaiting}</span>
          <span className="text-[#6B7870]">waiting</span>
        </div>

        <div className="flex items-center gap-2 text-[#6B7870]">
          <span className={`text-[11px] font-bold ${loadCfg.style}`}>{loadCfg.label}</span>
          <ClockIcon className="size-4" />
          <span>{shiftLabel}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-auto">
        <Button
          asChild
          size="sm"
          className="flex-1 h-8 rounded-lg text-[12px] font-bold bg-[#1A5345] text-white hover:bg-[#133F34] transition-colors shadow-none border-0"
        >
          <Link href={`/assistant-doctors/${doctor.id}`}>
            View Profile
            <ArrowRightIcon className="size-3.5 ml-1.5" />
          </Link>
        </Button>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="size-8 border-0 bg-transparent text-[#6B7870] hover:bg-transparent hover:text-[#1A5345] shadow-none"
        >
          <Link href={assistantDoctorChatHref(doctor.id)} aria-label={`Chat with ${doctor.name}`}>
            <MessageCircleIcon className="size-4" />
          </Link>
        </Button>
      </div>
    </Card>
  )
}
