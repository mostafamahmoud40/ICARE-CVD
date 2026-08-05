import { validatePatientAvatarFile } from "@/lib/uploads/avatar-validation"
import { uploadAvatarViaIntent } from "@/lib/uploads/presigned-put"

export { validatePatientAvatarFile }

export async function uploadDoctorAccountAvatar(file: File): Promise<string> {
  validatePatientAvatarFile(file)
  return uploadAvatarViaIntent(
    file,
    "/doctor/account/avatar/upload-intent",
    "/doctor/account/avatar",
  )
}
