/** Frontend mirror of the backend transactions contract (context/transactions). */

import { PaginationMeta } from '../../../core/types/api-response.types';

export type GateEventResult =
  | 'VERIFIED'
  | 'UNKNOWN_TAG'
  | 'FACE_MISMATCH'
  | 'PLATE_MISMATCH'
  | 'MANUAL_OVERRIDE'
  | 'DENIED'
  | 'ERROR';

export type RFIDTagStatus = 'ACTIVE' | 'INACTIVE' | 'LOST' | 'BLOCKED';

export type SnapshotType = 'FACE' | 'PLATE' | 'WIDE';

export type TimelineEventType =
  | 'RFID_SCANNED'
  | 'TAG_VALIDATED'
  | 'PLATE_CAPTURED'
  | 'PLATE_MATCHED'
  | 'FACE_CAPTURED'
  | 'FACE_MATCHED'
  | 'BARRIER_OPENED'
  | 'MANUAL_OVERRIDE';

export interface DriverSummary {
  firstName: string;
  lastName: string;
}

export interface TransactionListItem {
  id: string;
  eventCode: string;
  occurredAt: string;
  createdAt?: string;
  result: GateEventResult;
  rfidTag: { epcId: string; status: RFIDTagStatus } | null;
  plateRead: string | null;
  plateMismatch: boolean;
  truck: { plateNumber: string; model: string | null } | null;
  truckInRegistry: boolean;
  driver: DriverSummary | null;
  isOpen: boolean;
}

export type TransactionEventType = 'transaction.created' | 'transaction.updated';

export interface TransactionStreamEvent {
  type: TransactionEventType;
  data: TransactionListItem;
}

/** Live totals per result, returned in the list `meta`. Respects search, ignores the selected result. */
export type TransactionResultCounts = Record<GateEventResult, number>;

export interface TransactionListMeta extends PaginationMeta {
  counts: TransactionResultCounts;
}

export interface TransactionListResult {
  data: TransactionListItem[];
  meta: TransactionListMeta;
}

export interface TransactionTimelineEvent {
  type: TimelineEventType;
  message: string | null;
  metadata: unknown;
  occurredAt: string;
}

export interface TransactionVerification {
  rfidMatched: boolean;
  plateMatched: boolean | null;
  faceMatched: boolean | null;
  plateConfidence: number | null;
  faceConfidence: number | null;
  verifiedAt: string;
}

export interface TransactionSnapshot {
  id: string;
  type: SnapshotType;
  imageUrl: string;
}

export interface TransactionDetail {
  id: string;
  eventCode: string;
  occurredAt: string;
  result: GateEventResult;
  plateRead: string | null;
  plateMismatch: boolean;
  verification: TransactionVerification | null;
  timeline: TransactionTimelineEvent[];
  rfidTag: { epcId: string; status: RFIDTagStatus; assignedTruckPlate: string | null } | null;
  truck: { plateNumber: string; model: string | null; assignedDriver: DriverSummary | null } | null;
  truckInRegistry: boolean;
  driver: (DriverSummary & { id: string }) | null;
  faceMatchesAssigned: boolean;
  snapshots: TransactionSnapshot[];
  isOpen: boolean;
}
