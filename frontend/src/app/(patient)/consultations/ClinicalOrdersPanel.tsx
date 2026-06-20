import {
  CalendarDaysIcon,
  FlaskConicalIcon,
  ScanLineIcon,
  StethoscopeIcon,
  UserRoundIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  ClockIcon,
  AlertCircleIcon
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

import type { ClinicalOrder, ClinicalOrderKind, ClinicalOrderStatus } from "./consultations.types"
import { Button } from "@/components/ui/button"

const KIND_CONFIG: Record<
  ClinicalOrderKind,
  { label: string; Icon: LucideIcon; iconColor: string }
> = {
  lab: {
    label: "Lab Test",
    Icon: FlaskConicalIcon,
    iconColor: "text-violet-600",
  },
  imaging: {
    label: "Imaging",
    Icon: ScanLineIcon,
    iconColor: "text-sky-600",
  },
  referral: {
    label: "Referral",
    Icon: UserRoundIcon,
    iconColor: "text-indigo-600",
  },
  appointment: {
    label: "Follow-up",
    Icon: CalendarDaysIcon,
    iconColor: "text-[#1A5345]",
  },
  self_care: {
    label: "Self Care",
    Icon: StethoscopeIcon,
    iconColor: "text-amber-600",
  },
}

function getOrderAction(order: ClinicalOrder): { label: string } {
  if (order.status === "scheduled") {
    switch (order.kind) {
      case "appointment":
        return { label: "View appointment" }
      case "referral":
        return { label: "View referral" }
      case "imaging":
        return { label: "View imaging details" }
      case "lab":
        return { label: "View lab order" }
      case "self_care":
        return { label: "View care plan" }
    }
  }

  switch (order.kind) {
    case "lab":
      return { label: "Upload results" }
    case "imaging":
      return { label: "Book imaging" }
    case "referral":
      return { label: "Book specialist visit" }
    case "appointment":
      return { label: "Book follow-up" }
    case "self_care":
      return { label: "Log in app" }
  }
}

function StatusBadge({ status, urgent }: { status: ClinicalOrderStatus; urgent?: boolean }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
        <CheckCircle2Icon className="size-3" aria-hidden />
        Completed
      </span>
    )
  }
  if (status === "scheduled") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-bold text-white">
        <ClockIcon className="size-3" aria-hidden />
        Scheduled
      </span>
    )
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white",
        urgent ? "bg-rose-500" : "bg-amber-500",
      )}
    >
      <AlertCircleIcon className="size-3" aria-hidden />
      {urgent ? "Urgent" : "Action needed"}
    </span>
  )
}

type ClinicalOrdersPanelProps = {
  orders: ClinicalOrder[]
  layout?: "stack" | "grid"
  emptyMessage?: string
}

export function ClinicalOrdersPanel({
  orders,
  layout = "stack",
  emptyMessage = "No pending orders or actions.",
}: ClinicalOrdersPanelProps) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E8E6E0] bg-[#F9F8F5] py-8 text-center">
        <CheckCircle2Icon className="size-8 text-[#1A5345]/40 mb-3" />
        <p className="text-[14px] font-medium text-[#6B7870]">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-[13px] font-medium leading-relaxed text-[#6B7870]">
        Here are the tests and tasks your doctor requested for you to complete.
      </p>
      
      <div className={cn(
        layout === "grid" ? "grid grid-cols-1 gap-4 md:grid-cols-2" : "flex flex-col gap-4"
      )}>
        {orders.map((order) => {
          const cfg = KIND_CONFIG[order.kind]
          const Icon = cfg.Icon
          const action = getOrderAction(order)

          return (
            <div
              key={order.id}
              className={cn(
                "group relative flex flex-col overflow-hidden rounded-2xl border transition-all hover:shadow-md",
                order.status === "completed" 
                  ? "border-[#E8E6E0]/60 bg-slate-50/50 opacity-80 hover:opacity-100" 
                  : "border-[#E8E6E0] bg-white shadow-sm hover:border-[#1A5345]/30"
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-3 border-b border-[#E8E6E0]/40 px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2">
                  <Icon
                    className={cn("size-4 shrink-0", cfg.iconColor)}
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span className="font-serif text-[14px] font-bold text-[#1A1F1E]">
                    {cfg.label}
                  </span>
                </div>
                <StatusBadge status={order.status} urgent={order.urgency === "urgent"} />
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col px-4 py-4 sm:px-5">
                <h4 className="font-serif text-[16px] font-bold leading-tight text-[#1A1F1E]">
                  {order.title}
                </h4>
                
                {order.kind === "referral" && order.specialty && (
                  <p className="mt-1.5 text-[12px] font-bold text-[#1A5345]">
                    {order.referredDoctor ? `To: ${order.referredDoctor} (${order.specialty})` : `To: ${order.specialty} Specialist`}
                  </p>
                )}
                
                <p className="mt-2 text-[13px] leading-relaxed text-[#4F6D64]">
                  {order.detail}
                </p>

                {(order.dueDate || order.status !== "completed") && (
                  <div
                    className={cn(
                      "mt-4 flex flex-wrap items-center gap-3",
                      order.dueDate ? "justify-between" : "justify-end",
                    )}
                  >
                    {order.dueDate ? (
                      <div className="flex min-w-0 items-center gap-1.5 rounded-lg bg-[#F4F3EF] px-3 py-2 text-[12px] font-medium text-[#1A1F1E]">
                        <ClockIcon className="size-3.5 shrink-0 text-[#1A5345]" aria-hidden />
                        Complete by: <span className="font-bold">{order.dueDate}</span>
                      </div>
                    ) : null}
                    {order.status !== "completed" ? (
                      <Button
                        variant="link"
                        className="h-auto shrink-0 gap-1 p-0 text-[11px] font-bold text-[#1A5345] hover:text-[#133F34]"
                      >
                        {action.label}
                        <ArrowRightIcon
                          className="size-3 shrink-0 transition-transform group-hover:translate-x-0.5"
                          aria-hidden
                        />
                      </Button>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
