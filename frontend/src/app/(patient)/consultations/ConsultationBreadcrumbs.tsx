"use client"

import Link from "next/link"
import { ChevronRight, Stethoscope } from "lucide-react"

import { cn } from "@/lib/utils"

type BreadcrumbItem = {
  label: string
  href?: string
  isActive?: boolean
}

type ConsultationBreadcrumbsProps = {
  items: BreadcrumbItem[]
}

export function ConsultationBreadcrumbs({ items }: ConsultationBreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground">
      <Stethoscope className="h-4 w-4 text-[#1a5345]" />
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          {item.href && !item.isActive ? (
            <Link
              href={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className={cn("font-medium", item.isActive && "text-foreground")}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  )
}
