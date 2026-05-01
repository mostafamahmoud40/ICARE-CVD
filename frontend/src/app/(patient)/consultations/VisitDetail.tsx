"use client"

import Link from "next/link"
import {
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Info,
  Lock,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { cn } from "@/lib/utils"

import type { VisitSummary, VitalMetric, Medication, FollowUpInstruction } from "./consultations.types"

const statusVariants = {
  normal: "text-[#1a5345]",
  elevated: "text-[#9A6B2F]",
  warning: "text-[#c45d4b]",
  critical: "text-red-600",
}


const iconBgColors = {
  blue: "bg-[#E0EFF2] text-[#2d8a9e] ring-1 ring-[#C8E0E6]",
  red: "bg-[#F5E8E5] text-[#c45d4b] ring-1 ring-[#E8D4CE]",
  green: "bg-[#E8F0ED] text-[#1a5345] ring-1 ring-[#C8D9D3]",
  yellow: "bg-[#F7F1E6] text-[#8E7043] ring-1 ring-[#E8DCC8]",
}

const medicationStatusVariants = {
  ongoing: "text-[#1a5345]",
  increased: "text-[#9A6B2F]",
  decreased: "text-[#E89042]",
  new: "text-[#2d8a9e]",
  discontinued: "text-[#c45d4b]",
}

type VisitDetailProps = {
  visit: VisitSummary
}

function VitalCard({ vital }: { vital: VitalMetric }) {
  return (
    <Card className="border-[#E7EFEB] transition-colors hover:border-[#1a5345]/20">
      <CardContent className="p-4">
        <p className="text-sm text-[#6B7870]">{vital.label}</p>
        <p className="text-2xl font-bold text-[#1A1F1E]">
          {vital.value} <span className="text-sm font-normal text-[#6B7870]">{vital.unit}</span>
        </p>
        <p className={cn("text-xs font-medium", statusVariants[vital.status])}>
          {vital.status.charAt(0).toUpperCase() + vital.status.slice(1)}
        </p>
        {vital.note && <p className="text-xs text-[#6B7870] mt-1">{vital.note}</p>}
      </CardContent>
    </Card>
  )
}

function MedicationCard({ medication }: { medication: Medication }) {
  return (
    <Card className="border-[#E7EFEB] transition-colors hover:border-[#1a5345]/20">
      <CardContent className="flex items-start gap-3 p-4">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", iconBgColors[medication.icon])}>
          <Lock className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[#1A1F1E]">{medication.name}</p>
          <p className="text-sm text-[#6B7870]">{medication.schedule}</p>
          <p className={cn("text-xs", medicationStatusVariants[medication.status])}>
            {medication.note || medication.status.charAt(0).toUpperCase() + medication.status.slice(1)}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function FollowUpItem({ instruction, isLast }: { instruction: FollowUpInstruction; isLast: boolean }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "h-3 w-3 rounded-full",
            instruction.status === "completed" && "bg-[#1a5345]",
            instruction.status === "scheduled" && "bg-[#2d8a9e]",
            instruction.status === "pending" && "bg-[#E89042]"
          )}
        />
        {!isLast && <div className="mt-1 h-full w-px bg-[#E7EFEB]" />}
      </div>
      <div className={cn("pb-4", isLast && "pb-0")}>
        <p className="font-medium text-[#1A1F1E]">{instruction.title}</p>
        <p className="text-sm text-[#6B7870]">{instruction.description}</p>
        {instruction.date && <p className="text-xs text-[#6B7870] mt-1">{instruction.date}</p>}
      </div>
    </div>
  )
}

export function VisitDetail({ visit }: VisitDetailProps) {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/consultations" className="flex items-center gap-1.5 text-[#6B7870] hover:text-[#1a5345]">
              <FileText className="h-4 w-4" />
              Consultations
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-[#1A1F1E] font-medium">Visit Details</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header Area */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="mb-1">
          <h1 className="text-3xl font-bold tracking-tight text-[#1A1F1E] dark:text-foreground">
            Visit Summary
          </h1>
          <p className="m-0 max-w-xl text-[15px] leading-relaxed text-[#6B7870] dark:text-muted-foreground">
            {visit.date} · {visit.doctor.name} · {visit.doctor.specialty}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-700">Completed</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-[#cfd9d5] bg-white text-[#152a24] hover:border-[#d9e5e1] hover:text-[#1a5345] hover:bg-[#f8faf9]"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Vitals */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {visit.vitals.map((vital, index) => (
          <VitalCard key={index} vital={vital} />
        ))}
      </div>

      {/* Doctor Notes */}
      <Card className="border-[#E7EFEB] transition-colors hover:border-[#1a5345]/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium uppercase tracking-wide text-[#6B7870]">
            What the doctor noted
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[#1A1F1E] leading-relaxed">{visit.doctorNotes}</p>
        </CardContent>
      </Card>

      {/* Prescription & Follow-up - Side by Side */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Prescription */}
        <Card className="border-[#E7EFEB] transition-colors hover:border-[#1a5345]/20">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium uppercase tracking-wide text-[#6B7870]">
              Your Prescription
            </CardTitle>
            <Button variant="ghost" size="icon-xs" className="h-8 w-8 text-[#6B7870] hover:text-[#1a5345]" asChild>
              <Link href="/medications" title="View all medications">
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {visit.medications.map((medication, index) => (
                <MedicationCard key={index} medication={medication} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Follow-up Instructions */}
        <Card className="border-[#E7EFEB] transition-colors hover:border-[#1a5345]/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium uppercase tracking-wide text-[#6B7870]">
              Follow-up Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {visit.followUpInstructions.map((instruction, index) => (
                <FollowUpItem
                  key={index}
                  instruction={instruction}
                  isLast={index === visit.followUpInstructions.length - 1}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Note */}
      {visit.aiNote && (
        <Card className="border-[#C8D9D3] bg-[#E8F0ED]/50 dark:border-emerald-900/50 dark:bg-emerald-900/20">
          <CardContent className="flex gap-3 p-4">
            <Info className="h-5 w-5 shrink-0 text-[#1a5345] dark:text-emerald-400" />
            <div>
              <p className="font-medium text-[#1a5345] dark:text-emerald-400">iCare AI note</p>
              <p className="text-sm text-[#1a5345]/80 dark:text-emerald-400/80 leading-relaxed">{visit.aiNote}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
