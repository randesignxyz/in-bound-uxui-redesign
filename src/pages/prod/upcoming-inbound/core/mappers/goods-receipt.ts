import type {
  InboundGoodsReceiptApi,
  InboundGrItemApi,
  InboundGrActivityApi,
  InboundGrDocumentChecklistApi,
  SupportingDocReferenceApi,
  UpcomingInboundGoodsReceipt,
  UpcomingInboundGoodsReceiptItem,
  UpcomingInboundDocumentChecklist,
  UpcomingInboundActivity,
  UpcomingInboundProcessState,
  UpcomingInboundPoLinkStatus,
  GRScenarioMeta,
  GRScenarioPath,
  LegacyGRStatus,
  QcDecision,
  SupportingDocReference,
  SupportingDocSource,
} from '../type';
import {
  buildActivities,
  mapProcessStateToLegacyStatus,
} from '../workflow';
import {
  readArray,
  readBoolean,
  readNumber,
  readString,
  readValue,
  normalizeEnum,
  formatDisplayTimestamp,
  uniqueStrings,
} from './helpers';

const PROCESS_STATE_VALUES: UpcomingInboundProcessState[] = [
  'RECEIVED_CHECKING',
  'MISMATCH_EXCEPTION',
  'RECEIPT_CONFIRMED',
  'STORED_ON_HOLD',
  'GRPO_DRAFT',
  'QC_PENDING',
  'QC_PASSED',
  'PENDING_SUPERVISOR_REVIEW',
  'CORRECTION_REQUIRED',
  'MERGED_TO_SUPERVISOR_REVIEW',
  'SUPERVISOR_APPROVED',
  'SAP_SYNCED',
  'TRANSFERRED_TO_PM_RM_WH',
  'FIN_SUBMITTED',
  'DAILY_CLOSED',
  'MONTHLY_SUMMARY_READY',
];

const RECEIPT_TYPE_VALUES: UpcomingInboundGoodsReceipt['receiptType'][] = ['Planned', 'Unplanned'];

const PO_LINK_STATUS_VALUES: UpcomingInboundPoLinkStatus[] = ['NOT_REQUIRED', 'WAITING_PO', 'LINKED'];

const RECEIPT_SOURCE_VALUES: UpcomingInboundGoodsReceipt['receiptSourceType'][] = [
  'PLANNED',
  'UNPLANNED_WITH_PO',
  'TEMP_NO_PO',
];

const QC_DECISION_VALUES: QcDecision[] = ['Pass', 'Reject'];

const LEGACY_STATUS_VALUES: LegacyGRStatus[] = [
  'Draft',
  'Pending Approval',
  'Approved',
  'Ready To Post SAP',
  'Posted',
  'Correction Required',
];

function normalizeQcDecision(value?: string | null): QcDecision | undefined {
  switch ((value || '').trim().toLowerCase()) {
    case 'pass':
      return 'Pass';
    case 'reject':
    case 'rejected':
    case 'on hold':
    case 'on-hold':
    case 'on_hold':
      return 'Reject';
    default:
      return normalizeEnum(value, QC_DECISION_VALUES, undefined);
  }
}

