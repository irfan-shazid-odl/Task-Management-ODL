/**
 * Formats decimal hours into a human-readable string (e.g. 1.5 -> "1h 30m").
 */
export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'm' : ''}`.trim() || '0h';
}
