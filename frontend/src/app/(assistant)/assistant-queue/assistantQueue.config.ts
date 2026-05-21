import type { QueuePriority, QueueStatus } from "./assistantQueue.types"

export const STATUS_CONFIG: Record<QueueStatus, { label: string; style: string; dot: string }> = {
  scheduled: { label: "Scheduled", style: "bg-[#F4F3EF] border-[#E8E6E0]/60 text-[#4F6D64]", dot: "bg-[#6B7870]" },
  arrived: { label: "Arrived", style: "bg-blue-50/50 border-blue-200/60 text-blue-700", dot: "bg-blue-500" },
  waiting: { label: "Waiting", style: "bg-amber-50/50 border-amber-200/60 text-amber-700", dot: "bg-amber-500" },
  "in-consultation": { label: "In consultation", style: "bg-[#E8F0EE] border-[#1A5345]/20 text-[#1A5345]", dot: "bg-[#1A5345] animate-pulse" },
  completed: { label: "Completed", style: "bg-emerald-50/50 border-emerald-200/60 text-emerald-700", dot: "bg-emerald-500" },
  "no-show": { label: "No show", style: "bg-red-50/50 border-red-200/60 text-red-600", dot: "bg-red-500" },
  cancelled: { label: "Cancelled", style: "bg-gray-50 border-gray-200/60 text-gray-500", dot: "bg-gray-400" },
}

export const PRIORITY_CONFIG: Record<QueuePriority, { label: string; style: string }> = {
  normal: { label: "Normal", style: "bg-[#F4F3EF] text-[#6B7870]" },
  urgent: { label: "Urgent", style: "bg-amber-50 text-amber-700 border border-amber-200/60" },
  emergency: { label: "Emergency", style: "bg-red-50 text-red-700 border border-red-200/60 animate-pulse" },
}

export const VISIT_TYPE_CONFIG: Record<string, { label: string; style: string }> = {
  "follow-up": { label: "Follow-up", style: "bg-[#EEF5F3] border-[#1A5345]/10 text-[#1A5345]" },
  new: { label: "New", style: "bg-violet-50 border-violet-200/60 text-violet-700" },
  "walk-in": { label: "Walk-in", style: "bg-orange-50 border-orange-200/60 text-orange-700" },
  "urgent-care": { label: "Urgent care", style: "bg-red-50 border-red-200/60 text-red-700" },
  "post-procedure": { label: "Post-procedure", style: "bg-teal-50 border-teal-200/60 text-teal-700" },
}
