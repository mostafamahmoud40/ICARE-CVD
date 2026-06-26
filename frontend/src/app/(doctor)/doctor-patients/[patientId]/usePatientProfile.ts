"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useDoctorAvailableSlots, useDoctorAppointments } from "@/app/(doctor)/doctor-appointments/useDoctorAppointments"
import type { FamilyHistoryEntry, PatientAllergyEntry, PatientFullRecord } from "../doctorPatients.types"
import { formatSmokingStatus } from "../doctorPatients.utils"
import {
  uploadDoctorPatientAvatar,
  validatePatientAvatarFile,
} from "../doctorPatients.upload"
import { usePatientProfileExtras } from "../usePatientProfileExtras"
import { useUpdateDoctorPatientProfile } from "../useUpdateDoctorPatientProfile"
import { showIcareErrorToast, showIcareToast } from "@/components/shared/icare-toast"
import { calcProfileAge, formatProfileDate } from "@/features/patient-record"
import {
  APPOINTMENT_TYPE_REASON,
  emptyAllergyForm,
  emptyCareGoalForm,
  emptyFamilyHistoryForm,
  riskConfig,
  type AllergyForm,
  type FamilyHistoryForm,
} from "./patientProfile.types"
import { buildAllClinicalNotes } from "./patientProfile.helpers"

