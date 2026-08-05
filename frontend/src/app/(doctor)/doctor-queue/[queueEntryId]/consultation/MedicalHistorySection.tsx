"use client"

import { useMemo, useState } from "react"
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  HeartPulseIcon,
  PlusIcon,
  ShieldAlertIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Allergy, ConsultationMedicalHistory, ExistingCondition } from "./consultation.types"
import {
  CARDIAC_HISTORY_QUESTIONS,
  NON_CARDIAC_HISTORY_QUESTIONS,
} from "./medicalHistory.constants"

const SECTION_CARD = "rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm"
const FIELD_LABEL = "text-sm font-medium text-[#374151]"
const INPUT_CLASS =
  "h-10 rounded-xl border-gray-200 bg-white text-[14px] focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"

type TabId = "cardiac" | "non-cardiac" | "chronic" | "allergies"

function countPositives(
  questions: readonly (readonly [string, string, string])[],
  answers: Record<string, string>,
) {
  return questions.filter(([field]) => answers[field] === "Yes").length
}

function countChartFlags(
  questions: readonly (readonly [string, string, string])[],
  answers: Record<string, string>,
) {
  return questions.filter(([field]) => {
    const v = answers[field] ?? ""
    return v === "Yes" || v === "Not sure"
  }).length
}

/** Doctor workflow: toggle positives only; chart "Not sure" shows as amber until confirmed. */
function PastHistoryChipGrid({
  questions,
  answers,
  onAnswer,
}: {
  questions: readonly (readonly [string, string, string])[]
  answers: Record<string, string>
  onAnswer: (field: string, value: string) => void
}) {
  const [showAll, setShowAll] = useState(false)

  const flagged = questions.filter(([field]) => {
    const v = answers[field] ?? ""
    return v === "Yes" || v === "Not sure"
  })
  const visible = showAll ? questions : flagged.length > 0 ? flagged : questions.slice(0, 6)

  function toggle(field: string) {
    const current = answers[field] ?? ""
    const next = current === "Yes" ? "" : "Yes"
    onAnswer(field, next)
  }

  return (
    <div className="space-y-3">
      <p className="text-[12px] leading-relaxed text-[#6B7870]">
        Pre-filled from registration — tap only conditions to confirm or add. You do not need to answer every line.
      </p>

      <div className="flex flex-wrap gap-1.5">
        {visible.map(([field, title, subtitle]) => {
          const value = answers[field] ?? ""
          const positive = value === "Yes"
          const uncertain = value === "Not sure"
          return (
            <button
              key={field}
              type="button"
              title={subtitle}
              onClick={() => toggle(field)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                positive
                  ? "border-[#1A5345] bg-[#1A534518] text-[#1A5345]"
                  : uncertain
                    ? "border-amber-400 bg-amber-50 text-amber-800"
                    : "border-[#E8E6E0] bg-white text-[#6B7870] hover:border-[#A8C4BC] hover:bg-[#F9F8F5]",
              )}
            >
              {title}
              {uncertain ? <span className="ml-1 text-[10px] opacity-80">?</span> : null}
            </button>
          )
        })}
      </div>

      {!showAll && questions.length > visible.length ? (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="text-[12px] font-semibold text-[#1A5345] hover:underline"
        >
          Show all conditions ({questions.length})
        </button>
      ) : null}
      {showAll ? (
        <button
          type="button"
          onClick={() => setShowAll(false)}
          className="text-[12px] font-semibold text-[#6B7870] hover:underline"
        >
          Show chart highlights only
        </button>
      ) : null}
    </div>
  )
}

