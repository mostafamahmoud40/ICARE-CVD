import { validatePatientAvatarFile } from "@/lib/uploads/avatar-validation"
import { uploadAvatarViaIntent } from "@/lib/uploads/presigned-put"

export { validatePatientAvatarFile }

export async function uploadPatientAccountAvatar(file: File): Promise<string> {
  validatePatientAvatarFile(file)
  return uploadAvatarViaIntent(
    file,
    "/patient/account/avatar/upload-intent",
    "/patient/account/avatar",
  )
}
