import type { MinioStorageCategory } from './minio.constants';

export type MinioUploadIntentInput = {
  fileName: string;
  contentType: string;
  category: MinioStorageCategory;
  conversationId: number;
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
