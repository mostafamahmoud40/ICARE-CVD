"use client"

import { Loader2Icon, PhoneIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

export type PatientProfileContactDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact: { phone: string; email: string; address: string }
  setContact: React.Dispatch<React.SetStateAction<{ phone: string; email: string; address: string }>>
  onSave: () => void | Promise<void>
  isSaving: boolean
}

export function PatientProfileContactDialog({
  open,
  onOpenChange,
  contact,
  setContact,
  onSave,
  isSaving,
}: PatientProfileContactDialogProps) {
  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          aria-describedby={undefined}
          className="w-full max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl border-[#E8E6E0]/60 bg-white p-0 shadow-2xl sm:max-w-[480px]"
        >
          <div className="flex flex-col gap-4 bg-white p-5 sm:p-6">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <PhoneIcon className="size-5 shrink-0 text-[#1A5345] sm:size-6" aria-hidden />
              <DialogTitle className="text-left font-serif text-[17px] font-bold leading-tight text-[#1A1F1E]">
                Edit contact info
              </DialogTitle>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contact-phone" className="text-[12px] font-bold text-[#1A1F1E]">
                  Phone
                </Label>
                <Input
                  id="contact-phone"
                  value={contact.phone}
                  onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                  className="h-10 rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[13px] shadow-sm focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contact-email" className="text-[12px] font-bold text-[#1A1F1E]">
                  Email
                </Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={contact.email}
                  onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                  className="h-10 rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[13px] shadow-sm focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contact-address" className="text-[12px] font-bold text-[#1A1F1E]">
                  Address
                </Label>
                <Input
                  id="contact-address"
                  value={contact.address}
                  onChange={(e) => setContact((c) => ({ ...c, address: e.target.value }))}
                  className="h-10 rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[13px] shadow-sm focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-[#E8E6E0]/80 px-3.5 text-[12px] font-semibold text-[#1A1F1E] shadow-sm hover:bg-[#FAFAF8]"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-9 rounded-xl border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-sm hover:bg-[#133F34] disabled:opacity-50"
                onClick={() => void onSave()}
                disabled={isSaving}
              >
                {isSaving ? <Loader2Icon className="size-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
  )
}
