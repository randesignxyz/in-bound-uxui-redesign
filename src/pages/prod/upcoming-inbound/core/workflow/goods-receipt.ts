import { normalizeReceivingNumber } from '../receivingNumber';
import type {
  GoodsReceipt,
  ReceiptPoGroupedItemShape,
  ReceiptPoItemGroup,
  InboundProcessState,
  LegacyGRStatus,
  InboundHistoryStatus,
  QcQueueStatus,
  GoodsReceiptSourceType,
  POLinkStatus,
  SupportingDocSource,
} from '../type';
import { officialStateLabel } from '../constants';

export function getReceiptPOReferences(receipt: GoodsReceipt) {
  if (receipt.receiptSourceType === 'TEMP_NO_PO') {
    if (receipt.linkedPoNumber) {
      return [
        {
          poNumber: receipt.linkedPoNumber,
          businessUnit: receipt.businessUnit,
          supplier: receipt.supplier,
          expectedDate: receipt.expectedDate,
          expectedTime: receipt.expectedTime,
        },
      ];
    }

    return [];
  }

  return receipt.poReferences?.length
    ? receipt.poReferences
    : [
        {
          poNumber: receipt.poNumber,
          businessUnit: receipt.businessUnit,
          supplier: receipt.supplier,
          expectedDate: receipt.expectedDate,
          expectedTime: receipt.expectedTime,
        },
      ];
}

export function summarizePOReferences(receipt: GoodsReceipt) {
  const references = getReceiptPOReferences(receipt);
  if (receipt.receiptSourceType === 'TEMP_NO_PO' && references.length === 0) {
    return 'Waiting SAP PO';
  }
  if (references.length === 1) return references[0].poNumber;
  return `${references.length} POs`;
}

export function summarizeSuppliers(receipt: GoodsReceipt) {
  const suppliers = receipt.supplierNames?.length
    ? receipt.supplierNames
    : Array.from(new Set(getReceiptPOReferences(receipt).map((reference) => reference.supplier)));
  if (suppliers.length === 1) return suppliers[0];
  return `${suppliers.length} suppliers`;
}

function normalizeReceiptItemPoNumber(
  receipt: GoodsReceipt,
  item: ReceiptPoGroupedItemShape,
) {
  return (
    item.poNumber?.trim() ||
    receipt.linkedPoNumber?.trim() ||
    receipt.poNumber?.trim() ||
    undefined
  );
}

export function groupReceiptItemsByPO<TItem extends ReceiptPoGroupedItemShape>(
  receipt: GoodsReceipt,
  items: TItem[],
): ReceiptPoItemGroup<TItem>[] {
  const poReferencesByNumber = new Map(
    getReceiptPOReferences(receipt).map((reference) => [reference.poNumber, reference]),
  );
  const groupedItems = new Map<string, ReceiptPoItemGroup<TItem>>();
  const poQtyByGroupAndItem = new Map<string, Map<string, number>>();

  items.forEach((item) => {
    const poNumber = normalizeReceiptItemPoNumber(receipt, item);
    const groupKey = poNumber || '__UNASSIGNED_PO__';
    const itemKey = item.code.trim();
    const existingGroup = groupedItems.get(groupKey);
    const poReference = poNumber ? poReferencesByNumber.get(poNumber) : undefined;
    const groupPoQtyByItem = poQtyByGroupAndItem.get(groupKey) ?? new Map<string, number>();
    const previousPoQty = groupPoQtyByItem.get(itemKey) ?? 0;
    const nextPoQty = Math.max(previousPoQty, item.poQty);

    groupPoQtyByItem.set(itemKey, nextPoQty);
    poQtyByGroupAndItem.set(groupKey, groupPoQtyByItem);

    if (existingGroup) {
      existingGroup.items.push(item);
      existingGroup.itemCount += 1;
      existingGroup.totalPoQty += nextPoQty - previousPoQty;
      existingGroup.totalReceiveQty += item.receiveQty;
      return;
    }

    groupedItems.set(groupKey, {
      key: groupKey,
      poNumber,
      displayPoNumber:
        poNumber ||
        (receipt.receiptSourceType === 'TEMP_NO_PO' ? 'Waiting SAP PO' : 'PO Unassigned'),
      supplier: item.supplier || poReference?.supplier || receipt.supplier,
      expectedDate: poReference?.expectedDate || undefined,
      expectedTime: poReference?.expectedTime || undefined,
      itemCount: 1,
      totalPoQty: item.poQty,
      totalReceiveQty: item.receiveQty,
      items: [item],
    });
  });

  return Array.from(groupedItems.values()).sort((left, right) => {
    if (!left.poNumber && !right.poNumber) return 0;
    if (!left.poNumber) return 1;
    if (!right.poNumber) return -1;
    return left.poNumber.localeCompare(right.poNumber);
  });
}

