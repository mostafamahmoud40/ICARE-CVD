import type { PatientClinicalNote, PatientFullRecord } from "../doctorPatients.types"
import type { DisplayClinicalNote } from "./patientProfile.types"

function buildClinicalNotesFromVisits(record: PatientFullRecord): PatientClinicalNote[] {
  return record.visits
    .flatMap((visit) => {
      const items: PatientClinicalNote[] = []
      if (visit.notes?.trim()) {
        items.push({
          id: `${visit.id}-notes`,
          date: visit.date,
          text: visit.notes.trim(),
          author: visit.doctorName,
        })
      }
      if (visit.chiefComplaint?.trim()) {
        items.push({
          id: `${visit.id}-complaint`,
          date: visit.date,
          text: visit.chiefComplaint.trim(),
          author: visit.doctorName,
        })
      }
      return items
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function buildAllClinicalNotes(record: PatientFullRecord): DisplayClinicalNote[] {
  const profileNotes = record.profileClinicalNotes.map((note) => ({
    ...note,
    canDelete: true,
  }))
  const visitNotes = buildClinicalNotesFromVisits(record).map((note) => ({
    ...note,
    canDelete: false,
  }))
  return [...profileNotes, ...visitNotes].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )
}
