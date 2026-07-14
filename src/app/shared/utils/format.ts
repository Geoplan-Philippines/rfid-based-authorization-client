/** Shared formatting helpers for gate-event instrument readouts. */

export interface AvgPassTime {
  milliseconds: number | null;
  sampleSize: number;
}

/**
 * Format a mean RFID→barrier duration as a compact instrument readout.
 * Sub-second durations stay in milliseconds; everything else reads in seconds
 * to one decimal (e.g. `1.6s`). Returns `null` when no pass completed so the
 * caller can show its own empty state rather than a misleading `0s`.
 */
export function formatPassTime(card: AvgPassTime): string | null {
  if (card.milliseconds === null) return null;
  if (card.milliseconds < 1000) return `${card.milliseconds} ms`;
  return `${(card.milliseconds / 1000).toFixed(1)}s`;
}
