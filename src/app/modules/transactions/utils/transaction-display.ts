import {
  DisplayTag,
  gateResultTag,
  rfidTagStatusTag,
} from '../../../shared/ui/status-tags';
import { GateEventResult, RFIDTagStatus, SnapshotType, TimelineEventType } from '../types/transaction.types';

export type { DisplayTag, TagSeverity } from '../../../shared/ui/status-tags';

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
  return gateResultTag(result);
}

export function tagStatusTag(status: RFIDTagStatus): DisplayTag {
  return rfidTagStatusTag(status);
}

export function timelineLabel(type: TimelineEventType): string {
  return TIMELINE_LABELS[type];
}

export function snapshotLabel(type: SnapshotType): string {
  return SNAPSHOT_LABELS[type];
}
