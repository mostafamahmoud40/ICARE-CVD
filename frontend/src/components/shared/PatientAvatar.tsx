"use client"

import { useState } from "react"

import { cn } from "@/lib/utils"

function buildPatientAvatarSrc(
  avatarUrl: string | null | undefined,
  fallbackSeed: string | number,
): string {
  const raw = avatarUrl?.trim()
  if (!raw) {
    return `https://i.pravatar.cc/150?u=${encodeURIComponent(String(fallbackSeed))}`
  }
  if (raw.startsWith("/avatars/")) return raw
  return raw
}

type PatientAvatarProps = {
  avatarUrl?: string | null
  fallbackSeed: string | number
  alt?: string
  className?: string
}

export function PatientAvatar({
  avatarUrl,
  fallbackSeed,
  alt = "",
  className,
}: PatientAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const fallback = `https://i.pravatar.cc/150?u=${encodeURIComponent(String(fallbackSeed))}`
  const src = imageFailed ? fallback : buildPatientAvatarSrc(avatarUrl, fallbackSeed)

  return (
    <img
      src={src}
      alt={alt}
      className={cn("size-full object-cover", className)}
      onError={() => setImageFailed(true)}
    />
  )
}
