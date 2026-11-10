export type IESPlanningStatus = 'NOT_PLANNED' | 'PARTIALLY_PLANNED' | 'FULLY_PLANNED';
export type SAPPOStatus = 'Open' | 'Closed';

export interface DeliverySchedule {
  id: string;
  deliveryPlanNumber: string; // e.g. "Plan 1", "Plan 2"
  deliveryDate: string; // e.g. "2026-08-27"
  plannedQty: number;
  warehouseCode?: string;
  notes?: string;
}

export interface IRPlanItem {
  id: string;
  poNumber: string;
  itemCode: string;
  itemName: string;
  uom: string;
  totalPoQty: number;
  allocatedQty: number;
  remainingQty: number;
  schedules: DeliverySchedule[];
}

export type IRScheduleStatus = 'Pending' | 'In Progress' | 'Completed' | 'Rejected';

export interface IRPlan {
  id: string;
  irPlanNumber: string; // e.g. "IR0001"
  parentIrNumber?: string;
  qcFollowUpType?: 'REJECTED' | 'ON_HOLD';
  deliveryPlanNumber: string; // e.g. "Plan 1"
  vendor: string;
  poNumbers: string[];
  deliveryDate: string;
  status: IRScheduleStatus;
  items: IRPlanItem[];
  totalPlannedQty: number;
  totalItems: number;
  createdBy: string;
  createdAt: string;
  notes?: string;
  deliveryNoteNumber?: string;
  deliveryNoteDate?: string;
  deliveryNoteRemark?: string;
  attachments?: Array<{
    uid: string;
    name: string;
    size?: number;
    type?: string;
    url?: string;
  }>;
}
