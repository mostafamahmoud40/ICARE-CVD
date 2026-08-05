export type MedicationCompliance = 'good' | 'poor';
export type MedicationType =
  | 'antihypertensives'
  | 'antiplatelets'
  | 'anticoagulants'
  | 'statins'
  | 'antiarrhythmics'
  | 'diuretics'
  | 'diabetes_medications'
  | 'other';

const MEDICATION_TYPES: MedicationType[] = [
  'antihypertensives',
  'antiplatelets',
  'anticoagulants',
  'statins',
  'antiarrhythmics',
  'diuretics',
  'diabetes_medications',
  'other',
];

export function parseMedicationCompliance(
  value: unknown,
): MedicationCompliance | null {
  if (value === 'good' || value === 'poor') return value;
  return null;
}

export function parseMedicationType(value: unknown): MedicationType | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return MEDICATION_TYPES.includes(trimmed as MedicationType)
    ? (trimmed as MedicationType)
    : null;
}