export function getReceiptIrNumber(
  receipt: Pick<GoodsReceipt, 'receivingNumber' | 'grNumber'>,
) {
  return normalizeReceivingNumber(receipt.receivingNumber?.trim() || receipt.grNumber);
}

export function getReceiptApprovedGrNumber(
  receipt: Pick<GoodsReceipt, 'approvedGrNumber' | 'sapDocNum' | 'sapGrNumber'>,
) {
  return receipt.sapDocNum?.trim() || receipt.sapGrNumber?.trim() || receipt.approvedGrNumber?.trim() || undefined;
}

export function getReceiptSapStatus(receipt: Pick<GoodsReceipt, 'sapGrStatus' | 'processState'>) {
  const sapStatus = receipt.sapGrStatus?.trim();
  if (sapStatus) {
    return sapStatus;
  }

  return receipt.processState === 'SUPERVISOR_APPROVED' ? 'Pending SAP' : undefined;
}

export const goodsReceiptSourceLabel: Record<GoodsReceiptSourceType, string> = {
  PLANNED: 'Planned',
  UNPLANNED_WITH_PO: 'Unplanned',
  TEMP_NO_PO: 'Temporary Receiving',
};

export const poLinkStatusLabel: Record<POLinkStatus, string> = {
  NOT_REQUIRED: 'Not Required',
  WAITING_PO: 'Waiting PO',
  LINKED: 'Linked',
};

export const supportingDocSourceLabel: Record<SupportingDocSource, string> = {
  WAREHOUSE: 'Warehouse',
  QC: 'QC',
  SUPERVISOR: 'Supervisor',
};

export function getGoodsReceiptSourceColor(sourceType: GoodsReceiptSourceType) {
  switch (sourceType) {
    case 'PLANNED':
      return 'green';
    case 'UNPLANNED_WITH_PO':
      return 'orange';
    case 'TEMP_NO_PO':
      return 'purple';
    default:
      return 'default';
  }
}

export function getPOLinkStatusColor(status: POLinkStatus) {
  switch (status) {
    case 'NOT_REQUIRED':
      return 'default';
    case 'WAITING_PO':
      return 'warning';
    case 'LINKED':
      return 'success';
    default:
      return 'default';
  }
}

export function getSupportingDocSourceColor(source?: SupportingDocSource | null) {
  switch (source) {
    case 'WAREHOUSE':
      return 'blue';
    case 'QC':
      return 'gold';
    case 'SUPERVISOR':
      return 'green';
    default:
      return 'default';
  }
}

// Helpers
function getLatestCorrectionActivityText(receipt: GoodsReceipt) {
  const latestCorrectionActivity =
    [...receipt.activities].reverse().find((activity) => activity.processState === receipt.processState) ??
    [...receipt.activities]
      .reverse()
      .find((activity) => `${activity.title || ''} ${activity.description || ''}`.trim().length > 0);

  return `${latestCorrectionActivity?.title || ''} ${latestCorrectionActivity?.description || ''}`.trim().toLowerCase();
}

