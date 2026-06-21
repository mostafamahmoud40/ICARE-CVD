import type { MinioStorageCategory } from './minio.constants';

export type MinioUploadIntentInput = {
  fileName: string;
  contentType: string;
  category: MinioStorageCategory;
  /** Required for chat attachments when no patientNumber is set. */
  conversationId?: number;
  /** Patient UUID — kept for DB linkage in callers. */
  patientId?: string;
  /** Human-readable MRN (e.g. P-001) — used for object key paths. */
  patientNumber?: string;
  /** Doctor or assistant UUID — used for staff avatar paths. */
  staffId?: string;
  staffRole?: 'doctor' | 'assistant';
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
