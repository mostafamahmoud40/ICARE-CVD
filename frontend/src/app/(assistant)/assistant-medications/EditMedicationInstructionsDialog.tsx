"use client";

import { useState } from "react";
import { Loader2Icon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
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
      <DialogContent className="border-[#E8E6E0] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px] text-[#102F27]">Update care note</DialogTitle>
          <p className="text-[11px] text-muted-foreground">
            {patientLabel} · {medicationLabel}
          </p>
        </DialogHeader>
        <div className="space-y-2">
          <Label className="text-[11px] text-[#4F6D64]">Assistant-visible medication note</Label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            className="resize-none border-[#E8E6E0] text-[12px]"
          />
          {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
          <p className="text-[10px] text-muted-foreground">
            Clinical changes still require prescriber approval — this updates assistant-visible
            guidance only (demo).
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            className="border-[#E8E6E0]"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-[#1A5345] hover:bg-[#143f34]"
            onClick={() => void handleSave()}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2Icon className="mr-1 size-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
