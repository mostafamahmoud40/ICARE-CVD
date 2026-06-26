/** Safe string coercion for unknown JSON / template values (avoids [object Object]). */
export function formatUnknown(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => formatUnknown(item)).join(', ');
  }
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

export function jsonToText(data: unknown): string {
  if (!data) return '';
  if (typeof data === 'string') return data;
  try {
    const obj: unknown =
      typeof data === 'object' && data !== null
        ? data
        : (JSON.parse(formatUnknown(data)) as unknown);
    if (Array.isArray(obj)) {
      return obj.map((item) => formatUnknown(item)).join(', ');
    }
    if (typeof obj === 'object' && obj !== null) {
      return Object.entries(obj as Record<string, unknown>)
        .filter(
          ([, v]) => v !== null && v !== undefined && v !== '' && v !== false,
        )
        .map(
          ([k, v]) =>
            `${k}: ${Array.isArray(v) ? v.map(formatUnknown).join(', ') : formatUnknown(v)}`,
        )
        .join('; ');
    }
    return formatUnknown(obj);
  } catch {
    return formatUnknown(data);
  }
}
