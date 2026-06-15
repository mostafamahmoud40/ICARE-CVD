"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type AvatarImageStatus = "idle" | "loaded" | "error"

const AvatarContext = React.createContext<{
  imageStatus: AvatarImageStatus
  setImageStatus: (status: AvatarImageStatus) => void
} | null>(null)

function useAvatarContext() {
  const ctx = React.useContext(AvatarContext)
  if (!ctx) {
    throw new Error("Avatar components must be used within Avatar")
  }
  return ctx
}

type AvatarProps = React.ComponentPropsWithoutRef<"div"> & {
  size?: "default" | "sm" | "lg"
}

function Avatar({ className, size = "default", ...props }: AvatarProps) {
  const [imageStatus, setImageStatus] = React.useState<AvatarImageStatus>("idle")

  return (
    <AvatarContext.Provider value={{ imageStatus, setImageStatus }}>
      <div
        data-slot="avatar"
        data-size={size}
        className={cn(
          "group/avatar relative size-8 shrink-0 overflow-hidden rounded-full select-none after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken data-[size=lg]:size-10 data-[size=sm]:size-6 dark:after:mix-blend-lighten",
          className
        )}
        {...props}
      />
    </AvatarContext.Provider>
  )
}

function AvatarImage({
  className,
  alt = "",
  onLoad,
  onError,
  src,
  ...props
}: React.ComponentPropsWithoutRef<"img">) {
  const { setImageStatus } = useAvatarContext()
  const ref = React.useRef<HTMLImageElement>(null)
  const resolvedSrc = typeof src === "string" ? src.trim() : ""
  const hasSrc = resolvedSrc.length > 0
  const [hidden, setHidden] = React.useState(!hasSrc)

  React.useEffect(() => {
    if (!hasSrc) {
      setHidden(true)
      setImageStatus("error")
      return
    }

    setHidden(false)
    setImageStatus("idle")
    const img = ref.current
    if (!img) return
    if (img.complete && img.naturalWidth > 0) {
      setImageStatus("loaded")
    } else if (img.complete) {
      setImageStatus("error")
      setHidden(true)
    }
  }, [hasSrc, resolvedSrc, setImageStatus])

  if (!hasSrc || hidden) {
    return null
  }

  return (
    <img
      ref={ref}
      data-slot="avatar-image"
      className={cn(
        "absolute inset-0 size-full rounded-full object-cover",
        className
      )}
      alt={alt}
      src={resolvedSrc}
      onLoad={(event) => {
        setHidden(false)
        setImageStatus("loaded")
        onLoad?.(event)
      }}
      onError={(event) => {
        setHidden(true)
        setImageStatus("error")
        onError?.(event)
      }}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const { imageStatus } = useAvatarContext()

  if (imageStatus === "loaded") {
    return null
  }

  return (
    <div
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-muted text-sm text-muted-foreground group-data-[size=sm]/avatar:text-xs",
        className
      )}
      {...props}
    />
  )
}

function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        "absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground bg-blend-color ring-2 ring-background select-none",
        "group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden",
        "group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2",
        "group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2",
        className
      )}
      {...props}
    />
  )
}

function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        "group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background",
        className
      )}
      {...props}
    />
  )
}

function AvatarGroupCount({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground ring-2 ring-background group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 [&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3",
        className
      )}
      {...props}
    />
  )
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarBadge,
}
