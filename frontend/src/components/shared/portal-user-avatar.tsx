"use client"

import { useState } from "react"
import Image from "next/image"
import { User2Icon } from "lucide-react"

import { cn } from "@/lib/utils"

type PortalUserAvatarProps = {
  name: string
  avatarUrl?: string | null
  size?: "sm" | "md" | "sidebar" | "menu"
  shape?: "circle" | "rounded-2xl" | "rounded-xl"
  showOnlineDot?: boolean
  className?: string
}

const SIZE_CLASS = {
  sm: "size-10",
  md: "size-11",
  sidebar: "size-11",
  menu: "size-9",
} as const

const SHAPE_CLASS = {
  circle: "rounded-full",
  "rounded-2xl": "rounded-[14px]",
  "rounded-xl": "rounded-[10px]",
} as const

export function PortalUserAvatar({
  name,
  avatarUrl,
  size = "md",
  shape = "circle",
  showOnlineDot = false,
  className,
}: PortalUserAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const hasAvatar = Boolean(avatarUrl?.trim()) && !imageFailed
  const boxClass = SIZE_CLASS[size]
  const shapeClass = SHAPE_CLASS[shape]

  return (
    <div className={cn("relative shrink-0", boxClass, className)}>
      <div
        className={cn(
          "relative size-full overflow-hidden bg-[#F4F3EF]",
          shapeClass,
          shape !== "circle" && "border border-[#E8E6E0]/60 bg-white",
        )}
      >
        {hasAvatar ? (
          <Image
            src={avatarUrl!}
            alt={name}
            fill
            unoptimized
            sizes="44px"
            className="object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex size-full items-center justify-center text-[#B0BAB4]">
            <User2Icon className={size === "menu" ? "size-4" : "size-5"} strokeWidth={1.5} aria-hidden />
          </div>
        )}
      </div>
      {showOnlineDot ? (
        <span
          className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-white bg-[#22C55E] shadow-sm"
          aria-hidden
        />
      ) : null}
    </div>
  )
}
