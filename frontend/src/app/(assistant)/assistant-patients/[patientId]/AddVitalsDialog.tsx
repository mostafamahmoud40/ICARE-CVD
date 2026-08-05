"use client"

import { HeartPulseIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AddVitalsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border border-[#E8E6E0] shadow-lg rounded-2xl bg-white">
        <div className="px-6 pt-6 pb-4 border-b border-[#E8E6E0]/60">
           <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-[#F9F8F5] flex items-center justify-center text-[#1A5345] border border-[#E8E6E0]">
                 <HeartPulseIcon className="size-5" />
              </div>
              <div>
                 <DialogTitle className="text-[17px] font-bold text-[#1A1F1E]">Add Vitals Reading</DialogTitle>
                 <p className="text-muted-foreground text-[12px] font-medium">Record patient&apos;s physical measurements</p>
              </div>
           </div>
        </div>

        <div className="p-6 flex flex-col gap-5">
           <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                 <Label className="text-[12px] font-bold text-[#1A1F1E]">Systolic (mmHg)</Label>
                 <Input className="bg-[#F9F8F5]/50 border-[#E8E6E0] rounded-xl h-10 focus-visible:ring-[#1A5345]" placeholder="120" />
              </div>
              <div className="flex flex-col gap-1.5">
                 <Label className="text-[12px] font-bold text-[#1A1F1E]">Diastolic (mmHg)</Label>
                 <Input className="bg-[#F9F8F5]/50 border-[#E8E6E0] rounded-xl h-10 focus-visible:ring-[#1A5345]" placeholder="80" />
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                 <Label className="text-[12px] font-bold text-[#1A1F1E]">Heart Rate (bpm)</Label>
                 <Input className="bg-[#F9F8F5]/50 border-[#E8E6E0] rounded-xl h-10 focus-visible:ring-[#1A5345]" placeholder="72" />
              </div>
              <div className="flex flex-col gap-1.5">
                 <Label className="text-[12px] font-bold text-[#1A1F1E]">SpO2 (%)</Label>
                 <Input className="bg-[#F9F8F5]/50 border-[#E8E6E0] rounded-xl h-10 focus-visible:ring-[#1A5345]" placeholder="98" />
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                 <Label className="text-[12px] font-bold text-[#1A1F1E]">Temp (°C)</Label>
                 <Input className="bg-[#F9F8F5]/50 border-[#E8E6E0] rounded-xl h-10 focus-visible:ring-[#1A5345]" placeholder="36.8" />
              </div>
              <div className="flex flex-col gap-1.5">
                 <Label className="text-[12px] font-bold text-[#1A1F1E]">Weight (kg)</Label>
                 <Input className="bg-[#F9F8F5]/50 border-[#E8E6E0] rounded-xl h-10 focus-visible:ring-[#1A5345]" placeholder="82" />
              </div>
           </div>

           <div className="flex flex-col gap-1.5">
              <Label className="text-[12px] font-bold text-[#1A1F1E]">Notes</Label>
              <Input className="bg-[#F9F8F5]/50 border-[#E8E6E0] rounded-xl h-10 focus-visible:ring-[#1A5345]" placeholder="Add any observations..." />
           </div>

           <div className="flex gap-3 mt-2">
              <Button 
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 rounded-xl h-11 font-bold text-[14px] border-[#E8E6E0] text-[#1A1F1E] hover:bg-slate-50"
              >
                 Cancel
              </Button>
              <Button 
                onClick={() => onOpenChange(false)}
                className="flex-1 bg-[#1A5345] hover:bg-[#1A1F1E] text-white rounded-xl h-11 font-bold text-[14px]"
              >
                 Save Reading
              </Button>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