function isSupervisorRejectedCorrection(receipt: GoodsReceipt) {
  return getLatestCorrectionActivityText(receipt).includes('supervisor rejected');
}

function isQcRejectedCorrection(receipt: GoodsReceipt) {
  return getLatestCorrectionActivityText(receipt).includes('qc rejected');
}

export function isQcRejectedReceipt(receipt: GoodsReceipt) {
  return receipt.processState === 'MISMATCH_EXCEPTION' || receipt.qcResult === 'Rejected' || isQcRejectedCorrection(receipt);
}

function isRejectedReceipt(receipt: GoodsReceipt) {
  return isSupervisorRejectedCorrection(receipt) || isQcRejectedReceipt(receipt);
}

function hasActivityMatch(receipt: GoodsReceipt, text: string) {
  return receipt.activities.some((activity) =>
    `${activity.title || ''} ${activity.description || ''}`.trim().toLowerCase().includes(text)
  );
}

function hasSupervisorRejectedHistory(receipt: GoodsReceipt) {
  return hasActivityMatch(receipt, 'supervisor rejected');
}

function hasQcRejectedHistory(receipt: GoodsReceipt) {
  return receipt.processState === 'MISMATCH_EXCEPTION' || receipt.qcResult === 'Rejected' || hasActivityMatch(receipt, 'qc rejected');
}

function hasRejectedHistory(receipt: GoodsReceipt) {
  return hasSupervisorRejectedHistory(receipt) || hasQcRejectedHistory(receipt);
}

export function getReceiptDisplayStatus(receipt: GoodsReceipt) {
  const explicitDisplayStatus = receipt.displayStatus?.trim();
  if (explicitDisplayStatus) {
    return explicitDisplayStatus;
  }

  switch (receipt.processState) {
    case 'RECEIVED_CHECKING':
      return 'Received Checking';
    case 'RECEIPT_CONFIRMED':
      return 'Receipt Confirmed';
    case 'STORED_ON_HOLD':
      return 'Stored On-Hold';
    case 'GRPO_DRAFT':
      return 'GRPO Draft';
    case 'QC_PENDING':
      return 'QC Pending';
    case 'QC_PASSED':
      return 'QC Passed';
    case 'PENDING_SUPERVISOR_REVIEW':
    case 'MERGED_TO_SUPERVISOR_REVIEW':
      return 'Pending Supervisor Review';
    case 'SUPERVISOR_APPROVED':
      return 'Ready to Post SAP';
    case 'SAP_SYNCED':
      return receipt.sapGrStatus?.trim() || 'SAP Synced';
    case 'TRANSFERRED_TO_PM_RM_WH':
    case 'FIN_SUBMITTED':
    case 'DAILY_CLOSED':
    case 'MONTHLY_SUMMARY_READY':
      return 'Supervisor Approved';
    case 'MISMATCH_EXCEPTION':
      return 'QC Rejected';
    case 'CORRECTION_REQUIRED':
      if (isSupervisorRejectedCorrection(receipt)) {
        return 'Supervisor Rejected';
      }
      if (isQcRejectedReceipt(receipt)) {
        return 'QC Rejected';
      }
      return 'Correction Required';
    default:
      return officialStateLabel[receipt.processState];
  }
}

export function getReceiptDisplayStatusColor(displayStatus: string) {
  switch (displayStatus) {
    case 'Received Checking':
      return 'geekblue';
    case 'Receipt Confirmed':
      return 'cyan';
    case 'Stored On-Hold':
    case 'Correction Required':
      return 'orange';
    case 'QC Pending':
    case 'Pending Supervisor Review':
    case 'Ready to Post SAP':
    case 'Pending SAP':
      return 'gold';
    case 'QC Passed':
    case 'SAP Synced':
      return 'blue';
    case 'Supervisor Approved':
    case 'Open':
    case 'OPEN':
      return 'processing';
    case 'Close':
    case 'Closed':
    case 'CLOSED':
      return 'green';
    case 'QC Rejected':
    case 'Supervisor Rejected':
      return 'red';
    case 'GRPO Draft':
      return 'default';
    default:
      return 'default';
  }
}

