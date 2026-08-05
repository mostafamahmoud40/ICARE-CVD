"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  FlaskConicalIcon,
  Loader2Icon,
  SparklesIcon,
  UploadIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

import type { PatientLabOrder } from "./labOrders.types"
import { usePatientLabOrders } from "./usePatientLabOrders"

function formatDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso))
}

function statusBadge(order: PatientLabOrder) {
  switch (order.status) {
    case "uploaded":
      return (
        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
          <CheckCircle2Icon className="size-3" aria-hidden />
          Uploaded
        </span>
      )
    case "missing":
      return (
        <span className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
          <AlertTriangleIcon className="size-3" aria-hidden />
          Missing
        </span>
      )
    case "cancelled":
      return (
        <span className="rounded-lg bg-slate-500 px-2 py-0.5 text-[10px] font-bold text-white">
          Cancelled
        </span>
      )
    default:
      return (
        <span className="rounded-lg bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white">
          Awaiting upload
        </span>
      )
  }
}

export function PatientLabOrders() {
  const { orders, isLoading, isError, uploadReport, isUploading } = usePatientLabOrders()
  const [uploadOrder, setUploadOrder] = useState<PatientLabOrder | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadPhase, setUploadPhase] = useState<"idle" | "analyzing" | "done" | "error">("idle")
  const [uploadError, setUploadError] = useState<string | null>(null)

  const pending = useMemo(
    () => orders.filter((o) => o.status === "ordered" || o.status === "missing"),
    [orders],
  )

  async function submitUpload() {
    if (!uploadOrder || !uploadFile) return

    setUploadPhase("analyzing")
    setUploadError(null)

    try {
      await uploadReport(uploadOrder.id, uploadFile)
      setUploadPhase("done")
      setTimeout(() => {
        setUploadOrder(null)
        setUploadFile(null)
        setUploadPhase("idle")
      }, 1200)
    } catch (err) {
      setUploadPhase("error")
      setUploadError(err instanceof Error ? err.message : "Upload failed")
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#F9F8F5]">
      <div className="shrink-0 border-b border-[#E8E6E0]/60 bg-white px-6 py-5 sm:px-8">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="mb-3 h-8 rounded-lg border-0 bg-transparent px-0 text-[12px] font-bold text-[#1A5345] shadow-none hover:bg-transparent"
        >
          <Link href="/dashboard">
            <ArrowLeftIcon className="mr-1.5 size-3.5" aria-hidden />
            Back to dashboard
          </Link>
        </Button>
        <h1 className="font-serif text-[26px] font-bold text-[#1A1F1E]">Lab orders</h1>
        <p className="mt-1 text-[13px] font-medium text-[#6B7870]">
          Tests your doctor ordered — complete them at an external lab, then upload the report here.
        </p>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6 sm:px-8 custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2Icon className="size-8 animate-spin text-[#1A5345]" aria-hidden />
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-800">
            Could not load lab orders. Please try again.
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-[#E5EEEA] bg-white py-12 text-center">
            <FlaskConicalIcon className="mx-auto size-10 text-muted-foreground" aria-hidden />
            <p className="mt-3 text-[14px] font-bold text-[#1A1F1E]">No lab orders yet</p>
            <p className="mt-1 text-[12px] font-medium text-muted-foreground">
              When your doctor orders tests, they will appear here.
            </p>
          </div>
        ) : (
          <>
            {pending.length > 0 ? (
              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-[12px] font-medium text-amber-900">
                <strong>{pending.length}</strong> order{pending.length === 1 ? "" : "s"} need your
                attention — upload results when ready.
              </div>
            ) : null}

            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className={cn(
                    "overflow-hidden rounded-2xl border bg-white shadow-sm",
                    order.status === "missing" ? "border-rose-200" : "border-[#E8E6E0]/70",
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E6E0]/50 bg-[#F4F3ED]/40 px-4 py-3 sm:px-5">
                    <div className="flex items-center gap-2">
                      <FlaskConicalIcon className="size-4 text-violet-600" aria-hidden />
                      <h2 className="font-serif text-[16px] font-bold text-[#1A1F1E]">{order.title}</h2>
                    </div>
                    {statusBadge(order)}
                  </div>

                  <div className="space-y-3 px-4 py-4 sm:px-5">
                    <p className="text-[12px] font-medium text-muted-foreground">
                      Ordered by {order.doctorName} · {formatDate(order.orderedAt)}
                    </p>
                    <p className="text-[12px] font-medium text-[#1A1F1E]">
                      Complete by <span className="font-bold">{formatDate(order.dueAt)}</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {order.tests.map((test) => (
                        <span
                          key={test}
                          className="rounded-lg bg-[#F4F3EF] px-2 py-0.5 text-[11px] font-medium text-[#1A1F1E]"
                        >
                          {test}
                        </span>
                      ))}
                    </div>
                    {order.notes ? (
                      <p className="rounded-lg bg-[#FFF8EB] px-3 py-2 text-[12px] leading-relaxed text-[#8C5B1E]">
                        {order.notes}
                      </p>
                    ) : null}

                    {order.status === "ordered" || order.status === "missing" ? (
                      <Button
                        type="button"
                        size="sm"
                        className="h-9 gap-2 rounded-lg border-0 bg-[#1A5345] text-[12px] font-bold text-white hover:bg-[#133F34]"
                        onClick={() => {
                          setUploadOrder(order)
                          setUploadFile(null)
                          setUploadPhase("idle")
                          setUploadError(null)
                        }}
                      >
                        <UploadIcon className="size-3.5" aria-hidden />
                        Upload report
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Dialog
        open={uploadOrder !== null}
        onOpenChange={(open) => {
          if (!open && uploadPhase !== "analyzing" && !isUploading) {
            setUploadOrder(null)
            setUploadFile(null)
            setUploadPhase("idle")
            setUploadError(null)
          }
        }}
      >
        <DialogContent className="gap-0 overflow-hidden rounded-2xl border border-[#E8E6E0]/80 bg-white p-0 sm:max-w-[480px]">
          <DialogHeader className="border-b border-[#E8E6E0]/60 px-5 py-4 text-left">
            <DialogTitle className="font-serif text-[18px] font-bold text-[#1A1F1E]">
              Upload lab report
            </DialogTitle>
            <DialogDescription className="text-[12px] font-medium text-muted-foreground">
              {uploadOrder?.title} — AI will read the report and mark this order complete.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-5 py-5">
            {uploadPhase === "analyzing" || isUploading ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <Loader2Icon className="size-8 animate-spin text-violet-600" aria-hidden />
                <p className="text-[14px] font-bold text-[#1A1F1E]">Analyzing your report…</p>
              </div>
            ) : uploadPhase === "done" ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle2Icon className="size-8 text-emerald-600" aria-hidden />
                <p className="text-[14px] font-bold text-[#1A1F1E]">Report uploaded successfully</p>
              </div>
            ) : (
              <>
                <div>
                  <Label className="text-[12px] font-bold text-[#1A1F1E]">Lab report file</Label>
                  <label className="mt-1.5 flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-[#E8E6E0] bg-[#FAFAF8] px-4 py-6 text-center hover:border-violet-300">
                    <UploadIcon className="size-6 text-violet-600" aria-hidden />
                    <span className="text-[12px] font-bold text-[#1A1F1E]">
                      {uploadFile?.name ?? "Choose PDF or image"}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="sr-only"
                      onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
                {uploadPhase === "error" && uploadError ? (
                  <p className="rounded-lg bg-rose-50 px-3 py-2 text-[12px] font-medium text-rose-700">
                    {uploadError}
                  </p>
                ) : null}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg"
                    onClick={() => setUploadOrder(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!uploadFile}
                    className="h-8 gap-1.5 rounded-lg border-0 bg-[#1A5345] text-white"
                    onClick={() => void submitUpload()}
                  >
                    <SparklesIcon className="size-3.5" aria-hidden />
                    Upload & analyze
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
