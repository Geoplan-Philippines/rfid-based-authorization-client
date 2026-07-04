import { GateEventResult, RFIDTagStatus, SnapshotType, TimelineEventType } from '../types/transaction.types';

/** PrimeNG `p-tag` severities. */
export type TagSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast';

export interface DisplayTag {
  label: string;
  severity: TagSeverity;
}

const RESULT_TAGS: Record<GateEventResult, DisplayTag> = {
  VERIFIED: { label: 'Verified', severity: 'success' },
  UNKNOWN_TAG: { label: 'Unknown Tag', severity: 'danger' },
  FACE_MISMATCH: { label: 'Face Mismatch', severity: 'warn' },
  PLATE_MISMATCH: { label: 'Plate Mismatch', severity: 'warn' },
  MANUAL_OVERRIDE: { label: 'Manual Override', severity: 'info' },
  DENIED: { label: 'Denied', severity: 'danger' },
  ERROR: { label: 'Error', severity: 'danger' },
  IN_PROGRESS: { label: 'In Progress', severity: 'secondary' },
};

const TAG_STATUS_TAGS: Record<RFIDTagStatus, DisplayTag> = {
  ACTIVE: { label: 'Active', severity: 'success' },
  INACTIVE: { label: 'Inactive', severity: 'secondary' },
  LOST: { label: 'Lost', severity: 'warn' },
  BLOCKED: { label: 'Blocked', severity: 'danger' },
};

const TIMELINE_LABELS: Record<TimelineEventType, string> = {
  RFID_SCANNED: 'RFID Scanned',
  TAG_VALIDATED: 'Tag Validated',
  PLATE_CAPTURED: 'Plate Captured',
  PLATE_MATCHED: 'Plate Matched',
  FACE_CAPTURED: 'Face Captured',
  FACE_MATCHED: 'Face Matched',
  BARRIER_OPENED: 'Barrier Opened',
  MANUAL_OVERRIDE: 'Manual Override',
};

const SNAPSHOT_LABELS: Record<SnapshotType, string> = {
  FACE: 'Face',
  PLATE: 'Plate',
  WIDE: 'Wide',
};

export function resultTag(result: GateEventResult): DisplayTag {
  return RESULT_TAGS[result];
}

export function tagStatusTag(status: RFIDTagStatus): DisplayTag {
  return TAG_STATUS_TAGS[status];
}

export function timelineLabel(type: TimelineEventType): string {
  return TIMELINE_LABELS[type];
}

export function snapshotLabel(type: SnapshotType): string {
  return SNAPSHOT_LABELS[type];
}
