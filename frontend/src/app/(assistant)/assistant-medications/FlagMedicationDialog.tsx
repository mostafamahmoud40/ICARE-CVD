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
      <DialogContent className="border-[#E8E6E0] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px] text-[#102F27]">Flag medication</DialogTitle>
          <p className="text-[11px] text-muted-foreground">
            {patientLabel} · {medicationLabel}
          </p>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-[11px] text-[#4F6D64]">Severity</Label>
            <Select
              value={severity}
              onValueChange={(v) => setSeverity(v as MedicationFlagSeverity)}
            >
              <SelectTrigger className="h-9 border-[#E8E6E0] text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info — for chart awareness</SelectItem>
                <SelectItem value="watch">Watch — needs follow-up</SelectItem>
                <SelectItem value="critical">Critical — escalate</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] text-[#4F6D64]">Reason</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you flagging this medication line?"
              rows={4}
              className="resize-none border-[#E8E6E0] text-[12px]"
            />
          </div>
          {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
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
              "Save flag"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
