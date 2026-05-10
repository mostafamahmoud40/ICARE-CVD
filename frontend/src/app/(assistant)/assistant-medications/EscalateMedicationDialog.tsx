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
import { escalateMedicationSchema } from "./medicationDialogs.schema";
import type {
  DoctorEscalationPriority,
  PatientMedicationProfile,
} from "./assistantMedications.types";

const PATIENT_LEVEL_VALUE = "__patient__";

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
  const [note, setNote] = useState(
    suggestedReason
      ? "Please review this medication issue and advise the assistant follow-up plan."
      : ""
  );
  const [error, setError] = useState<string | null>(null);

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
      <DialogContent className="border-[#E8E6E0] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[15px] text-[#102F27]">Escalate to doctor</DialogTitle>
          {profile ? (
            <p className="text-[11px] text-muted-foreground">
              {profile.fullName} · medication workflow review
            </p>
          ) : null}
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[11px] text-[#4F6D64]">Medication</Label>
              <Select
                value={medicationValue}
                onValueChange={setMedicationValue}
                disabled={!profile}
              >
                <SelectTrigger className="h-9 border-[#E8E6E0] text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PATIENT_LEVEL_VALUE}>Patient-level issue</SelectItem>
                  {profile?.medications.map((med) => (
                    <SelectItem key={med.id} value={med.id}>
                      {med.name} {med.strength}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] text-[#4F6D64]">Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as DoctorEscalationPriority)}
              >
                <SelectTrigger className="h-9 border-[#E8E6E0] text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] text-[#4F6D64]">Reason</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="resize-none border-[#E8E6E0] text-[12px]"
              placeholder="What should the doctor review?"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] text-[#4F6D64]">Assistant note</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="resize-none border-[#E8E6E0] text-[12px]"
              placeholder="Context, contact attempts, or patient response."
            />
          </div>

          <p className="text-[10px] text-muted-foreground">
            Escalations are review requests; medication changes remain with the prescribing
            clinician.
          </p>
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
            onClick={() => void handleSubmit()}
            disabled={isPending || !profile}
          >
            {isPending ? (
              <>
                <Loader2Icon className="mr-1 size-3.5 animate-spin" />
                Queuing...
              </>
            ) : (
              "Queue escalation"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
