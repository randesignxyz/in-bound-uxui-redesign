import type {
  GoodsReceipt,
  GRItem,
  ReceiptPoGroupedItemShape,
  InboundProcessState,
} from '../type';

function getReceiptItemQuantityKey(item: Pick<GRItem, 'poNumber' | 'poLineNumber' | 'code'>) {
  return `${item.poNumber || 'NO_PO'}::${item.poLineNumber ?? item.code}::${item.code}`;
}

function getReceiptItemQuantityGroups(items: GRItem[]) {
  const groups = new Map<
    string,
    { code: string; poQty: number; receiveQty: number; uom: string }
  >();

  items.forEach((item) => {
    if (item.isDeferred || item.isMissing) return;
    const key = getReceiptItemQuantityKey(item);
    const current = groups.get(key) || {
      code: item.code,
      poQty: item.poQty,
      receiveQty: 0,
      uom: item.uom,
    };
    current.poQty = Math.max(current.poQty, item.poQty);
    current.receiveQty += item.receiveQty;
    groups.set(key, current);
  });

  return Array.from(groups.values());
}

export function hasReceiptDiscrepancy(items: GRItem[]) {
  if (items.some((item) => !item.isDeferred && item.isMissing)) {
    return true;
  }

  return getReceiptItemQuantityGroups(items).some((item) => item.receiveQty < item.poQty);
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

export function buildReceiptExceptionReason(items: GRItem[]) {
  const missingReasons = items
    .filter((item) => !item.isDeferred && item.isMissing)
    .map((item) => `${item.code}: missing item${item.missingRemark?.trim() ? ` - ${item.missingRemark.trim()}` : ''}`);
  const shortReasons = getReceiptItemQuantityGroups(items)
    .filter((item) => item.receiveQty < item.poQty)
    .map((item) => {
      const shortage = item.poQty - item.receiveQty;
      return `${item.code}: short by ${shortage.toLocaleString()} ${item.uom}`;
    });

  return [...missingReasons, ...shortReasons]
    .join('; ');
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

function isQcRejectedReceipt(receipt: GoodsReceipt) {
  return receipt.processState === 'MISMATCH_EXCEPTION' || receipt.qcResult === 'Rejected' || isQcRejectedCorrection(receipt);
}

function isRejectedReceipt(receipt: GoodsReceipt) {
  return isSupervisorRejectedCorrection(receipt) || isQcRejectedReceipt(receipt);
}

function buildReceiptItemKey(receipt: GoodsReceipt, item: ReceiptPoGroupedItemShape) {
  const poNumber = normalizeReceiptItemPoNumber(receipt, item)?.trim().toUpperCase();
  const itemCode = item.code?.trim().toUpperCase();

  if (!poNumber || !itemCode) {
    return undefined;
  }

  return `${poNumber}::${itemCode}`;
}

function isReceiptEligibleForQtyCoverage(receipt: GoodsReceipt) {
  const QTY_EXCEPTION_COVERAGE_STATES = new Set<InboundProcessState>([
    'RECEIVED_CHECKING',
    'MISMATCH_EXCEPTION',
    'RECEIPT_CONFIRMED',
    'STORED_ON_HOLD',
    'QC_PENDING',
    'QC_PASSED',
    'PENDING_SUPERVISOR_REVIEW',
    'CORRECTION_REQUIRED',
    'SUPERVISOR_APPROVED',
    'TRANSFERRED_TO_PM_RM_WH',
    'FIN_SUBMITTED',
    'DAILY_CLOSED',
    'MONTHLY_SUMMARY_READY',
  ]);

  if (!QTY_EXCEPTION_COVERAGE_STATES.has(receipt.processState)) {
    return false;
  }

  if (!receipt.specMatch) {
    return false;
  }

  return !isRejectedReceipt(receipt);
}

function buildReceiptQtyCoverage(receipts: GoodsReceipt[]) {
  const coverageByItem = new Map<string, { expectedQty: number; receiveQty: number }>();

  receipts.filter(isReceiptEligibleForQtyCoverage).forEach((receipt) => {
    receipt.items.forEach((item) => {
      const itemKey = buildReceiptItemKey(receipt, item);
      if (!itemKey) return;

      const currentCoverage = coverageByItem.get(itemKey) || { expectedQty: 0, receiveQty: 0 };
      currentCoverage.expectedQty = Math.max(currentCoverage.expectedQty, item.poQty);
      currentCoverage.receiveQty += Math.max(item.receiveQty, 0);
      coverageByItem.set(itemKey, currentCoverage);
    });
  });

  return coverageByItem;
}

function collectQuantityExceptionItemKeys(receipt: GoodsReceipt) {
  return Array.from(
    new Set(
      receipt.items
          .filter((item) => item.isMissing || item.receiveQty < item.poQty)
          .map((item) => buildReceiptItemKey(receipt, item))
          .filter((itemKey): itemKey is string => Boolean(itemKey)),
    ),
  );
}

function isReceiptVisibleInExceptionQueue(
  receipt: GoodsReceipt,
  qtyCoverageByItem: Map<string, { expectedQty: number; receiveQty: number }>,
) {
  if (!receipt.specMatch || isQcRejectedReceipt(receipt)) {
    return true;
  }

  const quantityExceptionKeys = collectQuantityExceptionItemKeys(receipt);
  if (quantityExceptionKeys.length > 0) {
    return quantityExceptionKeys.some((itemKey) => {
      const coverage = qtyCoverageByItem.get(itemKey);
      return !coverage || coverage.receiveQty < coverage.expectedQty;
    });
  }

  return !receipt.qtyMatch;
}

export function getExceptionQueueReceipts(receipts: GoodsReceipt[]) {
  const qtyCoverageByItem = buildReceiptQtyCoverage(receipts);

  return receipts.filter((receipt) => isReceiptVisibleInExceptionQueue(receipt, qtyCoverageByItem));
}
