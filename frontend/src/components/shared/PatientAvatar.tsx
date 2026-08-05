"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

function getNameInitials(name: string | null | undefined): string {
  const trimmed = name?.trim()
  if (!trimmed) return ""

  return trimmed
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function resolveDisplayAvatarUrl(avatarUrl: string | null | undefined): string | null {
  const raw = avatarUrl?.trim()
  if (!raw) return null
  if (raw.startsWith("/avatars/")) return null

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      const host = new URL(raw).hostname
      if (host === "i.pravatar.cc" || host === "api.dicebear.com") {
        return null
      }
    } catch {
      return null
    }
  }

  return raw
}

function isLocalAvatarPath(url: string): boolean {
  return url.startsWith("/") && !url.startsWith("//")
}

type PatientAvatarProps = {
  name?: string | null
  avatarUrl?: string | null
  alt?: string
  className?: string
  initialsClassName?: string
  sizes?: string
}

export function PatientAvatar({
  name,
  avatarUrl,
  alt,
  className,
  initialsClassName,
  sizes = "44px",
}: PatientAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const resolvedUrl = resolveDisplayAvatarUrl(avatarUrl)
  const hasAvatar = Boolean(resolvedUrl) && !imageFailed
  const displayName = name?.trim() || "Patient"
  const initials = getNameInitials(displayName)

  useEffect(() => {
    setImageFailed(false)
  }, [avatarUrl])

  return (
    <div className={cn("relative size-full overflow-hidden bg-[#F4F3EF]", className)}>
      {hasAvatar ? (
        isLocalAvatarPath(resolvedUrl!) ? (
          <Image
            src={resolvedUrl!}
            alt={alt ?? displayName}
            fill
            unoptimized
            sizes={sizes}
            className="object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          // MinIO presigned URLs must use a native img (dynamic host / query string).
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolvedUrl!}
            alt={alt ?? displayName}
            className="size-full object-cover"
            onError={() => setImageFailed(true)}
          />
        )
      ) : (
        <div
          className={cn(
            "flex size-full items-center justify-center bg-[#E4EBE8] font-sans font-bold text-[#1A5345]",
            initialsClassName ?? "text-[13px]",
          )}
        >
          {initials || "?"}
        </div>
      )}
    </div>
  )
}
