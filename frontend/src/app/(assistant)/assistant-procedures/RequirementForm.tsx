"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { CheckIcon, CalendarDaysIcon, PaperclipIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type RequirementFormProps = {
  open: boolean
  initial?: { title: string; description: string; allowsAttachment: boolean; dueAt?: string | null }
  onSave: (
    title: string,
    description: string | null,
    allowsAttachment: boolean,
    dueAt: string | null,
  ) => void
  onCancel: () => void
}

export function RequirementForm({ open, initial, onSave, onCancel }: RequirementFormProps) {
  const [text, setText] = useState(initial?.description || initial?.title || "")
  const [allowsAttachment, setAllowsAttachment] = useState(initial?.allowsAttachment ?? false)
  const [dueDate, setDueDate] = useState<Date | undefined>(
    initial?.dueAt ? new Date(initial.dueAt) : undefined,
  )
  const [calendarOpen, setCalendarOpen] = useState(false)

  useEffect(() => {
    if (open) {
      setText(initial?.description || initial?.title || "")
      setAllowsAttachment(initial?.allowsAttachment ?? false)
      const parsedDueDate = initial?.dueAt ? new Date(initial.dueAt) : undefined
      setDueDate(parsedDueDate)
    }
  }, [open, initial?.description, initial?.title, initial?.allowsAttachment, initial?.dueAt])

  const handleSave = () => {
    if (!text.trim()) return
    const dueAtValue = dueDate
      ? new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate(), 12, 0, 0).toISOString()
      : null
    onSave(text.trim(), text.trim(), allowsAttachment, dueAtValue)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel() }}>
      <DialogContent className="max-w-md rounded-[32px] border-0 bg-white p-0 shadow-2xl overflow-hidden">
        <DialogHeader className="gap-0 px-5 pb-3 pt-4 text-left sm:px-6 sm:pb-4 sm:pt-5 bg-[#F9F8F5]/50 border-b border-[#E8E6E0]/40">
          <DialogTitle className="font-serif text-[17px] font-bold leading-snug tracking-tight text-[#1A1F1E] sm:text-[18px]">
            {initial ? "Edit Directive" : "Add Clinical Directive"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-5 pb-6 pt-3 sm:px-6 sm:pt-4">
           <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Requirement Title
              </label>
              <Input
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSave() }}
                placeholder="e.g. Fasting 12 hours before lab"
                className="h-12 border-[#E8E6E0] bg-[#F9F8F5]/30 text-[14px] placeholder:text-[#9CA3AF] rounded-2xl focus-visible:ring-[#1A5345]/20"
              />
           </div>

           <div className="grid grid-cols-2 gap-4">
              {/* Custom Toggle for Attachment */}
              <div className="space-y-2">
                 <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Documentation</label>
                 <button
                   type="button"
                   onClick={() => setAllowsAttachment((v) => !v)}
                   className={cn(
                     "flex h-12 w-full items-center justify-between rounded-2xl border px-4 transition-all duration-300",
                     allowsAttachment
                       ? "border-[#1A5345]/20 bg-[#F0F5F3] text-[#1A5345] shadow-sm"
                       : "border-[#E8E6E0]/60 bg-white text-muted-foreground hover:bg-[#F9F8F5]",
                   )}
                 >
                   <div className="flex items-center gap-2">
                      <PaperclipIcon className={cn("size-4 transition-colors", allowsAttachment ? "text-[#1A5345]" : "text-[#9CA3AF]")} />
                      <span className="text-[13px] font-bold">Attachment</span>
                   </div>
                   <div className={cn(
                      "size-5 rounded-md border-2 flex items-center justify-center transition-all",
                      allowsAttachment ? "bg-[#1A5345] border-[#1A5345]" : "border-[#E8E6E0]"
                   )}>
                      {allowsAttachment && <CheckIcon className="size-3 text-white" strokeWidth={4} />}
                   </div>
                 </button>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Deadline</label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "h-12 w-full justify-start border-[#E8E6E0]/60 bg-white px-4 rounded-2xl text-[13px] font-bold hover:bg-[#F9F8F5] transition-all",
                        !dueDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarDaysIcon className="mr-2 size-4 text-[#1A5345]/40" />
                      {dueDate
                        ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(dueDate)
                        : "No deadline"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-[24px] overflow-hidden border-0 shadow-2xl" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={(date) => {
                        setDueDate(date)
                        setCalendarOpen(false)
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
           </div>

           {/* Form Actions */}
           <div className="flex items-center justify-end gap-2 pt-3 sm:gap-2.5">
             <Button
               type="button"
               variant="ghost"
               size="sm"
               onClick={onCancel}
               className="h-9 rounded-xl px-3 text-[12px] font-semibold text-muted-foreground hover:bg-[#F9F8F5]"
             >
               Discard
             </Button>
             <Button
               type="button"
               size="sm"
               onClick={handleSave}
               disabled={!text.trim()}
               className="h-9 rounded-xl px-4 text-[12px] font-semibold bg-[#1A5345] text-white shadow-sm shadow-[#1A5345]/15 hover:bg-[#133F34] disabled:opacity-40"
             >
               {initial ? "Apply Changes" : "Create Requirement"}
             </Button>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
