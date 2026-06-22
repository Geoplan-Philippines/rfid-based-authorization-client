/** Display helpers for the audit-logs surface: action humanizing, severity
 *  (anomalies-first), entity icons, and metadata summaries. */

/** PrimeNG `p-tag` severities. */
export type TagSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast';

/** Tokens kept uppercase when humanizing (e.g. `RFID`, not `Rfid`). */
const ACRONYMS = new Set(['RFID', 'EPC', 'ID', 'URL', 'API', 'CCTV', 'ANPR']);

/** Past-tense verb labels. Unknown verbs fall back to title-casing. */
const VERB_PAST: Record<string, string> = {
  CREATE: 'Created',
  UPDATE: 'Updated',
  DELETE: 'Deleted',
  UPLOAD: 'Uploaded',
  ASSIGN: 'Assigned',
  UNASSIGN: 'Unassigned',
  ADD: 'Added',
  REMOVE: 'Removed',
  BLOCK: 'Blocked',
  UNBLOCK: 'Unblocked',
  ACTIVATE: 'Activated',
  DEACTIVATE: 'Deactivated',
  LOGIN: 'Logged in',
  LOGOUT: 'Logged out',
};

function humanizeWord(word: string): string {
  const upper = word.toUpperCase();
  if (ACRONYMS.has(upper)) return upper;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/** `UPDATE_TRUCK` → "Updated Truck"; `UPLOAD_DRIVER_PHOTO` → "Uploaded Driver Photo". */
export function humanizeAction(action: string): string {
  if (!action) return 'Unknown';
  const [verbToken = action, ...rest] = action.split('_').filter(Boolean);
  const verb = VERB_PAST[verbToken.toUpperCase()] ?? humanizeWord(verbToken);
  const subject = rest.map(humanizeWord).join(' ');
  return subject ? `${verb} ${subject}` : verb;
}

/**
 * Anomalies-first: red for destructive actions (the exception your eye should
 * catch), green for additive, quiet grey for the routine majority.
 */
export function actionSeverity(action: string): TagSeverity {
  const verb = (action.split('_')[0] ?? '').toUpperCase();
  if (verb === 'DELETE' || verb === 'REMOVE' || verb === 'BLOCK') return 'danger';
  if (verb === 'CREATE' || verb === 'ADD') return 'success';
  return 'secondary';
}

export interface EntityMeta {
  label: string;
  /** PrimeIcons class name (without the `pi` prefix). */
  icon: string;
}

const ENTITY_META: Record<string, EntityMeta> = {
  Truck: { label: 'Truck', icon: 'pi-truck' },
  Driver: { label: 'Driver', icon: 'pi-id-card' },
  RFIDTag: { label: 'RFID Tag', icon: 'pi-tags' },
  User: { label: 'User', icon: 'pi-users' },
};

export function entityMeta(entityType: string): EntityMeta {
  return ENTITY_META[entityType] ?? { label: entityType, icon: 'pi-box' };
}

/** Domain entity types, for the entity-type filter. */
export const AUDIT_ENTITY_TYPES = ['Truck', 'Driver', 'RFIDTag', 'User'] as const;

/**
 * Known audit actions, for the action filter. The table renders any action
 * regardless (see `humanizeAction`); this list only seeds the dropdown.
 */
export const AUDIT_ACTIONS = [
  'CREATE_TRUCK', 'UPDATE_TRUCK', 'DELETE_TRUCK', 'UPLOAD_TRUCK_PHOTO',
  'CREATE_DRIVER', 'UPDATE_DRIVER', 'DELETE_DRIVER', 'UPLOAD_DRIVER_PHOTO',
  'CREATE_RFID_TAG', 'UPDATE_RFID_TAG', 'DELETE_RFID_TAG',
  'CREATE_USER', 'UPDATE_USER', 'DELETE_USER',
] as const;

/** A flat view of metadata so the template can switch on `kind` without union narrowing. */
export interface MetadataView {
  kind: 'fields' | 'photo' | 'text' | 'none';
  fields?: string[];
  fileName?: string;
  text?: string;
}

export function describeMetadata(metadata: Record<string, unknown> | null | undefined): MetadataView {
  if (!metadata || typeof metadata !== 'object') return { kind: 'none' };

  const fields = (metadata as { fields?: unknown }).fields;
  if (Array.isArray(fields) && fields.length) {
    return { kind: 'fields', fields: fields.map(String) };
  }

  const photoUrl = (metadata as { photoUrl?: unknown }).photoUrl;
  if (typeof photoUrl === 'string' && photoUrl) {
    return { kind: 'photo', fileName: photoUrl.split('/').pop() || photoUrl };
  }

  const keys = Object.keys(metadata);
  if (!keys.length) return { kind: 'none' };

  // Generic fallback for unknown metadata shapes.
  const text = keys.map(key => `${key}: ${formatValue(metadata[key])}`).join(', ');
  return { kind: 'text', text };
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (Array.isArray(value)) return value.map(String).join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/** First 8 chars of a UUID for compact display; full id belongs in a `title`. */
export function shortId(id: string | null | undefined): string {
  if (!id) return '—';
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}
