import { render, screen } from '@testing-library/react';

import { PODetailSidebar } from './PODetailSidebar';
import type { PurchaseOrder, POItem } from '../../../core/workflow';

jest.mock('@ant-design/pro-form', () => {
  const React = require('react');
  return {
    DrawerForm: ({ open, children, drawerProps }: any) =>
      open ? (
        <div data-testid="mock-drawer-form">
          <div>{drawerProps?.extra}</div>
          <div>{children}</div>
        </div>
      ) : null,
  };
});

jest.mock('@ant-design/pro-components', () => {
  return {
    ProCard: ({ children }: { children?: any }) => <div>{children}</div>,
    ProTable: ({ dataSource = [] }: { dataSource?: any[] }) => <div data-testid="mock-pro-table">{dataSource.length}</div>,
  };
});

jest.mock('../../../api/service', () => ({
  upcomingInboundService: {
    getPoActivities: jest.fn(),
  },
}));

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
  const items = overrides.items || [createPoItem()];

  return {
    poNumber: 'PO-001',
    supplier: 'Vendor A',
    expectedDate: '2026-04-01',
    expectedTime: '08:00',
    items,
    totalItems: items.length,
    totalQty: items.reduce((sum, item) => sum + item.poQty, 0),
    type: 'Planned',
    ...overrides,
  };
}

describe('PODetailSidebar', () => {
  it('hides the create inbound receiving button when create access is disabled', () => {
    render(
      <PODetailSidebar
        open
        onClose={jest.fn()}
        po={createPurchaseOrder()}
        canCreateInboundReceiving={false}
        onCreateGR={jest.fn()}
        onOpenReceiptInNewTab={jest.fn()}
      />,
    );

    expect(screen.queryByText('Create Inbound Receiving')).toBeNull();
  });

  it('shows the create inbound receiving button when create access is enabled', () => {
    render(
      <PODetailSidebar
        open
        onClose={jest.fn()}
        po={createPurchaseOrder()}
        canCreateInboundReceiving
        onCreateGR={jest.fn()}
        onOpenReceiptInNewTab={jest.fn()}
      />,
    );

    expect(screen.getByText('Create Inbound Receiving')).not.toBeNull();
  });
});
