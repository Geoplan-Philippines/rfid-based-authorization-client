export type RfidTagStatus = 'ACTIVE' | 'INACTIVE' | 'LOST' | 'BLOCKED';

// Matches the assignedTruck shape actually returned by GET /api/v1/rfid-tags
// (no assignedDriverId — that field belongs to the separate trucks endpoint's
// own Truck type, not this nested include).
export type AssignedTruck = {
  id: string;
  plateNumber: string;
  model: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

// Mirrors the backend's RfidTagWithTruck (RFIDTag + assignedTruck include).
// NOTE: the API does not currently return a last-event timestamp or gate-event count
// for a tag. If/when the backend adds these (e.g. `lastEventAt`, `eventsCount`), extend
// this type and wire them into rfid-tags.html in place of the hardcoded "-" / "0".
export type RfidTag = {
  id: string;
  epcId: string;
  status: RfidTagStatus;
  assignedTruckId: string | null;
  assignedTruck: AssignedTruck | null;
  createdAt: string;
  updatedAt: string;
};
