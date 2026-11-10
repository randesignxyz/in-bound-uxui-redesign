import { createQCFollowUps } from './qcFollowUp';
import type { GoodsReceipt } from './type';

const parent = {
  grNumber: 'GR-1',
  irPlanNumber: 'IR001',
  businessUnit: 'OFL',
  receiverWarehouseName: 'WHM1',
  poNumber: 'PO-1',
  items: [{
    code: 'ITEM-1', poNumber: 'PO-1', uom: 'EA',
    poQty: 100, receiveQty: 100,
    qcAcceptedQty: 60, qcRejectedQty: 25, qcOnHoldQty: 15,
  }],
} as GoodsReceipt;

it('creates sequential follow-up IRs for existing rejected and held stock', () => {
  const children = createQCFollowUps(parent, [parent]);
  expect(children.map(child => child.irPlanNumber)).toEqual(['IR001-1', 'IR001-2']);
  expect(children.map(child => child.items[0].receiveQty)).toEqual([25, 15]);
  expect(children.map(child => child.qcFollowUpType)).toEqual(['REJECTED', 'ON_HOLD']);
  expect(children.every(child => child.parentIrNumber === 'IR001' && child.rootIrNumber === 'IR001')).toBe(true);
  expect(children.every(child => child.businessUnit === 'OMM' && child.receiverWarehouseName === 'WH-02')).toBe(true);
  expect(children.every(child => child.items[0].sapPostedQty === undefined)).toBe(true);
  expect(children[1].processState).toBe('QC_PENDING');
  expect(children[1].items[0].qcAcceptedQty).toBe(0);
  expect(createQCFollowUps(parent, [parent, ...children])).toEqual([]);
});

it('creates the next generation only for unresolved quantities after reinspection', () => {
  const held = createQCFollowUps(parent, [parent])[1];
  const reinspected = {
    ...held,
    items: [{ ...held.items[0], qcAcceptedQty: 10, qcRejectedQty: 3, qcOnHoldQty: 2 }],
  };
  const children = createQCFollowUps(reinspected, [parent, held]);
  expect(children.map(child => child.irPlanNumber)).toEqual(['IR001-2-1', 'IR001-2-2']);
  expect(children.map(child => child.items[0].receiveQty)).toEqual([3, 2]);
  expect(children.every(child => child.rootIrNumber === 'IR001')).toBe(true);
});
