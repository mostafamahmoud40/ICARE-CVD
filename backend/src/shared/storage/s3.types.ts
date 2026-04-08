export type S3FileCategory = 'documents' | 'images';

export type S3UploadIntentInput = {
  fileName: string;
  contentType: string;
  category: S3FileCategory;
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

