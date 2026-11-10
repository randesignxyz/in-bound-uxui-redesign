import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { POListTable } from './POListTable';
import type { POItem, PurchaseOrder } from '../../../core/type';

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
    items,
    totalItems: items.length,
    totalQty: items.reduce((sum, item) => sum + item.poQty, 0),
    type: 'Planned',
    ...overrides,
  };
}

describe('POListTable', () => {
  it('dims mismatched vendor rows and blocks detail opening while selection is active', async () => {
    const onViewDetails = jest.fn();
    const onSelectionChange = jest.fn();

    render(
      <POListTable
        purchaseOrders={[
          createPurchaseOrder({ poNumber: 'PO-001', supplier: 'Vendor A' }),
          createPurchaseOrder({
            poNumber: 'PO-002',
            supplier: 'Vendor B',
            items: [createPoItem({ supplier: 'Vendor B' })],
          }),
        ]}
        onViewDetails={onViewDetails}
        selectedRowKeys={['PO-001']}
        lockedSupplier="Vendor A"
        onSelectionChange={onSelectionChange}
      />,
    );

    await waitFor(() => expect(screen.getByText('PO-002')).not.toBeNull());

    const dimmedRow = screen.getByText('PO-002').closest('tr');
    expect(dimmedRow?.getAttribute('data-dimmed-row')).toBe('true');

    const rowCheckbox = dimmedRow?.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(rowCheckbox.disabled).toBe(true);

    fireEvent.click(screen.getByText('Vendor B'));

    expect(onViewDetails).not.toHaveBeenCalled();
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('opens row detail when there is no active selection', async () => {
    const onViewDetails = jest.fn();

    render(
      <POListTable
        purchaseOrders={[
          createPurchaseOrder({ poNumber: 'PO-001', supplier: 'Vendor A' }),
          createPurchaseOrder({
            poNumber: 'PO-002',
            supplier: 'Vendor B',
            items: [createPoItem({ supplier: 'Vendor B' })],
          }),
        ]}
        onViewDetails={onViewDetails}
        selectedRowKeys={[]}
        lockedSupplier={undefined}
        onSelectionChange={jest.fn()}
      />,
    );

    await waitFor(() => expect(screen.getByText('PO-002')).not.toBeNull());

    fireEvent.click(screen.getByText('Vendor B'));

    expect(onViewDetails).toHaveBeenCalledWith(
      expect.objectContaining({
        poNumber: 'PO-002',
        supplier: 'Vendor B',
      }),
    );
  });

  it('does not open row detail when the checkbox is clicked', async () => {
    const onViewDetails = jest.fn();

    render(
      <POListTable
        purchaseOrders={[
          createPurchaseOrder({ poNumber: 'PO-001', supplier: 'Vendor A' }),
          createPurchaseOrder({
            poNumber: 'PO-002',
            supplier: 'Vendor B',
            items: [createPoItem({ supplier: 'Vendor B' })],
          }),
        ]}
        onViewDetails={onViewDetails}
        selectedRowKeys={['PO-001']}
        lockedSupplier="Vendor A"
        onSelectionChange={jest.fn()}
      />,
    );

    await waitFor(() => expect(screen.getByText('PO-002')).not.toBeNull());

    const dimmedRow = screen.getByText('PO-002').closest('tr');
    const rowCheckbox = dimmedRow?.querySelector('input[type="checkbox"]') as HTMLInputElement;

    fireEvent.click(rowCheckbox);

    expect(onViewDetails).not.toHaveBeenCalled();
  });
});
