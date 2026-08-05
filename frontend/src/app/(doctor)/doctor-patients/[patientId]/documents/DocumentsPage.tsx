"use client"

import React, { useMemo, useState } from "react"
import type { DoctorPatientsPagePatient, UploadedDocument } from "../../doctorPatients.types"
import { cn } from "@/lib/utils"
import Link from "next/link"
import {
  ActivityIcon,
  CalendarDaysIcon,
  DownloadIcon,
  FileTextIcon,
  FlaskConicalIcon,
  FolderOpenIcon,
  HeartPulseIcon,
  PillIcon,
  RefreshCwIcon,
  SearchIcon,
  UploadIcon,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { diagnosesScrollbarCss } from "../diagnoses/diagnosis.shared"

const DOC_ICONS: Record<UploadedDocument["type"], React.ElementType> = {
  ecg: HeartPulseIcon,
  imaging: ActivityIcon,
  lab_report: FlaskConicalIcon,
  prescription: PillIcon,
  referral: FileTextIcon,
  other: FileTextIcon,
}

const DOC_LABELS: Record<UploadedDocument["type"], string> = {
  ecg: "ECG",
  imaging: "Imaging",
  lab_report: "Lab report",
  prescription: "Prescription",
  referral: "Referral",
  other: "Other",
}

const DOC_ICON_COLORS: Record<UploadedDocument["type"], string> = {
  lab_report: "text-violet-600",
  imaging: "text-blue-600",
  ecg: "text-red-600",
  prescription: "text-[#1A5345]",
  referral: "text-[#6B7870]",
  other: "text-[#6B7870]",
}

const TYPE_BADGE_STYLES: Record<UploadedDocument["type"], string> = {
  lab_report: "bg-violet-600 text-white",
  imaging: "bg-blue-600 text-white",
  ecg: "bg-red-600 text-white",
  prescription: "bg-[#1A5345] text-white",
  referral: "bg-slate-500 text-white",
  other: "bg-slate-500 text-white",
}

const TYPE_ORDER: UploadedDocument["type"][] = [
  "lab_report",
  "imaging",
  "ecg",
  "prescription",
  "referral",
  "other",
]

type TypeFilter = "all" | UploadedDocument["type"]

function fmtShort(iso: string | null | undefined) {
  if (!iso) return "\u2014"
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso))
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type DocumentsPageProps = {
  patient: DoctorPatientsPagePatient
  documents: UploadedDocument[]
}

