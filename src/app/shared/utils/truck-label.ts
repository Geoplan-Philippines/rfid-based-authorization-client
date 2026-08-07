/** Placeholder shown wherever the backend holds no value for a field. */
export const EMPTY_VALUE = '—';

/**
 * Truck model for display. Trucks imported from the client's legacy registry carry no
 * recorded model, so `null` is an ordinary value here rather than a fault.
 */
export function truckModelLabel(model: string | null | undefined): string {
  return model?.trim() || EMPTY_VALUE;
}

/**
 * `PLATE · Model` for pickers and headings, collapsing to the bare plate when no model is
 * recorded — otherwise the separator dangles with nothing after it.
 */
export function truckLabel(plateNumber: string, model: string | null | undefined): string {
  const trimmedModel = model?.trim();

  return trimmedModel ? `${plateNumber} · ${trimmedModel}` : plateNumber;
}
