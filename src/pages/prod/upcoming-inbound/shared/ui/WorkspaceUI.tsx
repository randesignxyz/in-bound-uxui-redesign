import React, { useState } from 'react';
import { Button, Empty, Space } from 'antd';
import { ArrowLeftOutlined, ExportOutlined, ReloadOutlined } from '@ant-design/icons';
import type { GoodsReceipt } from '../../core/type';
import { getReceiptIrNumber } from '../../core/workflow/goods-receipt';
import './WorkspaceUI.less';
import { exportWorkspace, type ExportFormat } from './workspaceExport';

export function ExportButton({ onExport, className, style }: {
  onExport: (format: ExportFormat) => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  return <div className="inbound-export-menu" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);
  }}>
    <Button icon={<ExportOutlined />} className={className} style={style}
      aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>Export</Button>
    {open && <div className="inbound-export-options" role="menu" aria-label="Export format">
      {(['pdf', 'excel', 'csv'] as ExportFormat[]).map(format =>
        <button key={format} type="button" role="menuitem" onClick={() => {
          setOpen(false);
          onExport(format);
        }}>{format === 'pdf' ? 'PDF' : format === 'excel' ? 'Excel' : 'CSV'}</button>)}
    </div>}
  </div>;
}

export const workspacePagination = {
  defaultPageSize: 10,
  showSizeChanger: false,
  showTotal: (total: number, range: [number, number]) =>
    total ? `${range[0]}–${range[1]} of ${total} records` : '0 records',
};

export function WorkspaceHeader({ title, onRefresh, onExport, onResetDemo }: {
  title: string;
  onRefresh: () => void;
  onExport: (format: ExportFormat) => void;
  onResetDemo?: () => void;
}) {
  return <header className="inbound-workspace-header">
    <h1>{title}</h1>
    <Space wrap>
      <Button icon={<ReloadOutlined />} onClick={onRefresh}>Refresh</Button>
      {onResetDemo && <Button icon={<ReloadOutlined />} onClick={onResetDemo}>Reset Demo</Button>}
      <ExportButton onExport={onExport} />
    </Space>
  </header>;
}

export function WorkspaceEmpty({ filtered, description }: { filtered: boolean; description: string }) {
  return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
    description={filtered ? 'No matching records. Adjust or reset your filters.' : description} />;
}

// Quote every cell and neutralize spreadsheet formulas in supplier-controlled text.
export function exportWorkspaceCsv(filename: string, rows: (string | number | undefined)[][]) {
  exportWorkspace(filename, rows, 'csv');
}

export function exportReceipts(filename: string, receipts: GoodsReceipt[], format: ExportFormat) {
  exportWorkspace(filename, [
    ['Receiving #', 'IR Schedule #', 'PO #', 'Vendor', 'Delivery Status', 'QC Result', 'SAP Status', 'SAP GR #'],
    ...receipts.map(receipt => [getReceiptIrNumber(receipt), receipt.irPlanNumber, receipt.poNumber,
      receipt.supplier, receipt.deliveryPlanStatus, receipt.qcResult, receipt.sapPostingStatus, receipt.sapDocNum || receipt.sapGrNumber]),
  ], format);
}

export function WorkspaceTaskHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return <header className="inbound-task-header">
    <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack} aria-label={`Back from ${title}`}>Back</Button>
    <h1>{title}</h1>
  </header>;
}

export function ReceiptSummary({ receipt }: { receipt: GoodsReceipt }) {
  const fields = [
    ['Receiving #', getReceiptIrNumber(receipt)],
    ['IR Schedule #', receipt.irPlanNumber],
    ['PO #', receipt.poReferences?.map(po => po.poNumber).join(', ') || receipt.poNumber],
    ['Vendor', receipt.supplier],
    ['Warehouse', receipt.receiverWarehouseName],
    ['SAP GR #', receipt.sapDocNum || receipt.sapGrNumber],
    ['Current Status', receipt.displayStatus || receipt.deliveryPlanStatus || 'To Receive'],
  ];
  return <section className="inbound-task-summary" aria-label="Receiving record summary">
    {fields.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value || '—'}</strong></div>)}
  </section>;
}
