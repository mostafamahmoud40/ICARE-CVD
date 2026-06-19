export const MINIO_DEFAULT_PRESIGN_TTL_SECONDS = 900;

export type MinioStorageCategory =
  | 'chat_image'
  | 'chat_file'
  | 'lab_report'
  | 'consultation_xray'
  | 'consultation_echo'
  | 'consultation_ecg';

export const MINIO_CATEGORY_PREFIX: Record<MinioStorageCategory, string> = {
  chat_image: 'chat/images',
  chat_file: 'chat/files',
  lab_report: 'documents/lab-reports',
  consultation_xray: 'documents/consultation-xray',
  consultation_echo: 'documents/consultation-echo',
  consultation_ecg: 'documents/consultation-ecg',
};

/** Per-conversation object key prefix inside the chat bucket. */
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
