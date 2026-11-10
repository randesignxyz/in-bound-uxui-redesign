jest.mock('antd', () => require('./test-support/antdMock'));
import React from 'react';
// Umi's Jest JSX transform expects React in the global scope.
Object.assign(globalThis, { React });
import { fireEvent, render, screen } from '@testing-library/react';
import { QCWorkspace } from './QCWorkspace';
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

it('opens inspection as a page with the receiving identity and allows cancel without submission', () => {
  const onSubmit = jest.fn();
  render(<QCWorkspace receipts={[receipt]} onSubmitQCReview={onSubmit} onRefresh={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: /Start Inspection/ }));
  expect(screen.getByRole('heading', { name: 'QC Inspection' })).toBeTruthy();
  expect(screen.queryByRole('region', { name: 'Activity', exact: true })).toBeNull();
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.getAllByText('RCV000125').length).toBeGreaterThan(0);
  expect(screen.queryByText('GR000125')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel', exact: true }));
  expect(screen.getByRole('heading', { name: 'Quality Control — Inspection' })).toBeTruthy();
  expect(onSubmit).not.toHaveBeenCalled();
});

it('submits the inspection from the page while preserving the internal record key', () => {
  const onSubmit = jest.fn();
  render(<QCWorkspace receipts={[receipt]} onSubmitQCReview={onSubmit} onRefresh={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: /Start Inspection/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Submit to Supervisor' }));
  expect(onSubmit).toHaveBeenCalledTimes(1);
  expect(onSubmit.mock.calls[0][0]).toMatchObject({
    grNumber: 'GR000125', receivingNumber: 'RCV000125', processState: 'PENDING_SUPERVISOR_REVIEW',
    activities: [expect.objectContaining({ title: 'QC Inspection: Passed', performedBy: 'QC Lab (Demo)' })],
  });
  expect(screen.queryByRole('heading', { name: 'QC Inspection', exact: true })).toBeNull();
});

it('separates rejected, held, and passed queues and includes partial rejections in the status filter', () => {
  const rejected = { ...receipt, grNumber: 'GR000201', receivingNumber: 'RCV000201', deliveryPlanStatus: 'QC Completed',
    processState: 'PENDING_SUPERVISOR_REVIEW', qcResult: 'Fail',
    items: [{ ...receipt.items[0], qcAcceptedQty: 8, qcRejectedQty: 2, qcRejectedReason: 'Damaged packaging' }],
  } as GoodsReceipt;
  const held = { ...receipt, grNumber: 'GR000202', receivingNumber: 'RCV000202', deliveryPlanStatus: 'Pending Supervisor',
    processState: 'PENDING_SUPERVISOR_REVIEW', qcResult: 'Conditional Pass',
    items: [{ ...receipt.items[0], qcAcceptedQty: 8, qcOnHoldQty: 2, qcOnHoldReason: 'Awaiting lab results' }],
  } as GoodsReceipt;
  const passed = { ...receipt, grNumber: 'GR000203', receivingNumber: 'RCV000203', deliveryPlanStatus: 'QC Completed',
    processState: 'PENDING_SUPERVISOR_REVIEW', qcResult: 'Pass', items: [{ ...receipt.items[0], qcAcceptedQty: 10 }],
  } as GoodsReceipt;
  render(<QCWorkspace receipts={[receipt, rejected, held, passed]} onSubmitQCReview={jest.fn()} onRefresh={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: /Rejected/ }));
  expect(screen.getByText('RCV000201')).toBeTruthy();
  expect(screen.getByText('Partially Rejected')).toBeTruthy();
  expect(screen.getByText('Damaged packaging')).toBeTruthy();
  expect(screen.getByText('Next: Supervisor review')).toBeTruthy();
  expect(screen.queryByText('RCV000202')).toBeNull();
  expect(screen.getByRole('button', { name: 'View Inspection' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Start Inspection' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /On Hold/ }));
  expect(screen.getByText('RCV000202')).toBeTruthy();
  expect(screen.queryByText('RCV000201')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /Passed/ }));
  expect(screen.getByText('RCV000203')).toBeTruthy();
  expect(screen.queryByText('RCV000201')).toBeNull();
  fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'REJECTED' } });
  expect(screen.getByText('RCV000201')).toBeTruthy();
  expect(screen.queryByText('RCV000203')).toBeNull();
});

it('records rejection accurately without claiming an inspection passed', () => {
  const onSubmit = jest.fn();
  render(<QCWorkspace receipts={[receipt]} onSubmitQCReview={onSubmit} onRefresh={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: /Start Inspection/ }));
  const quantities = screen.getAllByRole('spinbutton');
  fireEvent.change(quantities[0], { target: { value: '0' } });
  fireEvent.change(quantities[1], { target: { value: '10' } });
  expect(screen.getByText('Rejection reason required')).toBeTruthy();
  fireEvent.change(screen.getByPlaceholderText(/Describe defect/i), { target: { value: 'Damaged packaging' } });
  expect(screen.queryByText('Rejection reason required')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Submit to Supervisor' }));
  expect(onSubmit).toHaveBeenCalledTimes(1);
  expect(onSubmit.mock.calls[0][0]).toMatchObject({ qcResult: 'Fail', activities: [expect.objectContaining({ title: 'QC Inspection: Rejected', description: expect.stringContaining('Damaged packaging') })] });
});

it('highlights a missing on-hold reason beside the quantity until entered', () => {
  render(<QCWorkspace receipts={[receipt]} onSubmitQCReview={jest.fn()} onRefresh={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: /Start Inspection/ }));
  fireEvent.change(screen.getAllByRole('spinbutton')[2], { target: { value: '2' } });
  expect(screen.getByText('On-hold reason required')).toBeTruthy();
  fireEvent.change(screen.getByPlaceholderText(/Hold reason/i), { target: { value: 'Awaiting lab result' } });
  expect(screen.queryByText('On-hold reason required')).toBeNull();
});
