import type { DoctorAssistantMember } from "./doctorAssistants.types"

const AVATAR_FALLBACK_COLORS = [
  "bg-[#1A5345]",
  "bg-[#2D6B5C]",
  "bg-[#CC5533]",
  "bg-[#5A7A70]",
] as const

export function getAssistantInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export function AssistantMemberAvatar({
  member,
  className = "size-11",
  textClassName = "text-[12px]",
}: {
  member: Pick<DoctorAssistantMember, "fullName" | "avatarUrl" | "id">
  className?: string
  textClassName?: string
}) {
  const color =
    AVATAR_FALLBACK_COLORS[member.id % AVATAR_FALLBACK_COLORS.length] ??
    AVATAR_FALLBACK_COLORS[0]

  if (member.avatarUrl) {
    return (
      <img
        src={member.avatarUrl}
        alt={member.fullName}
        className={`shrink-0 rounded-full border border-[#E8E6E0]/80 object-cover shadow-sm ${className}`}
      />
    )
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full border border-[#E8E6E0]/80 font-bold text-white shadow-sm ${color} ${className} ${textClassName}`}
    >
      {getAssistantInitials(member.fullName)}
    </div>
  )
}