function mapInboundGoodsReceiptItem(item: InboundGrItemApi): UpcomingInboundGoodsReceiptItem {
  return {
    id: readNumber(item, 'id') ?? undefined,
    poLineNumber: readNumber(item, 'poLineNumber', 'po_line_number') ?? undefined,
    code: readString(item, 'code'),
    name: readString(item, 'name'),
    poNumber: readValue<string | null>(item, 'poNumber', 'po_number') ?? '',
    supplier: readValue<string | null>(item, 'supplier') ?? '',
    poQty: readNumber(item, 'poQty', 'po_qty') ?? 0,
    receiveQty: readNumber(item, 'receiveQty', 'receive_qty') ?? 0,
    uom: readString(item, 'uom'),
    productDate:
      readValue<string | null>(item, 'productDate', 'product_date') ??
      readValue<string | null>(item, 'manufacturingDate', 'manufacturing_date') ??
      '',
    expiryDate:
      readValue<string | null>(item, 'expiryDate', 'expiry_date') ??
      readValue<string | null>(item, 'bestBeforeDate', 'best_before_date') ??
      '',
    batchNumber: readValue<string | null>(item, 'batchNumber', 'batch_number') ?? '',
    barcode: readValue<string | null>(item, 'barcode') ?? '',
    deliveryNoteNumber: readValue<string | null>(item, 'deliveryNoteNumber', 'delivery_note_number') ?? undefined,
    isMissing: readBoolean(item, 'isMissing', 'is_missing'),
    missingRemark: readValue<string | null>(item, 'missingRemark', 'missing_remark') ?? undefined,
    qcDecision: normalizeQcDecision(readValue<string | null>(item, 'qcDecision', 'qc_decision')),
    qcRejectedQty: readNumber(item, 'qcRejectedQty', 'qc_rejected_qty') ?? undefined,
    qcRemark: readValue<string | null>(item, 'qcRemark', 'qc_remark') ?? undefined,
  };
}

function normalizeSupportingDocSource(value?: string | null): SupportingDocSource | null | undefined {
  switch (value) {
    case 'WAREHOUSE':
    case 'QC':
    case 'SUPERVISOR':
      return value;
    case null:
      return null;
    default:
      return undefined;
  }
}

function mapSupportingDoc(doc: SupportingDocReferenceApi): SupportingDocReference {
  return {
    fileId: readValue<string | null>(doc, 'fileId', 'file_id') ?? undefined,
    fileName: readString(doc, 'fileName', 'file_name'),
    source: normalizeSupportingDocSource(readValue<string | null>(doc, 'source')),
    poNumber: readValue<string | null>(doc, 'poNumber', 'po_number') ?? undefined,
  };
}

function mapInboundDocumentChecklist(
  checklist?: InboundGrDocumentChecklistApi,
): UpcomingInboundDocumentChecklist {
  return {
    vendorDN: readBoolean(checklist, 'vendorDN', 'vendor_dn'),
    goodsReceiptPOForm: readBoolean(checklist, 'goodsReceiptPOForm', 'goods_receipt_po_form'),
    pmrmStockCardForm: readBoolean(checklist, 'pmrmStockCardForm', 'pmrm_stock_card_form'),
    supportingDocs: readArray<SupportingDocReferenceApi>(checklist, 'supportingDocs', 'supporting_docs').map(mapSupportingDoc),
  };
}

function normalizeActivityState(value: string): UpcomingInboundActivity['state'] {
  switch (value) {
    case 'active':
    case 'locked':
      return value;
    default:
      return 'done';
  }
}

export function mapInboundActivity(activity: InboundGrActivityApi): UpcomingInboundActivity {
  return {
    title: readString(activity, 'title'),
    description: readValue<string | null>(activity, 'description') ?? readString(activity, 'title'),
    performedBy: readValue<string | null>(activity, 'performedBy', 'performed_by') ?? undefined,
    timestamp: formatDisplayTimestamp(readValue<string | null>(activity, 'timestamp')),
    state: normalizeActivityState(readString(activity, 'state')),
    processState: normalizeEnum(readString(activity, 'state'), PROCESS_STATE_VALUES, undefined),
  };
}

function inferScenarioPath(
  api: InboundGoodsReceiptApi,
  processState: UpcomingInboundProcessState,
): GRScenarioPath {
  if (processState === 'MISMATCH_EXCEPTION') return 'MISMATCH_CORRECTION';
  if (processState === 'CORRECTION_REQUIRED') return 'CORRECTION_LOOP';
  if (readString(api, 'receiptSourceType', 'receipt_source_type') === 'TEMP_NO_PO' || readString(api, 'receiptType', 'receipt_type') === 'Unplanned') return 'UNPLANNED_ARRIVAL';
  if (readString(api, 'qcResult', 'qc_result') === 'Rejected') return 'QC_REJECTED';
  if (
    processState === 'TRANSFERRED_TO_PM_RM_WH' ||
    processState === 'FIN_SUBMITTED' ||
    processState === 'DAILY_CLOSED' ||
    processState === 'MONTHLY_SUMMARY_READY'
  ) {
    return 'QC_PASS_TRANSFER';
  }
  return 'NORMAL';
}

