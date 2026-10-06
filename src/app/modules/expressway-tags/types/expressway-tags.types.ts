export type { ExpresswayTagStatus } from '../../../shared/ui/status-tags';
import type { ExpresswayTagStatus } from '../../../shared/ui/status-tags';

export interface ExpresswayTagListItem {
  id: string;
  epcId: string;
  label: string | null;
  status: ExpresswayTagStatus;
  truck: { id: string; plateNumber: string; model: string | null } | null;
  lastSeenAt: Date | null;
  createdAt: Date;
}

export interface ExpresswayTagStatusHistoryItem {
  fromStatus: ExpresswayTagStatus | null;
  toStatus: ExpresswayTagStatus;
  reason: string | null;
  createdAt: Date;
}

export interface ExpresswayTagDetail extends ExpresswayTagListItem {
  statusHistory: ExpresswayTagStatusHistoryItem[];
}

export interface ExpresswayTagStatusCounts {
  total: number;
  ACTIVE: number;
  INACTIVE: number;
  BLOCKED: number;
}

export interface GetExpresswayTagsParams {
  page: number;
  limit: number;
  search?: string;
  status?: ExpresswayTagStatus;
}
