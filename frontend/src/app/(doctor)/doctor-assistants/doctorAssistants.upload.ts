import { validatePatientAvatarFile } from "@/lib/uploads/avatar-validation"
import { uploadAvatarViaIntent } from "@/lib/uploads/presigned-put"

export { validatePatientAvatarFile }

export async function uploadDoctorAssistantAvatar(
  assistantUserId: number,
  file: File,
): Promise<string> {
  validatePatientAvatarFile(file)
  return uploadAvatarViaIntent(
    file,
    `/doctor/assistants/${assistantUserId}/avatar/upload-intent`,
    `/doctor/assistants/${assistantUserId}/avatar`,
  )
}
