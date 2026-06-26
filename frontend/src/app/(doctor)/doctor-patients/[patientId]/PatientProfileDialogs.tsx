"use client"

import { emptyAllergyForm, emptyFamilyHistoryForm, emptyCareGoalForm } from "./patientProfile.types"
import type { PatientProfileState } from "./usePatientProfile"
import { PatientProfileAllergiesDialog } from "./PatientProfileAllergiesDialog"
import { PatientProfileAppointmentDialog } from "./PatientProfileAppointmentDialog"
import { PatientProfileCareGoalDialog } from "./PatientProfileCareGoalDialog"
import { PatientProfileClinicalNoteDialog } from "./PatientProfileClinicalNoteDialog"
import { PatientProfileContactDialog } from "./PatientProfileContactDialog"
import { PatientProfileDemographicsDialog } from "./PatientProfileDemographicsDialog"
import { PatientProfileFamilyHistoryDialog } from "./PatientProfileFamilyHistoryDialog"
import { PatientProfileLifestyleDialog } from "./PatientProfileLifestyleDialog"
import { PatientProfilePersonalDialog } from "./PatientProfilePersonalDialog"

type PatientProfileDialogsProps = {
  state: PatientProfileState
}

export function PatientProfileDialogs({ state }: PatientProfileDialogsProps) {
  const {
    editDialog,
    setEditDialog,
    contact,
    setContact,
    saveContact,
    isUpdating,
    demographics,
    setDemographics,
    pendingAvatarFile,
    setPendingAvatarFile,
    avatarPreviewUrl,
    avatarFileInputRef,
    handleDemographicsAvatarFileChange,
    closeDemographicsDialog,
    saveDemographics,
    personal,
    setPersonal,
    savePersonal,
    lifestyle,
    setLifestyle,
    saveLifestyle,
    allergies,
    setAllergies,
    newAllergy,
    setNewAllergy,
    addAllergyEntry,
    familyHistory,
    setFamilyHistory,
    newFamily,
    setNewFamily,
    addFamilyHistoryEntry,
    appointmentDialog,
    setAppointmentDialog,
    appointmentForm,
    setAppointmentForm,
    appointmentSlotsQuery,
    saveAppointment,
    isCreatingAppointment,
    clinicalNoteDialog,
    setClinicalNoteDialog,
    newClinicalNote,
    setNewClinicalNote,
    saveClinicalNote,
    profileExtras,
    careGoalDialog,
    setCareGoalDialog,
    newCareGoal,
    setNewCareGoal,
    saveCareGoal,
  } = state

  return (
    <>
      <PatientProfileContactDialog
        open={editDialog === "contact"}
        onOpenChange={(open) => {
          if (!open) setEditDialog(null)
        }}
        contact={contact}
        setContact={setContact}
        onSave={saveContact}
        isSaving={isUpdating}
      />
      <PatientProfileDemographicsDialog
        open={editDialog === "demographics"}
        onOpenChange={(open) => {
          if (!open) closeDemographicsDialog()
        }}
        demographics={demographics}
        setDemographics={setDemographics}
        pendingAvatarFile={pendingAvatarFile}
        setPendingAvatarFile={setPendingAvatarFile}
        avatarPreviewUrl={avatarPreviewUrl}
        avatarFileInputRef={avatarFileInputRef}
        onAvatarFileChange={handleDemographicsAvatarFileChange}
        onSave={saveDemographics}
        isSaving={isUpdating}
      />
      <PatientProfilePersonalDialog
        open={editDialog === "personal"}
        onOpenChange={(open) => {
          if (!open) setEditDialog(null)
        }}
        personal={personal}
        setPersonal={setPersonal}
        onSave={savePersonal}
        isSaving={isUpdating}
      />
      <PatientProfileLifestyleDialog
        open={editDialog === "lifestyle"}
        onOpenChange={(open) => {
          if (!open) setEditDialog(null)
        }}
        lifestyle={lifestyle}
        setLifestyle={setLifestyle}
        onSave={saveLifestyle}
        isSaving={isUpdating}
      />
      <PatientProfileAllergiesDialog
        open={editDialog === "allergies"}
        onOpenChange={(open) => {
          if (!open) {
            setEditDialog(null)
            setNewAllergy(emptyAllergyForm())
          }
        }}
        allergies={allergies}
        setAllergies={setAllergies}
        newAllergy={newAllergy}
        setNewAllergy={setNewAllergy}
        onAddEntry={addAllergyEntry}
      />
      <PatientProfileFamilyHistoryDialog
        open={editDialog === "family"}
        onOpenChange={(open) => {
          if (!open) {
            setEditDialog(null)
            setNewFamily(emptyFamilyHistoryForm())
          }
        }}
        familyHistory={familyHistory}
        setFamilyHistory={setFamilyHistory}
        newFamily={newFamily}
        setNewFamily={setNewFamily}
        onAddEntry={addFamilyHistoryEntry}
      />
      <PatientProfileAppointmentDialog
        open={appointmentDialog}
        onOpenChange={(open) => {
          setAppointmentDialog(open)
          if (!open) {
            setAppointmentForm({ date: "", time: "", type: "follow-up", notes: "" })
          }
        }}
        appointmentForm={appointmentForm}
        setAppointmentForm={setAppointmentForm}
        appointmentSlotsQuery={appointmentSlotsQuery}
        onSave={saveAppointment}
        isSaving={isCreatingAppointment}
      />
      <PatientProfileClinicalNoteDialog
        open={clinicalNoteDialog}
        onOpenChange={(open) => {
          setClinicalNoteDialog(open)
          if (!open) setNewClinicalNote("")
        }}
        note={newClinicalNote}
        setNote={setNewClinicalNote}
        onSave={saveClinicalNote}
        isSaving={profileExtras.isSavingNote}
      />
      <PatientProfileCareGoalDialog
        open={careGoalDialog}
        onOpenChange={(open) => {
          setCareGoalDialog(open)
          if (!open) setNewCareGoal(emptyCareGoalForm())
        }}
        newCareGoal={newCareGoal}
        setNewCareGoal={setNewCareGoal}
        onSave={saveCareGoal}
        isSaving={profileExtras.isSavingGoal}
      />
    </>
  )
}
