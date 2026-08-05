"use client"

import Link from "next/link"
import { ChevronLeftIcon, PillIcon } from "lucide-react"
import { useDoctorMedicationAdherence } from "./useDoctorMedicationAdherence"

import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Skeleton } from "@/components/ui/skeleton"
import { DoctorPatientRecordShell } from "../../../DoctorPatientRecordShell"
import type { MedicationRecord } from "../../../doctorPatients.types"

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso))
}

function MedicationDetailContent({
  patientId,
  medication,
}: {
  patientId: string
  medication: MedicationRecord
}) {
  const adherenceQuery = useDoctorMedicationAdherence(medication.id)

  const takenLogs =
    adherenceQuery.data?.doseLogs.filter((log) => !log.skipped).length ?? 0
  const totalLogs = adherenceQuery.data?.doseLogs.length ?? 0

  return (
    <div className="flex min-h-screen flex-col bg-[#F9F8F5]">
      <div className="border-b border-[#E8E6E0]/60 bg-white px-6 py-4 sm:px-8">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/doctor-patients" className="text-[11px] font-medium">
                  Patients
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/doctor-patients/${patientId}`} className="text-[11px] font-medium">
                  Patient Profile
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  href={`/doctor-patients/${patientId}/medications`}
                  className="text-[11px] font-medium"
                >
                  Medications
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-[11px] font-bold text-[#1A5345]">
                {medication.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="size-10 rounded-xl border border-[#E8E6E0]/60"
          >
            <Link href={`/doctor-patients/${patientId}/medications`}>
              <ChevronLeftIcon className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-serif text-[24px] font-bold text-[#102F27]">{medication.name}</h1>
            <p className="mt-0.5 text-[13px] font-medium text-[#6B7870]">
              {medication.dose} · {medication.frequency}
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1 px-6 py-8 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-3xl border border-[#E8E6E0]/60 bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="font-serif text-[18px] font-bold text-[#102F27]">Adherence (30 days)</h2>
            {adherenceQuery.isLoading ? (
              <Skeleton className="mt-4 h-24 w-full" />
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-[#F9FBFB] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7870]">
                    Adherence
                  </p>
                  <p className="mt-1 text-2xl font-bold text-[#1A5345]">
                    {medication.adherencePercent ?? adherenceQuery.data?.medication.adherencePercent ?? 0}%
                  </p>
                </div>
                <div className="rounded-2xl bg-[#F9FBFB] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7870]">
                    Doses logged
                  </p>
                  <p className="mt-1 text-2xl font-bold text-[#102F27]">
                    {takenLogs}/{totalLogs || "—"}
                  </p>
                </div>
                <div className="rounded-2xl bg-[#F9FBFB] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7870]">
                    Last taken
                  </p>
                  <p className="mt-1 text-lg font-bold text-[#102F27]">
                    {fmtDate(medication.lastTakenAt)}
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-[#E8E6E0]/60 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <PillIcon className="size-4 text-[#1A5345]" />
              <h2 className="font-serif text-[18px] font-bold text-[#102F27]">Prescription</h2>
            </div>
            <div className="space-y-3 text-[13px]">
              <div className="flex justify-between gap-3">
                <span className="text-[#6B7870]">Prescribed by</span>
                <span className="font-bold text-[#102F27]">{medication.prescribedBy}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-[#6B7870]">Prescribed on</span>
                <span className="font-bold text-[#102F27]">{fmtDate(medication.prescribedAt)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-[#6B7870]">Status</span>
                <span className="font-bold capitalize text-[#102F27]">{medication.status}</span>
              </div>
              {medication.instructions ? (
                <div>
                  <p className="text-[#6B7870]">Instructions</p>
                  <p className="mt-1 font-medium leading-relaxed text-[#102F27]">
                    {medication.instructions}
                  </p>
                </div>
              ) : null}
              {medication.sideEffects ? (
                <div>
                  <p className="text-[#6B7870]">Notes / side effects</p>
                  <p className="mt-1 font-medium leading-relaxed text-[#102F27]">
                    {medication.sideEffects}
                  </p>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export function MedicationDetailRoute({
  patientId,
  medicationId,
}: {
  patientId: string
  medicationId: string
}) {
  return (
    <DoctorPatientRecordShell patientId={patientId}>
      {(record) => {
        const medication = record.medications.find((med) => med.id === medicationId)
        if (!medication) {
          return (
            <main className="flex flex-1 items-center justify-center bg-[#F9F8F5] p-8">
              <div className="text-center">
                <p className="text-[14px] font-semibold text-[#102F27]">Medication not found</p>
                <Button asChild variant="outline" className="mt-4">
                  <Link href={`/doctor-patients/${patientId}/medications`}>Back to medications</Link>
                </Button>
              </div>
            </main>
          )
        }

        return <MedicationDetailContent patientId={patientId} medication={medication} />
      }}
    </DoctorPatientRecordShell>
  )
}
