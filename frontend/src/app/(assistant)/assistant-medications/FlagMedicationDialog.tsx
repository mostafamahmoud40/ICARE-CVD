"use client";

import { useEffect, useState } from "react";
import { FlagIcon, InfoIcon, Loader2Icon } from "lucide-react";

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
import { flagMedicationSchema } from "./medicationDialogs.schema";
import type { MedicationFlagSeverity } from "./assistantMedications.types";

type FlagMedicationDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  medicationLabel: string;
  patientLabel: string;
  onSubmit: (values: { severity: MedicationFlagSeverity; reason: string }) => Promise<void>;
  isPending: boolean;
};

export function FlagMedicationDialog({
  open,
  onOpenChange,
  medicationLabel,
  patientLabel,
  onSubmit,
  isPending,
}: FlagMedicationDialogProps) {
  const [severity, setSeverity] = useState<MedicationFlagSeverity>("watch");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSeverity("watch");
    setReason("");
  }, [open, medicationLabel, patientLabel]);

  const handleSave = async () => {
    const parsed = flagMedicationSchema.safeParse({ severity, reason });
    if (!parsed.success) {
      setError(parsed.error.flatten().fieldErrors.reason?.[0] ?? "Check inputs");
      return;
    }
    setError(null);
    await onSubmit(parsed.data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl border-[#E8E6E0]/60 bg-white p-0 shadow-2xl sm:max-w-[440px]">
        <div className="border-b border-[#E8E6E0]/60 bg-[#F9F8F5] px-5 py-3.5 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#E8E6E0] bg-white text-[#1A5345] shadow-sm sm:size-10">
              <FlagIcon className="size-[18px] sm:size-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <DialogTitle className="text-left text-[17px] font-bold font-serif leading-tight text-[#1A1F1E]">
                Flag medication
              </DialogTitle>
              <DialogDescription className="text-left text-[12px] font-medium leading-snug text-muted-foreground sm:text-[13px]">
                {patientLabel ? (
                  <>
                    <span className="font-bold text-[#1A1F1E]">{patientLabel}</span>
                    <span className="text-muted-foreground"> · </span>
                    <span>{medicationLabel}</span>
                  </>
                ) : (
                  medicationLabel
                )}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="flag-severity" className="text-[12px] font-bold text-[#1A1F1E]">
              Severity
            </Label>
            <Select value={severity} onValueChange={(v) => setSeverity(v as MedicationFlagSeverity)}>
              <SelectTrigger
                id="flag-severity"
                className="h-10 w-full min-w-0 rounded-xl border-[#E8E6E0] bg-white text-[13px] shadow-sm focus-visible:ring-[#1A5345]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                alignItemWithTrigger={false}
                className="rounded-xl border-[#E8E6E0]/60 shadow-lg"
              >
                <SelectItem value="info">Info — chart awareness only</SelectItem>
                <SelectItem value="watch">Watch — follow-up recommended</SelectItem>
                <SelectItem value="critical">Critical — safety concern / escalate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="flag-reason" className="text-[12px] font-bold text-[#1A1F1E]">
              Reason
            </Label>
            <Textarea
              id="flag-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why flag this line? Include what you observed, dates, patient report, or risk you are worried about."
              rows={4}
              className="min-h-[104px] resize-none rounded-xl border-[#E8E6E0] bg-[#F9F8F5]/50 text-[13px] leading-relaxed shadow-sm focus-visible:bg-white focus-visible:ring-[#1A5345]"
            />
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-dashed border-[#E8E6E0] bg-[#F9F8F5]/50 px-2.5 py-2 text-[11px] leading-snug text-muted-foreground sm:text-[12px]">
            <InfoIcon className="mt-0.5 size-3.5 shrink-0 text-[#1A5345]/70 sm:size-4" aria-hidden />
            <p>
              Flags help the team triage. <span className="font-semibold text-[#1A1F1E]">Critical</span> should be
              reserved for likely harm or urgent clinical review; use{" "}
              <span className="font-semibold text-[#1A1F1E]">Watch</span> for most workflow follow-ups.
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
            onClick={() => void handleSave()}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2Icon className="mr-2 size-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              "Save flag"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
