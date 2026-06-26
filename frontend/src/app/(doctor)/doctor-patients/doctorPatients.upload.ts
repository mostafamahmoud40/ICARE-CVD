import { validatePatientAvatarFile } from "@/lib/uploads/avatar-validation"
import { uploadAvatarViaIntent } from "@/lib/uploads/presigned-put"

export { validatePatientAvatarFile }

export async function uploadDoctorPatientAvatar(
  patientId: string,
  file: File,
): Promise<string> {
  validatePatientAvatarFile(file)
  return uploadAvatarViaIntent(
    file,
    `/doctor/patients/${patientId}/avatar/upload-intent`,
    `/doctor/patients/${patientId}/avatar`,
  )
}
