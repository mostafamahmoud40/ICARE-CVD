"use client"

import type { ReactNode } from "react"
import Link from "next/link"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

type DoctorProceduresPageShellProps = {
  title: string
  subtitle: string
  currentPage: string
  stats?: ReactNode
  toolbar?: ReactNode
  children: ReactNode
}

export function DoctorProceduresPageShell({
  title,
  subtitle,
  currentPage,
  stats,
  toolbar,
  children,
}: DoctorProceduresPageShellProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#F9F8F5] animate-in fade-in duration-500">
      <div className="relative z-20 shrink-0 border-b border-[#E8E6E0]/60 bg-white">
        <div className="flex flex-col px-5 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-5">
          <div className="mb-2 flex items-center gap-2 sm:mb-2.5">
            <Breadcrumb>
              <BreadcrumbList className="text-[10px] sm:text-[11px]">
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/doctor-procedures" className="text-[10px] font-medium sm:text-[11px]">
                      Procedures
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-[10px] font-medium sm:text-[11px]">
                    {currentPage}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
            <div className="min-w-0 space-y-0.5">
              <h1 className="font-serif text-[22px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[24px] lg:text-[26px]">
                {title}
              </h1>
              <p className="text-[13px] font-medium text-muted-foreground sm:text-[14px]">{subtitle}</p>
            </div>
            {stats ? <div className="flex flex-wrap items-center gap-4 sm:gap-6">{stats}</div> : null}
          </div>

          {toolbar ? <div className="mt-3 pt-1 sm:mt-4">{toolbar}</div> : null}
        </div>
      </div>

      <div className="relative flex-1 overflow-auto bg-[#F9F8F5] px-6 sm:px-8">{children}</div>
    </div>
  )
}

export function DoctorProceduresStat({
  label,
  value,
  icon: Icon,
  tone = "green",
}: {
  label: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  tone?: "green" | "amber" | "rose"
}) {
  const toneClass = {
    green: "text-[#1A5345]",
    amber: "text-amber-600",
    rose: "text-rose-600",
  }[tone]

  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="text-[10px] font-bold text-muted-foreground sm:text-[11px]">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className={`text-[16px] font-bold leading-none tabular-nums sm:text-[17px] ${toneClass}`}>
          {value}
        </span>
        <Icon className={`size-5 shrink-0 ${toneClass}`} aria-hidden />
      </div>
    </div>
  )
}
