import type {
  InboundProcessState,
  LegacyGRStatus,
  QcDecision,
  GRDocumentChecklist,
  GRScenarioMeta,
  GRActivity,
  InboundDeliveryPlanStatus,
  QCResultStatus,
  SupervisorDecision,
  SapPostingStatus,
  SyncStatus,
} from './workflow';

export type GoodsReceiptSourceType = 'PLANNED' | 'UNPLANNED_WITH_PO' | 'TEMP_NO_PO';
export type POLinkStatus = 'NOT_REQUIRED' | 'WAITING_PO' | 'LINKED';

export interface ItemBatch {
  id: string;
  batchNumber: string;
  batchQty: number;
  productionDate?: string;
  expiryDate?: string;
  bestBeforeDate?: string;
  remark?: string;
}

export interface QCInspectionCheck {
  packagingCondition: 'Pass' | 'Fail' | 'N/A';
  productAppearance: 'Pass' | 'Fail' | 'N/A';
  quantityVerification: 'Pass' | 'Fail' | 'N/A';
  batchVerification: 'Pass' | 'Fail' | 'N/A';
  dateVerification: 'Pass' | 'Fail' | 'N/A';
  handlingTempCondition: 'Pass' | 'Fail' | 'N/A';
  otherQualityRequirements?: string;
}

export interface SupervisorAdjustmentAudit {
  id: string;
  itemCode: string;
  itemName: string;
  fieldName: string;
  previousValue: number | string;
  newValue: number | string;
  changedBy: string;
  timestamp: string;
  reason: string;
}

export interface GRItem {
  id?: number;
  poLineNumber?: number;
  code: string;
  name: string;
  poNumber: string;
  expectedDate?: string;
  supplier: string;
  uom: string;
  
  // 6 Separate Quantities (Strict Ownership)
  poQty: number;              // Procurement planned / PO baseline
  plannedQty?: number;        // Explicit alias for plannedQty
  receiveQty: number;         // Warehouse physical count
  actualReceivedQty?: number; // Explicit alias for warehouse count
  qcAcceptedQty?: number;     // QC Accepted
  qcRejectedQty?: number;     // QC Rejected
  qcOnHoldQty?: number;       // QC On Hold
  finalGrQty?: number;        // Supervisor Approved Final GR Qty
  sapPostedQty?: number;      // SAP confirmed qty

  // Batches (WH-03A Multi-batch)
  batches?: ItemBatch[];
  
  // Legacy / Batch flat fields for single-batch fallback
  productDate?: string;
  expiryDate?: string;
  bestBeforeDate?: string;
  batchNumber?: string;
  barcode?: string;

  // Discrepancies
  deliveryNoteNumber?: string;
  isDeferred?: boolean;
  isMissing?: boolean;
  missingRemark?: string;
  
  // QC details
  qcDecision?: QcDecision;
  qcChecks?: QCInspectionCheck;
  qcResult?: QCResultStatus;
  qcRejectedReason?: string;
  qcOnHoldReason?: string;
  qcRemark?: string;
}

export type ReceiptPoGroupedItemShape = Pick<
  GRItem,
  'poNumber' | 'supplier' | 'poQty' | 'receiveQty' | 'code'
>;

export interface ReceiptPoItemGroup<TItem extends ReceiptPoGroupedItemShape = GRItem> {
  key: string;
  poNumber?: string;
  displayPoNumber: string;
  supplier: string;
  expectedDate?: string;
  expectedTime?: string;
  itemCount: number;
  totalPoQty: number;
  totalReceiveQty: number;
  items: TItem[];
}

export interface GoodsReceipt {
  id?: number;
  grNumber: string; // Internal legacy receipt key; use receivingNumber for warehouse display.
  receivingNumber?: string; // e.g. "RCV000125"; distinct from SAP goods receipt numbers.
  businessUnit?: string;
  parentIrNumber?: string; // Immediate source for a QC follow-up IR.
  rootIrNumber?: string; // Original procurement IR, retained across reinspections.
  qcFollowUpType?: 'REJECTED' | 'ON_HOLD';
  approvedGrNumber?: string;

  // IR & Delivery Plan references
  irPlanNumber?: string;       // e.g. "IR0001"
  deliveryPlanNumber?: string; // e.g. "Plan 1"
  deliveryPlanStatus?: InboundDeliveryPlanStatus;

  // Vehicle & Logistics Header
  truckPlateNumber?: string;
  driverContact?: string;
  driverName?: string;
  receiverWarehouseName: string;
  storageWarehouseConfirmed?: boolean;
  actualArrivalDate?: string;
  actualArrivalTime?: string;
  deliveryNoteNumber: string;   // Required; if 'NA', reason required
  deliveryNoteRemark?: string;  // Remark when DN = NA

  // SAP Integration
  sapDocEntry?: number;
  sapDocNum?: string;
  sapGrNumber?: string;
  sapGrStatus?: string;
  sapPostingStatus?: SapPostingStatus;
  sapPostingError?: string;
  sapLastAttempt?: string;
  sapManualHandled?: boolean;

  previousReceivingNumber?: string;
  previousApprovedGrNumber?: string;
  poNumber: string;
  supplier: string;
  poReferences: Array<{
    poNumber: string;
    businessUnit?: string;
    supplier: string;
    expectedDate?: string;
    expectedTime?: string;
    deliveryNoteNumber?: string;
  }>;
  supplierNames: string[];
  receiptType: 'Planned' | 'Unplanned';
  receiptSourceType: GoodsReceiptSourceType;
  poLinkStatus: POLinkStatus;
  tempReferenceNo?: string;
  pendingPOReason?: string;
  linkedPoNumber?: string;
  linkedPoLinkedAt?: string;
  linkedPoLinkedBy?: string;
  linkBlockReason?: string;
  expectedDate?: string;
  expectedTime?: string;
  postingDate: string;
  actualReceiptDate: string;
  items: GRItem[];

  // Workflow Statuses
  status: LegacyGRStatus;
  processState: InboundProcessState;
  displayStatus?: string;
  legacyStatus?: LegacyGRStatus;
  
  // QC Workflow
  qcResult?: QCResultStatus | 'Pending' | 'Pass' | 'Rejected' | 'Fail' | 'Conditional Pass';
  qcStatus?: string;
  qcBy?: string;
  qcAt?: string;
  qcNotes?: string;
  qcInspectedBy?: string;
  qcInspectionDate?: string;
  qcOverallRemark?: string;
  qcSubmittedViewedBy?: string;
  qcSubmittedViewedAt?: string;
  qcRejectedViewedBy?: string;
  qcRejectedViewedAt?: string;

  // Supervisor Workflow
  supervisorDecision?: SupervisorDecision;
  supervisorBy?: string;
  supervisorAt?: string;
  supervisorRemark?: string;
  supervisorAdjustments?: SupervisorAdjustmentAudit[];
  sendBackReason?: string;
  sendBackTarget?: 'WAREHOUSE' | 'QC';

  // System & Offline
  createdBy: string;
  createdDate: string;
  approvedBy?: string;
  approvedDate?: string;
  syncStatus?: SyncStatus;
  specMatch: boolean;
  qtyMatch: boolean;
  qualityCheckRequired: boolean;
  exceptionReason?: string;
  documentChecklist: GRDocumentChecklist;
  scenario: GRScenarioMeta;
  activities: GRActivity[];
}
