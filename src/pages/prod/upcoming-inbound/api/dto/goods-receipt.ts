import type { QcDecision } from '../../core/type';

export interface InboundGoodsReceiptSearch {
  searchValue?: string;
  businessUnit?: string | null;
  business_unit?: string | null;
  status?: string | null;
  processState?: string | null;
  processStates?: string[] | null;
  qcQueueStatus?: string | null;
  receiptType?: string | null;
  receiptSourceType?: string | null;
  receiptSourceGroup?: 'STANDARD' | 'TEMP' | null;
  poLinkStatus?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}

export interface InboundGoodsReceiptCountParams {
  businessUnit?: string | null;
  business_unit?: string | null;
  status?: string | null;
}

export interface InboundGrPoReferenceApi {
  poNumber: string;
  businessUnit?: string | null;
  supplier?: string | null;
  expectedDate?: string | null;
  expectedTime?: string | null;
  deliveryNoteNumber?: string | null;
}

export interface InboundGrItemApi {
  id?: number | null;
  poNumber?: string | null;
  poLineNumber?: number | null;
  supplier?: string | null;
  code: string;
  name: string;
  poQty: number;
  receiveQty: number;
  uom: string;
  condition: string;
  damagedQty?: number | null;
  rowNumber?: string | null;
  isMissing: boolean;
  missingRemark?: string | null;
  productDate?: string | null;
  manufacturingDate?: string | null;
  expiryDate?: string | null;
  bestBeforeDate?: string | null;
  batchNumber?: string | null;
  barcode?: string | null;
  deliveryNoteNumber?: string | null;
  qcDecision?: string | null;
  qcRejectedQty?: number | null;
  qcRemark?: string | null;
}

export interface SupportingDocReferenceApi {
  fileId?: string | null;
  fileName: string;
  source?: string | null;
  poNumber?: string | null;
}

export interface InboundGrDocumentChecklistApi {
  vendorDN: boolean;
  goodsReceiptPOForm: boolean;
  pmrmLabelForm: boolean;
  pmrmStockCardForm: boolean;
  supportingDocs: SupportingDocReferenceApi[];
}

export interface InboundPmrmLabelApi {
  itemCode: string;
  materialName: string;
  productionDate: string;
  expiryDate: string;
  batchNumber: string;
  quantity: number;
  receivingDate: string;
  receiverName: string;
  rowNumber: string;
}

export interface InboundGrActivityApi {
  grNumber: string;
  title: string;
  description?: string | null;
  performedBy?: string | null;
  timestamp?: string | null;
  state: string;
}

export interface InboundGoodsReceiptApi {
  id?: number | null;
  grNumber: string;
  receivingNumber: string;
  businessUnit: string;
  approvedGrNumber?: string | null;
  sapDocEntry?: number | null;
  sapDocNum?: string | null;
  sapGrNumber?: string | null;
  sapGrStatus?: string | null;
  previousReceivingNumber?: string | null;
  previousApprovedGrNumber?: string | null;
  poNumber?: string | null;
  poReferences: InboundGrPoReferenceApi[];
  supplier: string;
  receiptType: string;
  receiptSourceType: string;
  poLinkStatus: string;
  tempReferenceNo?: string | null;
  pendingPoReason?: string | null;
  linkedPoNumber?: string | null;
  linkBlockReason?: string | null;
  receivedByUser?: string | null;
  onHoldWarehouseCode?: string | null;
  releaseWarehouseCode?: string | null;
  postingDate: string;
  actualReceiptDate: string;
  deliveryNoteNumber: string;
  items: InboundGrItemApi[];
  status: string;
  processState: string;
  displayStatus?: string | null;
  legacyStatus?: string | null;
  createdBy?: string | null;
  createdDate?: string | null;
  approvedBy?: string | null;
  approvedDate?: string | null;
  qcReviewedBy?: string | null;
  qcReviewedAt?: string | null;
  qcSubmittedViewedBy?: string | null;
  qcSubmittedViewedAt?: string | null;
  qcRejectedViewedBy?: string | null;
  qcRejectedViewedAt?: string | null;
  specMatch: boolean;
  qtyMatch: boolean;
  qualityCheckRequired: boolean;
  qcResult: string;
  exceptionReason?: string | null;
  workflowLabel: string;
  recordTypeLabel: string;
  isAppendable: boolean;
  documentChecklist: InboundGrDocumentChecklistApi;
  labelForms: InboundPmrmLabelApi[];
  activities: InboundGrActivityApi[];
}

export interface InboundSaveGoodsReceiptItemInput {
  poNumber?: string | null;
  poLineNumber?: number | null;
  supplier?: string | null;
  code: string;
  name: string;
  poQty: number;
  receiveQty: number;
  uom: string;
  condition: string;
  damagedQty?: number | null;
  rowNumber?: string | null;
  isMissing?: boolean;
  missingRemark?: string | null;
  productDate?: string | null;
  manufacturingDate?: string | null;
  expiryDate?: string | null;
  bestBeforeDate?: string | null;
  batchNumber?: string | null;
  barcode?: string | null;
  qcDecision?: QcDecision | null;
  qcRejectedQty?: number | null;
  qcRemark?: string | null;
}

export interface InboundSaveGoodsReceiptInput {
  id?: number | null;
  gr_number?: string | null;
  receiving_number?: string | null;
  process_state?: string | null;
  business_unit?: string | null;
  po_number?: string | null;
  supplier: string;
  receipt_type: string;
  append_to_open_receiving?: boolean;
  receipt_source_type?: string;
  po_link_status?: string;
  temp_reference_no?: string | null;
  pending_po_reason?: string | null;
  linked_po_number?: string | null;
  received_by_user?: string | null;
  on_hold_warehouse_code?: string | null;
  release_warehouse_code?: string | null;
  posting_date: string;
  actual_receipt_date: string;
  delivery_note_number: string;
  poReferences?: InboundGrPoReferenceApi[];
  items: InboundSaveGoodsReceiptItemInput[];
  spec_match?: boolean;
  qty_match?: boolean;
  quality_check_required?: boolean;
  qc_result?: string;
  exception_reason?: string | null;
  documentChecklist?: InboundGrDocumentChecklistApi;
  labelForms?: InboundPmrmLabelApi[];
}

export interface InboundSaveActivityInput {
  gr_number: string;
  title: string;
  description?: string | null;
}

export interface InboundGoodsReceiptStatusChangeInput {
  id: number;
  statusChange: string;
  remark?: string | null;
  state: string;
  action?: string | null;
}

export interface InboundLinkPoInput {
  id: number;
  docNum?: string | null;
  sapDocNum?: string | null;
  poNumber?: string | null;
  note?: string | null;
}

export interface InboundQcReviewItemInput {
  code: string;
  itemId?: number | null;
  poNumber?: string | null;
  poLineNumber?: number | null;
  batchNumber?: string | null;
  qcDecision: QcDecision;
  qcRejectedQty?: number | null;
  qcRemark?: string | null;
}

export interface InboundSubmitQcReviewInput {
  id: number;
  items: InboundQcReviewItemInput[];
  documentChecklist?: InboundGrDocumentChecklistApi;
}

export interface InboundSubmitSupervisorReviewInput {
  id: number;
  action: string;
  note?: string | null;
}

export interface InboundMarkQcBadgeViewedInput {
  id: number;
  status: 'Submitted' | 'Rejected';
}
