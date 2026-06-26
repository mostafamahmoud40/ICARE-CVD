"use client"

import * as React from "react"
import {
  DownloadIcon,
  FileIcon,
  FileImageIcon,
  FileTextIcon,
  FilterIcon,
  MoreVerticalIcon,
  PlusIcon,
  SearchIcon,
  ShareIcon,
  Trash2Icon,
  EyeIcon,
  ClockIcon,
  FilesIcon,
  MicroscopeIcon,
  ImagesIcon,
  StethoscopeIcon,
  IdCardIcon,
  ListIcon,
  HistoryIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface PatientDocument {
  id: string
  name: string
  category: "lab" | "imaging" | "clinical" | "insurance"
  type: "pdf" | "jpg" | "png" | "doc"
  size: string
  uploadedAt: string
  uploadedBy: string
}

const DOCUMENT_CATEGORY_TABS = [
  { id: "all" as const, label: "All", icon: FilesIcon },
  { id: "lab" as const, label: "Lab", icon: MicroscopeIcon },
  { id: "imaging" as const, label: "Imaging", icon: ImagesIcon },
  { id: "clinical" as const, label: "Clinical", icon: StethoscopeIcon },
  { id: "insurance" as const, label: "Insurance", icon: IdCardIcon },
]

const DOCUMENT_CATEGORY_LABEL: Record<PatientDocument["category"], string> = {
  lab: "Lab",
  imaging: "Imaging",
  clinical: "Clinical",
  insurance: "Insurance",
}

function fileFormatLabel(type: PatientDocument["type"]): string {
  return type === "doc" ? "DOC" : type.toUpperCase()
}

function documentUsesImageIcon(type: PatientDocument["type"]): boolean {
  return type === "jpg" || type === "png"
}

/** Neutral category chip — readable, no per-category rainbow */
const documentCategoryChipClass =
  "inline-flex h-[22px] shrink-0 items-center rounded-md border border-[#E8E6E0] bg-white px-2 font-sans text-[11px] font-semibold leading-none tracking-tight text-[#1A1F1E] shadow-[0_1px_1px_rgba(0,0,0,0.04)]"

/** Color mapping for file extensions — no background, just bold text */
const getFileFormatColor = (type: PatientDocument["type"]) => {
  switch (type) {
    case "pdf": return "text-red-600"
    case "jpg": return "text-blue-600"
    case "png": return "text-emerald-600"
    case "doc": return "text-indigo-600"
    default: return "text-[#1A5345]"
  }
}

/** Neutral format chip — transparent background, colored text */
const documentFormatChipClass =
  "inline-flex h-[22px] shrink-0 items-center px-1 font-mono text-[10px] font-bold uppercase leading-none tracking-wider tabular-nums bg-transparent border-0 shadow-none"

export function Documents({
  documents = [],
  emptyMessage = "No documents uploaded for this patient yet.",
}: {
  documents?: PatientDocument[]
  emptyMessage?: string
}) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeCategory, setActiveCategory] = React.useState<string>("all")
  const [viewMode, setViewMode] = React.useState<"timeline" | "table">("timeline")

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === "all" || doc.category === activeCategory
    return matchesSearch && matchesCategory
  })

  // Group documents by month/year for timeline view
  const groupedDocs = filteredDocs.reduce((acc, doc) => {
    const date = new Date(doc.uploadedAt)
    const monthYear = date.toLocaleString("en-US", { month: "long", year: "numeric" })
    if (!acc[monthYear]) acc[monthYear] = []
    acc[monthYear].push(doc)
    return acc
  }, {} as Record<string, PatientDocument[]>)

  return (
    <div className="w-full px-4 sm:px-8 py-8 flex flex-col gap-8 animate-in fade-in duration-700">
      {/* Integrated Header & Toolbar */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-[24px] font-bold text-[#1A1F1E] tracking-tight font-serif">Medical Documents</h2>
            <p className="text-[14px] font-medium text-muted-foreground">Digital repository for reports, scans, and clinical records.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-[240px]">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input 
                placeholder="Search documents..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 rounded-lg border-[#E8E6E0] bg-white focus-visible:ring-[#1A5345] shadow-sm text-[12px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="h-8 rounded-lg border-[#E8E6E0] bg-white px-4 text-[12px] font-bold text-[#1A1F1E] hover:bg-[#F9F8F5] shadow-sm transition-all">
                <DownloadIcon className="mr-2 size-3.5 text-muted-foreground" strokeWidth={2.5} />
                Download All
              </Button>
              <Button className="h-8 rounded-lg bg-[#1A5345] px-5 text-[12px] font-bold text-white hover:bg-[#133F34] shadow-sm border-0 transition-all">
                <PlusIcon className="mr-2 size-3.5" strokeWidth={2.5} />
                Upload New
              </Button>
            </div>
          </div>
        </div>

        {/* Categories Bar & View Switcher — same tab affordance as PatientProfilePage */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 border-b border-[#E8E6E0] overflow-x-auto custom-scrollbar pb-px">
              {DOCUMENT_CATEGORY_TABS.map((tab) => {
                const Icon = tab.icon
                const isActive = activeCategory === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveCategory(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap text-[14px] font-bold outline-none",
                      isActive
                        ? "border-[#1A5345] text-[#1A5345]"
                        : "border-transparent text-muted-foreground hover:text-[#1A1F1E] hover:bg-slate-50 rounded-t-lg"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-4 pb-1 sm:pb-0">
             <div className="hidden md:flex items-center gap-1.5 text-[12px] font-bold text-muted-foreground bg-[#F9F8F5] px-2 py-1 rounded-xl border border-[#E8E6E0]/40">
                <FilterIcon className="size-3.5" />
                {filteredDocs.length} docs
             </div>
             <div className="flex items-center bg-[#F9F8F5] p-1 rounded-xl border border-[#E8E6E0]/60">
                <button 
                  onClick={() => setViewMode("timeline")}
                  className={cn(
                    "p-1.5 rounded-lg transition-all",
                    viewMode === "timeline" ? "bg-white text-[#1A5345] shadow-sm" : "text-muted-foreground hover:text-[#1A1F1E]"
                  )}
                  title="Timeline View"
                >
                  <HistoryIcon className="size-4" />
                </button>
                <button 
                  onClick={() => setViewMode("table")}
                  className={cn(
                    "p-1.5 rounded-lg transition-all",
                    viewMode === "table" ? "bg-white text-[#1A5345] shadow-sm" : "text-muted-foreground hover:text-[#1A1F1E]"
                  )}
                  title="Table View"
                >
                  <ListIcon className="size-4" />
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="min-h-[400px]">
        {filteredDocs.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-[#E8E6E0]">
            <div className="size-16 rounded-full bg-[#F9F8F5] flex items-center justify-center mb-4">
              <FileIcon className="size-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-[16px] font-bold text-[#1A1F1E]">No documents found</h3>
            <p className="text-[14px] font-medium text-muted-foreground mt-1">
              {documents.length === 0 ? emptyMessage : "Try adjusting your search or category filter."}
            </p>
          </div>
        ) : viewMode === "timeline" ? (
          /* Timeline View */
          <div className="relative pl-6 sm:pl-8 space-y-12">
            {/* Vertical Timeline Line */}
            <div className="absolute left-[11px] sm:left-[15px] top-2 bottom-0 w-0.5 bg-gradient-to-b from-[#1A5345]/20 via-[#E8E6E0] to-transparent" />

            {Object.entries(groupedDocs).map(([monthYear, docs]) => (
              <div key={monthYear} className="relative space-y-6">
                {/* Month Header */}
                <div className="flex items-center gap-4 -ml-[23px] sm:-ml-[27px]">
                  <div className="size-6 rounded-full bg-white border-4 border-[#1A5345] z-10 shadow-sm" />
                  <div className="px-4 py-1.5 rounded-xl bg-white border border-[#E8E6E0] shadow-sm">
                    <h3 className="text-[14px] font-bold text-[#1A5345] tracking-tight">{monthYear}</h3>
                  </div>
                </div>

                {/* Documents Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {docs.map((doc) => (
                    <div 
                      key={doc.id} 
                      className="group relative bg-white rounded-2xl border border-[#E8E6E0]/80 p-3.5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.02)] hover:shadow-lg hover:border-[#1A5345]/30 transition-all flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className="flex size-12 shrink-0 items-center justify-center transition-colors"
                        >
                          {documentUsesImageIcon(doc.type) ? (
                            <FileImageIcon className="size-6 text-[#1A5345]" strokeWidth={2.5} aria-hidden />
                          ) : (
                            <FileTextIcon className="size-6 text-[#1A5345]" strokeWidth={2.5} aria-hidden />
                          )}
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity translate-y-1 group-hover:translate-y-0 duration-200">
                          <Button variant="ghost" size="icon" className="size-8 rounded-lg text-[#1A5345] hover:bg-[#1A5345]/5">
                            <EyeIcon className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-lg text-[#1A5345]/85 hover:bg-[#E8F0EE] hover:text-[#1A5345]"
                          >
                            <DownloadIcon className="size-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8 rounded-lg text-muted-foreground">
                                <MoreVerticalIcon className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl border-[#E8E6E0]/60 shadow-lg p-1.5 w-48">
                              <DropdownMenuItem className="gap-2.5 text-[12px] font-medium rounded-lg cursor-pointer">
                                <ShareIcon className="size-3.5 text-amber-600" />
                                Share with Doctor
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-[#E8E6E0]/60 my-1" />
                              <DropdownMenuItem className="gap-2.5 text-[12px] font-semibold text-red-600 rounded-lg cursor-pointer focus:bg-red-50">
                                <Trash2Icon className="size-3.5" />
                                Archive
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-[14px] font-bold text-[#1A1F1E] group-hover:text-[#1A5345] transition-colors truncate">{doc.name}</h4>
                        <div
                          className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[11px] font-medium text-muted-foreground"
                          role="group"
                          aria-label="Document details"
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className={cn(documentCategoryChipClass, "normal-case")}
                            >
                              {DOCUMENT_CATEGORY_LABEL[doc.category]}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={cn(documentFormatChipClass, getFileFormatColor(doc.type))}
                              title="File format"
                            >
                              {fileFormatLabel(doc.type)}
                            </Badge>
                          </span>
                          <span
                            className="hidden h-3 w-px shrink-0 bg-[#E0DDD6] sm:block"
                            aria-hidden
                          />
                          <span className="flex min-w-0 items-center gap-1 tabular-nums">
                            <ClockIcon className="size-3 shrink-0 opacity-80" aria-hidden />
                            {doc.uploadedAt.split(",")[0]}
                          </span>
                          <span className="text-[#D4D1C9]" aria-hidden>
                            ·
                          </span>
                          <span className="tabular-nums">{doc.size}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#E8E6E0]/40 mt-1 flex items-center justify-between">
                         <span className="text-[10px] font-bold text-muted-foreground">Added by</span>
                         <span className="text-[11px] font-bold text-[#1A5345]">{doc.uploadedBy.split(' ').pop()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="w-full bg-white rounded-3xl border border-[#E8E6E0]/80 shadow-sm overflow-hidden animate-in slide-in-from-bottom-2 duration-500">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-[#F9F8F5] border-b border-[#E8E6E0]/60">
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground">Document name</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground">Category</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground">Date uploaded</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground">Size</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E6E0]/40">
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} className="group hover:bg-[#F9F8F5]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex size-11 shrink-0 items-center justify-center transition-colors"
                          >
                            {documentUsesImageIcon(doc.type) ? (
                              <FileImageIcon className="size-5.5 text-[#1A5345]" strokeWidth={2.5} aria-hidden />
                            ) : (
                              <FileTextIcon className="size-5.5 text-[#1A5345]" strokeWidth={2.5} aria-hidden />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[14px] font-bold text-[#1A1F1E] group-hover:text-[#1A5345] transition-colors truncate">{doc.name}</p>
                            <p className="text-[11px] font-medium text-muted-foreground">Uploaded by {doc.uploadedBy}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className={cn(documentCategoryChipClass, "normal-case")}
                          >
                            {DOCUMENT_CATEGORY_LABEL[doc.category]}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn(documentFormatChipClass, getFileFormatColor(doc.type))}
                            title="File format"
                          >
                            {fileFormatLabel(doc.type)}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[13px] font-bold text-[#1A1F1E]">{doc.uploadedAt}</td>
                      <td className="px-6 py-4 text-[13px] font-medium text-muted-foreground">{doc.size}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="size-8 rounded-lg text-[#1A5345] hover:bg-[#1A5345]/5">
                            <EyeIcon className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-lg text-[#1A5345]/85 hover:bg-[#E8F0EE] hover:text-[#1A5345]"
                          >
                            <DownloadIcon className="size-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8 rounded-lg text-muted-foreground">
                                <MoreVerticalIcon className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl border-[#E8E6E0]/60 shadow-lg p-1.5 w-48">
                               <DropdownMenuItem className="gap-2.5 text-[12px] font-medium rounded-lg cursor-pointer">
                                  <ShareIcon className="size-3.5 text-amber-600" />
                                  Share
                               </DropdownMenuItem>
                               <DropdownMenuSeparator className="bg-[#E8E6E0]/60 my-1" />
                               <DropdownMenuItem className="gap-2.5 text-[12px] font-semibold text-red-600 rounded-lg cursor-pointer focus:bg-red-50">
                                  <Trash2Icon className="size-3.5" />
                                  Archive
                               </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
