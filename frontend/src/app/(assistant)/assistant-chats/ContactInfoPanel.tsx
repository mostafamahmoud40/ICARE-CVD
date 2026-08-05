"use client"

import { useState } from "react"
import {
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  MoreHorizontalIcon,
  BellIcon,
  StarIcon,
  Volume2Icon,
  Trash2Icon,
  Share2Icon,
  FlagIcon,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import type { ContactDetails } from "./assistantChats.types"

interface ContactInfoPanelProps {
  details: ContactDetails
}

export function ContactInfoPanel({ details }: ContactInfoPanelProps) {
  const [notifications, setNotifications] = useState(details.notificationsEnabled)
  const [favourite, setFavourite] = useState(details.isFavourite)
  const [muted, setMuted] = useState(details.isMuted)

  const initials = details.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)

  return (
    <div className="flex h-full w-[340px] shrink-0 flex-col overflow-y-auto border-l border-[#E8E6E0]/60 bg-white shadow-[-4px_0_24px_rgba(0,0,0,0.02)] custom-scrollbar z-10">
      {/* Profile Header */}
      <div className="flex flex-col items-center px-6 pt-10 pb-6">
        <div
          className={`flex size-[80px] items-center justify-center rounded-full text-white text-[28px] font-bold shadow-sm ${
            details.avatarColor ?? "bg-[#3B82F6]"
          }`}
        >
          {initials}
        </div>
        <h3 className="mt-4 text-[18px] font-bold text-[#1A1F1E]">{details.name}</h3>
        <p className="text-[14px] text-muted-foreground mt-0.5">{details.subtitle}</p>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-center gap-4 w-full">
          {[MailIcon, PhoneIcon, MapPinIcon, MoreHorizontalIcon].map((Icon, i) => (
            <button
              key={`info-action-${i}`}
              type="button"
              className="flex size-[42px] items-center justify-center rounded-full border border-[#E8E6E0] text-muted-foreground transition-all duration-300 hover:bg-slate-50 hover:text-[#1A1F1E]"
            >
              <Icon className="size-[18px]" strokeWidth={1.5} />
            </button>
          ))}
        </div>
      </div>

      <Separator className="bg-[#E8E6E0]/60" />

      {/* Contact Details */}
      <div className="px-8 py-6 space-y-4">
        <DetailRow label="Company" value={details.company} />
        <DetailRow label="Role" value={details.role} />
        <DetailRow label="Phone" value={details.phone} />
        <DetailRow label="Email" value={details.email} />
      </div>

      <Separator className="bg-[#E8E6E0]/60" />

      {/* Shared Media */}
      <div className="px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[15px] font-bold text-[#1A1F1E]">Shared Media</span>
          <span className="text-[13px] font-semibold text-[#14B8A6]">
            ({details.sharedMediaCount} Items)
          </span>
        </div>

        {/* Media Tabs */}
        <div className="flex items-center gap-4 mb-4">
          {["Photos", "File", "Video", "Link"].map((tab, i) => (
            <button
              key={tab}
              type="button"
              className={`rounded-[8px] px-3 py-1.5 text-[13px] font-semibold transition-all duration-200 ${
                i === 0
                  ? "bg-[#1A5345] text-white"
                  : "text-muted-foreground hover:bg-slate-50 hover:text-[#1A1F1E]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Media Grid */}
        <div className="grid grid-cols-4 gap-2">
          {details.sharedPhotos.slice(0, 8).map((_, i) => (
            <div
              key={`media-${i}`}
              className="group aspect-square overflow-hidden rounded-[8px] bg-gradient-to-br from-[#E0EAFC] to-[#CFDEF3] shadow-sm cursor-pointer"
            >
              <div className="size-full bg-gradient-to-br from-[#E2E2E2]/40 via-[#C9D6FF]/60 to-[#E2E2E2]/40 transition-transform duration-500 group-hover:scale-105" />
            </div>
          ))}
        </div>
      </div>

      <Separator className="bg-[#E8E6E0]/60" />

      {/* Settings Toggles */}
      <div className="px-4 py-4 space-y-2">
        <ToggleRow
          icon={<BellIcon className="size-[18px]" strokeWidth={1.5} />}
          label="Notifications"
          enabled={notifications}
          onToggle={() => setNotifications(!notifications)}
        />
        <ToggleRow
          icon={<StarIcon className="size-[18px]" strokeWidth={1.5} />}
          label="Add To Favourites"
          enabled={favourite}
          onToggle={() => setFavourite(!favourite)}
        />
        <ToggleRow
          icon={<Volume2Icon className="size-[18px]" strokeWidth={1.5} />}
          label="Mute"
          enabled={muted}
          onToggle={() => setMuted(!muted)}
        />
      </div>

      <Separator className="bg-[#E8E6E0]/60" />

      {/* Actions */}
      <div className="px-4 py-4 space-y-2">
        <ActionRow icon={<Trash2Icon className="size-[18px]" strokeWidth={1.5} />} label="Clear Chat" />
        <ActionRow icon={<Share2Icon className="size-[18px]" strokeWidth={1.5} />} label="Export Chat" />
        <ActionRow icon={<FlagIcon className="size-[18px]" strokeWidth={1.5} />} label="Report Contact" />
      </div>
    </div>
  )
}

/* ── SRP: detail row ─────────────────────────────────────────── */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="w-[85px] shrink-0 text-[13px] font-medium text-muted-foreground">{label}</span>
      <span className="text-[14px] font-medium text-[#1A1F1E]">{value}</span>
    </div>
  )
}

/* ── SRP: toggle switch row ──────────────────────────────────── */
function ToggleRow({
  icon,
  label,
  enabled,
  onToggle,
}: {
  icon: React.ReactNode
  label: string
  enabled: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="group flex w-full items-center gap-4 rounded-[12px] px-4 py-3 text-left transition-all duration-200 hover:bg-slate-50"
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex-1 text-[15px] font-bold text-[#1A1F1E]">{label}</span>
      {/* Toggle Switch */}
      <div
        className={`relative h-[22px] w-[42px] rounded-full transition-colors duration-300 ${
          enabled ? "bg-[#1A5345]" : "bg-[#E5EEEA]"
        }`}
      >
        <div
          className={`absolute top-[3px] size-[16px] rounded-full bg-white shadow-sm transition-transform duration-300 ${
            enabled ? "translate-x-[23px]" : "translate-x-[3px]"
          }`}
        />
      </div>
    </button>
  )
}

/* ── SRP: action row ─────────────────────────────────────────── */
function ActionRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="group flex w-full items-center gap-4 rounded-[12px] px-4 py-3 text-left transition-all duration-200 hover:bg-slate-50"
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-[15px] font-bold text-muted-foreground">{label}</span>
    </button>
  )
}
