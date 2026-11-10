import type { GoodsReceipt, GRItem } from './type';

type FollowUpType = NonNullable<GoodsReceipt['qcFollowUpType']>;

const followUpQuantity = (item: GRItem, type: FollowUpType) =>
  type === 'REJECTED' ? item.qcRejectedQty ?? 0 : item.qcOnHoldQty ?? 0;

/** Children represent existing stock; they are never new PO deliveries. */
export function createQCFollowUps(source: GoodsReceipt, existing: GoodsReceipt[]): GoodsReceipt[] {
  const parentIrNumber = source.irPlanNumber;
  if (!parentIrNumber || existing.some(receipt => receipt.parentIrNumber === parentIrNumber)) return [];

  const usedNumbers = new Set(existing.map(receipt => receipt.irPlanNumber));
  const now = Date.now();
  let suffix = 1;
  return (['REJECTED', 'ON_HOLD'] as const).flatMap(type => {
    const items = source.items.flatMap(item => {
      const qty = followUpQuantity(item, type);
      if (qty <= 0) return [];
      return [{
        ...item,
        poQty: qty,
        plannedQty: qty,
        receiveQty: qty,
        actualReceivedQty: qty,
        qcAcceptedQty: 0,
        qcRejectedQty: type === 'REJECTED' ? qty : 0,
        qcOnHoldQty: type === 'ON_HOLD' ? qty : 0,
        finalGrQty: undefined,
        sapPostedQty: undefined,
        batches: undefined,
      }];
    });
    if (!items.length) return [];

    while (usedNumbers.has(`${parentIrNumber}-${suffix}`)) suffix += 1;
    const irPlanNumber = `${parentIrNumber}-${suffix++}`;
    usedNumbers.add(irPlanNumber);
    const isHold = type === 'ON_HOLD';
    const timestamp = now + suffix;
    return [{
      ...source,
      id: timestamp,
      grNumber: `QC-${irPlanNumber}`,
      receivingNumber: `QC-${irPlanNumber}`,
      irPlanNumber,
      parentIrNumber,
      rootIrNumber: source.rootIrNumber || parentIrNumber,
      qcFollowUpType: type,
      businessUnit: 'OMM',
      receiverWarehouseName: 'WH-02',
      items,
      deliveryPlanStatus: isHold ? 'Waiting for QC' : 'QC Completed',
      processState: isHold ? 'QC_PENDING' : 'QC_REJECTED',
      displayStatus: isHold ? 'On Hold — Ready for Reinspection' : 'Rejected — Awaiting Disposition',
      qcResult: isHold ? 'On Hold' : 'Rejected',
      sapDocNum: undefined,
      sapGrNumber: undefined,
      sapPostingStatus: undefined,
      supervisorDecision: undefined,
      supervisorAdjustments: undefined,
      createdBy: 'Supervisor (Demo)',
      createdDate: new Date(now).toISOString(),
      activities: [{
        id: `act-follow-up-${irPlanNumber}`,
        title: `${isHold ? 'On-Hold' : 'Rejected'} QC Follow-Up Created`,
        description: `${irPlanNumber} follows ${parentIrNumber}; ${items.map(item => `${item.receiveQty} ${item.uom} ${item.code}`).join(', ')} transferred to WH-02 for OMM. This is existing stock, not a new receipt.`,
        performedBy: 'Supervisor (Demo)',
        timestamp: new Date(now).toISOString(),
        state: 'done' as const,
      }],
    }];
  });
}
