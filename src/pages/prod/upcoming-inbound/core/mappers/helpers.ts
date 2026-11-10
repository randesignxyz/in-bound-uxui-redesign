import dayjs from 'dayjs';

export function formatDisplayTimestamp(value?: string | null): string {
  if (!value) return '';
  const parsed = dayjs(value);
  if (!parsed.isValid()) return value;
  return parsed.format('YYYY-MM-DD HH:mm:ss');
}

export function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export function readValue<T = unknown>(source: unknown, ...keys: string[]): T | undefined {
  if (!source || typeof source !== 'object') return undefined;
  const record = source as Record<string, unknown>;
  for (const key of keys) {
    if (record[key] !== undefined) return record[key] as T;
  }
  return undefined;
}

export function readString(source: unknown, ...keys: string[]): string {
  const value = readValue<unknown>(source, ...keys);
  return value === null || value === undefined ? '' : String(value);
}

export function readNumber(source: unknown, ...keys: string[]): number | undefined {
  const value = readValue<unknown>(source, ...keys);
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function readBoolean(source: unknown, ...keys: string[]): boolean {
  const value = readValue<unknown>(source, ...keys);
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return Boolean(value);
}

export function readArray<T>(source: unknown, ...keys: string[]): T[] {
  const value = readValue<unknown>(source, ...keys);
  return Array.isArray(value) ? value as T[] : [];
}

export function normalizeEnum<T extends string>(
  value: string | null | undefined,
  allowedValues: readonly T[],
  fallback: T,
): T;
export function normalizeEnum<T extends string>(
  value: string | null | undefined,
  allowedValues: readonly T[],
  fallback: T | undefined,
): T | undefined;
export function normalizeEnum<T extends string>(
  value: string | null | undefined,
  allowedValues: readonly T[],
  fallback: T | undefined,
): T | undefined {
  if (!value) return fallback;
  return allowedValues.find((allowedValue) => allowedValue === value) ?? fallback;
}
