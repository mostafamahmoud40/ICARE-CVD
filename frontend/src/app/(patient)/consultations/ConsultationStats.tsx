"use client"

import { Calendar, CheckCircle2, Clock, Stethoscope } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { ConsultationStats as Stats } from "./consultations.types"

type ConsultationStatsProps = {
  stats: Stats
}

export function ConsultationStats({ stats }: ConsultationStatsProps) {
  const statItems = [
    {
      label: "Total Visits",
      value: stats.totalVisits,
      icon: Stethoscope,
      bgClass: "bg-[#E8F0ED] text-[#1a5345]",
      ringClass: "ring-[#C8D9D3]",
    },
    {
      label: "Completed",
      value: stats.completedVisits,
      icon: CheckCircle2,
      bgClass: "bg-emerald-50 text-emerald-600",
      ringClass: "ring-emerald-200",
    },
    {
      label: "This Month",
      value: stats.thisMonthVisits,
      icon: Calendar,
      bgClass: "bg-[#E0EFF2] text-[#2d8a9e]",
      ringClass: "ring-[#C8E0E6]",
    },
    {
      label: "Upcoming",
      value: stats.upcomingVisits,
      icon: Clock,
      bgClass: "bg-[#F7F1E6] text-[#8E7043]",
      ringClass: "ring-[#E8DCC8]",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {statItems.map((item) => (
        <Card
          key={item.label}
          className="transition-colors hover:border-primary/50 border-[#E7EFEB]"
        >
          <CardContent className="flex items-center gap-3 p-4">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1",
                item.bgClass,
                item.ringClass
              )}
            >
              <item.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1A1F1E]">{item.value}</p>
              <p className="text-xs text-[#6B7870]">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
