"use client"

import Link from "next/link"
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  FlaskConicalIcon,
  HeartPulseIcon,
  ScanLineIcon,
  SparklesIcon,
  StethoscopeIcon,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import type { CareTimelineItem, CareTimelineItemKind, CareTimelineTestType } from "./dashboard.types"
import {
  careTimelineBucketLabel,
  formatCareDueDate,
  groupCareTimelineItems,
  type CareTimelineBucket,
} from "./careTimeline.utils"

const KIND_CONFIG: Record<
  CareTimelineItemKind,
  { label: string; Icon: LucideIcon; iconColor: string }
> = {
  lab_order: {
    label: "Lab test",
    Icon: FlaskConicalIcon,
    iconColor: "text-violet-600",
  },
  follow_up: {
    label: "Follow-up",
    Icon: StethoscopeIcon,
    iconColor: "text-[#1A5345]",
  },
  appointment: {
    label: "Appointment",
    Icon: CalendarDaysIcon,
    iconColor: "text-[#CC5533]",
  },
  test_order: {
    label: "Ordered test",
    Icon: HeartPulseIcon,
    iconColor: "text-emerald-600",
  },
}

const TEST_TYPE_ICON: Partial<
  Record<CareTimelineTestType, { Icon: LucideIcon; iconColor: string }>
> = {
  ecg: { Icon: HeartPulseIcon, iconColor: "text-emerald-600" },
  echocardiogram: { Icon: HeartPulseIcon, iconColor: "text-teal-600" },
  holter_monitor: { Icon: HeartPulseIcon, iconColor: "text-fuchsia-600" },
  stress_test: { Icon: HeartPulseIcon, iconColor: "text-orange-600" },
  nuclear_stress_test: { Icon: HeartPulseIcon, iconColor: "text-amber-700" },
  ct_coronary_angiography: { Icon: ScanLineIcon, iconColor: "text-sky-600" },
  cardiac_mri: { Icon: ScanLineIcon, iconColor: "text-indigo-600" },
  cardiac_catheterization: { Icon: HeartPulseIcon, iconColor: "text-rose-600" },
  carotid_doppler: { Icon: ScanLineIcon, iconColor: "text-cyan-700" },
  tilt_table_test: { Icon: HeartPulseIcon, iconColor: "text-lime-700" },
  imaging: { Icon: ScanLineIcon, iconColor: "text-sky-600" },
  pulmonary_function: { Icon: ScanLineIcon, iconColor: "text-cyan-600" },
  sleep_study: { Icon: ScanLineIcon, iconColor: "text-violet-600" },
}

function resolveTimelineIcon(item: CareTimelineItem) {
  if (item.testType && TEST_TYPE_ICON[item.testType]) {
    return TEST_TYPE_ICON[item.testType]!
  }
  return {
    Icon: KIND_CONFIG[item.kind].Icon,
    iconColor: KIND_CONFIG[item.kind].iconColor,
  }
}

function actionLabelForItem(item: CareTimelineItem) {
  if (item.kind === "lab_order") return "Upload results"
  if (item.kind === "test_order") return "View order"
  return "View details"
}

const BUCKET_LABEL_STYLES: Record<CareTimelineBucket, string> = {
  overdue: "text-rose-700",
  today: "text-[#1A5345]",
  tomorrow: "text-sky-700",
  upcoming: "text-[#6B7870]",
}

const BUCKET_ORDER: CareTimelineBucket[] = ["overdue", "today", "tomorrow", "upcoming"]

function StatusPill({ item }: { item: CareTimelineItem }) {
  if (item.status === "missing") {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
        <AlertTriangleIcon className="size-3" aria-hidden />
        Missing
      </span>
    )
  }
  if (item.status === "scheduled") {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-2 py-0.5 text-[10px] font-bold text-white">
        Scheduled
      </span>
    )
  }
  if (item.urgent) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
        Action needed
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-[#1A5345] px-2 py-0.5 text-[10px] font-bold text-white">
      Pending
    </span>
  )
}

function CareTimelineRow({ item }: { item: CareTimelineItem }) {
  const { Icon, iconColor } = resolveTimelineIcon(item)
  const actionLabel = actionLabelForItem(item)

  const content = (
    <>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Icon className={cn("mt-0.5 size-4 shrink-0", iconColor)} aria-hidden />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-serif text-[15px] font-bold leading-snug text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]">
              {item.title}
            </p>
            <StatusPill item={item} />
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-[#6B7870]">{item.detail}</p>
          <p className="mt-1 text-[11px] font-medium text-muted-foreground">
            {item.doctorName ? `${item.doctorName} · ` : null}
            Due {formatCareDueDate(item.dueAt)}
          </p>
        </div>
      </div>
      {item.href ? (
        <span className="inline-flex h-8 shrink-0 items-center gap-1 self-start rounded-lg bg-[#F4F3EF] px-3 text-[11px] font-bold text-[#1A5345] transition-all group-hover:bg-[#E8F0EE] sm:self-center">
          {actionLabel}
          <ArrowRightIcon className="size-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      ) : null}
    </>
  )

  const rowClassName =
    "group flex flex-col gap-3 rounded-xl bg-white px-4 py-3.5 shadow-sm transition-all duration-200 hover:bg-[#FAFAF8] hover:shadow-md sm:flex-row sm:items-center sm:justify-between"

  if (item.href) {
    return (
      <Link href={item.href} className={rowClassName}>
        {content}
      </Link>
    )
  }

  return <div className={rowClassName}>{content}</div>
}

type CareTimelineSectionProps = {
  items: CareTimelineItem[]
}

export function CareTimelineSection({ items }: CareTimelineSectionProps) {
  const grouped = groupCareTimelineItems(items)
  const actionCount = items.filter((item) => item.status !== "completed").length

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-4 sm:px-5">
        <div className="flex items-center gap-2.5">
          <SparklesIcon className="size-5 text-[#CC5533]" aria-hidden />
          <h2 className="font-serif text-[18px] font-bold text-[#1A1F1E]">What&apos;s next</h2>
          <span className="rounded-lg bg-[#1A5345] px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
            {actionCount} item{actionCount === 1 ? "" : "s"}
          </span>
        </div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-8 rounded-lg border-0 bg-transparent text-[12px] font-bold text-[#1A5345] shadow-none hover:bg-[#1A5345]/5"
        >
          <Link href="/lab-orders">All lab orders</Link>
        </Button>
      </div>

      <div className="space-y-5 bg-white p-4 sm:p-5">
        {BUCKET_ORDER.map((bucket) => {
          const bucketItems = grouped[bucket]

          return (
            <div key={bucket}>
              <h3 className={cn("mb-2.5 text-[13px] font-bold", BUCKET_LABEL_STYLES[bucket])}>
                {careTimelineBucketLabel(bucket)}
              </h3>
              {bucketItems.length > 0 ? (
                <div className="space-y-2">
                  {bucketItems.map((item) => (
                    <CareTimelineRow key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl bg-[#F4F3EF]/60 px-4 py-3 text-[12px] font-medium text-[#6B7870]">
                  <CheckCircle2Icon className="size-4 shrink-0 text-emerald-600" aria-hidden />
                  Nothing scheduled
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
