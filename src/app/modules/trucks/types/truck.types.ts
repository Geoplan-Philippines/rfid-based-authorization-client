export type Truck = {
  id: string;
  plateNumber: string;
  model: string;
  isArchived: boolean;
  assignedDriverId: string | null;
  createdAt: string;
  updatedAt: string;
};