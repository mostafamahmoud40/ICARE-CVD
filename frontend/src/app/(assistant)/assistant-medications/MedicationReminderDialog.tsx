"use client";

import { useState } from "react";
import { Loader2Icon, SparklesIcon } from "lucide-react";
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
import { reminderSchema } from "./medicationDialogs.schema";
import type { MedicationReminderChannel } from "./assistantMedications.types";
import type { PatientMedicationProfile } from "./assistantMedications.types";

type ReminderTemplateId = "gentle" | "missed-dose" | "refill" | "safety";

const REMINDER_TEMPLATES: Array<{ id: ReminderTemplateId; label: string }> = [
  { id: "gentle", label: "General check-in" },
  { id: "missed-dose", label: "Missed dose follow-up" },
  { id: "refill", label: "Refill reminder" },
  { id: "safety", label: "Safety check" },
];

type MedicationReminderDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  profile: PatientMedicationProfile | null;
  medicationSummary?: string | null;
  onSubmit: (values: {
    channel: MedicationReminderChannel;
    message: string;
    templateLabel?: string;
  }) => Promise<void>;
  isPending: boolean;
};

export function MedicationReminderDialog({
  open,
  onOpenChange,
  profile,
  medicationSummary,
  onSubmit,
  isPending,
}: MedicationReminderDialogProps) {
  const [channel, setChannel] = useState<MedicationReminderChannel>("sms");
  const [template, setTemplate] = useState<ReminderTemplateId>("gentle");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const useTemplate = () => {
    if (!profile) return;
    const firstName = profile.fullName.split(" ")[0];
    const focus = medicationSummary ? ` (${medicationSummary})` : "";

    const drafts: Record<ReminderTemplateId, string> = {
      gentle: `Dear ${firstName},\n\nThis is ICARE Cardiology. Please confirm you are taking your medicines as prescribed this week${focus}.\n\nReply STOP to opt out of reminders.`,
      "missed-dose": `Dear ${firstName},\n\nWe noticed a few missed medication doses${focus}. Please reply if timing, side effects, or refills are making it difficult.\n\nReply STOP to opt out of reminders.`,
      refill: `Dear ${firstName},\n\nYour medication refill may be due soon${focus}. Please contact the clinic if you need help avoiding a gap.\n\nReply STOP to opt out of reminders.`,
      safety: `Dear ${firstName},\n\nPlease check with your cardiology team before taking any new over-the-counter medicine${focus}.\n\nReply STOP to opt out of reminders.`,
    };

    setMessage(drafts[template]);
  };

  const handleSend = async () => {
    const templateLabel = REMINDER_TEMPLATES.find((item) => item.id === template)?.label;
    const parsed = reminderSchema.safeParse({ channel, message, templateLabel });
    if (!parsed.success) {
      setError(parsed.error.flatten().fieldErrors.message?.[0] ?? "Check message");
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
          <DialogTitle className="text-[15px] text-[#102F27]">Send adherence reminder</DialogTitle>
          {profile ? (
            <p className="text-[11px] text-muted-foreground">
              To {profile.fullName}
              {profile.phone ? ` · ${profile.phone}` : ""}
            </p>
          ) : null}
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-[140px] flex-1 space-y-1.5">
              <Label className="text-[11px] text-[#4F6D64]">Channel</Label>
              <Select
                value={channel}
                onValueChange={(v) => setChannel(v as MedicationReminderChannel)}
              >
                <SelectTrigger className="h-9 border-[#E8E6E0] text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="push">Push notification</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[160px] flex-1 space-y-1.5">
              <Label className="text-[11px] text-[#4F6D64]">Template</Label>
              <Select value={template} onValueChange={(v) => setTemplate(v as ReminderTemplateId)}>
                <SelectTrigger className="h-9 border-[#E8E6E0] text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REMINDER_TEMPLATES.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-5 gap-1 border-[#E8E6E0] text-[11px]"
              onClick={useTemplate}
              disabled={!profile}
            >
              <SparklesIcon className="size-3.5 text-violet-600" />
              Use template
            </Button>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] text-[#4F6D64]">Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="resize-none border-[#E8E6E0] text-[12px]"
              placeholder="Short, clear reminder…"
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            Templates are editable before queuing and should follow the clinic consent flow.
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
            onClick={() => void handleSend()}
            disabled={isPending || !profile}
          >
            {isPending ? (
              <>
                <Loader2Icon className="mr-1 size-3.5 animate-spin" />
                Sending…
              </>
            ) : (
              "Queue reminder"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
