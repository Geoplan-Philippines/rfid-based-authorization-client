export interface DeltaDisplay {
  /** Signed magnitude, e.g. `+18`, `−5`, `0`. */
  magnitude: string;
  /** `pi-*` arrow reflecting direction. */
  icon: string;
  direction: 'up' | 'down' | 'flat';
}

/**
 * Describe a change against a baseline. Throughput volume has no inherent
 * good/bad valence, so direction is carried by an arrow and the caller decides
 * whether to spend semantic colour on it — reserved for state that genuinely
 * reads as pass/fail (a rising exception count), never for raw volume.
 */
export function deltaDisplay(delta: number): DeltaDisplay {
  if (delta > 0) return { magnitude: `+${delta}`, icon: 'pi-arrow-up-right', direction: 'up' };
  if (delta < 0) return { magnitude: `−${Math.abs(delta)}`, icon: 'pi-arrow-down-right', direction: 'down' };
  return { magnitude: '0', icon: 'pi-minus', direction: 'flat' };
}
