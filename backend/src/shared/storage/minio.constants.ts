export const MINIO_DEFAULT_PRESIGN_TTL_SECONDS = 900;

export type MinioStorageCategory =
  | 'chat_image'
  | 'chat_file'
  | 'lab_report'
  | 'patient_avatar'
  | 'consultation_xray'
  | 'consultation_echo'
  | 'consultation_ecg'
  | 'consultation_cine_mri'
  | 'consultation_ct'
  | 'consultation_ecg_cls'
  | 'staff_avatar';

/** @deprecated Use `buildMinioObjectPrefix` from `./minio-patient-path` for new uploads. */
export { LEGACY_MINIO_CATEGORY_PREFIX as MINIO_CATEGORY_PREFIX } from './minio-patient-path';

/** Non-patient chat fallback (e.g. assistant ↔ doctor). */
export function buildChatConversationPrefix(
  conversationId: number,
  category: MinioStorageCategory,
): string {
  const subfolder = category === 'chat_image' ? 'images' : 'files';
  return `chat/conversations/${conversationId}/${subfolder}`;
}

export const CHAT_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export const CHAT_FILE_MIME_TYPES = new Set([
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

export const CHAT_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const CHAT_FILE_MAX_BYTES = 25 * 1024 * 1024;

export const LAB_REPORT_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
]);

export const LAB_REPORT_MAX_BYTES = 25 * 1024 * 1024;

export const PATIENT_AVATAR_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export const PATIENT_AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export const XRAY_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/bmp',
  'image/tiff',
]);

export const XRAY_IMAGE_MAX_BYTES = 25 * 1024 * 1024;

export const ECHO_VIDEO_MIME_TYPES = new Set([
  'video/avi',
  'video/x-msvideo',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-matroska',
  'application/octet-stream',
]);

export const ECHO_VIDEO_MAX_BYTES = 100 * 1024 * 1024;

export const ECG_FILE_MIME_TYPES = new Set([
  'application/octet-stream',
  'text/plain',
  'application/x-wfdb',
]);

export const ECG_FILE_MAX_BYTES = 50 * 1024 * 1024;

export const CINE_MRI_NIFTI_MIME_TYPES = new Set([
  'application/octet-stream',
  'application/gzip',
  'application/x-gzip',
]);

export const CINE_MRI_IMAGE_MIME_TYPES = new Set(['image/gif', 'image/png']);

export const CINE_MRI_NIFTI_MAX_BYTES = 100 * 1024 * 1024;
export const CINE_MRI_IMAGE_MAX_BYTES = 50 * 1024 * 1024;

export const CT_NIFTI_MAX_BYTES = 150 * 1024 * 1024;
export const CT_SLICE_MAX_BYTES = 25 * 1024 * 1024;

export const ECG_CLS_IMAGE_MAX_BYTES = 25 * 1024 * 1024;
