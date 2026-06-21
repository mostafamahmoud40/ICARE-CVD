"use client";

import Link from "next/link";
import { PatientAvatar } from "@/components/shared/PatientAvatar";
import { useRouter } from "next/navigation";
import { FlagIcon, PillIcon, SearchIcon, SparklesIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";

import {
  medicationsListSearchInputClassName,
  medicationsScrollbarCss,
  RiskBadge,
} from "./assistantMedications.shared";
import { useAssistantMedications } from "./useAssistantMedications";
import { MedicationsListFiltersPopover } from "./MedicationsListFiltersPopover";
import { countActiveMedicationListFilters } from "./assistantMedications.filters";

function formatPatientRowId(profile: { id: string; patientNumber?: string }) {
  if (profile.patientNumber?.trim()) {
    return `#${profile.patientNumber.replace(/^#/, "").toUpperCase()}`;
  }
  const raw = profile.id.replace(/^#/, "").trim();
  return `#${raw.slice(0, 8).toUpperCase()}`;
}

export function AssistantMedicationsList() {
  const router = useRouter();
  const vm = useAssistantMedications();

  const totalOpenFlags = vm.allProfiles.reduce(
    (acc, p) => acc + p.flags.filter((f) => f.status === "open").length,
    0,
  );
  const activeFilterCount = countActiveMedicationListFilters(vm.listFilters);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#F9F8F5] animate-in fade-in duration-500">
      <div className="relative z-20 shrink-0 border-b border-[#E8E6E0]/60 bg-white">
        <div className="flex flex-col px-5 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-5">
          <div className="mb-2 flex items-center gap-2 sm:mb-2.5">
            <Breadcrumb>
              <BreadcrumbList className="text-[10px] sm:text-[11px]">
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/assistant-patients" className="text-[10px] font-medium sm:text-[11px]">
                      Patients
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-[10px] font-medium sm:text-[11px]">Medications</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
            <div className="min-w-0 space-y-0.5">
              <h1 className="font-serif text-[22px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[24px] lg:text-[26px]">
                Medication adherence
              </h1>
              <p className="text-[13px] font-medium text-muted-foreground sm:text-[14px]">
                AI-assisted monitoring and clinical follow-up for patient adherence.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="hidden flex-col items-end gap-0.5 xl:flex">
                <span className="text-[10px] font-bold text-muted-foreground sm:text-[11px]">Active flags</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[16px] font-bold leading-none text-rose-600 tabular-nums sm:text-[17px]">
                    {totalOpenFlags}
                  </span>
                  <FlagIcon className="size-5 shrink-0 text-rose-600" aria-hidden />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2 pt-1 sm:mt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
            <div className="group relative w-full sm:min-w-0 sm:flex-1 sm:max-w-[min(100%,360px)] lg:max-w-[400px]">
              <SearchIcon
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#1A5345]/35 transition-colors group-focus-within:text-[#1A5345] sm:left-4"
                strokeWidth={2}
                aria-hidden
              />
              <Input
                type="search"
                placeholder="Search patient or medication…"
                value={vm.searchTerm}
                onChange={(e) => vm.setSearchTerm(e.target.value)}
                className={medicationsListSearchInputClassName}
              />
            </div>
            <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
              {vm.hasActiveListFilters ? (
                <span className="hidden text-[11px] font-bold text-[#1A5345] sm:inline">
                  {activeFilterCount} filter{activeFilterCount === 1 ? "" : "s"} active
                </span>
              ) : null}
              <MedicationsListFiltersPopover
                filters={vm.listFilters}
                onChange={vm.setListFilters}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex-1 overflow-auto bg-[#F9F8F5] px-6 sm:px-8">
        <div className="custom-scrollbar w-full pb-6 pt-4">
          <div className="overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
            <div className="overflow-x-auto">
              <table className="min-w-[1040px] w-full border-collapse bg-white text-left">
                <thead className="sticky top-0 z-10 bg-[#F4F3ED]/90 shadow-[0_1px_0_0_#E8E6E0] backdrop-blur-md">
                  <tr className="font-serif text-[15px] font-bold text-[#1A1F1E] transition-colors">
                    <th className="py-4 pl-4 pr-4">Patient</th>
                    <th className="px-4 py-4">Risk</th>
                    <th className="px-4 py-4">Open flags</th>
                    <th className="px-4 py-4">Medications</th>
                    <th className="px-4 py-4">Adherence</th>
                    <th className="px-4 py-4">AI insights</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E6E0]/40">
                  {vm.isLoading
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i}>
                          <td className="py-4 pl-4 pr-4" colSpan={6}>
                            <Skeleton className="h-12 w-full rounded-lg" />
                          </td>
                        </tr>
                      ))
                    : vm.profiles.length === 0
                      ? (
                          <tr>
                            <td className="px-4 py-20 text-center" colSpan={6}>
                              <div className="flex flex-col items-center justify-center opacity-50">
                                <PillIcon className="mb-4 size-12 stroke-[1.25]" />
                                <p className="text-[16px] font-bold text-[#1A1F1E]">No patients match</p>
                                <p className="mt-1 text-[13px] font-medium text-muted-foreground">
                                  Try changing search or filters.
                                </p>
                              </div>
                            </td>
                          </tr>
                        )
                      : (
                          vm.profiles.map((p) => {
                            const openFlags = p.flags.filter((f) => f.status === "open").length;
                            return (
                              <tr
                                key={p.id}
                                role="link"
                                tabIndex={0}
                                className="group cursor-pointer border-t border-[#E8E6E0]/40 transition-colors hover:bg-[#F9F8F5]/50"
                                onClick={() => router.push(`/assistant-medications/${p.id}`)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    router.push(`/assistant-medications/${p.id}`);
                                  }
                                }}
                              >
                                <td className="py-4 pl-4 pr-4">
                                  <div className="flex items-start gap-3">
                                    <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E8E6E0]/60 bg-[#F4F3EF]">
                                      <PatientAvatar
                                        name={p.fullName}
                                        avatarUrl={p.avatarUrl}
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="truncate font-serif text-[15px] font-bold leading-snug text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]">
                                        {p.fullName}
                                      </p>
                                      <p className="mt-0.5 text-[12px] font-medium tabular-nums tracking-wide text-muted-foreground">
                                        {formatPatientRowId(p)}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4 align-middle">
                                  <RiskBadge tier={p.riskTier} />
                                </td>
                                <td className="px-4 py-4 align-middle">
                                  {openFlags > 0 ? (
                                    <div
                                      className="inline-flex items-center gap-1.5"
                                      aria-label={`${openFlags} open flags`}
                                    >
                                      <FlagIcon className="size-4 shrink-0 text-rose-600" aria-hidden />
                                      <span className="text-[14px] font-semibold tabular-nums text-[#1A1F1E]">{openFlags}</span>
                                    </div>
                                  ) : (
                                    <span className="text-[14px] font-semibold tabular-nums text-[#1A1F1E]">0</span>
                                  )}
                                </td>
                                <td className="px-4 py-4 align-middle">
                                  <span className="text-[14px] font-medium text-[#1A1F1E]/80">{p.medications.length}</span>
                                </td>
                                <td className="px-4 py-4 align-middle">
                                  <span
                                    className={cn(
                                      "text-[14px] font-bold tabular-nums",
                                      p.overallAdherencePct >= 85
                                        ? "text-emerald-600"
                                        : p.overallAdherencePct >= 65
                                          ? "text-amber-600"
                                          : "text-rose-600",
                                    )}
                                  >
                                    {p.overallAdherencePct}%
                                  </span>
                                </td>
                                <td className="px-4 py-4 align-middle">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {p.aiInsights.map((insight) => (
                                      <div
                                        key={insight.id}
                                        className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-violet-200/70 bg-violet-100/90 shadow-sm"
                                        title={`${insight.title} · ${insight.confidencePct}% confidence`}
                                      >
                                        <SparklesIcon className="size-4 text-violet-600" aria-hidden />
                                      </div>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: medicationsScrollbarCss() }} />
    </div>
  );
}