function scenarioNameByPath(path: GRScenarioPath): string {
  switch (path) {
    case 'MISMATCH_CORRECTION':
      return 'Mismatch Correction Flow';
    case 'UNPLANNED_ARRIVAL':
      return 'Unplanned Inbound Receiving Flow';
    case 'QC_REJECTED':
      return 'QC Rejected Flow';
    case 'QC_PASS_TRANSFER':
      return 'QC Pass To Transfer Flow';
    case 'CORRECTION_LOOP':
      return 'Correction Loop Flow';
    case 'DAILY_CLOSE':
      return 'Daily Close Flow';
    case 'MONTHLY_SUMMARY':
      return 'Monthly Summary Flow';
    default:
      return 'Inbound Receiving Flow';
  }
}

function scenarioStepNumber(processState: UpcomingInboundProcessState): number {
  switch (processState) {
    case 'GRPO_DRAFT':
    case 'QC_PENDING':
      return 1;
    case 'QC_PASSED':
    case 'PENDING_SUPERVISOR_REVIEW':
      return 2;
    case 'SUPERVISOR_APPROVED':
    case 'SAP_SYNCED':
      return 3;
    case 'TRANSFERRED_TO_PM_RM_WH':
    case 'FIN_SUBMITTED':
    case 'DAILY_CLOSED':
    case 'MONTHLY_SUMMARY_READY':
      return 4;
    default:
      return 1;
  }
}

function buildInboundScenarioMeta(
  api: InboundGoodsReceiptApi,
  processState: UpcomingInboundProcessState,
  stepTitle: string,
): GRScenarioMeta {
  const scenarioPath = inferScenarioPath(api, processState);

  return {
    scenarioId: `LIVE-${readString(api, 'receivingNumber', 'receiving_number')}`,
    scenarioName: scenarioNameByPath(scenarioPath),
    scenarioPath,
    stepNumber: scenarioStepNumber(processState),
    totalSteps: 4,
    stepTitle,
  };
}

function buildFallbackPoReferences(api: InboundGoodsReceiptApi): UpcomingInboundGoodsReceipt['poReferences'] {
  const poNumber = readValue<string | null>(api, 'poNumber', 'po_number');
  if (!poNumber) return [];

  return [
    {
      poNumber,
      businessUnit: readString(api, 'businessUnit', 'business_unit'),
      supplier: readString(api, 'supplier'),
      expectedDate: undefined,
      expectedTime: undefined,
      deliveryNoteNumber: readValue<string | null>(api, 'deliveryNoteNumber', 'delivery_note_number') ?? undefined,
    },
  ];
}

function normalizeLegacyStatus(value: string | null | undefined, processState: UpcomingInboundProcessState): LegacyGRStatus {
  return normalizeEnum(value, LEGACY_STATUS_VALUES, mapProcessStateToLegacyStatus(processState));
}

function normalizeQcResult(value: string, processState: UpcomingInboundProcessState): UpcomingInboundGoodsReceipt['qcResult'] {
  switch (value) {
    case 'Pass':
      return 'Pass';
    case 'Rejected':
    case 'On Hold':
    case 'On-Hold':
      return 'Rejected';
    case 'Pending':
      return 'Pending';
    default:
      return processState === 'SUPERVISOR_APPROVED' ? 'Pass' : 'Pending';
  }
}

