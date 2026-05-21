"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-[18px]" strokeWidth={2.5} />,
        info: <InfoIcon className="size-[18px]" strokeWidth={2.5} />,
        warning: <TriangleAlertIcon className="size-[18px]" strokeWidth={2.5} />,
        error: <OctagonXIcon className="size-[18px]" strokeWidth={2.5} />,
        loading: <Loader2Icon className="size-[18px] animate-spin" strokeWidth={2.5} />,
      }}
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "#1A1F1E",
          "--normal-border": "rgba(232, 230, 224, 0.8)",
          "--border-radius": "16px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "group cn-toast flex-row items-start gap-3.5 rounded-2xl border border-[#E8E6E0]/80 bg-white px-5 py-4 shadow-[0_12px_40px_-8px_rgba(26,83,69,0.12)] ring-1 ring-[#1A5345]/5 w-[min(460px,calc(100vw-2rem))] max-w-[460px]",
          title: "text-[14.5px] font-bold tracking-tight text-[#1A1F1E]",
          description: "text-[13px] font-medium leading-[1.6] text-muted-foreground",
          icon: "flex size-10 shrink-0 items-center justify-center rounded-full ring-4 mt-0.5 bg-[#1A5345]/10 text-[#1A5345] ring-[#1A5345]/5",
          success: "bg-white border-[#E8E6E0]/80",
          error: "bg-white border-[#E8E6E0]/80",
          info: "bg-white border-[#E8E6E0]/80",
          warning: "bg-white border-[#E8E6E0]/80",
          loading: "bg-white border-[#E8E6E0]/80",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
