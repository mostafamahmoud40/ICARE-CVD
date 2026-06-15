import type { S3StorageCategory } from './s3.constants';

export type S3UploadIntentInput = {
  fileName: string;
  contentType: string;
  category: S3StorageCategory;
};

export type S3UploadIntentResult = {
  key: string;
  uploadUrl: string;
  publicUrl?: string;
  expiresIn: number;
};

export type S3DeleteInput = {
  key: string;
};
