"use client"

import { CalendarIcon, CalendarPlusIcon, Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { useDoctorAvailableSlots } from "@/app/(doctor)/doctor-appointments/useDoctorAppointments"

export type PatientProfileAppointmentDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointmentForm: { date: string; time: string; type: string; notes: string }
  setAppointmentForm: React.Dispatch<React.SetStateAction<{ date: string; time: string; type: string; notes: string }>>
  appointmentSlotsQuery: ReturnType<typeof useDoctorAvailableSlots>
  onSave: () => void | Promise<void>
  isSaving: boolean
}

export function PatientProfileAppointmentDialog({
  open,
  onOpenChange,
  appointmentForm,
  setAppointmentForm,
  appointmentSlotsQuery,
  onSave,
  isSaving,
}: PatientProfileAppointmentDialogProps) {
  return (
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
      >
        <DialogContent
          aria-describedby={undefined}
          className="flex w-full max-w-[calc(100vw-2rem)] max-h-[min(90vh,620px)] flex-col gap-0 overflow-hidden rounded-2xl border-[#E8E6E0]/60 bg-white p-0 shadow-2xl sm:max-w-[480px]"
        >
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden bg-white p-5 sm:p-6">
            <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
              <CalendarPlusIcon className="size-5 shrink-0 text-[#1A5345] sm:size-6" aria-hidden />
              <DialogTitle className="text-left font-serif text-[17px] font-bold leading-tight text-[#1A1F1E]">
                Schedule appointment
              </DialogTitle>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
              <div className="flex shrink-0 flex-col gap-1.5">
                <Label htmlFor="appointment-date" className="text-[12px] font-bold text-[#1A1F1E]">
                  Date
                </Label>
                <Input
                  id="appointment-date"
                  type="date"
                  value={appointmentForm.date}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setAppointmentForm((f) => ({ ...f, date: e.target.value, time: "" }))}
                  className="h-10 rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[13px] shadow-sm focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
                />
              </div>

              <div className="flex min-h-0 flex-1 flex-col gap-2">
                <Label className="shrink-0 text-[12px] font-bold text-[#1A1F1E]">Available slots</Label>
                {appointmentForm.date ? (
                  <div className="min-h-[88px] max-h-[220px] overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-300">
                    {appointmentSlotsQuery.isLoading ? (
                      <div className="flex h-[88px] items-center justify-center rounded-xl border border-dashed border-[#E8E6E0] bg-[#FAFAF8]">
                        <span className="text-[13px] font-medium text-muted-foreground">Loading slots…</span>
                      </div>
                    ) : appointmentSlotsQuery.isError ? (
                      <div className="flex h-[88px] items-center justify-center rounded-xl border border-dashed border-red-200 bg-red-50/40 px-4 text-center">
                        <span className="text-[13px] font-medium text-red-600">Could not load slots for this date.</span>
                      </div>
                    ) : (appointmentSlotsQuery.data?.length ?? 0) > 0 ? (
                      <div className="grid grid-cols-3 gap-2 pr-1">
                        {appointmentSlotsQuery.data!.map((slot) => (
                          <button
                            key={slot.value}
                            type="button"
                            onClick={() => setAppointmentForm((f) => ({ ...f, time: slot.value }))}
                            className={cn(
                              "h-10 rounded-xl border text-[13px] font-semibold transition-colors",
                              appointmentForm.time === slot.value
                                ? "border-[#1A5345] bg-[#1A5345] text-white shadow-[0_2px_10px_rgba(26,83,69,0.2)]"
                                : "border-[#E8E6E0]/80 bg-white text-[#6B7870] hover:border-[#1A5345]/40 hover:bg-[#1A5345]/5 hover:text-[#1A5345]",
                            )}
                          >
                            {slot.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex h-[88px] items-center justify-center rounded-xl border border-dashed border-[#E8E6E0] bg-[#FAFAF8] px-4 text-center">
                        <span className="text-[13px] font-medium text-muted-foreground">No available slots on this date.</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex h-[88px] items-center justify-center rounded-xl border border-dashed border-[#E8E6E0] bg-[#FAFAF8]">
                    <span className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
                      <CalendarIcon className="size-4 opacity-50" aria-hidden />
                      Select a date to see available slots
                    </span>
                  </div>
                )}
              </div>

              <div className="flex shrink-0 flex-col gap-1.5">
                <Label htmlFor="appointment-type" className="text-[12px] font-bold text-[#1A1F1E]">
                  Type
                </Label>
                <Select
                  value={appointmentForm.type}
                  onValueChange={(v) => setAppointmentForm((f) => ({ ...f, type: v }))}
                >
                  <SelectTrigger
                    id="appointment-type"
                    className="h-10 rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[13px] shadow-sm focus:ring-[#1A5345]/20"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-[#E8E6E0]">
                    <SelectItem value="follow-up">Follow-up</SelectItem>
                    <SelectItem value="new">New consultation</SelectItem>
                    <SelectItem value="post-procedure">Post-procedure</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex shrink-0 flex-col gap-1.5">
                <Label htmlFor="appointment-notes" className="text-[12px] font-bold text-[#1A1F1E]">
                  Notes <span className="font-medium text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="appointment-notes"
                  value={appointmentForm.notes}
                  onChange={(e) => setAppointmentForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Optional notes..."
                  className="min-h-[80px] resize-none rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[13px] shadow-sm focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
                />
              </div>
            </div>

            <div className="flex shrink-0 justify-end gap-2 border-t border-[#E8E6E0]/60 pt-4">
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
                disabled={!appointmentForm.date || !appointmentForm.time || isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" aria-hidden />
                    Scheduling…
                  </>
                ) : (
                  "Schedule"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
  )
}
