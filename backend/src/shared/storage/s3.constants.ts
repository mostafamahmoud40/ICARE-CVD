export const S3_DEFAULT_PRESIGN_TTL_SECONDS = 900;

export const S3_CATEGORY_PREFIX: Record<
  'lab_report' | 'imaging' | 'ecg' | 'prescription' | 'referral' | 'other',
  string
> = {
  lab_report: 'documents/lab-reports',
  imaging: 'documents/imaging',
  ecg: 'documents/ecg',
  prescription: 'documents/prescriptions',
  referral: 'documents/referrals',
  other: 'documents/other',
};
