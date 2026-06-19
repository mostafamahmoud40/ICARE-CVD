import type { MinioStorageCategory } from './minio.constants';

export type MinioUploadIntentInput = {
  fileName: string;
  contentType: string;
  category: MinioStorageCategory;
  /** Required for chat attachments. */
  conversationId?: number;
  /** Required for patient lab reports. */
  patientId?: string;
};

export type MinioUploadIntentResult = {
  key: string;
  uploadUrl: string;
  publicUrl?: string;
  expiresIn: number;
};

export type MinioDownloadUrlInput = {
  key: string;
};
