"use client"

import React, { useState } from "react"
import type { LabResult } from "../../doctorPatients.types"
import { cn } from "@/lib/utils"
import Link from "next/link"
import {
  FlaskConicalIcon,
  PlusIcon,
  TestTube2Icon,
} from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function fmtShort(iso: string | null | undefined) {
  if (!iso) return "\u2014"
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso))
}

type LabOrderFormData = {
  tests: string
  priority: "routine" | "urgent" | "stat"
  notes: string
}

const COMMON_TESTS = [
  "Complete Blood Count (CBC)",
  "Lipid Panel",
  "HbA1c",
  "Fasting Blood Sugar",
  "Basic Metabolic Panel (BMP)",
  "Comprehensive Metabolic Panel (CMP)",
  "Liver Function Tests (LFTs)",
  "Thyroid Panel (TSH, T3, T4)",
  "Cardiac Enzymes (Troponin, CK-MB)",
  "BNP / NT-proBNP",
  "CRP (C-Reactive Protein)",
  "ESR (Erythrocyte Sedimentation Rate)",
  "Urinalysis",
  "PT/INR",
  "Serum Creatinine / BUN",
  "Electrolytes (Na, K, Cl, Ca)",
  "Vitamin D",
  "Iron Studies",
]

type LabResultsPageProps = {
  patientId: string
  patientName: string
  labResults: LabResult[]
}