function PastHistoryReviewPanel({
  title,
  icon: Icon,
  noHistory,
  noHistoryLabel,
  noHistoryMessage,
  reviewed,
  notes,
  questions,
  answers,
  onNoHistoryToggle,
  onAnswer,
  onNotesChange,
  onConfirm,
}: {
  title: string
  icon: React.ElementType
  noHistory: boolean
  noHistoryLabel: string
  noHistoryMessage: string
  reviewed: boolean
  notes: string
  questions: readonly (readonly [string, string, string])[]
  answers: Record<string, string>
  onNoHistoryToggle: () => void
  onAnswer: (field: string, value: string) => void
  onNotesChange: (value: string) => void
  onConfirm: () => void
}) {
  const positives = countPositives(questions, answers)
  const flags = countChartFlags(questions, answers)

  return (
    <div role="tabpanel" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-[#1A5345]" aria-hidden />
          <p className="text-sm font-bold text-[#1A5345]">{title}</p>
        </div>
        <NoHistoryToggle active={noHistory} label={noHistoryLabel} onToggle={onNoHistoryToggle} />
      </div>

      {reviewed && !noHistory ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200/50 bg-emerald-50/60 px-3 py-2 text-emerald-800">
          <CheckCircle2Icon className="size-4 shrink-0" />
          <span className="text-[13px]">
            Chart reviewed
            {positives > 0 ? ` — ${positives} positive finding${positives === 1 ? "" : "s"}` : " — no positives flagged"}
          </span>
        </div>
      ) : null}

      {noHistory ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200/50 bg-emerald-50/60 p-3 text-emerald-800">
          <CheckCircle2Icon className="size-5 shrink-0" />
          <span className="text-sm">{noHistoryMessage}</span>
        </div>
      ) : (
        <>
          {flags === 0 && positives === 0 ? (
            <p className="rounded-xl border border-[#E8E6E0]/50 bg-[#F9F8F5]/50 px-3 py-2 text-[12px] text-[#6B7870]">
              Nothing flagged on chart — use &quot;No history&quot; or add conditions below.
            </p>
          ) : null}

          <PastHistoryChipGrid
            questions={questions}
            answers={answers}
            onAnswer={onAnswer}
          />

          <div className="space-y-1.5">
            <label className={FIELD_LABEL} htmlFor={`${title}-notes`}>
              Clinical notes <span className="font-normal text-[#9CA3AF]">(optional)</span>
            </label>
            <Textarea
              id={`${title}-notes`}
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="e.g. MI 2019, stent LAD; patient unsure about arrhythmia history…"
              rows={2}
              className="min-h-[72px] resize-y rounded-xl border-gray-200 bg-white text-[14px] focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
            />
          </div>

          <Button
            type="button"
            size="sm"
            variant={reviewed ? "outline" : "default"}
            onClick={onConfirm}
            className={cn(
              "h-8 gap-1.5 rounded-xl text-[12px]",
              reviewed
                ? "border-[#1A5345]/30 text-[#1A5345] hover:bg-[#1A534508]"
                : "bg-[#1A5345] hover:bg-[#154434]",
            )}
          >
            <CheckCircle2Icon className="size-3.5" />
            {reviewed ? "Re-confirm chart" : "Confirm chart reviewed"}
          </Button>
        </>
      )}
    </div>
  )
}

function NoHistoryToggle({
  active,
  label,
  onToggle,
}: {
  active: boolean
  label: string
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors",
        active
          ? "border-[#1A5345] bg-[#1A534518] text-[#1A5345]"
          : "border-[#E8E6E0] bg-white text-[#6B7870] hover:border-[#A8C4BC]",
      )}
    >
      {active ? <CheckCircle2Icon className="size-3.5" /> : null}
      {label}
    </button>
  )
}

export type MedicalHistorySectionProps = {
  medicalHistory: ConsultationMedicalHistory
  onMedicalHistoryChange: (next: ConsultationMedicalHistory) => void
  chronicConditions: ExistingCondition[]
  onChronicConditionsChange: (next: ExistingCondition[]) => void
  allergies: Allergy[]
  onAllergiesChange: (next: Allergy[]) => void
}

