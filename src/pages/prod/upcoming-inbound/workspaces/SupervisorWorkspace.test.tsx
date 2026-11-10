jest.mock('antd', () => require('./test-support/antdMock'));
import React from 'react';
// Umi's Jest JSX transform expects React in the global scope.
Object.assign(globalThis, { React });
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SupervisorWorkspace } from './SupervisorWorkspace';
type GoodsReceipt = import('../core/type').GoodsReceipt;

  const receipt: GoodsReceipt = {
    poReferences: [], supplierNames: ['Test Supplier'], receiptType: 'Planned',
    receiptSourceType: 'PLANNED', poLinkStatus: 'NOT_REQUIRED', postingDate: '2026-09-27',
    actualReceiptDate: '2026-09-27', status: 'Draft', createdBy: 'Test User', createdDate: '2026-09-27',
    specMatch: true, qtyMatch: true, qualityCheckRequired: true,
    documentChecklist: { vendorDN: true, goodsReceiptPOForm: false, pmrmStockCardForm: false, supportingDocs: [] },
    scenario: { scenarioId: 'test', scenarioName: 'Test', scenarioPath: 'NORMAL', stepNumber: 1, totalSteps: 1, stepTitle: 'Test' },
    grNumber: 'GR000125', receivingNumber: 'RCV000125', irPlanNumber: 'IR0001', poNumber: 'PO001',
    supplier: 'Test Supplier', receiverWarehouseName: 'Main Warehouse', deliveryNoteNumber: 'DN001',
    deliveryPlanStatus: 'Pending Supervisor', processState: 'PENDING_SUPERVISOR_REVIEW', activities: [],
    items: [{ poNumber: 'PO001', supplier: 'Test Supplier', code: 'ITEM001', name: 'Test Item', uom: 'EA', poQty: 10, receiveQty: 10, qcAcceptedQty: 10 }],
  };

it('opens a full review page and keeps adjustment dialogs available', async () => {
  const approve = jest.fn();
  render(<SupervisorWorkspace receipts={[receipt]} onApproveAndPostSAP={approve} onSendBack={jest.fn()}
    onAdjustGR={jest.fn()} onRetrySAPPosting={jest.fn()} onManualSAPSync={jest.fn()} onRefresh={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: /Review & Post/ }));
  expect(screen.getByRole('heading', { name: 'Supervisor Review & SAP Posting' })).toBeTruthy();
  expect(screen.queryByRole('region', { name: 'Activity', exact: true })).toBeNull();
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.getAllByText('RCV000125').length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole('button', { name: /Adjust/ }));
  expect(await screen.findByRole('dialog')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Close', exact: true }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  fireEvent.click(screen.getByRole('button', { name: 'Cancel', exact: true }));
  expect(screen.getByRole('heading', { name: 'Supervisor — Approval & SAP Posting' })).toBeTruthy();
  expect(approve).not.toHaveBeenCalled();
});

it('posts zero accepted quantity without substituting the received quantity', () => {
  const approve = jest.fn();
  const rejected = { ...receipt, items: [{ ...receipt.items[0], qcAcceptedQty: 0, qcRejectedQty: 10 }] };
  render(<SupervisorWorkspace receipts={[rejected]} onApproveAndPostSAP={approve} onSendBack={jest.fn()}
    onAdjustGR={jest.fn()} onRetrySAPPosting={jest.fn()} onManualSAPSync={jest.fn()} onRefresh={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: /Review & Post/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Approve & Post to SAP' }));
  expect(approve).toHaveBeenCalledTimes(1);
  expect(approve.mock.calls[0][0].items[0].sapPostedQty).toBe(0);
  expect(approve.mock.calls[0][0].activities).toEqual([]);
});

it('includes failed postings in the pending queue and exposes retry', () => {
  const retry = jest.fn();
  const failed = { ...receipt, deliveryPlanStatus: 'QC Completed', processState: 'SAP_POSTING_FAILED', sapPostingStatus: 'Posting Failed' } as GoodsReceipt;
  render(<SupervisorWorkspace receipts={[failed]} onApproveAndPostSAP={jest.fn()} onSendBack={jest.fn()}
    onAdjustGR={jest.fn()} onRetrySAPPosting={retry} onManualSAPSync={jest.fn()} onRefresh={jest.fn()} />);
  expect(screen.getByRole('button', { name: /Pending Review 1/ })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Retry SAP' }));
  expect(retry).toHaveBeenCalledWith(failed);
});
