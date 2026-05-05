"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { CalendarDaysIcon, PaperclipIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
      <DialogContent className="max-w-sm border-[#E8E6E0] bg-white p-0">
        <DialogHeader className="border-b border-[#E8E6E0] px-4 py-3">
          <DialogTitle className="text-[14px] font-bold text-[#102F27] sm:text-[15px]">
            {initial ? "Edit requirement" : "Add requirement"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 px-4 py-3">
          <Input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave() }}
            placeholder="Write the requirement..."
            className="h-10 border-[#E8E6E0] bg-white text-[13px] placeholder:text-[#9CA3AF]"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setAllowsAttachment((v) => !v)}
              className={cn(
                "flex h-full w-full items-center gap-2 rounded-lg border px-3 py-2 text-[12px] font-medium transition-colors",
                allowsAttachment
                  ? "border-[#1A5345]/30 bg-[#E8F0EE] text-[#1A5345]"
                  : "border-[#E5EEEA] bg-white text-muted-foreground hover:bg-[#F5F5F3]",
              )}
            >
              <PaperclipIcon className="size-3.5" />
              {allowsAttachment ? "Attachment required" : "No attachment needed"}
            </button>

            <div>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-10 justify-start border-[#E8E6E0] bg-white text-left text-[12px] font-normal hover:bg-[#F6FBF9]",
                      !dueDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarDaysIcon className="mr-2 size-4 text-[#1A5345]" />
                    {dueDate
                      ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(dueDate)
                      : "Pick due date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
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
        </div>

        <DialogFooter className="border-t border-[#E8E6E0] px-4 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[#E5EEEA] px-4 py-2 text-[12px] text-muted-foreground transition-colors hover:bg-[#F5F5F3]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!text.trim()}
            className="rounded-lg bg-[#1A5345] px-4 py-2 text-[12px] font-medium text-white transition-colors hover:bg-[#0F3D32] disabled:opacity-40"
          >
            {initial ? "Save changes" : "Add requirement"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
