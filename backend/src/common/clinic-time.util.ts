export const CLINIC_TIMEZONE = 'Africa/Cairo';

/** Human-readable clinic-local date + time for AI / patient-facing text. */
export function formatClinicDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);

  const time = new Intl.DateTimeFormat('en-US', {
    timeZone: CLINIC_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);

  return `${date} ${time}`;
}

export function todayClinicDateStr(ref = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ref);
}

/**
 * Convert "YYYY-MM-DD" + "09:00 AM" (clinic wall clock) → ISO with Cairo offset.
 */
export function clinicSlotToIso(dateStr: string, time12h: string): string {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time12h.trim());
  if (!match) return `${dateStr}T00:00:00+03:00`;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  return `${dateStr}T${hh}:${mm}:00+03:00`;
}
