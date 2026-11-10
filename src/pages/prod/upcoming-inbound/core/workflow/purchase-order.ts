import type {
  PurchaseOrder,
  GoodsReceipt,
  PurchaseOrderReceiptState,
} from '../type';
import { BLOCKING_PO_RECEIPT_STATES } from '../constants';

export function getCombinedPurchaseOrderVendor(purchaseOrders: PurchaseOrder[]) {
  const normalizedSuppliers = Array.from(
    new Set(
      purchaseOrders
        .map((purchaseOrder) => purchaseOrder.supplier?.trim())
        .filter((supplier): supplier is string => Boolean(supplier)),
    ),
  );

  return normalizedSuppliers.length === 1 ? normalizedSuppliers[0] : undefined;
}

export function getPurchaseOrderVendorOptions(purchaseOrders: PurchaseOrder[]) {
  return Array.from(
    new Set(
      purchaseOrders
        .map((purchaseOrder) => purchaseOrder.supplier?.trim())
        .filter((supplier): supplier is string => Boolean(supplier)),
    ),
  ).sort((left, right) => left.localeCompare(right));
}

export function canCombinePurchaseOrders(purchaseOrders: PurchaseOrder[]) {
  const businessUnits = Array.from(new Set(purchaseOrders.map((purchaseOrder) => purchaseOrder.businessUnit)));
  return (
    businessUnits.length <= 1 &&
    (purchaseOrders.length <= 1 || Boolean(getCombinedPurchaseOrderVendor(purchaseOrders)))
  );
}

export function isApprovedPoReceiptLogStatus(statusLabel?: string) {
  const label = statusLabel?.toLowerCase() || '';
  return (
    (label.includes('approved') ||
      label.includes('posted') ||
      label.includes('synced') ||
      label.includes('complete')) &&
    !label.includes('rejected') &&
    !label.includes('correction') &&
    !label.includes('pending') &&
    !label.includes('draft')
  );
}

export function isBlockingPoReceiptLogStatus(statusLabel?: string) {
  const label = statusLabel?.toLowerCase() || '';
  if (!label) {
    return false;
  }

  return (
    label.includes('draft') ||
    label.includes('pending') ||
    label.includes('rejected') ||
    label.includes('correction') ||
    label.includes('exception')
  );
}

export function getLinkedPurchaseOrderReceipts(
  purchaseOrder: PurchaseOrder,
  goodsReceipts: GoodsReceipt[],
) {
  return goodsReceipts.filter((receipt) => {
    if (receipt.poNumber === purchaseOrder.poNumber) return true;
    return receipt.poReferences?.some((reference) => reference.poNumber === purchaseOrder.poNumber);
  });
}
function isRejectedReceipt(receipt: GoodsReceipt) {
  const latestCorrectionActivity =
    [...receipt.activities].reverse().find((activity) => activity.processState === receipt.processState) ??
    [...receipt.activities]
      .reverse()
      .find((activity) => `${activity.title || ''} ${activity.description || ''}`.trim().length > 0);

  const latestCorrectionText = `${latestCorrectionActivity?.title || ''} ${latestCorrectionActivity?.description || ''}`.trim().toLowerCase();

  const isSupervisorRejectedCorrection = latestCorrectionText.includes('supervisor rejected');
  const isQcRejectedCorrection = latestCorrectionText.includes('qc rejected');
  const isQcRejectedReceipt = receipt.processState === 'MISMATCH_EXCEPTION' || receipt.qcResult === 'Rejected' || isQcRejectedCorrection;

  return isSupervisorRejectedCorrection || isQcRejectedReceipt;
}

export function isBlockingPurchaseOrderReceipt(receipt: GoodsReceipt) {
  return (
    BLOCKING_PO_RECEIPT_STATES.has(receipt.processState) ||
    receipt.qcResult === 'Rejected' ||
    isRejectedReceipt(receipt)
  );
}

export function getPurchaseOrderReceiptState(
  purchaseOrder: PurchaseOrder,
  goodsReceipts: GoodsReceipt[] = [],
): PurchaseOrderReceiptState {
  const isClosedPo = ['C', 'CLOSE', 'CLOSED'].includes(purchaseOrder.docStatus?.trim().toUpperCase() || '');
  const linkedReceipts = getLinkedPurchaseOrderReceipts(purchaseOrder, goodsReceipts);
  const hasLinkedReceipts =
    linkedReceipts.length > 0 || (purchaseOrder.receiptLogs?.some((log) => typeof log.receiptId === 'number') ?? false);
  const hasBlockingReceipt =
    linkedReceipts.length > 0
      ? linkedReceipts.some((receipt) => isBlockingPurchaseOrderReceipt(receipt))
      : purchaseOrder.receiptLogs?.some((log) => isBlockingPoReceiptLogStatus(log.statusLabel)) ?? false;

  const hasOutstandingQty =
    purchaseOrder.items?.some((item) => {
      if (item.remainingQty > 0) {
        return true;
      }

      const approvedQty =
        purchaseOrder.receiptLogs?.reduce((sum, log) => {
          if (!isApprovedPoReceiptLogStatus(log.statusLabel)) {
            return sum;
          }

          const matchedItem = log.approvedItems?.find((approvedItem) => approvedItem.code === item.code);
          return sum + (matchedItem ? matchedItem.qty : 0);
        }, 0) ?? 0;

      return approvedQty < item.poQty;
    }) ?? false;

  const isFullyReceived = !hasOutstandingQty && !hasBlockingReceipt;
  const canCreateInboundReceiving = hasOutstandingQty && !hasBlockingReceipt && !isClosedPo;

  return {
    hasOutstandingQty,
    hasLinkedReceipts,
    hasBlockingReceipt,
    isClosedPo,
    isFullyReceived,
    canCreateInboundReceiving,
    displayStatus: isClosedPo
      ? 'Closed'
      : isFullyReceived
      ? 'Fully Received'
      : hasBlockingReceipt
        ? 'In Progress'
        : 'Ready to Receive',
  };
}
