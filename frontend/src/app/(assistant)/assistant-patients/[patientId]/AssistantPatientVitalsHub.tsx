"use client"

import {
  ActivityIcon,
  CalendarIcon,
  ClockIcon,
  CopyIcon,
  EyeIcon,
  MoreVerticalIcon,
  PlusIcon,
  Printer,
  Trash2Icon,
  UserIcon,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend as RechartsLegend,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { showIcareToast } from "@/components/shared/icare-toast"
import type {
  AssistantPatientSummary,
  AssistantVitalsHistoryRow,
  AssistantVitalsTrendPoint,
} from "./assistantPatientProfile.types"
import { VITALS_TABLE_GRID } from "./assistantPatientProfile.constants"
import {
  copyAssistantPatientRowToClipboard as copyToClipboard,
  vitalsRowClipboardText,
} from "./assistantPatientProfile.clipboard"
import { AssistantPatientVitalReadingDialog } from "./AssistantPatientVitalReadingDialog"

type AssistantPatientVitalsHubProps = {
  vitalsHistory: AssistantVitalsHistoryRow[]
  vitalsTrend: AssistantVitalsTrendPoint[]
  patient: Pick<AssistantPatientSummary, "name">
  vitalReadingDetail: AssistantVitalsHistoryRow | null
  onVitalReadingDetailChange: (row: AssistantVitalsHistoryRow | null) => void
  onAddVitalsOpen: () => void
  emptyHubMessage: (section: string) => string
}

export function AssistantPatientVitalsHub({
  vitalsHistory,
  vitalsTrend,
  patient,
  vitalReadingDetail,
  onVitalReadingDetailChange,
  onAddVitalsOpen,
  emptyHubMessage,
}: AssistantPatientVitalsHubProps) {
  return (
<div className="w-full px-4 sm:px-8 py-8 flex flex-col gap-6">
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-[20px] font-bold text-[#1A1F1E] tracking-tight">Vitals History</h2>
      <p className="text-[13px] font-medium text-muted-foreground mt-1">Recorded physical examinations over time</p>
    </div>
    <Button 
      onClick={() => onAddVitalsOpen()}
      className="h-8 rounded-lg bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-sm transition-all hover:bg-[#0F3D32] border-0"
    >
      <PlusIcon className="size-4 mr-2" strokeWidth={2.5} />
      Add Reading
    </Button>
  </div>

  {/* Vitals Trend Chart Card */}
  <div className="rounded-2xl border border-[#E8E6E0]/80 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] p-6 overflow-hidden">
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-2.5">
        <ActivityIcon className="size-5 text-[#1A5345] stroke-[2.5]" />
        <h3 className="text-[16px] font-bold text-[#1A1F1E]">Vitals trend</h3>
      </div>
      <Badge className="rounded-lg border-0 bg-[#1A5345] px-2.5 py-1 text-[11px] font-bold text-white">
        All recorded measurements
      </Badge>
    </div>

    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={vitalsTrend} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E6E0" />
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }} 
            domain={[60, 160]}
            ticks={[60, 80, 100, 120, 140, 160]}
          />
          <Tooltip 
            contentStyle={{ borderRadius: "12px", border: "1px solid #E8E6E0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
          />
          <RechartsLegend 
            verticalAlign="top" 
            align="center" 
            iconType="rect" 
            height={40}
            formatter={(value) => <span className="text-[13px] font-bold text-[#64748b] ml-1 capitalize">{value}</span>}
          />
          <Line 
            type="monotone" 
            dataKey="systolic" 
            name="Systolic"
            stroke="#ef4444" 
            strokeWidth={3} 
            dot={{ r: 6, fill: "#ef4444", strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 8, strokeWidth: 0 }}
          />
          <Line 
            type="monotone" 
            dataKey="diastolic" 
            name="Diastolic"
            stroke="#3b82f6" 
            strokeWidth={3} 
            dot={{ r: 6, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 8, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>

  <div className="overflow-hidden rounded-2xl border border-[#E8E6E0]/80 bg-white shadow-sm">
    <div className="overflow-x-auto custom-scrollbar">
      <div className="min-w-[1100px]">
        <div
          className={`${VITALS_TABLE_GRID} border-b border-[#E8E6E0]/80 bg-[#F9F8F5] py-3.5 text-left`}
          role="row"
        >
          <span className="text-[13px] font-bold text-[#1A1F1E] px-6">Date</span>
          <span className="text-[13px] font-bold text-[#1A1F1E]">Time</span>
          <span className="text-[13px] font-bold text-[#1A1F1E]">BP</span>
          <span className="text-[13px] font-bold text-[#1A1F1E]">HR</span>
          <span className="text-[13px] font-bold text-[#1A1F1E]">Temp</span>
          <span className="text-[13px] font-bold text-[#1A1F1E]">SpO2</span>
          <span className="text-[13px] font-bold text-[#1A1F1E]">Glu</span>
          <span className="text-[13px] font-bold text-[#1A1F1E]">Wgt</span>
          <span className="text-[13px] font-bold text-[#1A1F1E]">Taken by</span>
          <span className="sr-only">Actions</span>
        </div>

        {vitalsHistory.length === 0 ? (
          <tr>
            <td colSpan={8} className="px-5 py-10 text-center text-[14px] font-medium text-muted-foreground">
              {emptyHubMessage("vitals readings")}
            </td>
          </tr>
        ) : vitalsHistory.map((vh) => (
          <div
            key={vh.id}
            role="row"
            className={`${VITALS_TABLE_GRID} group cursor-pointer border-b border-[#E8E6E0]/50 py-4 last:border-b-0 transition-colors hover:bg-[#F9F8F5]/70`}
          >
            <div className="flex min-w-0 items-center gap-2 px-6">
              <CalendarIcon className="size-4 shrink-0 text-[#1A5345]/70" aria-hidden />
              <span className="text-[14px] font-bold tabular-nums text-[#1A1F1E]">{vh.date}</span>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <ClockIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="text-[13px] font-semibold tabular-nums text-[#1A1F1E]">{vh.time}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-bold tabular-nums text-[#1A5345]">{vh.bp}</span>
              <span className="text-[10px] text-muted-foreground font-medium">mmHg</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-bold tabular-nums text-[#1A1F1E]">{vh.hr}</span>
              <span className="text-[10px] text-muted-foreground font-medium">bpm</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-bold tabular-nums text-[#1A1F1E]">{vh.temp}</span>
              <span className="text-[10px] text-muted-foreground font-medium">°C</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-bold tabular-nums text-[#1A1F1E]">{vh.spo2}</span>
              <span className="text-[10px] text-muted-foreground font-medium">%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-bold tabular-nums text-[#1A1F1E]">{vh.glucose}</span>
              <span className="text-[10px] text-muted-foreground font-medium">mg/dL</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-bold tabular-nums text-[#1A1F1E]">{vh.weight}</span>
              <span className="text-[10px] text-muted-foreground font-medium">kg</span>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <UserIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="min-w-0 truncate text-[13px] font-medium font-serif text-[#1A1F1E]">{vh.takenBy}</span>
            </div>
            <div className="flex justify-end pr-6">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-lg text-muted-foreground group-hover:bg-white group-hover:text-[#1A1F1E]"
                    aria-label={`More actions for ${vh.date}`}
                  >
                    <MoreVerticalIcon className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 rounded-xl border-[#E8E6E0]/80 p-1.5 shadow-lg"
                >
                  <DropdownMenuItem
                    className="cursor-pointer gap-2 rounded-lg text-[13px] font-medium"
                    onClick={() => onVitalReadingDetailChange(vh)}
                  >
                    <EyeIcon className="size-4 text-[#1A5345]" />
                    View reading
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer gap-2 rounded-lg text-[13px] font-medium"
                    onClick={() =>
                      void copyToClipboard(
                        "Vitals copied",
                        vitalsRowClipboardText(vh, patient.name)
                      )
                    }
                  >
                    <CopyIcon className="size-4 text-muted-foreground" />
                    Copy values
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#E8E6E0]/60" />
                  <DropdownMenuItem
                    className="cursor-pointer gap-2 rounded-lg text-[13px] font-medium"
                    onClick={() =>
                      showIcareToast({
                        title: "Print & PDF export",
                        description:
                          "Reporting will be available when the chart is connected to the document service.",
                        icon: Printer,
                      })
                    }
                  >
                    <Printer className="size-4 text-muted-foreground" />
                    Print / save as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer gap-2 rounded-lg text-[13px] font-medium text-red-600 focus:bg-red-50 focus:text-red-600"
                    onClick={() =>
                      showIcareToast({
                        title: "Remove reading",
                        description:
                          "Deleting vitals requires clinical permissions. Use the connected EHR when available.",
                        icon: Trash2Icon,
                      })
                    }
                  >
                    <Trash2Icon className="size-4" />
                    Remove from chart…
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>

  <AssistantPatientVitalReadingDialog
    reading={vitalReadingDetail}
    patientName={patient.name}
    onClose={() => onVitalReadingDetailChange(null)}
  />
</div>
  )
}
