import type { QueuePriority, QueueStatus } from "./assistantQueue.types"

export const STATUS_CONFIG: Record<QueueStatus, { label: string; style: string; dot: string }> = {
  scheduled: { label: "Scheduled", style: "bg-[#6B7870] text-white", dot: "bg-white" },
  arrived: { label: "Arrived", style: "bg-blue-600 text-white", dot: "bg-white" },
  waiting: { label: "Waiting", style: "bg-amber-600 text-white", dot: "bg-white" },
  "in-consultation": { label: "In consultation", style: "bg-[#1A5345] text-white", dot: "bg-white animate-pulse" },
  completed: { label: "Completed", style: "bg-emerald-600 text-white", dot: "bg-white" },
  "no-show": { label: "No show", style: "bg-red-600 text-white", dot: "bg-white" },
  cancelled: { label: "Cancelled", style: "bg-gray-500 text-white", dot: "bg-white" },
}

export const PRIORITY_CONFIG: Record<QueuePriority, { label: string; style: string }> = {
  normal: { label: "Normal", style: "bg-[#6B7870] text-white" },
  urgent: { label: "Urgent", style: "bg-[#CC5533] text-white" },
  emergency: { label: "Emergency", style: "bg-red-600 text-white animate-pulse" },
}

export const VISIT_TYPE_CONFIG: Record<string, { label: string; style: string }> = {
  "follow-up": { label: "Follow-up", style: "bg-[#1A5345] text-white" },
  new: { label: "New", style: "bg-violet-600 text-white" },
  "walk-in": { label: "Walk-in", style: "bg-[#CC5533] text-white" },
  "urgent-care": { label: "Urgent care", style: "bg-red-600 text-white" },
  "post-procedure": { label: "Post-procedure", style: "bg-teal-600 text-white" },
}
