"use client"

import { CheckCircle2Icon, HistoryIcon, XCircleIcon, XIcon } from "lucide-react"
import { StatCell } from "../shared/StatCell"

type PastVisitsStatsSummaryProps = {
  completed: number
  noShow: number
  cancelled: number
  total: number
}

export function PastVisitsStatsSummary({
  completed,
  noShow,
  cancelled,
  total,
}: PastVisitsStatsSummaryProps) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCell
        icon={HistoryIcon}
        value={total}
        label="Total visits"
        iconColor="text-slate-600"
      />
      <StatCell
        icon={CheckCircle2Icon}
        value={completed}
        label="Completed"
        iconColor="text-emerald-600"
      />
      <StatCell
        icon={XCircleIcon}
        value={noShow}
        label="No show"
        iconColor="text-red-600"
      />
      <StatCell
        icon={XIcon}
        value={cancelled}
        label="Cancelled"
        iconColor="text-gray-500"
      />
    </div>
  )
}
