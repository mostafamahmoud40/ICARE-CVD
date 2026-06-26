export const STAFF_STORAGE_ROOT = 'staff';

export type StaffAvatarRole = 'doctor' | 'assistant';

export function buildStaffAvatarPrefix(
  role: StaffAvatarRole,
  staffId: string,
): string {
  const folder = role === 'assistant' ? 'assistants' : 'doctors';
  return `${STAFF_STORAGE_ROOT}/${folder}/${staffId.trim()}/profile`;
}

export function isStaffAvatarStorageKey(
  key: string,
  staffId?: string,
): boolean {
  const trimmed = key.trim();
  if (!trimmed.startsWith(`${STAFF_STORAGE_ROOT}/`)) return false;
  if (!trimmed.includes('/profile/')) return false;
  if (staffId) {
    return (
      trimmed.startsWith(`${buildStaffAvatarPrefix('doctor', staffId)}/`) ||
      trimmed.startsWith(`${buildStaffAvatarPrefix('assistant', staffId)}/`)
    );
  }
  return true;
}
