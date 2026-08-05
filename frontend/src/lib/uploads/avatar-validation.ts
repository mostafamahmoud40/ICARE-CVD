const MAX_AVATAR_BYTES = 5 * 1024 * 1024
const AVATAR_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
])

export function validatePatientAvatarFile(file: File) {
  if (!AVATAR_MIME_TYPES.has(file.type)) {
    throw new Error("Please choose a JPEG, PNG, WebP, or GIF image.")
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error("Profile photo must be 5 MB or smaller.")
  }
}