export function DocumentsPage({ patient, documents: initialDocs }: DocumentsPageProps) {
  const [docs, setDocs] = useState<UploadedDocument[]>(initialDocs)
  const [uploadDialog, setUploadDialog] = useState(false)
  const [uploadType, setUploadType] = useState<UploadedDocument["type"]>("other")
  const [uploadFileName, setUploadFileName] = useState("")
  const [uploadFileSize, setUploadFileSize] = useState("0 KB")
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")

  const basePath = `/doctor-patients/${patient.id}`

  const stats = useMemo(() => {
    const typeSet = new Set(docs.map((d) => d.type))
    const labReports = docs.filter((d) => d.type === "lab_report").length
    const latest = docs.length > 0
      ? fmtShort([...docs].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0].uploadedAt)
      : "N/A"
    return { total: docs.length, categories: typeSet.size, labReports, latest }
  }, [docs])

  const filteredDocs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return docs.filter((d) => {
      const matchesSearch =
        !q ||
        d.fileName.toLowerCase().includes(q) ||
        d.uploadedBy.toLowerCase().includes(q) ||
        DOC_LABELS[d.type].toLowerCase().includes(q)
      const matchesType = typeFilter === "all" || d.type === typeFilter
      return matchesSearch && matchesType
    })
  }, [docs, searchQuery, typeFilter])

  const groupedByDate = useMemo(() => {
    return filteredDocs.reduce<Record<string, UploadedDocument[]>>((acc, d) => {
      const key = d.uploadedAt
      if (!acc[key]) acc[key] = []
      acc[key].push(d)
      return acc
    }, {})
  }, [filteredDocs])

  const dates = useMemo(
    () => Object.keys(groupedByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()),
    [groupedByDate],
  )

  function handleUploadFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadFileName(file.name)
    setUploadFileSize(formatFileSize(file.size))
  }

  function handleUpload() {
    if (!uploadFileName) return
    const newDoc: UploadedDocument = {
      id: `doc-${Date.now()}`,
      fileName: uploadFileName,
      type: uploadType,
      uploadedAt: new Date().toISOString().slice(0, 10),
      uploadedBy: "Dr. Mahmoud",
      fileSize: uploadFileSize,
    }
    setDocs((prev) => [newDoc, ...prev])
    setUploadDialog(false)
    setUploadFileName("")
    setUploadFileSize("0 KB")
    setUploadType("other")
  }

  function resetFilters() {
    setSearchQuery("")
    setTypeFilter("all")
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#F9F8F5] animate-in fade-in duration-500">
      <div className="relative z-20 shrink-0 border-b border-[#E8E6E0]/60 bg-gradient-to-br from-white via-[#FFFCFA] to-[#E8F0EE]/30">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#1A5345]/15 via-[#CC5533]/35 to-[#1A5345]/15"
          aria-hidden
        />
        <div className="flex flex-col px-6 pb-5 pt-4 sm:px-8 sm:pb-6 sm:pt-5">
          <div className="mb-2 flex items-center gap-2 sm:mb-2.5">
            <Breadcrumb>
              <BreadcrumbList className="text-[11px] sm:text-[12px]">
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/doctor-patients" className="text-[11px] font-medium sm:text-[12px]">Patients</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={basePath} className="text-[11px] font-medium sm:text-[12px]">{patient.fullName}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-[11px] font-medium sm:text-[12px]">Documents &amp; files</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
            <div className="min-w-0 space-y-1">
              <h1 className="font-serif text-[24px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[26px] lg:text-[28px]">
                Documents &amp; files
              </h1>
              <p className="text-[13px] font-medium text-[#6B7870] sm:text-[14px]">
                Clinical documents and uploaded reports for{" "}
                <span className="font-bold text-[#1A1F1E]">{patient.fullName}</span>
              </p>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={() => setUploadDialog(true)}
              className="h-8 gap-2 self-start rounded-lg border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-sm transition-colors hover:bg-[#133F34]"
            >
              <UploadIcon className="size-3.5" strokeWidth={2.5} aria-hidden />
              Upload file
            </Button>
          </div>

          <div className="mt-4 grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Total files</span>
                <span className="font-serif text-[32px] font-bold leading-none tracking-tight text-[#1A1F1E] tabular-nums">{stats.total}</span>
              </div>
              <FolderOpenIcon className="size-5 shrink-0 text-[#1A5345]" strokeWidth={2} aria-hidden />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Categories</span>
                <span className="font-serif text-[32px] font-bold leading-none tracking-tight text-[#1A1F1E] tabular-nums">{stats.categories}</span>
              </div>
              <FileTextIcon className="size-5 shrink-0 text-[#2C6A5B]" strokeWidth={2} aria-hidden />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Lab reports</span>
                <span className="font-serif text-[32px] font-bold leading-none tracking-tight text-violet-600 tabular-nums">{stats.labReports}</span>
              </div>
              <FlaskConicalIcon className="size-5 shrink-0 text-violet-600" strokeWidth={2} aria-hidden />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Latest upload</span>
                <span className="font-serif text-[18px] font-bold leading-tight tracking-tight text-[#1A1F1E]">{stats.latest}</span>
              </div>
              <UploadIcon className="size-5 shrink-0 text-[#C27D38]" strokeWidth={2} aria-hidden />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
            <div className="group relative flex-1 sm:w-[260px] sm:flex-none">
              <SearchIcon
                className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#9CA3AF] transition-colors group-focus-within:text-[#1A5345]"
                strokeWidth={2}
                aria-hidden
              />
              <Input
                type="search"
                placeholder="Search file name, type, or uploader…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-full rounded-lg border border-[#E8E6E0] bg-white pl-9 pr-3 text-[12px] font-medium text-[#1A1F1E] shadow-sm transition-all placeholder:text-muted-foreground/50 focus-visible:border-[#1A5345]/30 focus-visible:ring-0"
              />
            </div>

            <div className="flex items-center gap-2">
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
                <SelectTrigger className="h-8 w-full rounded-lg border border-[#E8E6E0] bg-white px-3 text-[12px] font-bold text-[#1A1F1E] shadow-sm transition-all hover:bg-slate-50 focus:ring-0 sm:w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="rounded-lg border border-[#cfd9d5] bg-white shadow-lg">
                  <SelectItem value="all" className="h-10 cursor-pointer text-[#152a24]">All types</SelectItem>
                  {TYPE_ORDER.map((type) => (
                    <SelectItem key={type} value={type} className="h-10 cursor-pointer text-[#152a24]">
                      {DOC_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 border-0 bg-transparent text-[#6B7870] shadow-none transition-colors hover:bg-transparent hover:text-[#1A5345]"
                onClick={resetFilters}
                aria-label="Reset filters"
              >
                <RefreshCwIcon className="size-4" strokeWidth={2} aria-hidden />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex-1 overflow-auto bg-[#F9F8F5] px-6 pb-10 pt-6 sm:px-8 sm:pb-12 sm:pt-8 custom-scrollbar">
        <div className="w-full space-y-6">
          <div className="flex items-center justify-between gap-3 px-0.5">
            <h2 className="font-serif text-[18px] font-bold text-[#1A1F1E]">File library</h2>
            <span className="rounded-lg bg-[#1A5345] px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
              {filteredDocs.length} file{filteredDocs.length === 1 ? "" : "s"}
            </span>
          </div>

          {filteredDocs.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[#E5EEEA] bg-white py-12 text-center">
              <div className="mx-auto mb-3.5 flex size-12 items-center justify-center rounded-full bg-[#F5F5F3]">
                <FolderOpenIcon className="size-6 text-[#9CA3AF]" aria-hidden />
              </div>
              <p className="text-[14px] font-bold text-[#1A1F1E]">No documents found</p>
              <p className="mt-1 text-[12px] font-medium text-[#6B7870] max-w-xs mx-auto">
                {searchQuery || typeFilter !== "all"
                  ? "No files match your current search or filter."
                  : "Upload ECG, imaging, lab reports, and other clinical files."}
              </p>
              {searchQuery || typeFilter !== "all" ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="mt-4 h-8 rounded-lg border-[#E8E6E0] text-[11px] font-bold text-[#1A5345] bg-white hover:bg-[#F9F8F5]"
                >
                  Clear filters
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setUploadDialog(true)}
                  className="mt-4 h-8 gap-1.5 rounded-lg border-0 bg-[#1A5345] text-[11px] font-bold text-white hover:bg-[#133F34]"
                >
                  <UploadIcon className="size-3.5" aria-hidden />
                  Upload file
                </Button>
              )}
            </div>
          ) : (
            dates.map((date) => {
              const dateDocs = groupedByDate[date]

              return (
                <section key={date} className="space-y-3">
                  <div className="flex items-center gap-2 px-0.5">
                    <CalendarDaysIcon className="size-4 text-[#1A5345]" aria-hidden />
                    <h3 className="font-serif text-[16px] font-bold text-[#1A1F1E]">{fmtShort(date)}</h3>
                    <span className="rounded-lg bg-[#1A5345] px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                      {dateDocs.length} file{dateDocs.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {dateDocs.map((doc) => {
                      const DocIcon = DOC_ICONS[doc.type]
                      return (
                        <div
                          key={doc.id}
                          className="group flex items-start gap-3 rounded-2xl border border-[#E8E6E0]/70 bg-white p-4 shadow-sm transition-all hover:border-[#1A5345]/25 hover:shadow-md"
                        >
                          <DocIcon className={cn("mt-0.5 size-5 shrink-0", DOC_ICON_COLORS[doc.type])} aria-hidden />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-bold text-[#1A1F1E] group-hover:text-[#1A5345] transition-colors">
                              {doc.fileName}
                            </p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                              <span className={cn("rounded-lg px-2 py-0.5 text-[9px] font-bold", TYPE_BADGE_STYLES[doc.type])}>
                                {DOC_LABELS[doc.type]}
                              </span>
                              <span className="text-[11px] font-medium text-muted-foreground">{doc.fileSize}</span>
                            </div>
                            <p className="mt-1 text-[11px] font-medium text-[#6B7870]">
                              {doc.uploadedBy}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 shrink-0 border-0 bg-transparent text-[#6B7870] shadow-none transition-colors hover:bg-transparent hover:text-[#1A5345]"
                            aria-label={`Download ${doc.fileName}`}
                          >
                            <DownloadIcon className="size-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )
            })
          )}
        </div>
      </div>

      <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
        <DialogContent className="gap-0 overflow-hidden rounded-2xl border border-[#E8E6E0]/80 bg-[#F9F8F5] p-0 shadow-[0_20px_60px_-12px_rgba(26,83,69,0.18)] sm:max-w-[560px]">
          <DialogHeader className="border-b border-[#E8E6E0]/60 bg-white px-6 py-4 text-left">
            <DialogTitle className="font-serif text-[22px] font-bold leading-tight text-[#1A1F1E] sm:text-[24px]">
              Upload document
            </DialogTitle>
            <DialogDescription className="text-[13px] font-medium text-[#6B7870] sm:text-[14px]">
              Add a clinical file for {patient.fullName}. Mock upload — saved locally in this session.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 py-5">
            <div>
              <Label className="text-[12px] font-bold text-[#1A1F1E]">Document type</Label>
              <Select value={uploadType} onValueChange={(v) => setUploadType(v as UploadedDocument["type"])}>
                <SelectTrigger className="mt-1.5 h-8 rounded-lg border-[#E8E6E0] text-[12px] font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ecg">ECG</SelectItem>
                  <SelectItem value="imaging">Imaging</SelectItem>
                  <SelectItem value="lab_report">Lab report</SelectItem>
                  <SelectItem value="prescription">Prescription</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[12px] font-bold text-[#1A1F1E]">File</Label>
              <label className="mt-1.5 flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-[#E8E6E0] bg-white px-4 py-6 text-center transition-colors hover:border-[#1A5345]/40 hover:bg-[#F9F8F5]">
                <UploadIcon className="size-6 text-[#1A5345]" aria-hidden />
                <span className="text-[12px] font-bold text-[#1A1F1E]">
                  {uploadFileName || "Click to choose a file"}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">PDF, JPG, PNG up to 10 MB</span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="sr-only"
                  onChange={handleUploadFileChange}
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-[#E8E6E0]/60 pt-4">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setUploadDialog(false)
                  setUploadFileName("")
                  setUploadFileSize("0 KB")
                  setUploadType("other")
                }}
                className="h-8 rounded-lg border-[#E8E6E0] text-[12px] font-bold"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleUpload}
                disabled={!uploadFileName}
                className="h-8 rounded-lg border-0 bg-[#1A5345] text-[12px] font-bold text-white hover:bg-[#133F34]"
              >
                Upload file
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style dangerouslySetInnerHTML={{ __html: diagnosesScrollbarCss }} />
    </div>
  )
}
