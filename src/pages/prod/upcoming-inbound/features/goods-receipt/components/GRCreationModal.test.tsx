import React from 'react';

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { GRCreationModal } from './GRCreationModal';

type POItem = import('../../../core/workflow').POItem;
type PurchaseOrder = import('../../../core/workflow').PurchaseOrder;

type UpcomingInboundGoodsReceipt = import('../../../core/type').UpcomingInboundGoodsReceipt;

jest.mock('antd', () => {
  const React = require('react');
  const actual = jest.requireActual('antd');
  const MockInput = ({ ...props }: any) => <input {...props} />;

  MockInput.TextArea = ({ autoSize: _autoSize, ...props }: any) => <textarea {...props} />;
  const MockForm = ({ children, onFinish: _onFinish, ...props }: any) => <form {...props}>{children}</form>;
  MockForm.Item = ({ children, label, help }: any) => (
    <div>
      {label ? <label>{label}</label> : null}
      {children}
      {help ? <div>{help}</div> : null}
    </div>
  );

  const MockTable = ({ columns = [], dataSource = [] }: { columns?: any[]; dataSource?: any[] }) => (
    <div data-testid="mock-table">
      {dataSource.map((record: any, rowIndex: number) => (
        <div key={record.key ?? rowIndex}>
          {columns.map((column: any, colIndex: number) => {
            const value = column.dataIndex ? record[column.dataIndex] : undefined;
            const rendered = column.render ? column.render(value, record, rowIndex) : value;
            const content =
              rendered && typeof rendered === 'object' && 'children' in rendered
                ? (rendered as any).children
                : rendered;

            return <div key={column.key ?? column.dataIndex ?? colIndex}>{content}</div>;
          })}
        </div>
      ))}
    </div>
  );

  const MockCollapse = ({ items = [], activeKey, onChange }: { items?: any[]; activeKey?: any; onChange?: any }) => {
    const activeKeys = Array.isArray(activeKey)
      ? activeKey.map(String)
      : activeKey
        ? [String(activeKey)]
        : [];

    return (
      <div>
        {items.map((item: any) => {
          const isActive = activeKeys.includes(String(item.key));

          return (
            <div key={String(item.key)}>
              <div
                onClick={() => {
                  const nextKeys = isActive
                    ? activeKeys.filter((key) => key !== String(item.key))
                    : [...activeKeys, String(item.key)];
                  onChange?.(nextKeys);
                }}
              >
                {item.label}
              </div>
              {isActive ? item.children : null}
            </div>
          );
        })}
      </div>
    );
  };

  const MockModal = ({ open, children, title, footer }: { open?: boolean; children?: any; title?: any; footer?: any }) =>
    open ? (
      <div data-testid="mock-modal">
        <div>{title}</div>
        <div>{children}</div>
        <div>{footer}</div>
      </div>
    ) : null;


  return {
    ...actual,
    Collapse: MockCollapse,
    Form: MockForm,
    Input: MockInput,
    Modal: MockModal,
    Table: MockTable,
  };
});

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


function createPoItem(overrides: Partial<POItem> = {}): POItem {
  return {
    code: 'ITEM-001',
    name: 'Item 001',
    poQty: 10,
    receivedQty: 0,
    remainingQty: 10,
    uom: 'KG',
    supplier: 'Vendor A',
    ...overrides,
  };
}

function createPurchaseOrder(overrides: Partial<PurchaseOrder> = {}): PurchaseOrder {
  const supplier = overrides.supplier || 'Vendor A';
  const items = overrides.items || [createPoItem({ supplier })];

  return {
    poNumber: 'PO-001',
    supplier,
    expectedDate: '2026-04-01',
    expectedTime: '08:00',
    deliveryNoteNumber: undefined,
    items,
    totalItems: items.length,
    totalQty: items.reduce((sum, item) => sum + item.poQty, 0),
    type: 'Planned',
    ...overrides,
  };
}

