import { Prisma } from '@prisma/client';

// Supabase's JS client returned numeric columns as plain numbers, `date`
// columns as 'YYYY-MM-DD' strings, and timestamptz as ISO strings. Prisma
// instead returns Decimal / BigInt / Date objects. These helpers reproduce
// the original JSON shape so the frontend contract is unchanged.

function isDecimal(v: unknown): v is Prisma.Decimal {
  return v instanceof Prisma.Decimal;
}

/** Format a Date (or ISO string) as a date-only 'YYYY-MM-DD' string. */
export function dateOnly(v: Date | string | null | undefined): string | null {
  if (v == null) return null;
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

/** Deeply convert Prisma scalar objects to JSON-friendly primitives. */
export function serialize<T>(value: T): T {
  if (value == null) return value;
  if (isDecimal(value)) return Number(value) as unknown as T;
  if (typeof value === 'bigint') return Number(value) as unknown as T;
  if (value instanceof Date) return value.toISOString() as unknown as T;
  if (Array.isArray(value)) return value.map((v) => serialize(v)) as unknown as T;
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = serialize(v);
    }
    return out as unknown as T;
  }
  return value;
}
