/** Shared display helpers for registry status/result/role chips (PrimeNG `p-tag`). */

export type TagSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast';

export interface DisplayTag {
  label: string;
  severity: TagSeverity;
}

export type RfidTagStatus = 'ACTIVE' | 'INACTIVE' | 'LOST' | 'BLOCKED' | 'RETIRED';
export type AssignmentRole = 'PRIMARY' | 'RELIEF';
export type GateEventResult =
  | 'VERIFIED'
  | 'UNKNOWN_TAG'
  | 'FACE_MISMATCH'
  | 'PLATE_MISMATCH'
  | 'MANUAL_OVERRIDE'
  | 'DENIED'
  | 'ERROR';

/** Canonical display order for the full GateEventResult set (filter chips, breakdown rows). */
export const GATE_EVENT_RESULT_ORDER: readonly GateEventResult[] = [
  'VERIFIED',
  'UNKNOWN_TAG',
  'FACE_MISMATCH',
  'PLATE_MISMATCH',
  'MANUAL_OVERRIDE',
  'DENIED',
  'ERROR',
];

const RFID_TAG_STATUS_TAGS: Record<RfidTagStatus, DisplayTag> = {
  ACTIVE: { label: 'Active', severity: 'success' },
  INACTIVE: { label: 'Inactive', severity: 'secondary' },
  LOST: { label: 'Lost', severity: 'warn' },
  BLOCKED: { label: 'Blocked', severity: 'danger' },
  RETIRED: { label: 'Retired', severity: 'contrast' },
};

const GATE_RESULT_TAGS: Record<GateEventResult, DisplayTag> = {
  VERIFIED: { label: 'Verified', severity: 'success' },
  UNKNOWN_TAG: { label: 'Unknown Tag', severity: 'danger' },
  FACE_MISMATCH: { label: 'Face Mismatch', severity: 'warn' },
  PLATE_MISMATCH: { label: 'Plate Mismatch', severity: 'warn' },
  MANUAL_OVERRIDE: { label: 'Manual Override', severity: 'info' },
  DENIED: { label: 'Denied', severity: 'danger' },
  ERROR: { label: 'Error', severity: 'danger' },
};

const ASSIGNMENT_ROLE_TAGS: Record<AssignmentRole, DisplayTag> = {
  PRIMARY: { label: 'Primary', severity: 'info' },
  RELIEF: { label: 'Relief', severity: 'secondary' },
};

export function rfidTagStatusTag(status: RfidTagStatus): DisplayTag {
  return RFID_TAG_STATUS_TAGS[status] ?? { label: status, severity: 'secondary' };
}

export function gateResultTag(result: GateEventResult): DisplayTag {
  return GATE_RESULT_TAGS[result] ?? { label: result, severity: 'secondary' };
}

export function assignmentRoleTag(role: AssignmentRole): DisplayTag {
  return ASSIGNMENT_ROLE_TAGS[role] ?? { label: role, severity: 'secondary' };
}
