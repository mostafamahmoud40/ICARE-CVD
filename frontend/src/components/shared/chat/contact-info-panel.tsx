"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
  MailIcon,
  PhoneIcon,
  MoreHorizontalIcon,
  BellIcon,
  StarIcon,
  Volume2Icon,
  Trash2Icon,
  FlagIcon,
  VideoIcon,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { CallKind } from "./chat-call"
import type { ChatContact, ChatMessage } from "./chat.types"
import { SharedMediaSection } from "./shared-media-section"

interface ContactInfoPanelProps {
  contact: ChatContact
  messages?: ChatMessage[]
  onClose?: () => void
  onInitiateCall?: (contactId: string, kind: CallKind) => void
}

export function ContactInfoPanel({
  contact,
  messages = [],
  onClose,
  onInitiateCall,
}: ContactInfoPanelProps) {
  const t = useTranslations("chat")
  const [notifications, setNotifications] = useState(true)
  const [favourite, setFavourite] = useState(false)
  const [muted, setMuted] = useState(false)

  const initials = contact.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)

  const isDoctor = contact.role === "doctor"
  const isAssistant = contact.role === "assistant"
  const subtitle = isDoctor
    ? contact.specialty?.trim() || t("roles.doctor")
    : isAssistant
      ? t("roles.assistant")
      : contact.role === "patient"
        ? t("roles.patient")
        : contact.role || t("roles.contact")

  const detailRows = isDoctor
    ? [
        { label: t("contactPanel.specialty"), value: contact.specialty?.trim() || "—" },
        { label: t("contactPanel.email"), value: contact.email?.trim() || "—" },
        { label: t("contactPanel.clinicAddress"), value: contact.clinicLocation?.trim() || "—" },
      ]
    : [{ label: t("contactPanel.email"), value: contact.email?.trim() || "—" }]

  return (
    <div className="custom-scrollbar z-10 hidden h-full w-[340px] shrink-0 animate-in flex-col overflow-y-auto border-s border-[#E8E6E0]/60 bg-white shadow-[-4px_0_24px_rgba(0,0,0,0.02)] duration-300 slide-in-from-right xl:flex">
      {/* Profile Header */}
      <div className="flex flex-col items-center px-6 pt-10 pb-6">
        <div className="relative">
          <Avatar className="size-20 border border-slate-100 shadow-sm">
            <AvatarImage src={contact.avatar} alt={contact.name} />
            <AvatarFallback className="bg-[#1A5345] text-[28px] font-bold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          {contact.online && (
            <span className="absolute bottom-0.5 end-0 size-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          )}
        </div>
        <h3 className="mt-4 text-[18px] font-bold text-[#1A1F1E]">{contact.name}</h3>
        <p className="text-[14px] text-muted-foreground mt-0.5">{subtitle}</p>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-center gap-4 w-full">
          <button
            type="button"
            className="flex size-[42px] items-center justify-center rounded-full border border-[#E8E6E0] text-muted-foreground transition-all duration-300 hover:bg-[#EEF5F3]/40 hover:text-[#1A5345] cursor-pointer"
            aria-label={t("actions.emailContact")}
          >
            <MailIcon className="size-[18px]" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => onInitiateCall?.(contact.id, "voice")}
            className="flex size-[42px] items-center justify-center rounded-full border border-[#E8E6E0] text-muted-foreground transition-all duration-300 hover:bg-[#EEF5F3]/40 hover:text-[#1A5345] cursor-pointer"
            aria-label={t("actions.startVoiceCall")}
          >
            <PhoneIcon className="size-[18px]" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => onInitiateCall?.(contact.id, "video")}
            className="flex size-[42px] items-center justify-center rounded-full border border-[#E8E6E0] text-muted-foreground transition-all duration-300 hover:bg-[#EEF5F3]/40 hover:text-[#1A5345] cursor-pointer"
            aria-label={t("actions.startVideoCall")}
          >
            <VideoIcon className="size-[18px]" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            className="flex size-[42px] items-center justify-center rounded-full border border-[#E8E6E0] text-muted-foreground transition-all duration-300 hover:bg-[#EEF5F3]/40 hover:text-[#1A5345] cursor-pointer"
            aria-label={t("actions.moreOptions")}
          >
            <MoreHorizontalIcon className="size-[18px]" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <Separator className="bg-[#E8E6E0]/60" />

      {/* Contact Details */}
      <div className="px-8 py-6 space-y-4">
        {detailRows.map((row) => (
          <DetailRow key={row.label} label={row.label} value={row.value} />
        ))}
      </div>

      <Separator className="bg-[#E8E6E0]/60" />

      <SharedMediaSection messages={messages} />

      <Separator className="bg-[#E8E6E0]/60" />

      {/* Settings Toggles */}
      <div className="px-4 py-4 space-y-2">
        <ToggleRow
          icon={<BellIcon className="size-[18px]" strokeWidth={1.5} />}
          label={t("contactPanel.notifications")}
          enabled={notifications}
          onToggle={() => setNotifications(!notifications)}
        />
        <ToggleRow
          icon={<StarIcon className="size-[18px]" strokeWidth={1.5} />}
          label={t("contactPanel.addToFavourites")}
          enabled={favourite}
          onToggle={() => setFavourite(!favourite)}
        />
        <ToggleRow
          icon={<Volume2Icon className="size-[18px]" strokeWidth={1.5} />}
          label={t("contactPanel.mute")}
          enabled={muted}
          onToggle={() => setMuted(!muted)}
        />
      </div>

      <Separator className="bg-[#E8E6E0]/60" />

      {/* Actions */}
      <div className="px-4 py-4 space-y-2">
        <ActionRow icon={<Trash2Icon className="size-[18px]" strokeWidth={1.5} />} label={t("contactPanel.clearChat")} />
        <ActionRow icon={<FlagIcon className="size-[18px]" strokeWidth={1.5} />} label={t("contactPanel.reportContact")} />
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4">
      <span className="w-[85px] shrink-0 text-[13px] font-medium text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 text-[14px] font-medium text-[#1A1F1E] break-words">{value}</span>
    </div>
  )
}

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
      className="group flex w-full items-center gap-4 rounded-[12px] px-4 py-3 text-start transition-all duration-200 hover:bg-slate-50 cursor-pointer"
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex-1 text-[15px] font-bold text-[#1A1F1E]">{label}</span>
      <div
        className={`relative h-[22px] w-[42px] rounded-full transition-colors duration-300 ${
          enabled ? "bg-[#1A5345]" : "bg-[#E5EEEA]"
        }`}
      >
        <div
          className={`absolute top-[3px] size-[16px] rounded-full bg-white shadow-sm transition-all duration-300 ${
            enabled ? "start-[23px]" : "start-[3px]"
          }`}
        />
      </div>
    </button>
  )
}

function ActionRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="group flex w-full items-center gap-4 rounded-[12px] px-4 py-3 text-start transition-all duration-200 hover:bg-slate-50 cursor-pointer"
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-[15px] font-bold text-muted-foreground">{label}</span>
    </button>
  )
}
