import { AssignmentRole, GateEventResult, RfidTagStatus } from '../../../shared/ui/status-tags';
import { PaginationMeta } from '../../../core/types/api-response.types';
import { RecentGateEvent } from '../../../shared/types/gate-event';

/** Plain truck entity (returned by create/update/archive/photo). */
export interface Truck {
  id: string;
  plateNumber: string;
  model: string;
  photoUrl: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TruckDriverListSummary {
  id: string;
  name: string;
  role: AssignmentRole;
}

export interface TruckBoundTagSummary {
  epcId: string;
  status: RfidTagStatus;
}

export interface TruckListItem {
  id: string;
  plateNumber: string;
  model: string;
  photoUrl: string | null;
  isArchived: boolean;
  drivers: TruckDriverListSummary[];
  driversCount: number;
  boundTag: TruckBoundTagSummary | null;
  events30d: number;
  lastEventAt: string | null;
}

export interface TruckListMeta extends PaginationMeta {
  counts: { withNoDriver: number };
}

export interface TruckListResult {
  data: TruckListItem[];
  meta: TruckListMeta;
}

export interface TruckDetailDriver {
  id: string;
  name: string;
  licenseNumber: string;
  role: AssignmentRole;
  since: string;
  photoUrl: string | null;
}

export interface TruckDetail {
  id: string;
  plateNumber: string;
  model: string;
  photoUrl: string | null;
  isArchived: boolean;
  status: 'ACTIVE' | 'ARCHIVED';
  drivers: TruckDetailDriver[];
  boundTag: TruckBoundTagSummary | null;
  events30d: number;
  lastEventAt: string | null;
  lastResult: GateEventResult | null;
  recentGateEvents: RecentGateEvent[];
  createdAt: string;
}
