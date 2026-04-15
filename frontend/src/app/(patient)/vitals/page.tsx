"use client"

import { useState } from "react"
import {
  ActivityIcon,
  HeartIcon,
  HeartPulseIcon,
  WeightIcon,
  SparklesIcon,
} from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AddVitalsDialog } from "./AddVitalsDialog"
import { AiAlertBanner } from "./AiAlertBanner"
import { AiSummaryBox } from "./AiSummaryBox"
import { VitalKpiCard } from "./VitalKpiCard"
import { BloodPressureChart } from "./BloodPressureChart"
import { HeartRateChart } from "./HeartRateChart"
import { AiDetailedAnalysis } from "./AiDetailedAnalysis"
import { VitalsHistoryList } from "./VitalsHistoryList"
import { useVitalsFilter, type TimeRange } from "./useVitalsFilter"
import { currentVitals, mockVitalsHistory } from "./vitals.mock"

const timeRangeOptions = [
  { key: "1W" as const, label: "Last Week" },
  { key: "1M" as const, label: "Last Month" },
  { key: "3M" as const, label: "Last 3 Months" },
] as const

export default function VitalsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [timeRange, setTimeRange] = useState<TimeRange>("3M")

  const filteredData = useVitalsFilter(mockVitalsHistory, timeRange)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsAddModalOpen(false)
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 lg:p-8">
      {/* Header Area */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="mb-1">
          <div className="mb-2 flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-[#1A1F1E] dark:text-foreground">
              Vitals & Measurements
            </h1>
            <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#E8F0ED] px-2 py-0.5 border border-[#C8D9D3] dark:border-emerald-900/50 dark:bg-emerald-950/30">
              <SparklesIcon className="size-3 text-[#1a5345] dark:text-emerald-400" />
              <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-[#1a5345] dark:text-emerald-400">
                AI-Powered Analysis
              </span>
            </div>
          </div>
          <p className="m-0 max-w-xl text-[15px] leading-relaxed text-[#6B7870] dark:text-muted-foreground">
            Our AI continuously monitors your vital trends to detect early signs of deterioration and predict health improvements.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="h-10 w-[160px] rounded-lg border-[#cfd9d5] bg-white text-[#152a24] hover:border-[#d9e5e1] hover:text-[#1a5345] focus:border-[#d9e5e1] focus:ring-0">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-[#cfd9d5] bg-white">
              {timeRangeOptions.map((option) => (
                <SelectItem
                  key={option.key}
                  value={option.key}
                  className="cursor-pointer text-[#152a24] hover:bg-[#d9e5e1] hover:text-[#1a5345] h-10"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AddVitalsDialog
            open={isAddModalOpen}
            onOpenChange={setIsAddModalOpen}
            onSubmit={handleSubmit}
          />
        </div>
      </div>

      {/* Primary AI Insights */}
      <div className="flex flex-col gap-4">
        <AiAlertBanner 
          message="AI Alert: Blood pressure reading on Mar 20 was 158/98 — higher than your normal limits. Your doctor has been automatically notified." 
        />
        <AiSummaryBox
          title="Last 3 Months AI Analysis"
          body="Systolic pressure reduced by 18% — significant improvement compared to your history. Heart rate is stable within the safe range for your age and condition. AI continues to detect a sustained positive trend."
          actionLabel1="Explain more"
          actionLabel2="Do I need a medication adjustment?"
        />
      </div>

      {/* KPI Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <VitalKpiCard
          title="Blood Pressure"
          icon={<HeartPulseIcon className="size-4" />}
          iconContainerClass="bg-[#E8F0ED] text-[#1a5345] dark:bg-emerald-950/30 dark:text-emerald-400"
          value={`${currentVitals.bloodPressure.systolic}/${currentVitals.bloodPressure.diastolic}`}
          unit="mmHg"
          trend={currentVitals.bloodPressure.trend as any}
          trendValue={currentVitals.bloodPressure.trendValue}
          trendGoodDirection="down"
          aiBadgeText="Within your normal range"
          aiBadgeType="info"
        />

        <VitalKpiCard
          title="Heart Rate"
          icon={<HeartIcon className="size-4" />}
          iconContainerClass="bg-[#F5E8E5] text-[#c45d4b] dark:bg-red-950/30 dark:text-red-400"
          value={currentVitals.heartRate.value}
          unit="bpm"
          trend={currentVitals.heartRate.trend as any}
          trendValue={currentVitals.heartRate.trendValue}
          trendGoodDirection="down"
          aiBadgeText="Stable for your age and condition"
          aiBadgeType="info"
        />

        <VitalKpiCard
          title="Blood Oxygen"
          icon={<ActivityIcon className="size-4" />}
          iconContainerClass="bg-[#E0EFF2] text-[#2d8a9e] dark:bg-cyan-950/30 dark:text-cyan-400"
          value={currentVitals.spo2.value}
          unit="%"
          trend={currentVitals.spo2.trend as any}
          trendValue={currentVitals.spo2.trendValue}
          trendGoodDirection="up"
          aiBadgeText="Excellent"
          aiBadgeType="info"
        />

        <VitalKpiCard
          title="Weight"
          icon={<WeightIcon className="size-4" />}
          iconContainerClass="bg-[#F7F1E6] text-[#8E7043] dark:bg-amber-950/30 dark:text-amber-400"
          value={currentVitals.weight.value}
          unit="kg"
          trend={currentVitals.weight.trend as any}
          trendValue={currentVitals.weight.trendValue}
          trendGoodDirection="down"
          aiBadgeText="Faster drop than usual"
          aiBadgeType="warning"
        />
      </div>

      {/* Progression Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <BloodPressureChart data={filteredData} />
        <HeartRateChart data={filteredData} />
      </div>

      {/* Detailed AI Analysis */}
      <AiDetailedAnalysis
        title="Detailed AI Analysis"
        updatedText="Updated just now"
        items={[
          { color: "green", title: "Positive trend in blood pressure", description: "The gradual reduction aligns with the effect of Lisinopril medication prescribed by your doctor." },
          { color: "orange", title: "Weight loss faster than target", description: "AI advises attention. Losing 4.5kg in one month might be a potential side effect of the new medication — Doctor notified." },
          { color: "blue", title: "Missed measurement", description: "Blood pressure log scheduled for April 12 was not recorded. Do you want to enter it now?" },
          { color: "green", title: "Compared to similar patients", description: "Your readings are better than 73% of patients your age and with your diagnosis at the same treatment stage." }
        ]}
        actionLabel1="Ask AI about weight"
        actionLabel2="Send to Doctor"
      />

      {/* Vitals History List */}
      <VitalsHistoryList data={filteredData} />
    </div>
  )
}
