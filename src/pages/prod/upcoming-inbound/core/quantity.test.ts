import { formatQuantities, getPostingQuantity, getPostedQuantityForItem } from './quantity';
type GRItem = import('./type').GRItem;
const item = { code: 'TEST', receiveQty: 10, qcAcceptedQty: 0, uom: 'EA' } as GRItem;
it('preserves zero accepted and zero adjusted quantities for SAP posting', () => {
  expect(getPostingQuantity(item)).toBe(0);
  expect(getPostingQuantity({ ...item, qcAcceptedQty: 10, finalGrQty: 0 })).toBe(0);
  expect(getPostingQuantity({ ...item, qcAcceptedQty: undefined })).toBe(10);
});
it('groups quantities by unit rather than adding unlike units', () => {
  expect(formatQuantities([{ uom: 'EA', qty: 10 }, { uom: 'kg', qty: 5 }, { uom: 'EA', qty: 3 }], i => i.qty)).toBe('13 EA · 5 kg');
});

it('posts split lines only to their own PO and preserves zero posted quantity', () => {
  const items = [
    { ...item, poNumber: 'PO1', sapPostedQty: 0 },
    { ...item, poNumber: 'PO1', qcAcceptedQty: 3 },
    { ...item, poNumber: 'PO2', qcAcceptedQty: 9 },
  ];
  expect(getPostedQuantityForItem(items, 'PO1', 'TEST', 'PO1')).toBe(3);
  expect(getPostedQuantityForItem(items, 'PO2', 'TEST', 'PO1')).toBe(9);
});

it('combines equivalent each and piece units into one displayed EA total', () => {
  expect(formatQuantities([{ uom: 'EA', qty: 400 }, { uom: 'EA', qty: 500 }, { uom: 'Pcs', qty: 2500 }], i => i.qty)).toBe('3,400 EA');
});
