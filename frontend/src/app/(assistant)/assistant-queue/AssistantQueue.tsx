"use client"

import { cn } from "@/lib/utils"
import { useLocale } from "next-intl"
import { useAssistantPageTranslations } from "../use-assistant-i18n"
import {
  AlertTriangleIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClockIcon,
  LogInIcon,
  PlayCircleIcon,
  SearchIcon,
  TimerIcon,
  UsersIcon,
  XIcon,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import type { QueueFilter, QueuePatient, QueueStats } from "./assistantQueue.types"
import type { DoctorLiveSnapshot } from "./assistantQueue.liveBoard"
import type { QueueNavMode } from "./queueNavMode"
import { DoctorsCheckInPanel } from "./doctors/DoctorsCheckInPanel"
import { ExpectedTodayPanel } from "./expected-today/ExpectedTodayPanel"
import { LiveDeskPanel } from "./live-desk/LiveDeskPanel"
import { PastVisitsPanel } from "./past-visits/PastVisitsPanel"
import { PatientDetailView } from "./shared/PatientDetailView"
import { QueueRow } from "./shared/QueueRow"
import { SelectPatientPlaceholder } from "./shared/SelectPatientPlaceholder"
import { StatCell } from "./shared/StatCell"

export type { QueueNavMode } from "./queueNavMode"

export type AssistantQueueProps = {
  patients: QueuePatient[]
  stats: QueueStats
  filter: QueueFilter
  setFilter: (filter: QueueFilter) => void
  searchTerm: string
  setSearchTerm: (value: string) => void
  tabCounts: Record<QueueFilter, number>
  selectedPatient: QueuePatient | null
  selectPatient: (id: string | null) => void
  clearSelection: () => void
  inClinicPatients: QueuePatient[]
  doctorLiveSnapshots: DoctorLiveSnapshot[]
  waitingTurnByQueueId: Map<string, number>
  liveBoardLoading: boolean
  onMarkArrived: (queueEntryId: string) => void
  onMoveToWaiting: (queueEntryId: string) => void
  onNoShow: (queueEntryId: string) => void
  isLoading?: boolean
  isError?: boolean
  queueNavMode: QueueNavMode
  pastVisitsPatients: QueuePatient[]
  pastVisitsLoading?: boolean
}

export function AssistantQueue({
  patients,
  stats,
  filter: _filter,
  setFilter: _setFilter,
  searchTerm,
  setSearchTerm,
  tabCounts: _tabCounts,
  selectedPatient,
  selectPatient,
  clearSelection,
  inClinicPatients: _inClinicPatients,
  doctorLiveSnapshots,
  waitingTurnByQueueId,
  liveBoardLoading,
  onMarkArrived,
  onMoveToWaiting,
  onNoShow,
  isLoading,
  isError,
  queueNavMode,
  pastVisitsPatients,
  pastVisitsLoading,
}: AssistantQueueProps) {
  const { t, ts } = useAssistantPageTranslations("queue")
  const locale = useLocale()
  const pageLoading = queueNavMode === "history" ? pastVisitsLoading : isLoading

  if (pageLoading) {
    return (
      <main className="flex h-full flex-1 items-center justify-center bg-[#F9F8F5]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-[#1A5345] border-t-transparent" />
          <p className="text-[11px] text-muted-foreground">{t("loading")}</p>
        </div>
      </main>
    )
  }

  if (isError) {
    return (
      <main className="flex h-full flex-1 items-center justify-center bg-[#F9F8F5]">
        <div className="flex flex-col items-center gap-3">
          <AlertTriangleIcon className="size-8 text-red-400" />
          <p className="text-[11px] text-red-600">{t("loadError")}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex h-full flex-1 flex-col overflow-hidden bg-[#F9F8F5]">
      {/* Header section matching the Dashboard layout */}
      <div className="relative z-20 shrink-0 border-b border-[#E8E6E0]/60 bg-gradient-to-br from-white via-[#FFFCFA] to-[#E8F0EE]/30 px-4 py-3 sm:px-6 sm:py-4">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#1A5345]/15 via-[#CC5533]/35 to-[#1A5345]/15"
          aria-hidden
        />
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1A5345] shadow-sm">
              <UsersIcon className="size-5 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-[18px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[20px]">
                {t("title")}
              </h1>
              <p className="text-[12px] font-medium text-muted-foreground">
                {new Intl.DateTimeFormat(locale, { dateStyle: "full" }).format(new Date())}
              </p>
            </div>
          </div>

          <span className="hidden items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm sm:flex">
            <span className="relative flex size-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/60 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-1.5 bg-white"></span>
            </span>
            {t("live")}
          </span>
        </div>
      </div>

      {/* Stats Bar - Only shown in Operations (Live Desk) mode */}
      {queueNavMode === "operations" && !selectedPatient && (
        <div className="shrink-0 border-b border-[#E8E6E0] bg-[#F9F8F5] p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            <StatCell
              icon={UsersIcon}
              iconColor="text-[#1A5345]"
              value={stats.totalToday}
              label={t("statTotalToday")}
            />
            <StatCell
              icon={PlayCircleIcon}
              iconColor="text-[#0F3D32]"
              value={stats.inConsultation}
              label={t("statInConsultation")}
            />
            <StatCell
              icon={ClockIcon}
              iconColor="text-amber-600"
              value={stats.inWaiting}
              label={t("statWaiting")}
            />
            <StatCell
              icon={LogInIcon}
              iconColor="text-[#9A6B2F]"
              value={stats.arrived}
              label={t("statArrived")}
            />
            <StatCell
              icon={CalendarDaysIcon}
              iconColor="text-[#4F6D64]"
              value={stats.scheduled}
              label={t("statScheduled")}
            />
            <StatCell
              icon={CheckCircle2Icon}
              iconColor="text-[#8A6230]"
              value={stats.completed}
              label={t("statCompleted")}
            />
            <StatCell
              icon={TimerIcon}
              iconColor="text-[#4F6D64]"
              value={`${stats.avgWaitMin}m`}
              label={t("statAvgWait")}
            />
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div
          className={cn(
            "flex w-full flex-col overflow-hidden border-r border-[#E8E6E0] bg-[#FAFAF8] md:w-[300px] md:shrink-0",
            queueNavMode === "doctors" || queueNavMode === "history" || queueNavMode === "schedule"
              ? "hidden"
              : "",
            selectedPatient ? "hidden md:flex" : "",
          )}
        >
          <div className="shrink-0 space-y-2.5 border-b border-[#E8E6E0] p-3">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#9CA3AF]" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="h-8 border-[#E8E6E0] bg-white pl-8 text-[11px] placeholder:text-[#9CA3AF]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7870]"
                  aria-label={ts("clearSearch")}
                >
                  <XIcon className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {patients.length > 0 ? (
              <div className="space-y-2">
                {patients.map((p, idx) => (
                  <QueueRow
                    key={p.queueEntryId}
                    patient={p}
                    position={idx}
                    waitingTurn={
                      p.status === "waiting"
                        ? (waitingTurnByQueueId.get(p.queueEntryId) ?? null)
                        : null
                    }
                    isSelected={selectedPatient?.queueEntryId === p.queueEntryId}
                    onSelect={() => selectPatient(p.queueEntryId)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E5EEEA] bg-white py-8">
                <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-[#F5F5F3]">
                  <UsersIcon className="size-5 text-[#9CA3AF]" />
                </div>
                <p className="px-3 text-center text-[10px] text-[#6B7870]">
                  {queueNavMode === "schedule"
                    ? t("noPendingArrivals")
                    : t("noPatientsInCategory")}
                </p>
              </div>
            )}
          </div>
        </div>

        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-hidden",
            selectedPatient || queueNavMode === "history" || queueNavMode === "doctors" || queueNavMode === "schedule"
              ? "flex"
              : "hidden md:flex",
          )}
        >
          {selectedPatient ? (
            <PatientDetailView
              patient={selectedPatient}
              onBack={clearSelection}
              onMarkArrived={onMarkArrived}
              onMoveToWaiting={onMoveToWaiting}
              onNoShow={onNoShow}
            />
          ) : queueNavMode === "operations" ? (
            <LiveDeskPanel
              snapshots={doctorLiveSnapshots}
              waitingTurnByQueueId={waitingTurnByQueueId}
              liveBoardLoading={liveBoardLoading}
              onSelectPatient={(id) => selectPatient(id)}
            />
          ) : queueNavMode === "schedule" ? (
            <ExpectedTodayPanel
              patients={patients.filter((p) => p.status === "scheduled")}
              onSelectPatient={(id) => selectPatient(id)}
            />
          ) : queueNavMode === "history" ? (
            <PastVisitsPanel
              patients={pastVisitsPatients}
              onSelectPatient={(id) => selectPatient(id)}
              onMarkArrived={onMarkArrived}
            />
          ) : queueNavMode === "doctors" ? (
            <DoctorsCheckInPanel />
          ) : (
            <SelectPatientPlaceholder />
          )}
        </div>
      </div>
    </main>
  )
}