export function getGoodsReceiptProcessStateBadgeColor(displayStatus: string) {
  return getReceiptDisplayStatusColor(displayStatus);
}

export function getInboundHistoryStatus(receipt: GoodsReceipt): InboundHistoryStatus {
  const rejectedHistory = hasRejectedHistory(receipt);

  switch (receipt.processState) {
    case 'GRPO_DRAFT':
      return rejectedHistory ? 'Rejected' : 'Draft';
    case 'QC_PENDING':
    case 'QC_PASSED':
    case 'PENDING_SUPERVISOR_REVIEW':
      return 'Pending';
    case 'SUPERVISOR_APPROVED':
      return 'Ready to Post SAP';
    case 'SAP_SYNCED':
    case 'TRANSFERRED_TO_PM_RM_WH':
    case 'FIN_SUBMITTED':
    case 'DAILY_CLOSED':
    case 'MONTHLY_SUMMARY_READY':
      return 'Complete';
    case 'MISMATCH_EXCEPTION':
    case 'CORRECTION_REQUIRED':
      return rejectedHistory ? 'Rejected' : 'Correction Required';
    default:
      return 'Draft';
  }
}

export function getQcQueueStatus(receipt: GoodsReceipt): QcQueueStatus | null {
  switch (receipt.processState) {
    case 'QC_PENDING':
      return 'Pending';
    case 'QC_PASSED':
    case 'PENDING_SUPERVISOR_REVIEW':
    case 'MERGED_TO_SUPERVISOR_REVIEW':
      return 'Submitted';
    case 'SUPERVISOR_APPROVED':
    case 'SAP_SYNCED':
    case 'TRANSFERRED_TO_PM_RM_WH':
    case 'FIN_SUBMITTED':
    case 'DAILY_CLOSED':
    case 'MONTHLY_SUMMARY_READY':
      return 'Complete';
    case 'MISMATCH_EXCEPTION':
      return 'Rejected';
    case 'CORRECTION_REQUIRED':
      return isRejectedReceipt(receipt) ? 'Rejected' : 'Correction Required';
    default:
      return null;
  }
}

export function getQcQueueStatusColor(status: QcQueueStatus) {
  switch (status) {
    case 'Pending':
      return 'gold';
    case 'Submitted':
      return 'blue';
    case 'Correction Required':
      return 'orange';
    case 'Rejected':
      return 'red';
    case 'Complete':
      return 'green';
    default:
      return 'default';
  }
}

export function getInboundHistoryStatusColor(status: InboundHistoryStatus) {
  switch (status) {
    case 'Draft':
      return 'default';
    case 'Pending':
      return 'gold';
    case 'Complete':
      return 'green';
    case 'Rejected':
      return 'red';
    case 'Correction Required':
      return 'orange';
    default:
      return 'default';
  }
}

export function mapProcessStateToLegacyStatus(state: InboundProcessState): LegacyGRStatus {
  switch (state) {
    case 'GRPO_DRAFT':
      return 'Draft';
    case 'QC_PENDING':
    case 'QC_PASSED':
    case 'PENDING_SUPERVISOR_REVIEW':
    case 'MERGED_TO_SUPERVISOR_REVIEW':
      return 'Pending Approval';
    case 'SUPERVISOR_APPROVED':
      return 'Ready To Post SAP';
    case 'TRANSFERRED_TO_PM_RM_WH':
    case 'FIN_SUBMITTED':
    case 'DAILY_CLOSED':
    case 'MONTHLY_SUMMARY_READY':
      return 'Posted';
    case 'CORRECTION_REQUIRED':
    case 'MISMATCH_EXCEPTION':
      return 'Correction Required';
    default:
      return 'Draft';
  }
}


