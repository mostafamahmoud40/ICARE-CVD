"use client"

import { type FormEvent, useEffect, useRef, useState } from "react"
import type { MriResult, MriDiagnosisClass } from "./CineMRISection"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { AlertCircleIcon, CheckIcon, Loader2Icon, SendHorizontalIcon, SparklesIcon, XIcon } from "lucide-react"

const CHAT_ROUTE = "/api/medical-analyzer/chat"

// ─── types ────────────────────────────────────────────────────────────────────

type MriChatMsg = { id: string; role: "user" | "assistant"; content: string }

type Recommendation = { id: string; text: string; accepted: boolean | null }

// ─── derive recommendations from clinical data (deterministic) ────────────────

function deriveRecommendations(result: MriResult): Recommendation[] {
  const { diagnosisClass, clinicalFeatures: f } = result
  const recs: string[] = []

  if (f.ef_lv < 35) {
    recs.push("Evaluate ICD implantation candidacy given severely reduced LVEF (< 35%).")
  } else if (f.ef_lv < 50) {
    recs.push("Initiate or optimise guideline-directed medical therapy (ACE-i / ARB + beta-blocker) for reduced EF.")
  }
  if (diagnosisClass === "DCM") {
    recs.push("Consider cardiac resynchronization therapy (CRT) evaluation if QRS ≥ 130 ms on ECG.")
    recs.push("Refer for heart failure specialist review and enrolment in a structured HF programme.")
  }
  if (diagnosisClass === "HCM") {
    recs.push("Arrange genetic counselling and first-degree family screening for HCM.")
    recs.push("Assess for LVOT obstruction with stress echo; consider myectomy / septal ablation if symptomatic.")
  }
  if (diagnosisClass === "MINF") {
    recs.push("Urgent coronary angiography to define extent of ischaemic disease and revascularisation options.")
    recs.push("Initiate dual antiplatelet therapy and high-intensity statin pending catheterisation findings.")
  }
  if (diagnosisClass === "RV") {
    recs.push("Right heart catheterisation to assess pulmonary pressures and exclude pulmonary hypertension.")
  }
  if (f.ef_rv < 40) {
    recs.push("Monitor RV function closely; consider referral if RV dysfunction progresses.")
  }
  if (recs.length === 0) {
    recs.push("Continue routine follow-up with repeat cardiac MRI in 12 months.")
  }

  return recs.map((text, i) => ({ id: `rec-${i}`, text, accepted: null }))
}

// ─── build MRI context object for the LLM ────────────────────────────────────

function buildContext(result: MriResult) {
  const { diagnosisClass, clinicalFeatures: f } = result
  return {
    type: "cardiac_mri",
    diagnosis_class: diagnosisClass,
    ef_lv_pct: f.ef_lv,
    ef_rv_pct: f.ef_rv,
    ed_vol_lv_ml: f.ed_vol_lv,
    es_vol_lv_ml: f.es_vol_lv,
    ed_vol_rv_ml: f.ed_vol_rv,
    es_vol_rv_ml: f.es_vol_rv,
    ed_mass_myo_g: f.ed_mass_myo,
    ed_lv_rv_ratio: f.ed_ratio_lv_rv,
  }
}

// ─── component ────────────────────────────────────────────────────────────────

export type CineMRIAiChatDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  result: MriResult | null
}

const DIAGNOSIS_LABEL: Record<MriDiagnosisClass, string> = {
  NOR: "Normal",
  HCM: "Hypertrophic Cardiomyopathy",
  DCM: "Dilated Cardiomyopathy",
  MINF: "Myocardial Infarction",
  RV: "Right Ventricular Disease",
}

