"use client";

import { useEffect, useState } from "react";
import { Loader2Icon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assistantProfileEditSchema } from "./assistantAccount.schema";
import type { AssistantProfileEditValues } from "./assistantAccount.schema";

const DEPARTMENT_OPTIONS = [
  "Cardiology",
  "Internal Medicine",
  "Endocrinology",
  "Nephrology",
  "General Practice",
] as const;

type EditAssistantProfileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues: AssistantProfileEditValues;
  onSubmit: (values: AssistantProfileEditValues) => Promise<void>;
  isPending: boolean;
};

type FieldErrors = Partial<Record<keyof AssistantProfileEditValues, string>>;

export function EditAssistantProfileDialog({
  open,
  onOpenChange,
  initialValues,
  onSubmit,
  isPending,
}: EditAssistantProfileDialogProps) {
  const [form, setForm] = useState(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (open) {
      setForm(initialValues);
      setErrors({});
    }
  }, [open, initialValues]);

  const setField = <K extends keyof AssistantProfileEditValues>(
    key: K,
    value: AssistantProfileEditValues[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = assistantProfileEditSchema.safeParse(form);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors({
        fullName: flat.fullName?.[0],
        email: flat.email?.[0],
        phone: flat.phone?.[0],
        department: flat.department?.[0],
        experienceYears: flat.experienceYears?.[0],
        avatarUrl: flat.avatarUrl?.[0],
      });
      return;
    }
    await onSubmit(parsed.data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden rounded-2xl border border-[#E8E6E0]/70 p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-[#E8E6E0]/60 bg-[#F9F8F5] px-5 py-4 sm:px-6">
          <DialogTitle className="font-serif text-[18px] font-bold text-[#1A1F1E]">Edit profile</DialogTitle>
          <p className="text-[12px] font-medium text-muted-foreground">
            Update your contact and professional details visible to the care team.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4 sm:px-6">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-[#6B7870]">Full name</Label>
            <Input
              value={form.fullName}
              onChange={(e) => setField("fullName", e.target.value)}
              className="h-10 rounded-xl border-[#E8E6E0] text-[13px]"
              autoComplete="name"
            />
            {errors.fullName ? <p className="text-[11px] text-red-600">{errors.fullName}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-[#6B7870]">Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                className="h-10 rounded-xl border-[#E8E6E0] text-[13px]"
                autoComplete="email"
              />
              {errors.email ? <p className="text-[11px] text-red-600">{errors.email}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-[#6B7870]">Phone</Label>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                className="h-10 rounded-xl border-[#E8E6E0] text-[13px]"
                autoComplete="tel"
              />
              {errors.phone ? <p className="text-[11px] text-red-600">{errors.phone}</p> : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-[#6B7870]">Department</Label>
              <Select value={form.department} onValueChange={(v) => setField("department", v)}>
                <SelectTrigger className="h-10 w-full rounded-xl border-[#E8E6E0] text-[13px]">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENT_OPTIONS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.department ? <p className="text-[11px] text-red-600">{errors.department}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-[#6B7870]">Years of experience</Label>
              <Input
                type="number"
                min={0}
                max={50}
                value={form.experienceYears}
                onChange={(e) => setField("experienceYears", Number(e.target.value))}
                className="h-10 rounded-xl border-[#E8E6E0] text-[13px]"
              />
              {errors.experienceYears ? (
                <p className="text-[11px] text-red-600">{errors.experienceYears}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-[#6B7870]">Profile photo URL (optional)</Label>
            <Input
              type="url"
              placeholder="https://…"
              value={form.avatarUrl ?? ""}
              onChange={(e) => setField("avatarUrl", e.target.value)}
              className="h-10 rounded-xl border-[#E8E6E0] text-[13px]"
            />
            {errors.avatarUrl ? <p className="text-[11px] text-red-600">{errors.avatarUrl}</p> : null}
            <p className="text-[10px] font-medium text-muted-foreground">
              Leave empty to use the default photo. Staff ID and join date cannot be changed here.
            </p>
          </div>

          <DialogFooter className="gap-2 border-t border-[#E8E6E0]/60 pt-4 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-[#E8E6E0]"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-[#1A5345] text-[13px] font-bold text-white hover:bg-[#133F34]"
            >
              {isPending ? <Loader2Icon className="size-4 animate-spin" /> : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