export function usePatientProfile(record: PatientFullRecord) {
  const p = record.patient
  const queryClient = useQueryClient()
  const { updateProfile, isUpdating } = useUpdateDoctorPatientProfile(p.id)
  const profileExtras = usePatientProfileExtras(p.id)
  const { createAppointment, isCreating: isCreatingAppointment } = useDoctorAppointments()
  const risk = riskConfig[p.riskLevel]
  const age = calcProfileAge(p.dateOfBirth)
  const activeMeds = record.medications.filter((m) => m.status === "active").length
  const basePath = `/doctor-patients/${p.id}`
  const bloodTypeDisplay = p.bloodType && p.bloodType !== "—" ? p.bloodType : "—"

  const [contact, setContact] = useState({ phone: p.phone, email: p.email, address: p.address })
  const [personal, setPersonal] = useState({
    maritalStatus: p.maritalStatus,
    occupation: p.occupation,
    nationalId: p.nationalId,
  })
  const [demographics, setDemographics] = useState({
    profileImageUrl: p.profileImageUrl ?? "",
    gender: p.gender,
    bloodType: bloodTypeDisplay === "—" ? "" : bloodTypeDisplay,
  })
  const [lifestyle, setLifestyle] = useState({ smokingStatus: p.smokingStatus, bmi: p.bmi })
  const [allergies, setAllergies] = useState<PatientAllergyEntry[]>(p.allergies)
  const [familyHistory, setFamilyHistory] = useState<FamilyHistoryEntry[]>(p.familyHistory)

  useEffect(() => {
    const nextBloodType = p.bloodType && p.bloodType !== "—" ? p.bloodType : ""
    setContact({ phone: p.phone, email: p.email, address: p.address })
    setPersonal({
      maritalStatus: p.maritalStatus,
      occupation: p.occupation,
      nationalId: p.nationalId,
    })
    setDemographics({
      profileImageUrl: p.profileImageUrl ?? "",
      gender: p.gender,
      bloodType: nextBloodType,
    })
    setLifestyle({ smokingStatus: p.smokingStatus, bmi: p.bmi })
    setAllergies(p.allergies)
    setFamilyHistory(p.familyHistory)
  }, [p])

  const clinicalNotes = useMemo(() => buildAllClinicalNotes(record), [record])
  const careGoals = record.careGoals

  const [clinicalNoteDialog, setClinicalNoteDialog] = useState(false)
  const [careGoalDialog, setCareGoalDialog] = useState(false)
  const [newClinicalNote, setNewClinicalNote] = useState("")
  const [newCareGoal, setNewCareGoal] = useState(emptyCareGoalForm())

  const [editDialog, setEditDialog] = useState<
    "contact" | "personal" | "lifestyle" | "demographics" | "allergies" | "family" | null
  >(null)
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)
  const avatarFileInputRef = useRef<HTMLInputElement>(null)
  const [newAllergy, setNewAllergy] = useState<AllergyForm>(emptyAllergyForm())
  const [newFamily, setNewFamily] = useState<FamilyHistoryForm>(emptyFamilyHistoryForm())

  const [appointmentDialog, setAppointmentDialog] = useState(false)
  const [appointmentForm, setAppointmentForm] = useState({ date: "", time: "", type: "follow-up", notes: "" })
  const appointmentSlotsQuery = useDoctorAvailableSlots(appointmentForm.date, {
    enabled: appointmentDialog && Boolean(appointmentForm.date),
  })

  useEffect(() => {
    if (!pendingAvatarFile) {
      setAvatarPreviewUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(pendingAvatarFile)
    setAvatarPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [pendingAvatarFile])

  function handleDemographicsAvatarFileChange(fileList: FileList | null) {
    const file = fileList?.item(0)
    if (!file) return
    try {
      validatePatientAvatarFile(file)
      setPendingAvatarFile(file)
    } catch (err) {
      showIcareErrorToast(
        "Invalid profile photo",
        err instanceof Error ? err.message : "Could not use this image.",
      )
    }
    if (avatarFileInputRef.current) {
      avatarFileInputRef.current.value = ""
    }
  }

  function openDemographicsDialog() {
    setPendingAvatarFile(null)
    setEditDialog("demographics")
  }

  function closeDemographicsDialog() {
    setPendingAvatarFile(null)
    setEditDialog(null)
  }

  function openAppointmentDialog() {
    setAppointmentForm({ date: "", time: "", type: "follow-up", notes: "" })
    setAppointmentDialog(true)
  }

  async function saveAppointment() {
    if (!appointmentForm.date || !appointmentForm.time) return
    try {
      const [year, month, day] = appointmentForm.date.split("-").map(Number)
      const [hours, minutes] = appointmentForm.time.split(":").map(Number)
      const scheduledAt = new Date(year, month - 1, day, hours, minutes, 0, 0).toISOString()

      await createAppointment({
        patientId: p.id,
        scheduledAt,
        visitType: "clinic",
        reason: APPOINTMENT_TYPE_REASON[appointmentForm.type] ?? appointmentForm.type,
        notes: appointmentForm.notes.trim() || undefined,
      })

      showIcareToast({
        title: "Appointment scheduled",
        description: `Visit booked for ${formatProfileDate(appointmentForm.date)} at ${appointmentSlotsQuery.data?.find((s) => s.value === appointmentForm.time)?.label ?? appointmentForm.time}.`,
        variant: "success",
      })

      setAppointmentDialog(false)
      setAppointmentForm({ date: "", time: "", type: "follow-up", notes: "" })
      await queryClient.invalidateQueries({ queryKey: ["doctor-patient-record", p.id] })
    } catch {
      showIcareErrorToast(
        "Could not schedule appointment",
        "The selected slot may no longer be available. Try another time.",
      )
    }
  }

  function addAllergyEntry() {
    if (!newAllergy.allergen.trim()) return
    setAllergies((prev) => [
      ...prev,
      {
        id: `al-${Date.now()}`,
        category: newAllergy.category,
        allergen: newAllergy.allergen.trim(),
        reaction: newAllergy.reaction.trim(),
      },
    ])
    setNewAllergy(emptyAllergyForm())
  }

  function openAllergiesDialog() {
    setNewAllergy(emptyAllergyForm())
    setEditDialog("allergies")
  }

  function addFamilyHistoryEntry() {
    if (!newFamily.relationship.trim() || !newFamily.condition.trim()) return
    setFamilyHistory((prev) => [
      ...prev,
      {
        id: `fh-${Date.now()}`,
        relationship: newFamily.relationship.trim(),
        condition: newFamily.condition.trim(),
        details: newFamily.details.trim(),
      },
    ])
    setNewFamily(emptyFamilyHistoryForm())
  }

  function openFamilyHistoryDialog() {
    setNewFamily(emptyFamilyHistoryForm())
    setEditDialog("family")
  }

  async function saveClinicalNote() {
    const body = newClinicalNote.trim()
    if (!body) return
    try {
      await profileExtras.createClinicalNote({ body })
      setNewClinicalNote("")
      setClinicalNoteDialog(false)
    } catch {
      /* toast handled in hook */
    }
  }

  async function removeClinicalNote(noteId: string) {
    try {
      await profileExtras.deleteClinicalNote(noteId)
    } catch {
      /* toast handled in hook */
    }
  }

  async function saveCareGoal() {
    if (!newCareGoal.metric.trim() || !newCareGoal.target.trim()) return
    try {
      await profileExtras.createCareGoal({
        metric: newCareGoal.metric.trim(),
        target: newCareGoal.target.trim(),
        current: newCareGoal.current.trim() || undefined,
        status: newCareGoal.status,
      })
      setNewCareGoal(emptyCareGoalForm())
      setCareGoalDialog(false)
    } catch {
      /* toast handled in hook */
    }
  }

  async function removeCareGoal(goalId: string) {
    try {
      await profileExtras.deleteCareGoal(goalId)
    } catch {
      /* toast handled in hook */
    }
  }

  async function saveContact() {
    try {
      await updateProfile({
        phone: contact.phone.trim(),
        email: contact.email.trim(),
        address: contact.address.trim(),
      })
      setEditDialog(null)
    } catch {
      showIcareErrorToast("Could not save", "Contact details could not be updated.")
    }
  }

  async function savePersonal() {
    try {
      await updateProfile({
        maritalStatus: personal.maritalStatus
          ? (personal.maritalStatus as "single" | "married" | "divorced" | "widowed")
          : null,
        occupation: personal.occupation.trim(),
        nationalId: personal.nationalId.trim(),
      })
      setEditDialog(null)
    } catch {
      showIcareErrorToast("Could not save", "Personal details could not be updated.")
    }
  }

  async function saveDemographics() {
    try {
      const profilePayload: Parameters<typeof updateProfile>[0] = {
        gender: demographics.gender,
        bloodType: demographics.bloodType
          ? (demographics.bloodType as "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-")
          : null,
      }

      let uploadedAvatarUrl: string | undefined

      if (pendingAvatarFile) {
        uploadedAvatarUrl = await uploadDoctorPatientAvatar(p.id, pendingAvatarFile)
      } else {
        const initialAvatar = p.profileImageUrl ?? ""
        const nextAvatar = demographics.profileImageUrl
        if (nextAvatar !== initialAvatar) {
          profilePayload.avatarUrl = nextAvatar || undefined
        }
      }

      const updated = await updateProfile(profilePayload)
      const nextProfileImageUrl =
        uploadedAvatarUrl ??
        updated.patient.profileImageUrl ??
        demographics.profileImageUrl ??
        ""

      setDemographics({
        profileImageUrl: nextProfileImageUrl,
        gender: updated.patient.gender,
        bloodType:
          updated.patient.bloodType && updated.patient.bloodType !== "—"
            ? updated.patient.bloodType
            : "",
      })

      queryClient.setQueryData<PatientFullRecord>(["doctor-patient-record", p.id], (current) =>
        current
          ? {
              ...current,
              patient: {
                ...current.patient,
                profileImageUrl: nextProfileImageUrl,
              },
            }
          : current,
      )

      setPendingAvatarFile(null)
      setEditDialog(null)
    } catch {
      showIcareErrorToast("Could not save", "Profile photo and demographics could not be updated.")
    }
  }

  async function saveLifestyle() {
    try {
      await updateProfile({
        smokingStatus: lifestyle.smokingStatus
          ? (lifestyle.smokingStatus as
              | "never"
              | "former-5"
              | "former-10"
              | "former-15"
              | "former-20"
              | "current-5"
              | "current-10"
              | "current-15"
              | "current-20")
          : null,
      })
      setEditDialog(null)
    } catch {
      showIcareErrorToast("Could not save", "Lifestyle details could not be updated.")
    }
  }

  const smokingDisplay = formatSmokingStatus(lifestyle.smokingStatus)
  const profileAvatarUrl = demographics.profileImageUrl || p.profileImageUrl || null

  return {
    record,
    p,
    queryClient,
    updateProfile,
    isUpdating,
    profileExtras,
    createAppointment,
    isCreatingAppointment,
    risk,
    age,
    activeMeds,
    basePath,
    bloodTypeDisplay,
    contact,
    setContact,
    personal,
    setPersonal,
    demographics,
    setDemographics,
    lifestyle,
    setLifestyle,
    allergies,
    setAllergies,
    familyHistory,
    setFamilyHistory,
    clinicalNotes,
    careGoals,
    clinicalNoteDialog,
    setClinicalNoteDialog,
    careGoalDialog,
    setCareGoalDialog,
    newClinicalNote,
    setNewClinicalNote,
    newCareGoal,
    setNewCareGoal,
    editDialog,
    setEditDialog,
    pendingAvatarFile,
    setPendingAvatarFile,
    avatarPreviewUrl,
    avatarFileInputRef,
    newAllergy,
    setNewAllergy,
    newFamily,
    setNewFamily,
    appointmentDialog,
    setAppointmentDialog,
    appointmentForm,
    setAppointmentForm,
    appointmentSlotsQuery,
    handleDemographicsAvatarFileChange,
    openDemographicsDialog,
    closeDemographicsDialog,
    openAppointmentDialog,
    saveAppointment,
    addAllergyEntry,
    openAllergiesDialog,
    addFamilyHistoryEntry,
    openFamilyHistoryDialog,
    saveClinicalNote,
    removeClinicalNote,
    saveCareGoal,
    removeCareGoal,
    saveContact,
    savePersonal,
    saveDemographics,
    saveLifestyle,
    smokingDisplay,
    profileAvatarUrl,
  }
}

export type PatientProfileState = ReturnType<typeof usePatientProfile>
