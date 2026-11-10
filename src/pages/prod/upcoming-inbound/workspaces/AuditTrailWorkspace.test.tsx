jest.mock('antd', () => require('./test-support/antdMock'));
import React from 'react';
Object.assign(globalThis, { React });
import { fireEvent, render, screen } from '@testing-library/react';
import { AuditTrailWorkspace } from './AuditTrailWorkspace';
type GoodsReceipt = import('../core/type').GoodsReceipt;

const receipt: GoodsReceipt = {
  poReferences: [], supplierNames: ['Test Supplier'], receiptType: 'Planned',
    receiptSourceType: 'PLANNED', poLinkStatus: 'NOT_REQUIRED', postingDate: '2026-09-27',
    actualReceiptDate: '2026-09-27', status: 'Draft', createdBy: 'Test User', createdDate: '2026-09-27',
    specMatch: true, qtyMatch: true, qualityCheckRequired: true,
    documentChecklist: { vendorDN: true, goodsReceiptPOForm: false, pmrmStockCardForm: false, supportingDocs: [] },
    scenario: { scenarioId: 'test', scenarioName: 'Test', scenarioPath: 'NORMAL', stepNumber: 1, totalSteps: 1, stepTitle: 'Test' },
    grNumber: 'GR000125',
  receivingNumber: 'RCV000125',
  irPlanNumber: 'IR0001',
  poNumber: 'PO001',
  supplier: 'Test Supplier',
  receiverWarehouseName: 'Main Warehouse',
  deliveryNoteNumber: 'DN001',
  deliveryPlanStatus: 'Waiting for QC',
  processState: 'QC_PENDING',
  activities: [],
  items: [{ poNumber: 'PO001', supplier: 'Test Supplier', code: 'ITEM001', name: 'Test Item', uom: 'EA', poQty: 10, plannedQty: 10, receiveQty: 10 }],
};

it('shows empty history instead of inventing completed actions', () => {
  render(<AuditTrailWorkspace receipts={[receipt]} onRefresh={jest.fn()} />);
  expect(screen.queryByText('IR Schedule Created & Dispatched')).toBeNull();
  expect(screen.getByRole('heading', { name: 'Audit Trail — Activity History' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Cards View' })).toBeNull();
});
it('keeps recorded rejection history searchable', () => {
  const recorded = { ...receipt, activities: [{ id: 'qc-event', title: 'QC Inspection: Rejected',
    description: 'Damaged packaging', performedBy: 'QC Lab (Demo)', timestamp: '2026-09-27 10:00', state: 'done' as const }] };
  render(<AuditTrailWorkspace receipts={[recorded]} onRefresh={jest.fn()} />);
  expect(screen.getByText('QC Inspection: Rejected')).toBeTruthy();
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'unmatched' } });
  expect(screen.queryByText('QC Inspection: Rejected')).toBeNull();
});
