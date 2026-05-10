"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FilterIcon, FlagIcon, PillIcon, SearchIcon, SparklesIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

import { medicationsScrollbarCss, RiskBadge } from "./assistantMedications.shared";
import { useAssistantMedications } from "./useAssistantMedications";

function formatPatientRowId(internalId: string) {
  const raw = internalId.replace(/^#/, "").trim();
  return `#${raw.toUpperCase()}`;
}

export function AssistantMedicationsList() {
  const router = useRouter();
  const vm = useAssistantMedications();

  const totalOpenFlags = vm.profiles.reduce((acc, p) => acc + p.flags.filter((f) => f.status === "open").length, 0);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#F9F8F5] animate-in fade-in duration-500">
      <div className="relative z-20 shrink-0 border-b border-[#E8E6E0]/60 bg-white">
        <div className="flex flex-col px-6 pb-4 pt-6 sm:px-8 sm:pb-5 sm:pt-8">
          <div className="mb-4 flex items-center gap-3">
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

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
            <div className="space-y-1">
              <h1 className="font-serif text-[28px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[30px] lg:text-[32px]">
                Medication adherence
              </h1>
              <p className="text-[14px] font-medium text-muted-foreground sm:text-[15px]">
                AI-assisted monitoring and clinical follow-up for patient adherence.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="hidden flex-col items-end gap-1 xl:flex">
                <span className="text-[11px] font-bold text-muted-foreground">Active flags</span>
                <div className="flex items-center gap-2">
                  <span className="text-[18px] font-bold leading-none text-rose-600 tabular-nums">{totalOpenFlags}</span>
                  <FlagIcon className="size-6 shrink-0 text-rose-600" aria-hidden />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-11 gap-2 rounded-xl border-[#E8E6E0] bg-white px-5 text-[14px] font-bold text-[#1A1F1E] shadow-sm transition-all hover:bg-[#F9F8F5]"
              >
                <FilterIcon className="size-4 text-muted-foreground" />
                Filter view
              </Button>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 pt-2 sm:mt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-[min(100%,320px)] lg:w-[380px]">
              <SearchIcon className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search patient or medication…"
                value={vm.searchTerm}
                onChange={(e) => vm.setSearchTerm(e.target.value)}
                className="h-11 rounded-2xl border-[#E8E6E0] bg-white pl-10 text-[14px] shadow-sm focus-visible:border-[#1A5345]/40 focus-visible:ring-[#1A5345]/20"
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="flex cursor-pointer items-center gap-2.5 px-1">
                <Checkbox
                  checked={vm.flaggedOnly}
                  onCheckedChange={(v) => vm.setFlaggedOnly(Boolean(v))}
                  className="rounded-md border-[#E8E6E0] data-[state=checked]:border-[#1A5345] data-[state=checked]:bg-[#1A5345]"
                />
                <span className="text-[12px] font-bold text-muted-foreground transition-colors hover:text-[#1A1F1E]">
                  Flagged only
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-2.5 px-1">
                <Checkbox
                  checked={vm.followUpOnly}
                  onCheckedChange={(v) => vm.setFollowUpOnly(Boolean(v))}
                  className="rounded-md border-[#E8E6E0] data-[state=checked]:border-[#1A5345] data-[state=checked]:bg-[#1A5345]"
                />
                <span className="text-[12px] font-bold text-muted-foreground transition-colors hover:text-[#1A1F1E]">
                  Follow-up queue only
                </span>
              </label>
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
                                      <Image
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(p.fullName.replace(/\s+/g, ""))}`}
                                        alt=""
                                        width={44}
                                        height={44}
                                        unoptimized
                                        className="size-full object-cover"
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="truncate font-serif text-[15px] font-bold leading-snug text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]">
                                        {p.fullName}
                                      </p>
                                      <p className="mt-0.5 text-[12px] font-medium tabular-nums tracking-wide text-muted-foreground">
                                        {formatPatientRowId(p.id)}
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
