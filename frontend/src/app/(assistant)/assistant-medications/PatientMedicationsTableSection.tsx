"use client";

import type { ReactNode } from "react";
import {
  BeakerIcon,
  ClockIcon,
  PillIcon,
  SyringeIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MedicationLine, MedicationType } from "./assistantMedications.types";
import { MedicationDots } from "./assistantMedications.shared";

export function MedicationTypeIcon({
  type,
  className,
}: {
  type?: MedicationType;
  className?: string;
}) {
  if (type === "injection") return <SyringeIcon className={cn("text-sky-500", className)} />;
  if (type === "solution") return <BeakerIcon className={cn("text-purple-500", className)} />;
  return (
    <svg
      className={cn("drop-shadow-sm", className)}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <g transform="rotate(-45 12 12)">
        <path d="M7 12V8C7 5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8V12H7Z" fill="#3B82F6" />
        <path d="M7 12V16C7 18.7614 9.23858 21 12 21C14.7614 21 17 18.7614 17 16V12H7Z" fill="#EF4444" />
        <line x1="7" y1="12" x2="17" y2="12" stroke="white" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

export type PastMedicationTableRow = {
  id: string;
  name: string;
  strength: string;
  dosageInstructions: string;
  statusLabel: string;
};

type PatientMedicationsTableSectionProps = {
  medications: MedicationLine[];
  pastMedications?: PastMedicationTableRow[];
  medicationsTab: "active" | "past";
  onMedicationsTabChange: (tab: "active" | "past") => void;
  toolbarEnd?: ReactNode;
  onViewActiveRecord?: (med: MedicationLine) => void;
  onViewPastRecord?: (row: PastMedicationTableRow) => void;
  renderActiveActions?: (med: MedicationLine) => ReactNode;
};

export function PatientMedicationsTableSection({
  medications,
  pastMedications = [],
  medicationsTab,
  onMedicationsTabChange,
  toolbarEnd,
  onViewActiveRecord,
  onViewPastRecord,
  renderActiveActions,
}: PatientMedicationsTableSectionProps) {
  return (
    <section>
      <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <PillIcon className="size-5 text-[#1A5345]" aria-hidden />
            <h3 className="text-[18px] font-bold text-[#1A1F1E]">Medications</h3>
          </div>
          <div className="flex items-center rounded-lg border border-[#E8E6E0] bg-[#F9F8F5] p-0.5 shadow-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMedicationsTabChange("active")}
              className={cn(
                "h-7 rounded-md px-3 text-[11px] font-bold transition-all",
                medicationsTab === "active"
                  ? "bg-white text-[#1A1F1E] shadow-sm"
                  : "text-muted-foreground hover:text-[#1A1F1E]",
              )}
            >
              Active
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMedicationsTabChange("past")}
              className={cn(
                "h-7 rounded-md px-3 text-[11px] font-bold transition-all",
                medicationsTab === "past"
                  ? "bg-white text-[#1A1F1E] shadow-sm"
                  : "text-muted-foreground hover:text-[#1A1F1E]",
              )}
            >
              Past & History
            </Button>
          </div>
        </div>
        {toolbarEnd}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E8E6E0]/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#E8E6E0]/60 bg-[#F9F8F5]">
                <th className="px-5 py-4 text-[13px] font-bold tracking-normal text-[#1A1F1E]">Drug name</th>
                <th className="px-5 py-4 text-[13px] font-bold tracking-normal text-[#1A1F1E]">Dosage</th>
                <th className="px-5 py-4 text-[13px] font-bold tracking-normal text-[#1A1F1E]">7-day adherence</th>
                <th className="px-5 py-4 text-right text-[13px] font-bold tracking-normal text-[#1A1F1E]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E6E0]/40">
              {medicationsTab === "active" ? (
                medications.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-[13px] font-medium text-muted-foreground">
                      No active medications on file.
                    </td>
                  </tr>
                ) : (
                  medications.map((med) => (
                    <tr key={med.id} className="group transition-colors hover:bg-[#F9F8F5]/30">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <p className="text-[14px] font-bold text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]">
                            {med.name}
                          </p>
                          <MedicationTypeIcon type={med.type} className="size-[18px] shrink-0 opacity-90" />
                        </div>
                        <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{med.strength}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="max-w-[200px] text-[13px] font-medium leading-relaxed text-[#1A1F1E]/80">
                          {med.dosageInstructions}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex max-w-[148px] flex-col gap-1.5">
                          <MedicationDots history={med.adherenceHistory7d} />
                          <div className="flex items-center gap-2">
                            <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-[#E8E6E0]">
                              <div
                                className={cn(
                                  "h-full rounded-full bg-emerald-500",
                                  med.adherencePct7d < 85 && "bg-amber-500",
                                  med.adherencePct7d < 65 && "bg-rose-500",
                                )}
                                style={{ width: `${med.adherencePct7d}%` }}
                              />
                            </div>
                            <span className="shrink-0 text-[10px] font-bold tabular-nums text-muted-foreground">
                              {med.adherencePct7d}%
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {renderActiveActions ? (
                          renderActiveActions(med)
                        ) : onViewActiveRecord ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewActiveRecord(med)}
                            className="h-8 rounded-lg text-[11px] font-bold text-[#1A5345] hover:bg-[#1A5345]/5"
                          >
                            <ClockIcon className="mr-1.5 size-3.5" />
                            View history
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )
              ) : pastMedications.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-[13px] font-medium text-muted-foreground">
                    No past medications on file.
                  </td>
                </tr>
              ) : (
                pastMedications.map((row) => (
                  <tr key={row.id} className="group transition-colors hover:bg-[#F9F8F5]/30">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-bold text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]">
                          {row.name}
                        </p>
                        <MedicationTypeIcon type="pill" className="size-[18px] shrink-0 opacity-60 grayscale" />
                      </div>
                      <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{row.strength}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="max-w-[200px] text-[13px] font-medium leading-relaxed text-[#1A1F1E]/80">
                        {row.dosageInstructions}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="secondary" className="border-0 bg-slate-100 text-[10px] font-bold text-slate-600">
                        {row.statusLabel}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {onViewPastRecord ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewPastRecord(row)}
                          className="h-8 rounded-lg text-[11px] font-bold text-[#1A5345] hover:bg-[#1A5345]/5"
                        >
                          <ClockIcon className="mr-1.5 size-3.5" />
                          View record
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
