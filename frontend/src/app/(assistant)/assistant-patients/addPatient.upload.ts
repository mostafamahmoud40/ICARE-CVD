import {
  studyKindToPayload,
  type StudyKind,
} from "../assistant-queue/assistantQueue.documents.types"
import { validatePatientAvatarFile } from "@/lib/uploads/avatar-validation"
import {
  uploadAvatarViaIntent,
  uploadDocumentViaIntent,
} from "@/lib/uploads/presigned-put"

export { validatePatientAvatarFile }

export async function uploadPatientAvatar(
  patientId: string,
  file: File,
): Promise<string> {
  validatePatientAvatarFile(file)
  return uploadAvatarViaIntent(
    file,
    `/assistant/patients/${patientId}/avatar/upload-intent`,
    `/assistant/patients/${patientId}/avatar`,
  )
}

export async function uploadAssistantPatientDocument(
  patientId: string,
  file: File,
  studyKind: StudyKind,
) {
  const { intentCategory, registerCategory, title } = studyKindToPayload(
    studyKind,
    file.name,
  )

  await uploadDocumentViaIntent(
    file,
    "/documents/upload-intent",
    `/assistant/patients/${patientId}/documents`,
    { category: intentCategory },
    { category: registerCategory, title },
  )
}