function createInitialReceipt(
  overrides: Partial<UpcomingInboundGoodsReceipt> = {},
): UpcomingInboundGoodsReceipt {
  return {
    id: 1,
    grNumber: 'IR-001',
    receivingNumber: 'IR-001',
    approvedGrNumber: undefined,
    previousReceivingNumber: undefined,
    previousApprovedGrNumber: undefined,
    poNumber: 'PO-001',
    supplier: 'Vendor A',
    poReferences: [
      {
        poNumber: 'PO-001',
        supplier: 'Vendor A',
        expectedDate: '2026-04-01',
        expectedTime: '08:00',
      },
    ],
    supplierNames: ['Vendor A'],
    receiptType: 'Planned',
    receiptSourceType: 'PLANNED',
    poLinkStatus: 'NOT_REQUIRED',
    tempReferenceNo: undefined,
    pendingPOReason: undefined,
    linkedPoNumber: undefined,
    linkBlockReason: undefined,
    postingDate: '2026-04-01',
    actualReceiptDate: '2026-04-01',
    deliveryNoteNumber: 'DN-001',
    receiverWarehouseName: 'warehouse.staff01',
    items: [
      {
        code: 'ITEM-001',
        name: 'Item 001',
        poNumber: 'PO-001',
        supplier: 'Vendor A',
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
      scenarioPath: 'NORMAL',
      stepNumber: 1,
      totalSteps: 1,
      stepTitle: 'Draft',
    },
    activities: [],
    ...overrides,
  };
}

describe('GRCreationModal', () => {
  const onClose = jest.fn();
  const onSaveDraft = jest.fn();
  const onSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders one expanded item-receipt panel per purchase order by default', async () => {
    render(
      <GRCreationModal
        open
        onClose={onClose}
        purchaseOrders={[
          createPurchaseOrder({ poNumber: 'PO-001' }),
          createPurchaseOrder({
            poNumber: 'PO-002',
            items: [createPoItem({ code: 'ITEM-002', supplier: 'Vendor A' })],
          }),
        ]}
        onSaveDraft={onSaveDraft}
        onSubmit={onSubmit}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('item-receipt-panel-body-PO-001')).not.toBeNull();
      expect(screen.getByTestId('item-receipt-panel-body-PO-002')).not.toBeNull();
    });
  });

  it('collapses one purchase-order panel without hiding the others', async () => {
    render(
      <GRCreationModal
        open
        onClose={onClose}
        purchaseOrders={[
          createPurchaseOrder({ poNumber: 'PO-001' }),
          createPurchaseOrder({
            poNumber: 'PO-002',
            items: [createPoItem({ code: 'ITEM-002', supplier: 'Vendor A' })],
          }),
        ]}
        onSaveDraft={onSaveDraft}
        onSubmit={onSubmit}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('item-receipt-panel-body-PO-001')).not.toBeNull();
      expect(screen.getByTestId('item-receipt-panel-body-PO-002')).not.toBeNull();
    });

    fireEvent.click(screen.getByTestId('item-receipt-panel-header-PO-001'));

    await waitFor(() => {
      expect(screen.queryByTestId('item-receipt-panel-body-PO-001')).toBeNull();
    });

    expect(screen.getByTestId('item-receipt-panel-body-PO-002')).not.toBeNull();
  });

  it('scans one purchase order without changing the others', async () => {
    render(
      <GRCreationModal
        open
        onClose={onClose}
        purchaseOrders={[
          createPurchaseOrder({ poNumber: 'PO-001' }),
          createPurchaseOrder({
            poNumber: 'PO-002',
            items: [createPoItem({ code: 'ITEM-002', supplier: 'Vendor A' })],
          }),
        ]}
        onSaveDraft={onSaveDraft}
        onSubmit={onSubmit}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('scan-po-button-PO-001')).not.toBeNull();
      expect(screen.getByTestId('scan-po-button-PO-002')).not.toBeNull();
    });

    const poOnePanel = screen.getByTestId('item-receipt-panel-body-PO-001');
    const poTwoPanel = screen.getByTestId('item-receipt-panel-body-PO-002');
    const poOneBatchInput = within(poOnePanel).getByPlaceholderText('Batch no.') as HTMLInputElement;
    const poTwoBatchInput = within(poTwoPanel).getByPlaceholderText('Batch no.') as HTMLInputElement;

    expect(poOneBatchInput.value).toBe('');
    expect(poTwoBatchInput.value).toBe('');

    fireEvent.click(screen.getByTestId('scan-po-button-PO-001'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Scan result for PO-001')).not.toBeNull();
    });

    fireEvent.click(screen.getByText('Confirm PO Scan'));

    await waitFor(() => {
      expect(poOneBatchInput.value).toBe('PO001-01');
    });

    expect(poTwoBatchInput.value).toBe('');
  });

  it('still renders correctly for a single purchase order', async () => {
    render(
      <GRCreationModal
        open
        onClose={onClose}
        purchaseOrders={[createPurchaseOrder({ poNumber: 'PO-001' })]}
        onSaveDraft={onSaveDraft}
        onSubmit={onSubmit}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('item-receipt-panel-header-PO-001')).not.toBeNull();
      expect(screen.getByTestId('item-receipt-panel-body-PO-001')).not.toBeNull();
    });

    expect(screen.queryByTestId('item-receipt-panel-header-PO-002')).toBeNull();
  });

  it('blocks submit when product date is later than expiry date', async () => {
    render(
      <GRCreationModal
        open
        onClose={onClose}
        purchaseOrders={[createPurchaseOrder({ poNumber: 'PO-001' })]}
        onSaveDraft={onSaveDraft}
        onSubmit={onSubmit}
        initialReceipt={createInitialReceipt()}
      />,
    );

    fireEvent.click(screen.getByText('Submit for QC'));

    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  it('keeps the single po delivery note editable even when the po already has a previous dn', async () => {
    render(
      <GRCreationModal
        open
        onClose={onClose}
        purchaseOrders={[createPurchaseOrder({ deliveryNoteNumber: 'DN-LOCKED-001' })]}
        onSaveDraft={onSaveDraft}
        onSubmit={onSubmit}
      />,
    );

    const deliveryNoteInput = screen.getByPlaceholderText('From truck paperwork') as HTMLInputElement;

    expect(deliveryNoteInput.value).toBe('');
    expect(deliveryNoteInput.disabled).toBe(false);
  });

  it('renders one delivery note field per po and submits the values by po for multi po receipts', async () => {
    onSubmit.mockResolvedValue(true);
    const initialReceipt = createInitialReceipt({
      poNumber: 'PO-001',
      poReferences: [
        {
          poNumber: 'PO-001',
          supplier: 'Vendor A',
          expectedDate: '2026-04-01',
          expectedTime: '08:00',
          deliveryNoteNumber: 'DN-OLD-001',
        },
        {
          poNumber: 'PO-002',
          supplier: 'Vendor A',
          expectedDate: '2026-04-01',
          expectedTime: '08:00',
          deliveryNoteNumber: 'DN-OLD-002',
        },
      ],
      items: [
        {
          code: 'ITEM-001',
          name: 'Item 001',
          poNumber: 'PO-001',
          supplier: 'Vendor A',
          poQty: 10,
          receiveQty: 10,
          uom: 'KG',
          productDate: '2026-04-01',
          expiryDate: '2027-04-01',
          batchNumber: 'BATCH-001',
          barcode: 'BARCODE-001',
          isMissing: false,
          missingRemark: '',
        },
        {
          code: 'ITEM-002',
          name: 'Item 002',
          poNumber: 'PO-002',
          supplier: 'Vendor A',
          poQty: 10,
          receiveQty: 10,
          uom: 'KG',
          productDate: '2026-04-02',
          expiryDate: '2027-04-02',
          batchNumber: 'BATCH-002',
          barcode: 'BARCODE-002',
          isMissing: false,
          missingRemark: '',
        },
      ],
    });

    render(
      <GRCreationModal
        open
        onClose={onClose}
        purchaseOrders={[
          createPurchaseOrder({ poNumber: 'PO-001' }),
          createPurchaseOrder({
            poNumber: 'PO-002',
            items: [createPoItem({ code: 'ITEM-002', supplier: 'Vendor A' })],
          }),
        ]}
        onSaveDraft={onSaveDraft}
        onSubmit={onSubmit}
        initialReceipt={initialReceipt}
      />,
    );

    const poOnePanel = screen.getByTestId('item-receipt-panel-body-PO-001');
    const poTwoPanel = screen.getByTestId('item-receipt-panel-body-PO-002');

    fireEvent.change(within(poOnePanel).getByPlaceholderText('DN for PO-001'), {
      target: { value: 'DN-001' },
    });
    fireEvent.change(within(poTwoPanel).getByPlaceholderText('DN for PO-002'), {
      target: { value: 'DN-002' },
    });
    fireEvent.click(screen.getByText('Submit for QC'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });

    expect(onSubmit.mock.calls[0][0].poReferences).toEqual([
      expect.objectContaining({ poNumber: 'PO-001', deliveryNoteNumber: 'DN-001' }),
      expect.objectContaining({ poNumber: 'PO-002', deliveryNoteNumber: 'DN-002' }),
    ]);
  });
});
