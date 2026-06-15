export const S3_DEFAULT_PRESIGN_TTL_SECONDS = 900;

export type S3StorageCategory =
  | 'lab_report'
  | 'imaging'
  | 'ecg'
  | 'prescription'
  | 'referral'
  | 'other'
  | 'chat_image'
  | 'chat_file';

export const S3_CATEGORY_PREFIX: Record<S3StorageCategory, string> = {
  lab_report: 'documents/lab-reports',
  imaging: 'documents/imaging',
  ecg: 'documents/ecg',
  prescription: 'documents/prescriptions',
  referral: 'documents/referrals',
  other: 'documents/other',
  chat_image: 'chat/images',
  chat_file: 'chat/files',
};
