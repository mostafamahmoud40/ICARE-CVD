"use client";

import { useEffect, useState } from "react";
import { FileTextIcon, InfoIcon, Loader2Icon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { editInstructionsSchema } from "./medicationDialogs.schema";

type EditMedicationInstructionsDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  medicationLabel: string;
  patientLabel: string;
  initialInstructions: string;
  onSubmit: (dosageInstructions: string) => Promise<void>;
  isPending: boolean;
};

export function EditMedicationInstructionsDialog({
  open,
  onOpenChange,
  medicationLabel,
  patientLabel,
  initialInstructions,
  onSubmit,
  isPending,
}: EditMedicationInstructionsDialogProps) {
  const [text, setText] = useState(initialInstructions);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setText(initialInstructions);
    setError(null);
  }, [open, initialInstructions, medicationLabel, patientLabel]);

  const handleSave = async () => {
    const parsed = editInstructionsSchema.safeParse({ dosageInstructions: text });
    if (!parsed.success) {
      setError(parsed.error.flatten().fieldErrors.dosageInstructions?.[0] ?? "Invalid");
      return;
    }
    setError(null);
    await onSubmit(parsed.data.dosageInstructions);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl border-[#E8E6E0]/60 bg-white p-0 shadow-2xl sm:max-w-[480px]">
        <div className="border-b border-[#E8E6E0]/60 bg-[#F9F8F5] px-5 py-3.5 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <FileTextIcon className="size-6 shrink-0 text-[#1A5345] sm:size-7" aria-hidden />
            <div className="min-w-0 flex-1 space-y-0.5">
              <DialogTitle className="text-left font-serif text-[17px] font-bold leading-tight text-[#1A1F1E]">
                Update care note
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
            <Label htmlFor="care-note-text" className="text-[12px] font-bold text-[#1A1F1E] sm:text-[13px]">
              Assistant-visible medication note
            </Label>
            <Textarea
              id="care-note-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder="Timing tips, patient preferences, adherence barriers, or follow-up reminders for the assistant team…"
              className="min-h-[120px] resize-none rounded-xl border-[#E8E6E0] bg-[#F9F8F5]/50 text-[13px] leading-relaxed shadow-sm focus-visible:bg-white focus-visible:ring-[#1A5345] sm:min-h-[132px] sm:text-[14px]"
            />
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-dashed border-[#E8E6E0] bg-[#F9F8F5]/50 px-2.5 py-2.5 text-[11px] leading-snug text-muted-foreground sm:text-[12px]">
            <InfoIcon className="mt-0.5 size-3.5 shrink-0 text-[#1A5345]/70 sm:size-4" aria-hidden />
            <p>
              Clinical changes still require prescriber approval. This updates{" "}
              <span className="font-semibold text-[#1A1F1E]">assistant-visible guidance only</span> (demo).
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
            className="h-8 rounded-lg border border-[#E8E6E0] bg-white px-4 text-[12px] font-bold text-[#1A1F1E] shadow-sm transition-colors hover:bg-slate-50 hover:text-[#1A5345]"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="h-8 rounded-lg border-0 bg-[#1A5345] px-5 text-[12px] font-bold text-white shadow-sm transition-all hover:bg-[#133F34] disabled:opacity-50 disabled:shadow-none"
            onClick={() => void handleSave()}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2Icon className="mr-2 size-3.5 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              "Save note"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