export function CineMRIAiChatDialog({ open, onOpenChange, result }: CineMRIAiChatDialogProps) {
  const [messages, setMessages] = useState<MriChatMsg[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [summaryPhase, setSummaryPhase] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [draft, setDraft] = useState("")
  const [isReplying, setIsReplying] = useState(false)
  const [replyError, setReplyError] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Auto-generate summary in background; recommendations appear immediately (local)
  useEffect(() => {
    if (!open || !result || summaryPhase !== "idle") return

    setRecommendations(deriveRecommendations(result))
    setSummaryPhase("loading")

    const ctrl = new AbortController()
    abortRef.current = ctrl

    const timeoutId = setTimeout(() => ctrl.abort(), 15000)

    void (async () => {
      try {
        const res = await fetch(CHAT_ROUTE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: ctrl.signal,
          body: JSON.stringify({
            history: [
              {
                role: "user",
                content:
                  "Write a concise 2-3 sentence clinical summary of this cardiac MRI result for a cardiologist. Be direct with no preamble.",
              },
            ],
            context: buildContext(result),
          }),
        })
        const data = (await res.json()) as { success: boolean; reply?: string }
        if (!data.success || !data.reply) throw new Error("No reply")
        setMessages([{ id: "summary", role: "assistant", content: data.reply }])
        setSummaryPhase("done")
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          setMessages([{ id: "summary", role: "assistant", content: "Summary timed out. Recommendations are available below for your review." }])
        }
        setSummaryPhase("error")
      } finally {
        clearTimeout(timeoutId)
      }
    })()

    return () => {
      clearTimeout(timeoutId)
      ctrl.abort()
    }
  }, [open, result, summaryPhase])

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      abortRef.current?.abort()
      setSummaryPhase("idle")
      setMessages([])
      setDraft("")
      setReplyError(null)
      setRecommendations([])
    }
  }, [open])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (!open) return
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, open])

  const handleSend = async (e: FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text || isReplying || !result) return

    const userMsg: MriChatMsg = { id: crypto.randomUUID(), role: "user", content: text }
    setDraft("")
    setReplyError(null)
    setMessages((m) => [...m, userMsg])
    setIsReplying(true)

    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      const history = [...messages.filter((m) => m.id !== "summary"), userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }))
      const res = await fetch(CHAT_ROUTE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({ history, context: buildContext(result) }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as { success: boolean; reply?: string; error?: string }
      if (!data.success) throw new Error(data.error ?? "Request failed")
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", content: data.reply ?? "" },
      ])
    } catch (err) {
      if ((err as Error).name === "AbortError") return
      setReplyError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsReplying(false)
    }
  }

  const acceptRec = (id: string) =>
    setRecommendations((prev) => prev.map((r) => (r.id === id ? { ...r, accepted: true } : r)))
  const dismissRec = (id: string) =>
    setRecommendations((prev) => prev.map((r) => (r.id === id ? { ...r, accepted: false } : r)))

  const chatMessages = messages.filter((m) => m.id !== "summary")
  const summaryMsg = messages.find((m) => m.id === "summary")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(820px,93vh)] w-full max-w-2xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-[#E8E6E0] px-5 py-4 text-left">
          <DialogTitle className="flex items-center gap-2 text-[17px] text-[#102F27]">
            <SparklesIcon className="size-5 text-violet-500" />
            MRI AI Assistant
          </DialogTitle>
          <DialogDescription className="text-[13px]">
            {result
              ? `${DIAGNOSIS_LABEL[result.diagnosisClass]} · LVEF ${result.clinicalFeatures.ef_lv.toFixed(1)}% — Powered by Groq`
              : "No result loaded."}
          </DialogDescription>
        </DialogHeader>

        <div ref={listRef} className="scrollbar-hide flex-1 space-y-6 overflow-y-auto px-6 py-5">

          {/* ── Clinical Summary ──────────────────────────────────────── */}
          <div>
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-[#102F27]/50">
              Clinical Summary
            </p>
            {summaryPhase === "loading" && (
              <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                <Loader2Icon className="size-3.5 animate-spin" />
                Generating summary…
              </div>
            )}
            {summaryPhase === "error" && (
              <p className="text-[13px] text-red-500">
                Could not generate summary. Check the medical-analyzer service is running.
              </p>
            )}
            {summaryMsg && (
              <div
                className="rounded-xl border border-[#E5EEEA] bg-[#FAFAF8] px-4 py-3.5 text-[14px] leading-relaxed text-[#102F27]"
                dir="auto"
              >
                {summaryMsg.content}
              </div>
            )}
          </div>

          {/* ── Recommendations ───────────────────────────────────────── */}
          {recommendations.length > 0 && (
            <div>
              <p className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-[#102F27]/50">
                Recommendations
              </p>
              <div className="space-y-2">
                {recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-3.5 text-[13px] leading-relaxed transition-colors",
                      rec.accepted === true
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : rec.accepted === false
                          ? "border-[#E5EEEA] bg-[#F9F8F5] text-[#102F27]/35 line-through"
                          : "border-[#E5EEEA] bg-white text-[#102F27]",
                    )}
                  >
                    <span className="flex-1">{rec.text}</span>
                    {rec.accepted === null && (
                      <div className="flex shrink-0 gap-1">
                        <button
                          onClick={() => acceptRec(rec.id)}
                          className="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[14px] font-medium text-emerald-700 hover:bg-emerald-100"
                        >
                          <CheckIcon className="size-3.5" />
                          Accept
                        </button>
                        <button
                          onClick={() => dismissRec(rec.id)}
                          className="flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-[14px] font-medium text-red-600 hover:bg-red-100"
                        >
                          <XIcon className="size-3.5" />
                          Dismiss
                        </button>
                      </div>
                    )}
                    {rec.accepted === true && (
                      <CheckIcon className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Follow-up chat messages ───────────────────────────────── */}
          {chatMessages.length > 0 && (
            <div>
              <p className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-[#102F27]/50">
                Follow-up
              </p>
              <div className="space-y-2">
                {chatMessages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "max-w-[90%] rounded-xl px-4 py-3 text-[14px] leading-relaxed",
                      m.role === "user"
                        ? "ml-auto bg-[#1A5345] text-white"
                        : "mr-auto border border-[#E5EEEA] bg-[#FAFAF8] text-[#102F27]",
                    )}
                    dir="auto"
                  >
                    {m.content}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isReplying && (
            <div className="flex items-center gap-2 text-[14px] text-muted-foreground">
              <Loader2Icon className="size-3.5 animate-spin" />
              Thinking…
            </div>
          )}

          {replyError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-[14px] text-red-700">
              <AlertCircleIcon className="mt-0.5 size-3.5 shrink-0" />
              <span>{replyError}</span>
            </div>
          )}
        </div>

        {/* ── Chat input ────────────────────────────────────────────────── */}
        <form
          onSubmit={(e) => { void handleSend(e) }}
          className="flex gap-3 border-t border-[#E8E6E0] p-5"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask about this MRI result…"
            dir="auto"
            disabled={!result}
            className="flex-1 rounded-lg border border-[#E5EEEA] bg-white px-4 py-3 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            aria-label="Message to MRI AI assistant"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!draft.trim() || isReplying || !result}
            className="shrink-0 gap-1 bg-[#1A5345] hover:bg-[#0F3D32]"
          >
            <SendHorizontalIcon className="size-4" />
            Send
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
