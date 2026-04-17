"use client"

import React, { useState } from "react"
import type { UploadedDocument } from "../../doctorPatients.types"
import { cn } from "@/lib/utils"
import Link from "next/link"
import {
  ActivityIcon,
  DownloadIcon,
  FileTextIcon,
  FlaskConicalIcon,
  HeartPulseIcon,
  PillIcon,
  PlusIcon,
  UploadIcon,
  XIcon,
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
import { Label } from "@/components/ui/label"
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

const DOC_ICONS: Record<string, React.ElementType> = {
  ecg: HeartPulseIcon,
  imaging: ActivityIcon,
  lab_report: FlaskConicalIcon,
  prescription: PillIcon,
  referral: FileTextIcon,
  other: FileTextIcon,
}

const DOC_LABELS: Record<string, string> = {
  ecg: "ECG",
  imaging: "Imaging",
  lab_report: "Lab Report",
  prescription: "Prescription",
  referral: "Referral",
  other: "Other",
}

const DOC_COLORS: Record<string, string> = {
  lab_report: "bg-violet-50 text-violet-600",
  imaging: "bg-blue-50 text-blue-600",
  ecg: "bg-red-50 text-red-600",
  prescription: "bg-[#EEF5F3] text-[#2C6A5B]",
  referral: "bg-[#F5F5F3] text-[#6B7870]",
  other: "bg-[#F5F5F3] text-[#6B7870]",
}

function fmtShort(iso: string | null | undefined) {
  if (!iso) return "\u2014"
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso))
}

type DocumentsPageProps = {
  patientId: string
  patientName: string
  documents: UploadedDocument[]
}

export function DocumentsPage({ patientId, patientName, documents: initialDocs }: DocumentsPageProps) {
  const [docs, setDocs] = useState<UploadedDocument[]>(initialDocs)
  const [uploadDialog, setUploadDialog] = useState(false)
  const [uploadType, setUploadType] = useState<UploadedDocument["type"]>("other")
  const [uploadFileName, setUploadFileName] = useState("")

  const types = [...new Set(docs.map((d) => d.type))]

  function handleUpload() {
    if (!uploadFileName) return
    const newDoc: UploadedDocument = {
      id: `doc-${Date.now()}`,
      fileName: uploadFileName,
      type: uploadType,
      uploadedAt: new Date().toISOString().slice(0, 10),
      uploadedBy: "Dr. Mahmoud",
      fileSize: "0 KB",
    }
    setDocs((prev) => [newDoc, ...prev])
    setUploadDialog(false)
    setUploadFileName("")
    setUploadType("other")
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
                <BreadcrumbPage className="text-[10px] font-medium sm:text-[11px]">Documents & Files</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Button size="sm" onClick={() => setUploadDialog(true)} className="gap-1 bg-[#1A5345] text-[10px] hover:bg-[#0F3D32] sm:text-[11px]">
            <UploadIcon className="size-3 sm:size-3.5" />
            <span className="hidden sm:inline">Upload</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#EEF5F3] px-2.5 py-1 text-[10px] font-semibold text-[#1A5345] sm:text-[11px]">{docs.length} files</span>
        </div>

        {types.map((type) => {
          const typeDocs = docs.filter((d) => d.type === type)
          return (
            <div key={type} className="rounded-xl border border-[#E5EEEA] bg-white p-3 sm:p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-lg bg-[#E8F0EE] sm:size-7">
                  {React.createElement(DOC_ICONS[type] ?? FileTextIcon, { className: "size-3 text-[#1A5345] sm:size-3.5" })}
                </div>
                <h3 className="text-[12px] font-semibold text-[#102F27] sm:text-[13px]">{DOC_LABELS[type] ?? type}</h3>
                <span className="rounded-full bg-[#F5F5F3] px-1.5 py-0.5 text-[9px] text-[#6B7870]">{typeDocs.length}</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {typeDocs.map((doc) => {
                  const DocIcon = DOC_ICONS[doc.type] ?? FileTextIcon
                  return (
                    <div key={doc.id} className="flex items-start gap-2 rounded-lg border border-[#E5EEEA] bg-[#FBFDFC] p-2 sm:p-2.5">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#E8F0EE] sm:size-10">
                        <DocIcon className="size-4 text-[#1A5345] sm:size-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[10px] font-medium text-[#102F27] sm:text-[11px]">{doc.fileName}</p>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[9px] text-muted-foreground">
                          <span className={cn("rounded-full px-1.5 py-0.5", DOC_COLORS[doc.type] ?? DOC_COLORS.other)}>
                            {DOC_LABELS[doc.type] ?? doc.type}
                          </span>
                          <span>{doc.fileSize}</span>
                        </div>
                        <p className="mt-0.5 text-[9px] text-muted-foreground">{fmtShort(doc.uploadedAt)} &middot; {doc.uploadedBy}</p>
                      </div>
                      <Button size="sm" variant="ghost" className="h-7 w-7 shrink-0 p-0 text-[#6B7870] hover:text-[#1A5345]">
                        <DownloadIcon className="size-3.5" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[13px] font-semibold text-[#102F27] sm:text-[14px]">Upload Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-[10px] text-muted-foreground sm:text-[11px]">Document Type</Label>
                <Select value={uploadType} onValueChange={(v) => setUploadType(v as UploadedDocument["type"])}>
                  <SelectTrigger className="mt-1 h-8 text-[11px] sm:h-9 sm:text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ecg">ECG</SelectItem>
                    <SelectItem value="imaging">Imaging</SelectItem>
                    <SelectItem value="lab_report">Lab Report</SelectItem>
                    <SelectItem value="prescription">Prescription</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground sm:text-[11px]">File</Label>
                <div className="mt-1 flex items-center gap-2 rounded-lg border border-dashed border-[#E5EEEA] bg-[#FBFDFC] p-4 text-center">
                  <UploadIcon className="mx-auto size-6 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-[10px] text-muted-foreground sm:text-[11px]">Click to browse or drag & drop</p>
                    <p className="text-[9px] text-muted-foreground">PDF, JPG, PNG up to 10 MB</p>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground sm:text-[11px]">File Name</Label>
                <input
                  type="text"
                  value={uploadFileName}
                  onChange={(e) => setUploadFileName(e.target.value)}
                  placeholder="e.g. ECG_2026-04-17.pdf"
                  className="mt-1 w-full rounded-md border border-[#E5EEEA] bg-white px-3 py-1.5 text-[11px] outline-none focus:border-[#1A5345] focus:ring-1 focus:ring-[#1A5345]/20 sm:text-[12px]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setUploadDialog(false)} className="text-[10px] sm:text-[11px]">Cancel</Button>
                <Button size="sm" onClick={handleUpload} className="bg-[#1A5345] text-[10px] hover:bg-[#0F3D32] sm:text-[11px]" disabled={!uploadFileName}>
                  Upload
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}
