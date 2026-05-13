"use client";

import { useEffect, useState } from "react";
import { InfoIcon, Loader2Icon, MessageCircleIcon, SparklesIcon } from "lucide-react";

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
import { reminderSchema } from "./medicationDialogs.schema";
import type { MedicationReminderChannel, PatientMedicationProfile } from "./assistantMedications.types";

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

  useEffect(() => {
    if (open) setError(null);
  }, [open]);

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
      <DialogContent className="w-full max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl border-[#E8E6E0]/60 bg-white p-0 shadow-2xl sm:max-w-[460px]">
        {/* Header — compact strip like AddVitals */}
        <div className="border-b border-[#E8E6E0]/60 bg-[#F9F8F5] px-5 py-3.5 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#E8E6E0] bg-white text-[#1A5345] shadow-sm sm:size-10">
              <MessageCircleIcon className="size-[18px] sm:size-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <DialogTitle className="text-left text-[17px] font-bold font-serif leading-tight text-[#1A1F1E]">
                Send adherence reminder
              </DialogTitle>
              {profile ? (
                <DialogDescription className="text-left text-[12px] font-medium leading-snug text-muted-foreground sm:text-[13px]">
                  To <span className="font-bold text-[#1A1F1E]">{profile.fullName}</span>
                  {profile.phone ? <> · {profile.phone}</> : null}
                </DialogDescription>
              ) : (
                <DialogDescription className="text-left text-[12px] font-medium text-muted-foreground sm:text-[13px]">
                  Select a patient to send a reminder.
                </DialogDescription>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reminder-channel" className="text-[12px] font-bold text-[#1A1F1E]">
                Channel
              </Label>
              <Select value={channel} onValueChange={(v) => setChannel(v as MedicationReminderChannel)}>
                <SelectTrigger
                  id="reminder-channel"
                  className="h-10 w-full min-w-0 rounded-xl border-[#E8E6E0] bg-white text-[13px] shadow-sm focus-visible:ring-[#1A5345]"
                >
                  <SelectValue placeholder="Channel" />
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  className="rounded-xl border-[#E8E6E0]/60 shadow-lg"
                >
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="push">Push notification</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reminder-template" className="text-[12px] font-bold text-[#1A1F1E]">
                Template
              </Label>
              <Select value={template} onValueChange={(v) => setTemplate(v as ReminderTemplateId)}>
                <SelectTrigger
                  id="reminder-template"
                  className="h-10 w-full min-w-0 rounded-xl border-[#E8E6E0] bg-white text-[13px] shadow-sm focus-visible:ring-[#1A5345]"
                >
                  <SelectValue placeholder="Template" />
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  className="rounded-xl border-[#E8E6E0]/60 shadow-lg"
                >
                  {REMINDER_TEMPLATES.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="reminder-message" className="text-[12px] font-bold text-[#1A1F1E]">
                Message
              </Label>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8 shrink-0 rounded-lg border-[#E8E6E0]/80 bg-white text-[#1A1F1E] shadow-sm hover:bg-[#F9F8F5] sm:size-9"
                onClick={useTemplate}
                disabled={!profile}
                aria-label="Insert template into message"
                title="Insert template into message"
              >
                <SparklesIcon className="size-4 text-violet-600" aria-hidden />
                <span className="sr-only">Insert template into message</span>
              </Button>
            </div>
            <Textarea
              id="reminder-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="min-h-[92px] resize-none rounded-xl border-[#E8E6E0] bg-[#F9F8F5]/50 text-[13px] leading-relaxed shadow-sm focus-visible:bg-white focus-visible:ring-[#1A5345] sm:min-h-[100px]"
              placeholder="Write your reminder, or tap the sparkles to insert the selected template…"
            />
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-dashed border-[#E8E6E0] bg-[#F9F8F5]/50 px-2.5 py-2 text-[11px] leading-snug text-muted-foreground sm:text-[12px]">
            <InfoIcon className="mt-0.5 size-3.5 shrink-0 text-[#1A5345]/70 sm:size-4" aria-hidden />
            <p>
              You can edit before queuing. Use only channels and wording this patient has agreed to for ICARE-CVD.
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
            onClick={() => void handleSend()}
            disabled={isPending || !profile}
          >
            {isPending ? (
              <>
                <Loader2Icon className="mr-2 size-4 animate-spin" aria-hidden />
                Sending…
              </>
            ) : (
              "Queue reminder"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
