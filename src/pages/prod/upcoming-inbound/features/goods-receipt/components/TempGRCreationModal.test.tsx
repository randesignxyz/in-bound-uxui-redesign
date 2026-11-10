import React from 'react';

import { Modal } from 'antd';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { TempGRCreationModal } from './TempGRCreationModal';

type UpcomingInboundGoodsReceipt = import('../../../core/type').UpcomingInboundGoodsReceipt;

jest.mock('../../supporting-documents', () => ({
  applyUploadedSupportingDocs: jest.fn((files) => files),
  hasIncompleteAppFilesUpload: jest.fn(() => false),
  normalizeUploadFileList: jest.fn((files) => files),
  previewSupportingUploadFile: jest.fn(async () => true),
  stageSupportingDocBeforeUpload: jest.fn(() => false),
  supportingDocsToUploadFiles: jest.fn(() => []),
  uploadPendingSupportingDocs: jest.fn(async () => []),
  uploadFilesToSupportingDocs: jest.fn(() => []),
  SupportingDocPreviewModal: () => null,
  SupportingDocsList: () => null,
}));

jest.mock('../../../shared/ui/FullscreenModal', () => {
  const React = require('react');
  return {
    FullscreenModal: ({ open, children, title }: { open?: boolean; children?: any; title?: any }) =>
      open ? (
        <div data-testid="fullscreen-modal">
          <div>{title}</div>
          {children}
        </div>
      ) : null,
  };
});


function createInitialReceipt(
  overrides: Partial<UpcomingInboundGoodsReceipt> = {},
): UpcomingInboundGoodsReceipt {
  return {
    id: 1,
    grNumber: 'IR-TEMP-001',
    receivingNumber: 'IR-TEMP-001',
    approvedGrNumber: undefined,
    previousReceivingNumber: undefined,
    previousApprovedGrNumber: undefined,
    poNumber: '',
    supplier: 'Vendor Temp',
    poReferences: [],
    supplierNames: ['Vendor Temp'],
    receiptType: 'Unplanned',
    receiptSourceType: 'TEMP_NO_PO',
    poLinkStatus: 'WAITING_PO',
    tempReferenceNo: 'TMP-001',
    pendingPOReason: 'PO still pending',
    linkedPoNumber: undefined,
    linkBlockReason: undefined,
    postingDate: '2026-04-01',
    actualReceiptDate: '2026-04-01',
    deliveryNoteNumber: 'DN-TEMP-001',
    receiverWarehouseName: 'warehouse.staff01',
    items: [
      {
        code: 'ITEM-001',
        name: 'Item 001',
        poNumber: '',
        supplier: 'Vendor Temp',
        poQty: 10,
        receiveQty: 10,
        uom: 'KG',
        productDate: '2027-04-02',
        expiryDate: '2027-04-01',
        batchNumber: 'BATCH-001',
        barcode: 'BARCODE-001',
        isMissing: false,
        missingRemark: '',
      },
    ],
    status: 'Draft',
    processState: 'GRPO_DRAFT',
    displayStatus: 'GRPO Draft',
    legacyStatus: 'Draft',
    createdBy: 'warehouse.user',
    createdDate: '2026-04-01 08:00:00',
    approvedBy: undefined,
    approvedDate: undefined,
    specMatch: true,
    qtyMatch: true,
    qualityCheckRequired: true,
    qcResult: 'Pending',
    exceptionReason: undefined,
    workflowLabel: 'Warehouse receiving draft',
    recordTypeLabel: 'Inbound Receiving',
    isAppendable: true,
    documentChecklist: {
      vendorDN: true,
      goodsReceiptPOForm: true,
      pmrmStockCardForm: false,
      supportingDocs: [],
    },
    scenario: {
      scenarioId: 'scenario-1',
      scenarioName: 'Scenario',
      scenarioPath: 'UNPLANNED_ARRIVAL',
      stepNumber: 1,
      totalSteps: 1,
      stepTitle: 'Draft',
    },
    activities: [],
    ...overrides,
  };
}

describe('TempGRCreationModal', () => {
  const onClose = jest.fn();
  const onSaveDraft = jest.fn();
  const onSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Modal, 'confirm').mockImplementation((config) => {
      void config.onOk?.();
      return {
        destroy: jest.fn(),
        update: jest.fn(),
      } as any;
    });
  });

  it('blocks submit when product date is later than expiry date', async () => {
    render(
      <TempGRCreationModal
        open
        onClose={onClose}
        onSaveDraft={onSaveDraft}
        onSubmit={onSubmit}
        initialReceipt={createInitialReceipt()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Submit for QC' }));

    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  it('renders item code and item name fields in the same row', async () => {
    render(
      <TempGRCreationModal
        open
        onClose={onClose}
        onSaveDraft={onSaveDraft}
        onSubmit={onSubmit}
      />,
    );

    const identityRow = await screen.findByTestId('temp-gr-item-identity-0');

    expect(identityRow.getAttribute('style')).toContain('display: flex');
    expect(within(identityRow).getByPlaceholderText('Item code')).not.toBeNull();
    expect(within(identityRow).getByPlaceholderText('Item name')).not.toBeNull();
  });

  it('submits temp receipts with discrepancy to QC instead of mismatch exception', async () => {
    const submitSpy = jest.fn(async () => true);

    render(
      <TempGRCreationModal
        open
        onClose={onClose}
        onSaveDraft={onSaveDraft}
        onSubmit={submitSpy}
        initialReceipt={createInitialReceipt({
          items: [
            {
              code: 'ITEM-001',
              name: 'Item 001',
              poNumber: '',
              supplier: 'Vendor Temp',
              poQty: 10,
              receiveQty: 5,
              uom: 'KG',
              productDate: '2027-04-01',
              expiryDate: '2027-04-02',
              batchNumber: 'BATCH-001',
              barcode: 'BARCODE-001',
              isMissing: false,
              missingRemark: '',
            },
          ],
        })}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Submit for QC' }));

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          processState: 'QC_PENDING',
          qtyMatch: false,
          qcResult: 'Pending',
        }),
      );
    });
  });

  it('renders required item columns for receive without PO', async () => {
    render(
      <TempGRCreationModal
        open
        onClose={onClose}
        onSaveDraft={onSaveDraft}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByText('Item')).not.toBeNull();
    expect(screen.getByText('Qty')).not.toBeNull();
    expect(screen.getByText('Received')).not.toBeNull();
    expect(screen.getByText('UoM')).not.toBeNull();
    expect(screen.getByText('Batch Number')).not.toBeNull();
  });
});
