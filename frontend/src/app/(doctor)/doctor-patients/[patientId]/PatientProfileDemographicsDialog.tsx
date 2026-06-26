"use client"

import { CameraIcon, Loader2Icon, UserRoundIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { PATIENT_AVATAR_OPTIONS, PATIENT_BLOOD_TYPES, PATIENT_GENDERS } from "../patientProfile.constants"

import type { PatientFullRecord } from "../doctorPatients.types"

export type PatientProfileDemographicsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  demographics: {
    profileImageUrl: string
    gender: PatientFullRecord["patient"]["gender"]
    bloodType: string
  }
  setDemographics: React.Dispatch<
    React.SetStateAction<{
      profileImageUrl: string
      gender: PatientFullRecord["patient"]["gender"]
      bloodType: string
    }>
  >
  pendingAvatarFile: File | null
  setPendingAvatarFile: React.Dispatch<React.SetStateAction<File | null>>
  avatarPreviewUrl: string | null
  avatarFileInputRef: React.RefObject<HTMLInputElement | null>
  onAvatarFileChange: (files: FileList | null) => void
  onSave: () => void | Promise<void>
  isSaving: boolean
}

export function PatientProfileDemographicsDialog({
  open,
  onOpenChange,
  demographics,
  setDemographics,
  pendingAvatarFile,
  setPendingAvatarFile,
  avatarPreviewUrl,
  avatarFileInputRef,
  onAvatarFileChange,
  onSave,
  isSaving,
}: PatientProfileDemographicsDialogProps) {
  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          aria-describedby={undefined}
          className="w-full max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl border-[#E8E6E0]/60 bg-white p-0 shadow-2xl sm:max-w-[480px]"
        >
          <div className="flex flex-col gap-4 bg-white p-5 sm:p-6">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <UserRoundIcon className="size-5 shrink-0 text-[#1A5345] sm:size-6" aria-hidden />
              <DialogTitle className="text-left font-serif text-[17px] font-bold leading-tight text-[#1A1F1E]">
                Edit profile photo & demographics
              </DialogTitle>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label className="text-[12px] font-bold text-[#1A1F1E]">Profile photo</Label>
                <p className="text-[12px] text-muted-foreground">
                  Choose a preset avatar or upload a photo (JPEG, PNG, WebP, or GIF, max 5 MB).
                </p>
                <input
                  ref={avatarFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  onChange={(e) => onAvatarFileChange(e.target.files)}
                />
                <div className="flex flex-wrap items-center gap-2">
                  {avatarPreviewUrl ? (
                    <div className="size-14 overflow-hidden rounded-full border-2 border-[#1A5345] ring-2 ring-[#1A5345]/20">
                      <img src={avatarPreviewUrl} alt="" className="size-full object-cover" />
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setPendingAvatarFile(null)
                      setDemographics((d) => ({ ...d, profileImageUrl: "" }))
                    }}
                    className={cn(
                      "flex size-14 items-center justify-center rounded-full border-2 bg-slate-50 transition-colors",
                      !demographics.profileImageUrl && !pendingAvatarFile
                        ? "border-[#1A5345] ring-2 ring-[#1A5345]/20"
                        : "border-[#E8E6E0] hover:border-[#1A5345]/40",
                    )}
                    aria-label="No photo"
                  >
                    <UserRoundIcon className="size-6 text-slate-400" />
                  </button>
                  {PATIENT_AVATAR_OPTIONS.map((avatar) => (
                    <button
                      key={avatar}
                      type="button"
                      onClick={() => {
                        setPendingAvatarFile(null)
                        setDemographics((d) => ({ ...d, profileImageUrl: avatar }))
                      }}
                      className={cn(
                        "size-14 overflow-hidden rounded-full border-2 transition-colors",
                        demographics.profileImageUrl === avatar && !pendingAvatarFile
                          ? "border-[#1A5345] ring-2 ring-[#1A5345]/20"
                          : "border-[#E8E6E0] hover:border-[#1A5345]/40",
                      )}
                    >
                      <img src={avatar} alt="" className="size-full object-cover" />
                    </button>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-fit rounded-full border-[#E8E6E0] px-3 text-[12px] font-semibold text-[#1A5345] hover:bg-white"
                  onClick={() => avatarFileInputRef.current?.click()}
                >
                  <CameraIcon className="mr-1.5 size-3.5" aria-hidden />
                  Upload photo
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="demographics-gender" className="text-[12px] font-bold text-[#1A1F1E]">
                    Gender
                  </Label>
                  <Select
                    value={demographics.gender}
                    onValueChange={(value) =>
                      setDemographics((d) => ({
                        ...d,
                        gender: value as typeof d.gender,
                      }))
                    }
                  >
                    <SelectTrigger
                      id="demographics-gender"
                      className="h-10 rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[13px] shadow-sm focus:ring-[#1A5345]/20"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-[#E8E6E0]">
                      {PATIENT_GENDERS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="demographics-blood-type" className="text-[12px] font-bold text-[#1A1F1E]">
                    Blood type
                  </Label>
                  <Select
                    value={demographics.bloodType || "unset"}
                    onValueChange={(value) =>
                      setDemographics((d) => ({
                        ...d,
                        bloodType: value === "unset" ? "" : value,
                      }))
                    }
                  >
                    <SelectTrigger
                      id="demographics-blood-type"
                      className="h-10 rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[13px] shadow-sm focus:ring-[#1A5345]/20"
                    >
                      <SelectValue placeholder="Not set" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-[#E8E6E0]">
                      <SelectItem value="unset">Not set</SelectItem>
                      {PATIENT_BLOOD_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-[#E8E6E0]/80 px-3.5 text-[12px] font-semibold text-[#1A1F1E] shadow-sm hover:bg-[#FAFAF8]"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-9 rounded-xl border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-sm hover:bg-[#133F34] disabled:opacity-50"
                onClick={() => void onSave()}
                disabled={isSaving}
              >
                {isSaving ? <Loader2Icon className="size-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
  )
}
