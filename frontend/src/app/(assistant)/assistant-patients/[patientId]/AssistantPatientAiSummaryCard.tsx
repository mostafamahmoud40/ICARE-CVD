"use client"

import { FileTextIcon, SparklesIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export function AssistantPatientAiSummaryCard() {
  return (
<div className="px-4 sm:px-6 pt-5 pb-1">
   <Card className="rounded-2xl border border-[#E8E6E0]/80 bg-white shadow-[0_2px_8px_-4px_rgba(0,0,0,0.02)] overflow-hidden">
     <CardContent className="px-4 py-4 sm:px-5 sm:py-4.5">
       <div className="flex items-start gap-4">
         <SparklesIcon className="size-5.5 text-violet-600 mt-0.5" strokeWidth={2.5} />
         <div className="flex-1 min-w-0 flex flex-col">
           <div className="flex items-center gap-2 mb-1.5">
             <h3 className="text-[15px] font-bold text-[#1A1F1E]">AI Clinical Summary</h3>
             <Badge className="rounded-lg border-0 bg-violet-600 text-[10px] font-bold text-white px-2 py-0.5">
               Updated today
             </Badge>
           </div>
           <p className="text-[13px] font-medium text-muted-foreground leading-relaxed">
             Patient&apos;s cardiovascular risk profile has improved. LDL cholesterol is down 15% from last visit, aligning with the recent Atorvastatin dosage increase. Blood pressure remains stable. <strong className="text-[#1A1F1E]">Recommendation:</strong> Schedule follow-up lab panel in 3 months.
           </p>
           <div className="mt-2.5 flex justify-end">
             <Button className="h-6 rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 border-0 text-[10px] font-bold px-2.5 transition-colors shadow-none">
               <FileTextIcon className="size-3 mr-1" strokeWidth={2.5} />
               View Full Analysis
             </Button>
           </div>
         </div>
       </div>
     </CardContent>
   </Card>
</div>
  )
}