export function MedicalHistorySection({
  medicalHistory,
  onMedicalHistoryChange,
  chronicConditions,
  onChronicConditionsChange,
  allergies,
  onAllergiesChange,
}: MedicalHistorySectionProps) {
  const [tab, setTab] = useState<TabId>("cardiac")
  const [newCondition, setNewCondition] = useState({ name: "", details: "", diagnosedAt: "" })
  const [newAllergy, setNewAllergy] = useState<{
    category: Allergy["category"]
    allergen: string
    reaction: string
  }>({ category: "drug", allergen: "", reaction: "" })

  const tabs: { id: TabId; label: string }[] = [
    { id: "cardiac", label: "Cardiac" },
    { id: "non-cardiac", label: "Non-cardiac" },
    { id: "chronic", label: "Chronic" },
    { id: "allergies", label: "Allergies" },
  ]

  const cardiacPositives = countPositives(CARDIAC_HISTORY_QUESTIONS, medicalHistory.cardiacAnswers)
  const nonCardiacPositives = countPositives(
    NON_CARDIAC_HISTORY_QUESTIONS,
    medicalHistory.nonCardiacAnswers,
  )

  const tabBadge = useMemo(() => {
    if (tab === "cardiac") return medicalHistory.cardiacReviewed ? "✓" : String(cardiacPositives || "—")
    if (tab === "non-cardiac") return medicalHistory.nonCardiacReviewed ? "✓" : String(nonCardiacPositives || "—")
    if (tab === "chronic") return String(chronicConditions.length)
    return String(allergies.length)
  }, [
    tab,
    cardiacPositives,
    nonCardiacPositives,
    medicalHistory.cardiacReviewed,
    medicalHistory.nonCardiacReviewed,
    chronicConditions.length,
    allergies.length,
  ])

  function patchHistory(patch: Partial<ConsultationMedicalHistory>) {
    onMedicalHistoryChange({ ...medicalHistory, ...patch })
  }

  function setCardiacAnswer(field: string, value: string) {
    patchHistory({
      cardiacAnswers: { ...medicalHistory.cardiacAnswers, [field]: value },
      cardiacReviewed: false,
    })
  }

  function setNonCardiacAnswer(field: string, value: string) {
    patchHistory({
      nonCardiacAnswers: { ...medicalHistory.nonCardiacAnswers, [field]: value },
      nonCardiacReviewed: false,
    })
  }

  function addChronicCondition() {
    if (!newCondition.name.trim()) return
    onChronicConditionsChange([
      ...chronicConditions,
      {
        id: crypto.randomUUID(),
        name: newCondition.name.trim(),
        details: newCondition.details.trim(),
        diagnosedAt: newCondition.diagnosedAt || new Date().toISOString().slice(0, 10),
      },
    ])
    setNewCondition({ name: "", details: "", diagnosedAt: "" })
  }

  function addAllergy() {
    if (!newAllergy.allergen.trim()) return
    onAllergiesChange([
      ...allergies,
      {
        id: crypto.randomUUID(),
        category: newAllergy.category,
        allergen: newAllergy.allergen.trim(),
        reaction: newAllergy.reaction.trim() || "—",
      },
    ])
    setNewAllergy({ category: "drug", allergen: "", reaction: "" })
  }

  return (
    <div className={SECTION_CARD}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClipboardListIcon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
          <h3 className="font-serif text-[17px] font-bold tracking-tight text-[#1A1F1E]">Medical background</h3>
        </div>
        <span className="text-[11px] font-medium text-[#6B7870]">Confirm or update from patient chart</span>
      </div>

      <div className="mb-3 flex items-center justify-between gap-2 border-b border-[#E8E6E0]/60">
        <div className="flex items-center gap-0.5" role="tablist" aria-label="Medical background sections">
          {tabs.map((item) => {
            const active = tab === item.id
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(item.id)}
                className={cn(
                  "relative -mb-px inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold transition-colors",
                  active
                    ? "text-[#1A5345] after:absolute after:inset-x-1 after:bottom-0 after:h-0.5 after:rounded-full after:bg-[#1A5345]"
                    : "text-[#6B7870] hover:text-[#1A1F1E]",
                )}
              >
                {item.label}
                {active ? (
                  <span className="tabular-nums text-[10px] font-medium text-[#9CA3AF]">{tabBadge}</span>
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

      {tab === "cardiac" ? (
        <PastHistoryReviewPanel
          title="Past cardiac history"
          icon={HeartPulseIcon}
          noHistory={medicalHistory.noCardiacHistory}
          noHistoryLabel="No cardiac history"
          noHistoryMessage="No significant past cardiac history reported."
          reviewed={medicalHistory.cardiacReviewed}
          notes={medicalHistory.cardiacNotes}
          questions={CARDIAC_HISTORY_QUESTIONS}
          answers={medicalHistory.cardiacAnswers}
          onNoHistoryToggle={() =>
            patchHistory({
              noCardiacHistory: !medicalHistory.noCardiacHistory,
              cardiacReviewed: !medicalHistory.noCardiacHistory,
            })
          }
          onAnswer={setCardiacAnswer}
          onNotesChange={(value) => patchHistory({ cardiacNotes: value, cardiacReviewed: false })}
          onConfirm={() => patchHistory({ cardiacReviewed: true })}
        />
      ) : null}

      {tab === "non-cardiac" ? (
        <PastHistoryReviewPanel
          title="Past non-cardiac history"
          icon={ClipboardListIcon}
          noHistory={medicalHistory.noNonCardiacHistory}
          noHistoryLabel="No non-cardiac history"
          noHistoryMessage="No significant non-cardiac medical history reported."
          reviewed={medicalHistory.nonCardiacReviewed}
          notes={medicalHistory.nonCardiacNotes}
          questions={NON_CARDIAC_HISTORY_QUESTIONS}
          answers={medicalHistory.nonCardiacAnswers}
          onNoHistoryToggle={() =>
            patchHistory({
              noNonCardiacHistory: !medicalHistory.noNonCardiacHistory,
              nonCardiacReviewed: !medicalHistory.noNonCardiacHistory,
            })
          }
          onAnswer={setNonCardiacAnswer}
          onNotesChange={(value) => patchHistory({ nonCardiacNotes: value, nonCardiacReviewed: false })}
          onConfirm={() => patchHistory({ nonCardiacReviewed: true })}
        />
      ) : null}

      {tab === "chronic" ? (
        <div role="tabpanel" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-[#1A5345]">Active chronic conditions</p>
            <NoHistoryToggle
              active={medicalHistory.noChronicConditions}
              label="No chronic conditions"
              onToggle={() =>
                patchHistory({ noChronicConditions: !medicalHistory.noChronicConditions })
              }
            />
          </div>

          {medicalHistory.noChronicConditions ? (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200/50 bg-emerald-50/60 p-3 text-emerald-800">
              <CheckCircle2Icon className="size-5 shrink-0" />
              <span className="text-sm">No active chronic conditions documented.</span>
            </div>
          ) : (
            <>
              {chronicConditions.length > 0 ? (
                <div className="space-y-2">
                  {chronicConditions.map((condition) => (
                    <div
                      key={condition.id}
                      className="flex items-start justify-between gap-2 rounded-xl border border-[#E8E6E0]/50 bg-[#F9F8F5]/40 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[#1A1F1E]">{condition.name}</p>
                        {condition.details ? (
                          <p className="text-[12px] text-[#6B7870]">{condition.details}</p>
                        ) : null}
                        {condition.diagnosedAt ? (
                          <p className="text-[11px] text-[#9CA3AF]">Since {condition.diagnosedAt}</p>
                        ) : null}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 border-0 bg-transparent text-muted-foreground shadow-none hover:bg-transparent hover:text-red-600"
                        onClick={() =>
                          onChronicConditionsChange(
                            chronicConditions.filter((c) => c.id !== condition.id),
                          )
                        }
                        aria-label={`Remove ${condition.name}`}
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-[#6B7870]">No chronic conditions on file yet.</p>
              )}

              <div className="rounded-xl border border-dashed border-[#A8C4BC]/60 bg-[#F9F8F5] p-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#6B7870]">Add condition</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Input
                    value={newCondition.name}
                    onChange={(e) => setNewCondition((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Type 2 diabetes"
                    className={INPUT_CLASS}
                  />
                  <Input
                    value={newCondition.details}
                    onChange={(e) => setNewCondition((p) => ({ ...p, details: e.target.value }))}
                    placeholder="Details (optional)"
                    className={INPUT_CLASS}
                  />
                  <Input
                    type="date"
                    value={newCondition.diagnosedAt}
                    onChange={(e) => setNewCondition((p) => ({ ...p, diagnosedAt: e.target.value }))}
                    className={INPUT_CLASS}
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={addChronicCondition}
                  disabled={!newCondition.name.trim()}
                  className="mt-2 h-8 gap-1.5 rounded-xl bg-[#1A5345] text-[12px] hover:bg-[#154434]"
                >
                  <PlusIcon className="size-3.5" />
                  Add condition
                </Button>
              </div>
            </>
          )}
        </div>
      ) : null}

      {tab === "allergies" ? (
        <div role="tabpanel" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldAlertIcon className="size-4 text-red-600" aria-hidden />
              <p className="text-sm font-bold text-[#1A1F1E]">Allergies & contraindications</p>
            </div>
            <NoHistoryToggle
              active={medicalHistory.noKnownAllergies}
              label="No known allergies"
              onToggle={() => patchHistory({ noKnownAllergies: !medicalHistory.noKnownAllergies })}
            />
          </div>

          {medicalHistory.noKnownAllergies ? (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200/50 bg-emerald-50/60 p-3 text-emerald-800">
              <CheckCircle2Icon className="size-5 shrink-0" />
              <span className="text-sm">NKDA — no known drug or other allergies.</span>
            </div>
          ) : (
            <>
              {allergies.length > 0 ? (
                <div className="space-y-2">
                  {allergies.map((allergy) => (
                    <div
                      key={allergy.id}
                      className="flex items-start justify-between gap-2 rounded-xl border border-red-200/50 bg-red-50/40 px-3 py-2.5"
                    >
                      <div className="flex min-w-0 items-start gap-2">
                        <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden />
                        <div>
                          <p className="text-[13px] font-semibold text-red-800">
                            {allergy.allergen}
                            <span className="ml-1 text-[11px] font-medium text-red-600">({allergy.category})</span>
                          </p>
                          {allergy.reaction ? (
                            <p className="text-[12px] text-red-700">{allergy.reaction}</p>
                          ) : null}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 border-0 bg-transparent text-red-400 shadow-none hover:bg-transparent hover:text-red-700"
                        onClick={() =>
                          onAllergiesChange(allergies.filter((a) => a.id !== allergy.id))
                        }
                        aria-label={`Remove allergy ${allergy.allergen}`}
                      >
                        <XIcon className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-[#6B7870]">No allergies documented yet.</p>
              )}

              <div className="rounded-xl border border-dashed border-red-200/60 bg-red-50/20 p-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#6B7870]">Add allergy</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Select
                    value={newAllergy.category}
                    onValueChange={(v) =>
                      setNewAllergy((p) => ({ ...p, category: v as Allergy["category"] }))
                    }
                  >
                    <SelectTrigger className={INPUT_CLASS}>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="drug">Drug</SelectItem>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={newAllergy.allergen}
                    onChange={(e) => setNewAllergy((p) => ({ ...p, allergen: e.target.value }))}
                    placeholder="Allergen"
                    className={INPUT_CLASS}
                  />
                  <Input
                    value={newAllergy.reaction}
                    onChange={(e) => setNewAllergy((p) => ({ ...p, reaction: e.target.value }))}
                    placeholder="Reaction (optional)"
                    className={INPUT_CLASS}
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={addAllergy}
                  disabled={!newAllergy.allergen.trim()}
                  className="mt-2 h-8 gap-1.5 rounded-xl bg-[#1A5345] text-[12px] hover:bg-[#154434]"
                >
                  <PlusIcon className="size-3.5" />
                  Add allergy
                </Button>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
