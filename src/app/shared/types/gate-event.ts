import { GateEventResult } from '../ui/status-tags';

/**
 * Recent gate event shown in registry detail modals. Counterpart fields are
 * optional so the same shape serves both the truck side (driver counterpart)
 * and the driver side (truck counterpart).
 */
export interface RecentGateEvent {
  id: string;
  occurredAt: string;
  result: GateEventResult;
  eventCode?: string | null;
  truckPlate?: string | null;
  driverName?: string | null;
}