export function mapInboundGoodsReceipt(api: InboundGoodsReceiptApi): UpcomingInboundGoodsReceipt {
  const poReferences = readArray<InboundGoodsReceiptApi['poReferences'][number]>(
    api,
    'poReferences',
    'po_references',
  );
  const items = readArray<InboundGrItemApi>(api, 'items');
  const activities = readArray<InboundGrActivityApi>(api, 'activities');
  const processState = normalizeEnum(readString(api, 'processState', 'process_state'), PROCESS_STATE_VALUES, 'GRPO_DRAFT');
  const createdDate = formatDisplayTimestamp(readValue<string | null>(api, 'createdDate', 'created_date'));
  const workflowLabel = readString(api, 'workflowLabel', 'workflow_label');
  const recordTypeLabel = readString(api, 'recordTypeLabel', 'record_type_label');
  const fallbackStepTitle = workflowLabel || recordTypeLabel || mapProcessStateToLegacyStatus(processState);
  const qcResult = normalizeQcResult(readString(api, 'qcResult', 'qc_result'), processState);
  const approvedGrNumber =
    processState === 'SUPERVISOR_APPROVED'
      ? undefined
      : readValue<string | null>(api, 'approvedGrNumber', 'approved_gr_number') ?? undefined;

  return {
    id: readValue<number | null>(api, 'id') ?? undefined,
    grNumber: readString(api, 'grNumber', 'gr_number'),
    receivingNumber: readString(api, 'receivingNumber', 'receiving_number'),
    businessUnit: readString(api, 'businessUnit', 'business_unit'),
    approvedGrNumber,
    sapDocEntry: readNumber(api, 'sapDocEntry', 'sap_doc_entry') ?? undefined,
    sapDocNum: readValue<string | null>(api, 'sapDocNum', 'sap_doc_num', 'sap_doc_no') ?? undefined,
    sapGrNumber: readValue<string | null>(api, 'sapGrNumber', 'sap_gr_number') ?? undefined,
    sapGrStatus: readValue<string | null>(api, 'sapGrStatus', 'sap_gr_status') ?? undefined,
    previousReceivingNumber:
      readValue<string | null>(api, 'previousReceivingNumber', 'previous_receiving_number') ?? undefined,
    previousApprovedGrNumber:
      readValue<string | null>(api, 'previousApprovedGrNumber', 'previous_approved_gr_number') ?? undefined,
    poNumber: readString(api, 'poNumber', 'po_number') || readString(poReferences[0], 'poNumber', 'po_number'),
    supplier: readString(api, 'supplier'),
    poReferences:
      poReferences.length > 0
        ? poReferences.map((reference) => ({
            poNumber: readString(reference, 'poNumber', 'po_number'),
            businessUnit: readValue<string | null>(reference, 'businessUnit', 'business_unit') ?? undefined,
            supplier: readValue<string | null>(reference, 'supplier') ?? readString(api, 'supplier'),
            expectedDate: readValue<string | null>(reference, 'expectedDate', 'expected_date') ?? undefined,
            expectedTime: readValue<string | null>(reference, 'expectedTime', 'expected_time') ?? undefined,
            deliveryNoteNumber:
              readValue<string | null>(reference, 'deliveryNoteNumber', 'delivery_note_number') ?? undefined,
          }))
        : buildFallbackPoReferences(api),
    supplierNames: uniqueStrings([
      readString(api, 'supplier'),
      ...poReferences.map((reference) => readValue<string | null>(reference, 'supplier') ?? ''),
    ]),
    receiptType: normalizeEnum(readString(api, 'receiptType', 'receipt_type'), RECEIPT_TYPE_VALUES, 'Planned'),
    receiptSourceType: normalizeEnum(
      readString(api, 'receiptSourceType', 'receipt_source_type'),
      RECEIPT_SOURCE_VALUES,
      'PLANNED',
    ),
    poLinkStatus: normalizeEnum(readString(api, 'poLinkStatus', 'po_link_status'), PO_LINK_STATUS_VALUES, 'NOT_REQUIRED'),
    tempReferenceNo: readValue<string | null>(api, 'tempReferenceNo', 'temp_reference_no') ?? undefined,
    pendingPOReason: readValue<string | null>(api, 'pendingPoReason', 'pending_po_reason') ?? undefined,
    linkedPoNumber: readValue<string | null>(api, 'linkedPoNumber', 'linked_po_number') ?? undefined,
    linkBlockReason: readValue<string | null>(api, 'linkBlockReason', 'link_block_reason') ?? undefined,
    expectedDate: readValue<string | null>(poReferences[0], 'expectedDate', 'expected_date') ?? undefined,
    expectedTime: readValue<string | null>(poReferences[0], 'expectedTime', 'expected_time') ?? undefined,
    postingDate: readString(api, 'postingDate', 'posting_date'),
    actualReceiptDate: readString(api, 'actualReceiptDate', 'actual_receipt_date'),
    deliveryNoteNumber: readString(api, 'deliveryNoteNumber', 'delivery_note_number'),
    receiverWarehouseName:
      readValue<string | null>(api, 'onHoldWarehouseCode', 'on_hold_warehouse_code') ??
      readValue<string | null>(api, 'releaseWarehouseCode', 'release_warehouse_code') ??
      readValue<string | null>(api, 'receivedByUser', 'received_by_user') ??
      'On-Hold Warehouse',
    items: items.map(mapInboundGoodsReceiptItem),
    status: normalizeLegacyStatus(readValue<string | null>(api, 'status'), processState),
    processState,
    displayStatus: readValue<string | null>(api, 'displayStatus', 'display_status') ?? undefined,
    legacyStatus: normalizeLegacyStatus(readValue<string | null>(api, 'legacyStatus', 'legacy_status'), processState),
    createdBy: readValue<string | null>(api, 'createdBy', 'created_by') ?? '',
    createdDate,
    approvedBy:
      readValue<string | null>(api, 'approvedBy', 'approved_by') ??
      readValue<string | null>(api, 'qcReviewedBy', 'qc_reviewed_by') ??
      undefined,
    approvedDate: formatDisplayTimestamp(
      readValue<string | null>(api, 'approvedDate', 'approved_date') ??
        readValue<string | null>(api, 'qcReviewedAt', 'qc_reviewed_at'),
    ),
    qcSubmittedViewedBy:
      readValue<string | null>(api, 'qcSubmittedViewedBy', 'qc_submitted_viewed_by') ?? undefined,
    qcSubmittedViewedAt: formatDisplayTimestamp(
      readValue<string | null>(api, 'qcSubmittedViewedAt', 'qc_submitted_viewed_at'),
    ),
    qcRejectedViewedBy:
      readValue<string | null>(api, 'qcRejectedViewedBy', 'qc_rejected_viewed_by') ?? undefined,
    qcRejectedViewedAt: formatDisplayTimestamp(
      readValue<string | null>(api, 'qcRejectedViewedAt', 'qc_rejected_viewed_at'),
    ),
    specMatch: readBoolean(api, 'specMatch', 'spec_match'),
    qtyMatch: readBoolean(api, 'qtyMatch', 'qty_match'),
    qualityCheckRequired: readBoolean(api, 'qualityCheckRequired', 'quality_check_required'),
    qcResult,
    exceptionReason: readValue<string | null>(api, 'exceptionReason', 'exception_reason') ?? undefined,
    workflowLabel,
    recordTypeLabel,
    isAppendable: readBoolean(api, 'isAppendable', 'is_appendable'),
    documentChecklist: mapInboundDocumentChecklist(
      readValue<InboundGrDocumentChecklistApi | undefined>(api, 'documentChecklist', 'document_checklist'),
    ),
    scenario: buildInboundScenarioMeta(api, processState, fallbackStepTitle),
    activities:
      activities.length > 0
        ? activities.map(mapInboundActivity)
        : buildActivities(processState, createdDate, fallbackStepTitle),
  };
}

export function mapInboundGoodsReceipts(receipts: InboundGoodsReceiptApi[]): UpcomingInboundGoodsReceipt[] {
  if (!Array.isArray(receipts)) return [];
  return receipts.map(mapInboundGoodsReceipt);
}
