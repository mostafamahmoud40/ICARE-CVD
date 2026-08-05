import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  PillIcon, 
  CheckCircle2Icon, 
  XCircleIcon, 
  CalendarIcon, 
  SunIcon, 
  MoonIcon,
  ActivityIcon,
  ClockIcon,
  SyringeIcon,
  BeakerIcon
} from "lucide-react";
import { type MedicationType } from "./assistantMedications.types";
import {
  buildDoseTimesFromFrequency,
  isHighFrequencySchedule,
  mockDoseStatus,
} from "./medicationDoseSchedule";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type MedicationRecordDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicationName: string;
  strength?: string;
  type?: MedicationType;
  dosageInstructions?: string;
  frequencyLabel?: string;
};

export function MedicationRecordDialog({
  open,
  onOpenChange,
  medicationName,
  strength = "10 mg",
  type = "pill",
  dosageInstructions = "1 tablet twice daily with meals",
  frequencyLabel = "BID",
}: MedicationRecordDialogProps) {
  // Mock Data for the record
  const adherenceStats = {
    adheredDays: 24,
    missedDays: 4,
    partialDays: 2,
    totalDays: 30,
  };

  // Generate dose times from frequency (Q3H = every 3 hours, BID = twice daily, etc.)
  const doseTimes = buildDoseTimesFromFrequency(frequencyLabel);
  const highFrequency = isHighFrequencySchedule(doseTimes);

  // Generate mock timeline
  const generateMockTimeline = () => {
    const today = new Date("2026-05-10");
    const arr = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      const dayDoses = doseTimes.map((dt, doseIndex) => ({
        time: dt.time,
        label: dt.label,
        status: mockDoseStatus(i, doseIndex, frequencyLabel),
      }));

      arr.push({ date: dateStr, doses: dayDoses });
    }
    return arr;
  };

  const timeline = generateMockTimeline();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden rounded-3xl border-0 shadow-2xl bg-[#F9F8F5] sm:max-w-[720px]">
        <DialogHeader className="p-6 pb-0 sm:p-8 sm:pb-4 border-b border-[#E8E6E0]/60 bg-white">
          <div className="flex items-center gap-4 mb-2">
            {type === "injection" ? (
              <SyringeIcon className="size-8 text-sky-500 drop-shadow-sm shrink-0" />
            ) : type === "solution" ? (
              <BeakerIcon className="size-8 text-purple-500 drop-shadow-sm shrink-0" />
            ) : (
              <svg 
                className="size-10 shrink-0 drop-shadow-sm" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <g transform="rotate(-45 12 12)">
                  <path d="M7 12V8C7 5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8V12H7Z" fill="#3B82F6" />
                  <path d="M7 12V16C7 18.7614 9.23858 21 12 21C14.7614 21 17 18.7614 17 16V12H7Z" fill="#EF4444" />
                  <line x1="7" y1="12" x2="17" y2="12" stroke="white" strokeWidth="1.5" />
                </g>
              </svg>
            )}
            <div>
              <DialogTitle className="text-[24px] font-bold text-[#1A1F1E] font-serif tracking-tight flex items-center gap-2">
                {medicationName} <span className="text-muted-foreground font-sans text-[16px] font-medium tracking-normal">{strength}</span>
              </DialogTitle>
              <DialogDescription className="text-[13px] font-medium text-muted-foreground mt-1 flex items-center gap-1.5">
                <ClockIcon className="size-3.5" /> {dosageInstructions}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-6 sm:p-8 space-y-8">
            
            {/* Overview Stats */}
            <div className="grid grid-cols-3 gap-4">
               <div className="flex items-center gap-3 rounded-2xl border border-[#E8E6E0]/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-md cursor-default">
                  <div className="flex shrink-0 items-center justify-center">
                     <CheckCircle2Icon className="size-5 text-[#1A5345]" />
                  </div>
                  <div className="min-w-0">
                     <div className="text-[20px] font-bold leading-none text-[#1A1F1E] tracking-tight">{adherenceStats.adheredDays} <span className="text-[12px] font-bold text-muted-foreground tracking-normal">days</span></div>
                     <div className="mt-1 truncate text-[11px] font-medium text-[#6B7870] uppercase tracking-wider">Full adherence</div>
                  </div>
               </div>
               
               <div className="flex items-center gap-3 rounded-2xl border border-[#E8E6E0]/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-md cursor-default">
                  <div className="flex shrink-0 items-center justify-center">
                     <ActivityIcon className="size-5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                     <div className="text-[20px] font-bold leading-none text-[#1A1F1E] tracking-tight">{adherenceStats.partialDays} <span className="text-[12px] font-bold text-muted-foreground tracking-normal">days</span></div>
                     <div className="mt-1 truncate text-[11px] font-medium text-[#6B7870] uppercase tracking-wider">Partial days</div>
                  </div>
               </div>
               
               <div className="flex items-center gap-3 rounded-2xl border border-[#E8E6E0]/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-md cursor-default">
                  <div className="flex shrink-0 items-center justify-center">
                     <XCircleIcon className="size-5 text-rose-600" />
                  </div>
                  <div className="min-w-0">
                     <div className="text-[20px] font-bold leading-none text-[#1A1F1E] tracking-tight">{adherenceStats.missedDays} <span className="text-[12px] font-bold text-muted-foreground tracking-normal">days</span></div>
                     <div className="mt-1 truncate text-[11px] font-medium text-[#6B7870] uppercase tracking-wider">Missed days</div>
                  </div>
               </div>
            </div>

            {/* Detailed Timeline */}
            <div>
               <h4 className="text-[15px] font-bold text-[#1A1F1E] mb-4 flex items-center gap-2">
                 <CalendarIcon className="size-4 text-[#1A5345]" />
                 30-Day Timeline
               </h4>
               <div className="bg-white rounded-2xl border border-[#E8E6E0] overflow-hidden shadow-sm">
                  <div className="divide-y divide-[#E8E6E0]/60">
                     {timeline.map((day, i) => (
                       <div
                         key={i}
                         className={cn(
                           "border-b border-[#E8E6E0]/60 p-4 transition-colors last:border-0 hover:bg-[#F9F8F5]/50",
                           highFrequency
                             ? "flex flex-col gap-3"
                             : "flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-0",
                         )}
                       >
                          <span className="text-[13px] font-bold text-[#1A1F1E] sm:w-[120px]">{day.date}</span>

                          <div
                            className={cn(
                              "flex flex-1 gap-3",
                              highFrequency
                                ? "grid grid-cols-2 sm:grid-cols-4"
                                : "flex-wrap items-center justify-start sm:justify-end gap-x-6 gap-y-3",
                            )}
                          >
                             {day.doses.map((dose, idx) => (
                               <div
                                 key={idx}
                                 className={cn(
                                   "flex items-center gap-2",
                                   highFrequency ? "min-w-0 rounded-lg border border-[#E8E6E0]/50 bg-[#FAFAF8] px-2.5 py-2" : "min-w-[90px]",
                                 )}
                               >
                                  {highFrequency ? (
                                    <ClockIcon className="size-4 shrink-0 text-[#1A5345]" aria-hidden />
                                  ) : dose.label === "Night" || dose.label === "Evening" || dose.label === "Bedtime" ? (
                                    <MoonIcon className="size-4 text-indigo-500" aria-hidden />
                                  ) : (
                                    <SunIcon className="size-4 text-amber-500" aria-hidden />
                                  )}
                                  <div className="flex min-w-0 flex-col">
                                    <span className="mb-0.5 text-[10px] font-bold leading-none text-muted-foreground">
                                      {dose.time}
                                    </span>
                                    {dose.status === "taken" ? (
                                      <Badge className="w-fit rounded-lg border-0 bg-emerald-500 px-2 py-0.5 text-[10px] leading-none text-white shadow-none hover:bg-emerald-500">Taken</Badge>
                                    ) : (
                                      <Badge className="w-fit rounded-lg border-0 bg-rose-500 px-2 py-0.5 text-[10px] leading-none text-white shadow-none hover:bg-rose-500">Missed</Badge>
                                    )}
                                  </div>
                               </div>
                             ))}
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