export function LabResultsPage({ patientId, patientName, labResults }: LabResultsPageProps) {
  const [orderDialog, setOrderDialog] = useState(false)
  const [orderForm, setOrderForm] = useState<LabOrderFormData>({ tests: "", priority: "routine", notes: "" })
  const [selectedTests, setSelectedTests] = useState<string[]>([])

  const stStyles: Record<string, string> = {
    normal: "text-emerald-600",
    high: "text-red-600 font-semibold",
    low: "text-amber-600 font-semibold",
    critical: "text-red-700 font-bold",
  }
  const dotStyles: Record<string, string> = {
    normal: "bg-emerald-400",
    high: "bg-red-400",
    low: "bg-amber-400",
    critical: "bg-red-500 animate-pulse",
  }

  const grouped = labResults.reduce<Record<string, LabResult[]>>((acc, r) => {
    const key = r.date
    if (!acc[key]) acc[key] = []
    acc[key].push(r)
    return acc
  }, {})

  const dates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  function toggleTest(test: string) {
    setSelectedTests((prev) =>
      prev.includes(test) ? prev.filter((t) => t !== test) : [...prev, test]
    )
  }

  function submitOrder() {
    setOrderDialog(false)
    setSelectedTests([])
    setOrderForm({ tests: "", priority: "routine", notes: "" })
  }

  return (
    <main className="flex-1 overflow-y-auto bg-[#F9F8F5] p-3 sm:p-4 lg:p-5">
      <div className="space-y-4 sm:space-y-5">
        <div className="flex items-center justify-between">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/doctor-patients" className="text-[10px] sm:text-[11px]">Patients</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/doctor-patients/${patientId}`} className="text-[10px] sm:text-[11px]">{patientName}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-[10px] font-medium sm:text-[11px]">Lab Results</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Button size="sm" onClick={() => setOrderDialog(true)} className="gap-1 bg-[#1A5345] text-[10px] hover:bg-[#0F3D32] sm:text-[11px]">
            <PlusIcon className="size-3 sm:size-3.5" />
            <span className="hidden sm:inline">Order Tests</span>
            <span className="sm:hidden">Order</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#EEF5F3] px-2.5 py-1 text-[10px] font-semibold text-[#1A5345] sm:text-[11px]">{labResults.length} tests</span>
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] text-gray-500 sm:text-[11px]">{dates.length} panels</span>
        </div>

        {dates.map((date) => (
          <div key={date} className="rounded-xl border border-[#E5EEEA] bg-white p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-lg bg-[#E8F0EE] sm:size-7">
                  <FlaskConicalIcon className="size-3 text-[#1A5345] sm:size-3.5" />
                </div>
                <h3 className="text-[12px] font-semibold text-[#102F27] sm:text-[13px]">{fmtShort(date)}</h3>
              </div>
              <span className="text-[9px] text-muted-foreground sm:text-[10px]">Ordered by {grouped[date][0]?.orderedBy}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[9px] sm:text-[10px]">
                <thead>
                  <tr className="border-b border-[#E8E6E0] text-muted-foreground">
                    <th className="px-2 py-1.5 font-medium">Test</th>
                    <th className="px-2 py-1.5 font-medium">Result</th>
                    <th className="hidden px-2 py-1.5 font-medium sm:table-cell">Reference Range</th>
                    <th className="px-2 py-1.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped[date].map((r) => (
                    <tr key={r.id} className="border-b border-[#F5F5F3]">
                      <td className="px-2 py-1.5 font-medium text-[#102F27]">{r.testName}</td>
                      <td className={cn("px-2 py-1.5", stStyles[r.status])}>
                        {r.value} <span className="text-muted-foreground">{r.unit}</span>
                      </td>
                      <td className="hidden px-2 py-1.5 text-muted-foreground sm:table-cell">{r.referenceRange}</td>
                      <td className="px-2 py-1.5">
                        <span className="flex items-center gap-1">
                          <span className={cn("inline-block size-1.5 rounded-full", dotStyles[r.status])} />
                          <span className={cn(stStyles[r.status])}>{r.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        <Dialog open={orderDialog} onOpenChange={setOrderDialog}>
          <DialogContent className="max-w-lg sm:max-w-xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[13px] font-semibold text-[#102F27] sm:text-[14px]">Order New Lab Tests</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-[10px] font-medium text-muted-foreground sm:text-[11px]">Select Tests</Label>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5 max-h-[200px] overflow-y-auto">
                  {COMMON_TESTS.map((test) => (
                    <button
                      key={test}
                      type="button"
                      onClick={() => toggleTest(test)}
                      className={cn(
                        "rounded-lg border px-2 py-1.5 text-left text-[9px] transition-colors sm:text-[10px]",
                        selectedTests.includes(test)
                          ? "border-[#1A5345] bg-[#EEF5F3] text-[#1A5345] font-medium"
                          : "border-[#E5EEEA] bg-white text-[#102F27] hover:border-[#1A5345]/30"
                      )}
                    >
                      {test}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground sm:text-[11px]">Custom Test Name</Label>
                <Input
                  value={orderForm.tests}
                  onChange={(e) => setOrderForm((f) => ({ ...f, tests: e.target.value }))}
                  placeholder="Or type a custom test name..."
                  className="mt-1 h-8 text-[11px] sm:h-9 sm:text-[12px]"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground sm:text-[11px]">Priority</Label>
                <Select value={orderForm.priority} onValueChange={(v) => setOrderForm((f) => ({ ...f, priority: v as LabOrderFormData["priority"] }))}>
                  <SelectTrigger className="mt-1 h-8 text-[11px] sm:h-9 sm:text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routine">Routine</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="stat">STAT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground sm:text-[11px]">Clinical Notes</Label>
                <Textarea
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Reason for ordering, clinical context..."
                  className="mt-1 min-h-[50px] text-[11px] sm:text-[12px]"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground sm:text-[10px]">
                  {selectedTests.length > 0 ? `${selectedTests.length} test(s) selected` : "No tests selected"}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setOrderDialog(false)} className="text-[10px] sm:text-[11px]">Cancel</Button>
                  <Button size="sm" onClick={submitOrder} className="bg-[#1A5345] text-[10px] hover:bg-[#0F3D32] sm:text-[11px]" disabled={selectedTests.length === 0 && !orderForm.tests}>
                    Submit Order
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}
