import type { MinioStorageCategory } from './minio.constants';

/** Root folder inside the `icare-chat` bucket. */
export const PATIENTS_STORAGE_ROOT = 'patients';

export type PatientStorageFolder =
  | 'profile'
  | 'chat'
  | 'labs'
  | 'imaging'
  | 'documents';

/** Patient document categories stored in `patient_document`. */
export type PatientDocumentCategory =
  | 'lab_report'
  | 'imaging'
  | 'ecg'
  | 'prescription'
  | 'referral'
  | 'other';

const REGISTRATION_DOCUMENT_ROOT = 'registration/documents';

/** Legacy flat prefixes kept for reading old keys still stored in the DB. */
export const LEGACY_MINIO_CATEGORY_PREFIX: Record<MinioStorageCategory, string> = {
  chat_image: 'chat/images',
  chat_file: 'chat/files',
  lab_report: 'documents/lab-reports',
  patient_avatar: 'documents/patient-avatars',
  consultation_xray: 'documents/consultation-xray',
  consultation_echo: 'documents/consultation-echo',
  consultation_ecg: 'documents/consultation-ecg',
  consultation_cine_mri: 'documents/consultation-cine-mri',
  consultation_ct: 'documents/consultation-ct',
  consultation_ecg_cls: 'documents/consultation-ecg-cls',
  staff_avatar: 'staff',
};

export function normalizePatientNumber(patientNumber: string): string {
  return patientNumber.trim().toUpperCase();
}

export function buildPatientStoragePrefix(
  patientNumber: string,
  folder: PatientStorageFolder,
  ...subfolders: string[]
): string {
  const segments = [
    PATIENTS_STORAGE_ROOT,
    normalizePatientNumber(patientNumber),
    folder,
    ...subfolders.map((part) => part.trim()).filter(Boolean),
  ];
  return segments.join('/');
}

export function buildPatientDocumentPrefix(
  patientNumber: string,
  category: PatientDocumentCategory,
): string {
  const pn = normalizePatientNumber(patientNumber);
  if (category === 'lab_report') {
    return buildPatientStoragePrefix(pn, 'labs');
  }
  return buildPatientStoragePrefix(pn, 'documents', category);
}

export function buildRegistrationDocumentPrefix(
  category: PatientDocumentCategory,
): string {
  const folder = category === 'lab_report' ? 'lab-reports' : category;
  return `${REGISTRATION_DOCUMENT_ROOT}/${folder}`;
}

/** True when the key belongs to this app's MinIO bucket layout (incl. legacy flat keys). */
export function isMinioObjectKey(key: string, patientNumber?: string): boolean {
  const trimmed = key.trim();
  if (!trimmed) return false;

  if (
    trimmed.startsWith(`${PATIENTS_STORAGE_ROOT}/`) ||
    trimmed.startsWith(`${REGISTRATION_DOCUMENT_ROOT}/`) ||
    trimmed.startsWith('staff/') ||
    trimmed.startsWith('chat/')
  ) {
    return true;
  }

  if (trimmed.startsWith('documents/')) {
    return true;
  }

  if (patientNumber) {
    const pn = normalizePatientNumber(patientNumber);
    return trimmed.includes(`/${pn}/`);
  }

  return false;
}

export function buildMinioObjectPrefix(
  category: MinioStorageCategory,
  patientNumber: string,
): string {
  const pn = normalizePatientNumber(patientNumber);

  switch (category) {
    case 'patient_avatar':
      return buildPatientStoragePrefix(pn, 'profile');
    case 'lab_report':
      return buildPatientStoragePrefix(pn, 'labs');
    case 'chat_image':
      return buildPatientStoragePrefix(pn, 'chat', 'images');
    case 'chat_file':
      return buildPatientStoragePrefix(pn, 'chat', 'files');
    case 'consultation_xray':
      return buildPatientStoragePrefix(pn, 'imaging', 'xray');
    case 'consultation_echo':
      return buildPatientStoragePrefix(pn, 'imaging', 'echo');
    case 'consultation_ecg':
      return buildPatientStoragePrefix(pn, 'imaging', 'ecg');
    case 'consultation_cine_mri':
      return buildPatientStoragePrefix(pn, 'imaging', 'cine-mri');
    case 'consultation_ct':
      return buildPatientStoragePrefix(pn, 'imaging', 'ct');
    case 'consultation_ecg_cls':
      return buildPatientStoragePrefix(pn, 'imaging', 'ecg-cls');
    default:
      return buildPatientStoragePrefix(pn, 'documents');
  }
}

export function isMinioKeyForCategory(
  key: string,
  category: MinioStorageCategory,
  patientNumber?: string,
): boolean {
  const trimmed = key.trim();
  if (!trimmed) return false;

  if (patientNumber) {
    const expected = `${buildMinioObjectPrefix(category, patientNumber)}/`;
    if (trimmed.startsWith(expected)) return true;
  }

  if (trimmed.startsWith(`${LEGACY_MINIO_CATEGORY_PREFIX[category]}/`)) {
    return true;
  }

  if (!patientNumber) {
    const folder = categoryFolder(category);
    if (folder) {
      return (
        trimmed.startsWith(`${PATIENTS_STORAGE_ROOT}/`) &&
        trimmed.includes(`/${folder}/`)
      );
    }
  }

  return false;
}

export function isPatientProfileStorageKey(
  key: string,
  patientNumber?: string,
): boolean {
  return isMinioKeyForCategory(key, 'patient_avatar', patientNumber);
}

function categoryFolder(category: MinioStorageCategory): PatientStorageFolder | null {
  switch (category) {
    case 'patient_avatar':
      return 'profile';
    case 'lab_report':
      return 'labs';
    case 'chat_image':
    case 'chat_file':
      return 'chat';
    case 'consultation_xray':
    case 'consultation_echo':
    case 'consultation_ecg':
    case 'consultation_cine_mri':
    case 'consultation_ct':
    case 'consultation_ecg_cls':
      return 'imaging';
    default:
      return null;
  }
}

/** Standard subfolders created for each patient in MinIO. */
export const PATIENT_STORAGE_SUBFOLDERS = [
  'profile',
  'chat/images',
  'chat/files',
  'labs',
  'imaging/xray',
  'imaging/echo',
  'imaging/ecg',
  'imaging/cine-mri',
  'imaging/ct',
  'imaging/ecg-cls',
  'documents',
] as const;

export function buildPatientFolderMarkers(patientNumber: string): string[] {
  const pn = normalizePatientNumber(patientNumber);
  return PATIENT_STORAGE_SUBFOLDERS.map(
    (sub) => `${PATIENTS_STORAGE_ROOT}/${pn}/${sub}/.keep`,
  );
}
