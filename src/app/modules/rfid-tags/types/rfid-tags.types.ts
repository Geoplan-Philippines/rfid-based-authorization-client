import { GateEventResult, RfidTagStatus } from '../../../shared/ui/status-tags';
import { PaginationMeta } from '../../../core/types/api-response.types';

export type { RfidTagStatus } from '../../../shared/ui/status-tags';

export interface RfidAssignedTruckSummary {
  id: string;
  plateNumber: string;
  model: string | null;
}

/** Plain tag entity (returned by create). */
export interface RfidTag {
  id: string;
  epcId: string;
  /** The number printed on the physical tag. Null for tags registered without one. */
  serialNo: string | null;
  status: RfidTagStatus;
  /** Null while the tag is unbound spare stock, before it is issued to a truck. */
  assignedTruckId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RfidTagListItem {
  id: string;
  epcId: string;
  serialNo: string | null;
  status: RfidTagStatus;
  /** Null while the tag is unbound spare stock, before it is issued to a truck. */
  assignedTruck: RfidAssignedTruckSummary | null;
  lastSeenAt: string | null;
  lastResult: GateEventResult | null;
  events30d: number;
}

export type RfidTagStatusCounts = Record<RfidTagStatus, number> & { total: number };

export interface RfidTagListMeta extends PaginationMeta {
  counts: RfidTagStatusCounts;
}

export interface RfidTagListResult {
  data: RfidTagListItem[];
  meta: RfidTagListMeta;
}

export interface RfidTagStatusHistoryItem {
  fromStatus: RfidTagStatus | null;
  toStatus: RfidTagStatus;
  reason: string | null;
  createdAt: string;
}

export interface RfidTagDetail extends RfidTagListItem {
  boundSince: string;
  lastVerifiedAt: string | null;
  denials7d: number;
  statusHistory: RfidTagStatusHistoryItem[];
}
