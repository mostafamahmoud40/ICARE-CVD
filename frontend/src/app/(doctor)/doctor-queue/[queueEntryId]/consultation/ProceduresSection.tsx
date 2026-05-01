"use client"

import { useCallback, useState } from "react"
import type { ProcedureEntry } from "./consultation.types"
import { useSpeechDictation } from "./useSpeechDictation"
import { cn } from "@/lib/utils"
import { MicIcon, PlusIcon, SyringeIcon, Trash2Icon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const URGENCY_OPTIONS = [
  { value: "elective", label: "Elective" },
  { value: "urgent", label: "Urgent" },
  { value: "stat", label: "STAT" },
] as const

/** Cardiology procedures — value is stable id; label is stored on the chart entry. */
const CARDIAC_PROCEDURES = [
  { value: "coronary_angiography", label: "Coronary angiography (diagnostic cath)", cpt: "93458" },
  { value: "pci", label: "PCI — percutaneous coronary intervention", cpt: "92928" },
  { value: "ffr_ifr", label: "FFR / iFR physiologic assessment", cpt: "92925" },
  { value: "ivus_oct", label: "Intravascular imaging (IVUS / OCT)", cpt: "92978" },
  { value: "cabg", label: "CABG — coronary artery bypass graft", cpt: "33533" },
  { value: "tavr", label: "TAVR — transcatheter aortic valve replacement", cpt: "33361" },
  { value: "savr", label: "SAVR — surgical aortic valve replacement", cpt: "33405" },
  { value: "mitral_valve", label: "Mitral valve repair / replacement", cpt: "33418" },
  { value: "tricuspid_valve", label: "Tricuspid valve intervention", cpt: "33430" },
  { value: "icd", label: "ICD implantation", cpt: "33249" },
  { value: "pacemaker", label: "Pacemaker implantation", cpt: "33208" },
  { value: "crt", label: "CRT — cardiac resynchronization therapy", cpt: "33224" },
  { value: "ep_ablation", label: "EP study / catheter ablation (AF, SVT, VT)", cpt: "93650" },
  { value: "cardioversion", label: "Electrical cardioversion", cpt: "92960" },
  { value: "tee", label: "TEE — transesophageal echocardiography", cpt: "93312" },
  { value: "cardiac_mri", label: "Cardiac MRI (stress or viability)", cpt: "75561" },
  { value: "stress_test", label: "Exercise or pharmacologic stress test", cpt: "93015" },
  { value: "myocardial_biopsy", label: "Myocardial biopsy", cpt: "93505" },
  { value: "balloon_valvuloplasty", label: "Balloon valvuloplasty", cpt: "92990" },
  { value: "laac", label: "LAAC / LAA occlusion (e.g. Watchman)", cpt: "33340" },
  { value: "other", label: "Other procedure…", cpt: "" },
] as const

const CARDIAC_BODY_SITES = [
  { value: "unspecified", label: "Not specified" },
  { value: "lad", label: "LAD" },
  { value: "lcx", label: "LCx" },
  { value: "rca", label: "RCA" },
  { value: "lmca", label: "Left main (LMCA)" },
  { value: "multivessel", label: "Multivessel" },
  { value: "aortic_valve", label: "Aortic valve" },
  { value: "mitral_valve", label: "Mitral valve" },
  { value: "tricuspid_valve", label: "Tricuspid valve" },
  { value: "pulmonary_valve", label: "Pulmonary valve" },
  { value: "lv", label: "Left ventricle (LV)" },
  { value: "rv", label: "Right ventricle (RV)" },
  { value: "la", label: "Left atrium (LA)" },
  { value: "ra", label: "Right atrium (RA)" },
  { value: "coronary_sinus", label: "Coronary sinus" },
  { value: "pericardium", label: "Pericardium" },
  { value: "other_site", label: "Other site…" },
] as const

const urgencyStyles: Record<ProcedureEntry["urgency"], string> = {
  elective: "bg-[#E8F0EE] text-[#1A5345]",
  urgent: "bg-amber-50 text-amber-700",
  stat: "bg-red-50 text-red-700",
}

function ProcedureCard({
  procedure,
  onRemove,
}: {
  procedure: ProcedureEntry
  onRemove: (id: string) => void
}) {
  return (
    <div className="rounded-lg border-2 border-[#E5EEEA] bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize",
                urgencyStyles[procedure.urgency],
              )}
            >
              {procedure.urgency}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-semibold text-[#102F27]">{procedure.name}</span>
            {procedure.cptCode.trim() ? (
              <span className="rounded bg-[#F5F5F3] px-1 py-0.5 text-[10px] font-mono text-[#6B7870]">
                CPT {procedure.cptCode}
              </span>
            ) : null}
          </div>
          {procedure.bodySite.trim() ? (
            <p className="mt-1 text-[11px] text-muted-foreground">Cardiac site: {procedure.bodySite}</p>
          ) : null}
          {procedure.scheduledDate.trim() ? (
            <p className="mt-0.5 text-[11px] text-muted-foreground">Scheduled: {procedure.scheduledDate}</p>
          ) : null}
          {procedure.notes.trim() ? (
            <p className="mt-1 text-[11px] text-muted-foreground">{procedure.notes}</p>
          ) : null}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 shrink-0 p-0 text-[#6B7870] hover:bg-red-50 hover:text-red-500"
          onClick={() => onRemove(procedure.id)}
        >
          <Trash2Icon className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

function AddProcedureForm({ onAdd }: { onAdd: (entry: ProcedureEntry) => void }) {
  const [procedureKey, setProcedureKey] = useState("")
  const [customProcedureName, setCustomProcedureName] = useState("")
  const [bodySiteKey, setBodySiteKey] = useState("unspecified")
  const [customBodySite, setCustomBodySite] = useState("")
  const [cptCode, setCptCode] = useState("")
  const [urgency, setUrgency] = useState<ProcedureEntry["urgency"]>("elective")
  const [scheduledDate, setScheduledDate] = useState("")
  const [notes, setNotes] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const getNotesText = useCallback(() => notes, [notes])
  const setNotesText = useCallback((_key: "procedureNotes", value: string) => setNotes(value), [])

  const {
    supported: notesDictationSupported,
    activeKey: notesDictationKey,
    interimText: notesInterimText,
    audioLevel: notesAudioLevel,
    elapsedSeconds: notesElapsedSeconds,
    toggle: toggleNotesDictation,
  } = useSpeechDictation({
    getText: getNotesText,
    setText: setNotesText,
  })

  const formatNotesElapsed = useCallback((totalSeconds: number) => {
    const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0")
    const ss = String(totalSeconds % 60).padStart(2, "0")
    return `${mm}:${ss}`
  }, [])

  const notesListening = notesDictationKey === "procedureNotes"

  const resetFields = () => {
    setProcedureKey("")
    setCustomProcedureName("")
    setBodySiteKey("unspecified")
    setCustomBodySite("")
    setCptCode("")
    setUrgency("elective")
    setScheduledDate("")
    setNotes("")
  }

  const handleProcedureSelect = (v: string) => {
    setProcedureKey(v)
    if (v === "other") return
    const meta = CARDIAC_PROCEDURES.find((p) => p.value === v)
    setCptCode(meta?.cpt ?? "")
  }

  const resolvedProcedureName =
    procedureKey === "other"
      ? customProcedureName.trim()
      : procedureKey !== ""
        ? (CARDIAC_PROCEDURES.find((p) => p.value === procedureKey)?.label ?? "").trim()
        : ""

  const resolvedBodySite =
    bodySiteKey === "other_site"
      ? customBodySite.trim()
      : bodySiteKey === "unspecified"
        ? ""
        : (CARDIAC_BODY_SITES.find((b) => b.value === bodySiteKey)?.label ?? "").trim()

  const canSubmit =
    procedureKey === "other" ? customProcedureName.trim().length > 0 : procedureKey !== ""

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-[#E5EEEA] py-2.5 text-[12px] font-medium text-[#6B7870] transition-colors hover:border-[#1A5345]/30 hover:bg-[#F6FBF9] hover:text-[#1A5345]"
      >
        <PlusIcon className="size-3.5" />
        Add cardiac procedure
      </button>
    )
  }

  const handleSubmit = () => {
    if (!resolvedProcedureName) return
    onAdd({
      id: crypto.randomUUID(),
      name: resolvedProcedureName,
      cptCode: cptCode.trim(),
      bodySite: resolvedBodySite,
      urgency,
      scheduledDate: scheduledDate.trim(),
      notes: notes.trim(),
    })
    resetFields()
    setIsOpen(false)
  }

  return (
    <div className="space-y-3 rounded-lg border-2 border-[#1A5345]/20 bg-[#F6FBF9] p-3">
      <div className="flex items-center justify-between">
          <div>
            <span className="text-[12px] font-semibold text-[#1A5345]">New cardiac procedure</span>
            <p className="text-[10px] text-muted-foreground">Choose from the list (like chief complaint) or Other to type a custom procedure.</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => {
              resetFields()
              setIsOpen(false)
            }}
          >
            <XIcon className="size-3.5" />
          </Button>
      </div>
      <div className="space-y-1">
        <label className="text-[11px] font-medium text-muted-foreground">Cardiac procedure *</label>
        <Select value={procedureKey === "" ? undefined : procedureKey} onValueChange={handleProcedureSelect}>
          <SelectTrigger className="h-9 w-full rounded-lg border-[#cfd9d5] bg-white text-[13px] text-[#152a24] hover:border-[#d9e5e1] hover:text-[#1a5345] focus:border-[#d9e5e1] focus:ring-0">
            <SelectValue placeholder="Select cardiac procedure…" />
          </SelectTrigger>
          <SelectContent className="rounded-lg border-[#cfd9d5] bg-white">
            {CARDIAC_PROCEDURES.map((p) => (
              <SelectItem
                key={p.value}
                value={p.value}
                className="h-10 cursor-pointer text-[13px] text-[#152a24] hover:bg-[#d9e5e1] hover:text-[#1a5345]"
              >
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {procedureKey === "other" ? (
          <Input
            value={customProcedureName}
            onChange={(e) => setCustomProcedureName(e.target.value)}
            placeholder="Type procedure name…"
            className="h-8 border-[#E8E6E0] bg-white text-[12px]"
          />
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground">CPT code</label>
          <Input
            value={cptCode}
            onChange={(e) => setCptCode(e.target.value)}
            placeholder="e.g. 92928 (PCI)"
            className="h-8 border-[#E8E6E0] bg-white text-[12px] font-mono"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground">Urgency</label>
          <Select value={urgency} onValueChange={(v) => setUrgency(v as ProcedureEntry["urgency"])}>
            <SelectTrigger className="h-8 w-full rounded-lg border-[#cfd9d5] bg-white text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-[#cfd9d5] bg-white">
              {URGENCY_OPTIONS.map((u) => (
                <SelectItem key={u.value} value={u.value} className="text-[12px]">
                  {u.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">Cardiac / vascular site</label>
          <Select value={bodySiteKey} onValueChange={setBodySiteKey}>
            <SelectTrigger className="h-9 w-full rounded-lg border-[#cfd9d5] bg-white text-[13px] text-[#152a24] hover:border-[#d9e5e1] hover:text-[#1a5345] focus:border-[#d9e5e1] focus:ring-0">
              <SelectValue placeholder="Site (optional)" />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-[#cfd9d5] bg-white">
              {CARDIAC_BODY_SITES.map((s) => (
                <SelectItem
                  key={s.value}
                  value={s.value}
                  className="h-10 cursor-pointer text-[13px] text-[#152a24] hover:bg-[#d9e5e1] hover:text-[#1a5345]"
                >
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {bodySiteKey === "other_site" ? (
            <Input
              value={customBodySite}
              onChange={(e) => setCustomBodySite(e.target.value)}
              placeholder="Type site…"
              className="h-8 border-[#E8E6E0] bg-white text-[12px]"
            />
          ) : null}
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground">Scheduled date</label>
          <Input
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="h-8 border-[#E8E6E0] bg-white text-[12px]"
          />
        </div>
      </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <label className="text-[10px] font-medium text-muted-foreground" htmlFor="procedure-notes">
              Notes
            </label>
            {notesDictationSupported ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    id="procedure-notes-mic"
                    variant={notesListening ? "secondary" : "ghost"}
                    size="icon-xs"
                    className={
                      notesListening
                        ? "shrink-0 text-[#B42318] ring-2 ring-[#B42318]/25"
                        : "shrink-0 text-[#2C6A5B]"
                    }
                    aria-pressed={notesListening}
                    aria-label={notesListening ? "Stop voice dictation" : "Start voice dictation"}
                    onClick={() => toggleNotesDictation("procedureNotes")}
                  >
                    <MicIcon className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[220px] text-center">
                  {notesListening ? "Stop dictation" : "Voice dictation"}
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
          <Textarea
            id="procedure-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="CAD class, LVEF, anticoagulation, contrast allergy, informed consent…"
            className="min-h-[40px] resize-none border-[#E8E6E0] bg-white text-[12px] placeholder:text-[#9CA3AF]"
            aria-describedby={notesListening && notesInterimText ? "procedure-notes-interim" : undefined}
          />
          {notesListening ? (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-[#B42318]">{formatNotesElapsed(notesElapsedSeconds)}</span>
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#EEF5F3]">
                <div
                  className="h-full rounded-full bg-[#1A5345] transition-all duration-150"
                  style={{ width: `${Math.max(6, notesAudioLevel)}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">Voice level</span>
            </div>
          ) : null}
          {notesListening && notesInterimText ? (
            <p id="procedure-notes-interim" className="text-[11px] leading-snug text-[#6B7280]">
              {notesInterimText}
            </p>
          ) : null}
        </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 text-[11px]"
          onClick={() => {
            resetFields()
            setIsOpen(false)
          }}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          className="flex-1 bg-[#1A5345] text-[11px] hover:bg-[#0F3D32]"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          Add cardiac procedure
        </Button>
      </div>
    </div>
  )
}

export type ProceduresSectionProps = {
  procedures: ProcedureEntry[]
  onAddProcedure: (entry: ProcedureEntry) => void
  onRemoveProcedure: (id: string) => void
}

export function ProceduresSection({ procedures, onAddProcedure, onRemoveProcedure }: ProceduresSectionProps) {
  return (
    <div className="rounded-xl border-2 border-[#E5EEEA] bg-white p-3 sm:p-5">
      <div className="mb-4 flex items-start gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-[#E8F0EE]">
          <SyringeIcon className="size-4 text-[#1A5345]" />
        </div>
        <div>
          <h3 className="text-[12px] font-semibold text-[#102F27] sm:text-[14px]">Cardiac procedures</h3>
          <p className="text-[10px] text-muted-foreground sm:text-[11px]">Planned or ordered cardiology interventions for this patient.</p>
        </div>
        {procedures.length > 0 ? (
          <span className="rounded-full bg-[#EEF5F3] px-2 py-0.5 text-[9px] font-medium text-[#2C6A5B] sm:text-[10px]">
            {procedures.length}
          </span>
        ) : null}
      </div>
      <div className="space-y-2">
        {procedures.map((p) => (
          <ProcedureCard key={p.id} procedure={p} onRemove={onRemoveProcedure} />
        ))}
        <AddProcedureForm onAdd={onAddProcedure} />
      </div>
    </div>
  )
}
