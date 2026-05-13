"use client";

import { useEffect, useState } from "react";
import { InfoIcon, Loader2Icon, StethoscopeIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { escalateMedicationSchema } from "./medicationDialogs.schema";
import type {
  DoctorEscalationPriority,
  PatientMedicationProfile,
} from "./assistantMedications.types";

const PATIENT_LEVEL_VALUE = "__patient__";

const DEFAULT_ASSISTANT_NOTE =
  "Please review this medication issue and advise the assistant follow-up plan.";

type EscalateMedicationDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  profile: PatientMedicationProfile | null;
  initialMedicationLineId?: string | null;
  suggestedReason?: string;
  onSubmit: (values: {
    medicationLineId: string | null;
    priority: DoctorEscalationPriority;
    reason: string;
    note: string;
  }) => Promise<void>;
  isPending: boolean;
};

export function EscalateMedicationDialog({
  open,
  onOpenChange,
  profile,
  initialMedicationLineId,
  suggestedReason,
  onSubmit,
  isPending,
}: EscalateMedicationDialogProps) {
  const [medicationValue, setMedicationValue] = useState(
    initialMedicationLineId ?? PATIENT_LEVEL_VALUE
  );
  const [priority, setPriority] = useState<DoctorEscalationPriority>("urgent");
  const [reason, setReason] = useState(suggestedReason ?? "");
  const [note, setNote] = useState(suggestedReason ? DEFAULT_ASSISTANT_NOTE : "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setMedicationValue(initialMedicationLineId ?? PATIENT_LEVEL_VALUE);
    setPriority("urgent");
    setReason(suggestedReason ?? "");
    setNote(suggestedReason ? DEFAULT_ASSISTANT_NOTE : "");
  }, [open, initialMedicationLineId, suggestedReason]);

  const handleSubmit = async () => {
    const parsed = escalateMedicationSchema.safeParse({
      medicationLineId: medicationValue === PATIENT_LEVEL_VALUE ? null : medicationValue,
      priority,
      reason,
      note,
    });
    if (!parsed.success) {
      const fields = parsed.error.flatten().fieldErrors;
      setError(fields.reason?.[0] ?? fields.note?.[0] ?? "Check escalation details");
      return;
    }
    setError(null);
    await onSubmit(parsed.data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl border-[#E8E6E0]/60 bg-white p-0 shadow-2xl sm:max-w-[480px]">
        <div className="border-b border-[#E8E6E0]/60 bg-[#F9F8F5] px-5 py-3.5 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#E8E6E0] bg-white text-[#1A5345] shadow-sm sm:size-10">
              <StethoscopeIcon className="size-[18px] sm:size-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <DialogTitle className="text-left text-[17px] font-bold font-serif leading-tight text-[#1A1F1E]">
                Escalate to doctor
              </DialogTitle>
              {profile ? (
                <DialogDescription className="text-left text-[12px] font-medium leading-snug text-muted-foreground sm:text-[13px]">
                  <span className="font-bold text-[#1A1F1E]">{profile.fullName}</span>
                  <span className="text-muted-foreground"> · </span>
                  Medication workflow review
                  {profile.phone ? (
                    <>
                      <span className="text-[#D4D1C9]" aria-hidden>
                        {" "}
                        ·{" "}
                      </span>
                      <span className="tabular-nums">{profile.phone}</span>
                    </>
                  ) : null}
                </DialogDescription>
              ) : (
                <DialogDescription className="text-left text-[12px] font-medium text-muted-foreground sm:text-[13px]">
                  Select a patient record to queue an escalation.
                </DialogDescription>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="escalate-medication" className="text-[12px] font-bold text-[#1A1F1E]">
                Medication
              </Label>
              <Select
                value={medicationValue}
                onValueChange={setMedicationValue}
                disabled={!profile}
              >
                <SelectTrigger
                  id="escalate-medication"
                  className="h-10 w-full min-w-0 rounded-xl border-[#E8E6E0] bg-white text-[13px] shadow-sm focus-visible:ring-[#1A5345]"
                >
                  <SelectValue placeholder="Choose scope" />
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  className="rounded-xl border-[#E8E6E0]/60 shadow-lg"
                >
                  <SelectItem value={PATIENT_LEVEL_VALUE}>Patient-level issue</SelectItem>
                  {profile?.medications.map((med) => (
                    <SelectItem key={med.id} value={med.id}>
                      {med.name} {med.strength}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="escalate-priority" className="text-[12px] font-bold text-[#1A1F1E]">
                Priority
              </Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as DoctorEscalationPriority)}
              >
                <SelectTrigger
                  id="escalate-priority"
                  className="h-10 w-full min-w-0 rounded-xl border-[#E8E6E0] bg-white text-[13px] shadow-sm focus-visible:ring-[#1A5345]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  className="rounded-xl border-[#E8E6E0]/60 shadow-lg"
                >
                  <SelectItem value="routine">Routine — review within routine cadence</SelectItem>
                  <SelectItem value="urgent">Urgent — needs attention soon</SelectItem>
                  <SelectItem value="critical">Critical — potential safety risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="escalate-reason" className="text-[12px] font-bold text-[#1A1F1E]">
              Reason for review
            </Label>
            <Textarea
              id="escalate-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="min-h-[88px] resize-none rounded-xl border-[#E8E6E0] bg-[#F9F8F5]/50 text-[13px] leading-relaxed shadow-sm focus-visible:bg-white focus-visible:ring-[#1A5345]"
              placeholder="What should the cardiologist review? Be specific (symptoms, adherence, labs, interactions…)."
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="escalate-note" className="text-[12px] font-bold text-[#1A1F1E]">
              Assistant note
            </Label>
            <Textarea
              id="escalate-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="min-h-[104px] resize-none rounded-xl border-[#E8E6E0] bg-[#F9F8F5]/50 text-[13px] leading-relaxed shadow-sm focus-visible:bg-white focus-visible:ring-[#1A5345]"
              placeholder="Context for the doctor: contact attempts, patient quotes, dates, or next steps you suggest."
            />
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-dashed border-[#E8E6E0] bg-[#F9F8F5]/50 px-2.5 py-2 text-[11px] leading-snug text-muted-foreground sm:text-[12px]">
            <InfoIcon className="mt-0.5 size-3.5 shrink-0 text-[#1A5345]/70 sm:size-4" aria-hidden />
            <p>
              Escalations are <span className="font-semibold text-[#1A1F1E]">review requests</span> only.
              Prescribing and med changes stay with the clinician — do not imply a dose change was made.
            </p>
          </div>

          {error ? (
            <p className="text-[12px] font-medium text-red-600 sm:text-[13px]" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex justify-end gap-2.5 border-t border-[#E8E6E0]/60 bg-[#F9F8F5]/50 px-5 py-3 sm:px-6">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl border-[#E8E6E0]/80 px-4 text-[13px] font-semibold text-[#1A1F1E] shadow-sm hover:bg-white"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="h-10 rounded-xl border-0 bg-[#1A5345] px-5 text-[13px] font-bold text-white shadow-[0_4px_14px_rgba(26,83,69,0.2)] transition-all hover:bg-[#133F34] hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none"
            onClick={() => void handleSubmit()}
            disabled={isPending || !profile}
          >
            {isPending ? (
              <>
                <Loader2Icon className="mr-2 size-4 animate-spin" aria-hidden />
                Queuing…
              </>
            ) : (
              "Queue escalation"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
