import type { GoodsReceipt } from './type';

export type QCQueue = 'PENDING' | 'ON_HOLD' | 'REJECTED' | 'PASSED' | 'ALL';
export const qcQueueLabels: Record<QCQueue, string> = {
  PENDING: 'To Inspect', ON_HOLD: 'On Hold', REJECTED: 'Rejected', PASSED: 'Passed', ALL: 'All Receipts',
};

export function getQCQueueState(receipt: GoodsReceipt) {
  const pending = receipt.deliveryPlanStatus === 'Waiting for QC' || receipt.processState === 'QC_PENDING';
  const acceptedQty = receipt.items.reduce((sum, item) => sum + (item.qcAcceptedQty || 0), 0);
  const rejectedQty = receipt.items.reduce((sum, item) => sum + (item.qcRejectedQty || 0), 0);
  const holdQty = receipt.items.reduce((sum, item) => sum + (item.qcOnHoldQty || 0), 0);
  const result = receipt.qcResult;
  const rejected = !pending && (rejectedQty > 0 || ['Fail', 'Reject', 'Rejected', 'Partial Reject'].includes(result || '') || receipt.processState === 'QC_REJECTED');
  const onHold = !pending && (holdQty > 0 || ['On Hold', 'Conditional Pass'].includes(result || '') || receipt.processState === 'QC_ON_HOLD');
  const passed = !pending && !rejected && !onHold && (result === 'Pass' || receipt.processState === 'QC_PASSED' || (receipt.deliveryPlanStatus === 'QC Completed' && acceptedQty > 0));
  const partial = rejected && (acceptedQty > 0 || holdQty > 0 || result === 'Partial Reject');
  return {
    pending, rejected, onHold, passed, acceptedQty, rejectedQty, holdQty,
    label: pending ? 'To Inspect' : partial ? 'Partially Rejected' : rejected ? 'Rejected' : onHold ? 'On Hold' : passed ? 'Passed' : 'Awaiting Warehouse',
    color: pending ? 'purple' : rejected ? 'red' : onHold ? 'gold' : passed ? 'green' : 'default',
  };
}

// A receipt with both rejected and held quantities belongs to both follow-up queues.
export function matchesQCQueue(receipt: GoodsReceipt, queue: QCQueue) {
  const state = getQCQueueState(receipt);
  return queue === 'ALL' || ({ PENDING: state.pending, ON_HOLD: state.onHold, REJECTED: state.rejected, PASSED: state.passed })[queue];
}

export function getQCFollowUp(receipt: GoodsReceipt) {
  if (receipt.processState === 'PENDING_SUPERVISOR_REVIEW' || receipt.deliveryPlanStatus === 'Pending Supervisor') return 'Supervisor review';
  if (receipt.sendBackTarget === 'QC' || receipt.processState === 'QC_PENDING') return 'QC reinspection';
  if (receipt.sendBackTarget === 'WAREHOUSE') return 'Warehouse correction';
  return 'Follow-up team not assigned';
}
