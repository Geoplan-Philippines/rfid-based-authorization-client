import { AssignmentRole, GateEventResult, RfidTagStatus } from '../../../shared/ui/status-tags';
import { PaginationMeta } from '../../../core/types/api-response.types';
import { RecentGateEvent } from '../../../shared/types/gate-event';
import { BanState } from '../../../shared/types/ban';

/** Plain driver entity (returned by create/update/archive/photo). */
export interface Driver {
  id: string;
  driverId: string;
  firstName: string;
  lastName: string;
  licenseNumber: string;
  photoUrl: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DriverTruckListSummary {
  id: string;
  plateNumber: string;
}

export interface DriverListItem extends BanState {
  id: string;
  driverId: string;
  firstName: string;
  lastName: string;
  licenseNumber: string;
  photoUrl: string | null;
  isArchived: boolean;
  trucksCount: number;
  trucks: DriverTruckListSummary[];
  events30d: number;
  lastEventAt: string | null;
  createdAt: string;
}

export interface DriverListResult {
  data: DriverListItem[];
  meta: PaginationMeta;
}

export interface DriverDetailTruck {
  id: string;
  plateNumber: string;
  model: string | null;
  role: AssignmentRole;
  since: string;
  tagEpc: string | null;
  tagStatus: RfidTagStatus | null;
}

export interface DriverDetail extends BanState {
  id: string;
  driverId: string;
  firstName: string;
  lastName: string;
  licenseNumber: string;
  photoUrl: string | null;
  isArchived: boolean;
  trucks: DriverDetailTruck[];
  events30d: number;
  denials30d: number;
  lastEventAt: string | null;
  lastResult: GateEventResult | null;
  createdAt: string;
  recentGateEvents: RecentGateEvent[];
}
