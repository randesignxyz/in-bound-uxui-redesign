import type { ProColumns } from '@ant-design/pro-table';
import ProTable from '@ant-design/pro-table';
import { Flex, Progress, Tag, Tooltip } from 'antd';
import type { TablePaginationConfig } from 'antd/es/table';
import React, { type MouseEvent, type ReactNode } from 'react';

import { getPurchaseOrderReceiptState, type PurchaseOrder, type GoodsReceipt } from '../../../core/workflow';


interface POListTableProps {
  purchaseOrders: PurchaseOrder[];
  onViewDetails: (po: PurchaseOrder) => void;
  headerTitle?: ReactNode;
  toolbarExtra?: ReactNode;
  selectedRowKeys?: string[];
  lockedSupplier?: string;
  onSelectionChange?: (selectedRowKeys: string[]) => void;
  pagination?: TablePaginationConfig;
  goodsReceipts?: GoodsReceipt[];
}

export function POListTable({
  purchaseOrders,
  onViewDetails,
  headerTitle,
  toolbarExtra,
  selectedRowKeys = [],
  lockedSupplier,
  onSelectionChange,
  pagination,
  goodsReceipts = [],
}: POListTableProps) {
  const hasActiveSelection = selectedRowKeys.length > 0;
  const getRowKey = (purchaseOrder: PurchaseOrder) =>
    `${purchaseOrder.businessUnit || 'UNSPECIFIED'}::${purchaseOrder.poNumber}`;
  const isSelectionLockedRow = (purchaseOrder: PurchaseOrder) =>
    Boolean(lockedSupplier) &&
    purchaseOrder.supplier !== lockedSupplier &&
    !selectedRowKeys.includes(getRowKey(purchaseOrder));
  const openPurchaseOrderDetails = (
    purchaseOrder: PurchaseOrder,
    event?: { preventDefault?: () => void; stopPropagation?: () => void },
  ) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (hasActiveSelection) {
      return;
    }
    onViewDetails(purchaseOrder);
  };

  const columns: ProColumns<PurchaseOrder>[] = [
    {
      key: 'poNumber',
      title: 'ID',
      dataIndex: 'poNumber',
      width: 130,
      render: (_: any, r: PurchaseOrder) => (
        <a
          onClick={(event) => openPurchaseOrderDetails(r, event)}
          aria-disabled={hasActiveSelection ? 'true' : undefined}
          style={{
            color: isSelectionLockedRow(r) ? '#8c8c8c' : undefined,
            cursor: hasActiveSelection
              ? isSelectionLockedRow(r)
                ? 'not-allowed'
                : 'default'
              : 'pointer',
          }}
        >
          {r.poNumber}
        </a>
      ),
    },
    {
      key: 'sapDocNum',
      title: 'PO Doc Num',
      dataIndex: 'sapDocNum',
      width: 140,
      render: (_: any, r: PurchaseOrder) => r.sapDocNum || '-',
    },
    {
      key: 'type',
      title: 'Type',
      dataIndex: 'type',
      width: 100,
      render: (_: any, r: PurchaseOrder) => (
        <Tag color={r.type === 'Planned' ? 'green' : 'orange'}>{r.type}</Tag>
      ),
    },
    {
      key: 'supplier',
      title: 'Supplier',
      dataIndex: 'supplier',
      width: 180,
      ellipsis: true,
    },
    {
      key: 'expectedDate',
      title: 'Expected Date',
      dataIndex: 'expectedDate',
      width: 150,
      render: (_: any, r: PurchaseOrder) =>
        r.expectedDate ? `${r.expectedDate} ${r.expectedTime || ''}`.trim() : 'Unplanned',
      sorter: (a: PurchaseOrder, b: PurchaseOrder) =>
        (a.expectedDate || '9999-12-31').localeCompare(b.expectedDate || '9999-12-31'),
    },
    // {
    //   width: 80,
    //   key: 'totalItems',
    //   title: 'Items',
    //   dataIndex: 'totalItems',
    // },
    {
      key: 'totalQty',
      title: 'Total Qty',
      dataIndex: 'totalQty',
      width: 100,
      render: (_: any, r: PurchaseOrder) => r.totalQty.toLocaleString(),
    },
    {
      key: 'progress',
      title: 'Progress',
      width: 120,
      render: (_: any, r: PurchaseOrder) => {
        const totalPO = r.items.reduce((acc: number, item) => acc + item.poQty, 0);
        const totalReceived = r.items.reduce((acc: number, item) => acc + item.receivedQty, 0);
        const pct = totalPO > 0 ? Math.round((totalReceived / totalPO) * 100) : 0;
        return (
          <Flex vertical gap="small" style={{ width: 100 }}>
            <Tooltip title={`${totalReceived.toLocaleString()}/${totalPO.toLocaleString()}`}>
              <Progress
                percent={pct}
                strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                size="small"
                status="active"
              />
            </Tooltip>
          </Flex>
        );
      },
    },
  ];
  const interactiveColumns = columns.map((column) => ({
    ...column,
    onCell: (record: PurchaseOrder) => ({
      onClick: (event: MouseEvent<HTMLElement>) => {
        const target = event.target as HTMLElement;
        if (target.closest('a') || target.closest('button')) {
          return;
        }

        openPurchaseOrderDetails(record);
      },
      style: { cursor: hasActiveSelection ? 'default' : 'pointer' },
    }),
  }));

  return (
    <ProTable<PurchaseOrder>
      headerTitle={headerTitle}
      columns={interactiveColumns}
      dataSource={purchaseOrders}
      rowKey={getRowKey}
      bordered
      size="small"
      search={false}
      options={{ density: false, setting: false, reload: false }}
      toolBarRender={() => (toolbarExtra ? [toolbarExtra] : [])}
      tableAlertRender={false}
      pagination={pagination ?? { pageSize: 10, showSizeChanger: true }}
      tableLayout="fixed"
      rowSelection={
        onSelectionChange
          ? {
              selectedRowKeys,
              onChange: (nextSelectedRowKeys) =>
                onSelectionChange(nextSelectedRowKeys.map((key) => String(key))),
              preserveSelectedRowKeys: false,
              getCheckboxProps: (record) => {
                const receiptState = getPurchaseOrderReceiptState(record, goodsReceipts);
                const isLockedSupplier =
                  Boolean(lockedSupplier) &&
                  record.supplier !== lockedSupplier &&
                  !selectedRowKeys.includes(getRowKey(record));
                return {
                  disabled: isLockedSupplier || !receiptState.canCreateInboundReceiving,
                };
              },
            }
          : undefined
      }
      onRow={(record) => ({
        'data-dimmed-row': isSelectionLockedRow(record) ? 'true' : undefined,
        style: {
          backgroundColor: isSelectionLockedRow(record) ? '#fafafa' : undefined,
          opacity: isSelectionLockedRow(record) ? 0.58 : 1,
          transition: 'background-color 0.2s ease, opacity 0.2s ease',
        },
      })}
    />
  );
}
