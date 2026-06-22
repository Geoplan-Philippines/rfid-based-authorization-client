import { AvgPassTimeCard } from '../types/dashboard.types';

/**
 * Format the mean RFID→barrier duration as a compact instrument readout.
 * Sub-second durations stay in milliseconds; everything else reads in seconds
 * to one decimal (e.g. `1.6s`). Returns `null` when no pass completed so the
 * card can show its empty state rather than a misleading `0s`.
 */
export function formatPassTime(card: AvgPassTimeCard): string | null {
  if (card.milliseconds === null) return null;
  if (card.milliseconds < 1000) return `${card.milliseconds} ms`;
  return `${(card.milliseconds / 1000).toFixed(1)}s`;
}

export interface DeltaDisplay {
  /** Signed magnitude, e.g. `+18`, `−5`, `0`. */
  magnitude: string;
  /** `pi-*` arrow reflecting direction. */
  icon: string;
  direction: 'up' | 'down' | 'flat';
}

/**
 * Describe a day-over-day change. Throughput volume has no inherent good/bad
 * valence, so direction is shown with an arrow and neutral styling — semantic
 * colour stays reserved for true pass/fail state.
 */
export function deltaDisplay(delta: number): DeltaDisplay {
  if (delta > 0) return { magnitude: `+${delta}`, icon: 'pi-arrow-up-right', direction: 'up' };
  if (delta < 0) return { magnitude: `−${Math.abs(delta)}`, icon: 'pi-arrow-down-right', direction: 'down' };
  return { magnitude: '0', icon: 'pi-minus', direction: 'flat' };
}
