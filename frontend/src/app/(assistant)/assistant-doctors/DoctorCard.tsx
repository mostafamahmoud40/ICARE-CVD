import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UsersIcon, ArrowRightIcon, PlusIcon, UserPlus2Icon, MessageCircleIcon, PhoneIcon, MapPinIcon, ClockIcon, CheckCircle2Icon, ActivityIcon } from "lucide-react"
import type { DoctorProfile, DoctorStatus, LoadLevel } from "./assistantDoctors.types"

const STATUS_CONFIG: Record<DoctorStatus, { label: string; style: string; dot: string }> = {
  "available": { label: "AVAILABLE", style: "bg-emerald-50 text-emerald-700", dot: "bg-[#22C55E]" },
  "in-consultation": { label: "IN CONSULTATION", style: "bg-red-50 text-red-600", dot: "bg-[#EF4444]" },
  "away": { label: "AWAY", style: "bg-[#F3F4F6] text-[#6B7280]", dot: "bg-[#9CA3AF]" },
}

const LOAD_CONFIG: Record<LoadLevel, { label: string; style: string }> = {
  "optimal": { label: "Optimal", style: "text-[#1A5345]" },
  "moderate": { label: "Moderate", style: "text-[#D97706]" }, // amber
  "high": { label: "High Load", style: "text-[#DC2626]" }, // red
  "inactive": { label: "Inactive", style: "text-[#9CA3AF]" }, // gray
}

export function DoctorCard({ doctor }: { doctor: DoctorProfile }) {
  const statusCfg = STATUS_CONFIG[doctor.status]
  const loadCfg = LOAD_CONFIG[doctor.loadLevel]

  return (
    <Card className="flex flex-col p-4 shadow-sm border-[#E5EEEA]/80 hover:shadow-md transition-shadow bg-white rounded-[16px]">
      <div className="flex justify-between items-start">
        {/* Avatar with status dot */}
        <div className="relative">
          <div className="size-12 rounded-full overflow-hidden bg-gray-100 border border-[#E5EEEA]">
            <img 
              src={doctor.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${doctor.id}`} 
              alt={doctor.name} 
              className="size-full object-cover" 
            />
          </div>
          <span 
            className={`absolute bottom-0 right-0 size-3.5 rounded-full border-[2.5px] border-white ${statusCfg.dot}`}
          />
        </div>
        
        {/* Status Badge & Quick Actions */}
        <div className="flex flex-col items-end gap-1.5">
          <div className={`px-2 py-0.5 rounded-[6px] text-[9px] font-bold tracking-wide ${statusCfg.style}`}>
            {statusCfg.label}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="size-6 rounded-full text-[#6B7870] hover:text-[#1A5345] hover:bg-[#E8F0EE]" title="Send Message">
              <MessageCircleIcon className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="size-6 rounded-full text-[#6B7870] hover:text-[#1A5345] hover:bg-[#E8F0EE]" title="Call Room">
              <PhoneIcon className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-2 mb-3">
        <h3 className="text-[15px] font-bold text-[#1A1F1E]">{doctor.name}</h3>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-[12px] font-medium text-[#6B7870] truncate">{doctor.specialty}</p>
          {doctor.room && (
            <span className="shrink-0 flex items-center text-[10px] text-[#1A5345] font-semibold bg-[#E8F0EE] px-1.5 py-0.5 rounded">
              <MapPinIcon className="size-3 mr-1" />
              {doctor.room}
            </span>
          )}
        </div>
        
        {/* Tags */}
        {doctor.tags && doctor.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {doctor.tags.map(tag => (
               <span key={tag} className="text-[9px] px-2 py-0.5 rounded-[6px] border border-[#E8E6E0] text-[#6B7870] bg-[#FAFAF8] font-medium">
                 {tag}
               </span>
            ))}
          </div>
        )}
      </div>

      {/* Details Grid: Shift & Progress */}
      <div className="grid grid-cols-2 gap-2 mb-3 bg-[#FAFAF8] rounded-[10px] p-2 border border-[#E8E6E0]/50 text-[11px] font-medium text-[#6B7870]">
         <div className="flex items-center gap-1.5">
           <ClockIcon className="size-3.5 text-muted-foreground/70" />
           <span className="truncate">{doctor.shiftStart} - {doctor.shiftEnd}</span>
         </div>
         <div className="flex items-center gap-1.5">
           <CheckCircle2Icon className="size-3.5 text-muted-foreground/70" />
           <span className="truncate">Seen: {doctor.patientsSeen}/{doctor.totalPatients}</span>
         </div>
         {doctor.status === "in-consultation" && doctor.estTimeRemainingMins !== undefined && (
           <div className="flex items-center gap-1.5 text-red-600 col-span-2 pt-1 border-t border-[#E8E6E0]/50 mt-1">
             <ActivityIcon className="size-3.5" />
             <span>Est. {doctor.estTimeRemainingMins} mins left in current session</span>
           </div>
         )}
      </div>

      <div className="mt-auto mb-4 bg-[#F9F8F5] rounded-[10px] p-2.5 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#102F27]">
            <UsersIcon className="size-4 text-[#1A5345]" />
            <span className="text-[13px] font-semibold">
              {doctor.patientsWaiting} {doctor.patientsWaiting === 1 ? "Patient" : "Patients"} Waiting
            </span>
          </div>
          <span className={`text-[12px] font-bold ${loadCfg.style}`}>
            {loadCfg.label}
          </span>
        </div>
        {doctor.avgWaitTimeMins !== undefined && doctor.patientsWaiting > 0 && (
          <div className="text-[11px] font-medium text-[#6B7870] flex items-center gap-1.5 ml-6">
            <ClockIcon className="size-3" />
            Avg wait: {doctor.avgWaitTimeMins} mins
          </div>
        )}
      </div>

      <Button 
        variant="outline" 
        className="w-full h-10 rounded-[10px] border-[#E8E6E0] text-[#1A1F1E] font-semibold text-[13px] hover:bg-[#F9F8F5]"
      >
        View Queue
        <ArrowRightIcon className="size-3.5 ml-1.5" />
      </Button>
    </Card>
  )
}

export function AddPractitionerCard() {
  return (
    <Card className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#E8E6E0] bg-[#F9F8F5]/50 rounded-[16px] text-center shadow-none hover:bg-[#F9F8F5] transition-colors cursor-pointer group min-h-[300px]">
      <div className="size-12 rounded-full bg-[#E8F0EE] flex items-center justify-center text-[#1A5345] mb-4 group-hover:scale-105 transition-transform">
        <UserPlus2Icon className="size-6" />
      </div>
      <h3 className="text-[15px] font-bold text-[#1A1F1E] mb-1">Add Practitioner</h3>
      <p className="text-[12px] text-[#6B7870] font-medium max-w-[200px] mb-4">
        Invite a new healthcare professional to the console.
      </p>
      <div className="size-6 rounded-full border border-[#E8E6E0] bg-white flex items-center justify-center text-[#6B7870]">
        <PlusIcon className="size-3.5" />
      </div>
    </Card>
  )
}
