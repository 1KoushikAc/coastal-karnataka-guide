// src/utils/format.ts
// Shared formatting helpers used across screens.

/**
 * Converts a duration in minutes to a human-readable string.
 * e.g. 45 → "45 min", 90 → "1 hr 30 min", 120 → "2 hr"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
}
