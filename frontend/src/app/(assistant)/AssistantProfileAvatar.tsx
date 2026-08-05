"use client"

import Image from "next/image"
import { useState } from "react"

import { cn } from "@/lib/utils"

export function getNameInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

type AssistantProfileAvatarProps = {
  name: string
  avatarUrl?: string | null
  className?: string
  imageClassName?: string
  initialsClassName?: string
  sizes?: string
  alt?: string
}

export function AssistantProfileAvatar({
  name,
  avatarUrl,
  className,
  imageClassName,
  initialsClassName,
  sizes = "44px",
  alt,
}: AssistantProfileAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const hasAvatar = Boolean(avatarUrl?.trim()) && !imageFailed
  const initials = getNameInitials(name)

  return (
    <div className={cn("relative overflow-hidden bg-[#F4F3EF]", className)}>
      {hasAvatar ? (
        <Image
          src={avatarUrl!}
          alt={alt ?? name}
          fill
          unoptimized
          sizes={sizes}
          className={cn("object-cover", imageClassName)}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div
          className={cn(
            "flex size-full items-center justify-center bg-[#E4EBE8] font-sans font-bold text-[#1A5345]",
            initialsClassName,
          )}
        >
          {initials || "?"}
        </div>
      )}
    </div>
  )
}
