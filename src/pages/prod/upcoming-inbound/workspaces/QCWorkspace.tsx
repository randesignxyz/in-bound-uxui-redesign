import { RowActionButton, rowActionColumn } from '../shared/ui/RowActionButton';
import { formatQuantities, getPostingQuantity } from '../core/quantity';
import { getQCQueueState, matchesQCQueue, qcQueueLabels, getQCFollowUp, type QCQueue } from '../core/qcQueue';
import { getReceiptIrNumber } from '../core/workflow/goods-receipt';
import { WorkspaceTaskHeader, WorkspaceHeader, WorkspaceEmpty, workspacePagination, exportReceipts } from '../shared/ui/WorkspaceUI';
import type { ExportFormat } from '../shared/ui/workspaceExport';
import React, { useState, useMemo } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Input,
  Select,
  Drawer,
  Form,
  DatePicker,
  InputNumber,
  Row,
  Col,
  Alert,
  Divider,
  Statistic,
  message,
  Tooltip,
  Progress,
} from 'antd';
import {
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StopOutlined,
  EyeOutlined,
  SearchOutlined,
  SendOutlined,
  FileDoneOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type {
  GoodsReceipt,
  GRItem,
  QCInspectionCheck,
  QCResultStatus,
} from '../core/type';
import { InboundStatusBadge } from '../features/shared/InboundStatusBadge';
import { AuditTrailTimeline } from '../features/shared/AuditTrailTimeline';
import './ProcurementWorkspace.less';

const { Text } = Typography;
const { RangePicker } = DatePicker;

export interface QCWorkspaceProps {
  receipts: GoodsReceipt[];
  onSubmitQCReview: (gr: GoodsReceipt) => void;
  onRefresh: () => void;
  onNavigateToRole?: (role: 'PROCUREMENT' | 'WAREHOUSE' | 'QC' | 'SUPERVISOR' | 'AUDIT_TIMELINE') => void;
}

export const QCWorkspace: React.FC<QCWorkspaceProps> = ({
  receipts,
  onSubmitQCReview,
  onRefresh,
  onNavigateToRole,
}) => {
  const [activeTab, setActiveTab] = useState<QCQueue>('PENDING');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<QCQueue>('ALL');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<any>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<GoodsReceipt | null>(null);
  const [isInspectionPageOpen, setIsInspectionPageOpen] = useState<boolean>(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState<boolean>(false);

  // QC Form state
  const [inspectionItems, setInspectionItems] = useState<GRItem[]>([]);
  const [overallQcRemark, setOverallQcRemark] = useState<string>('');

  const tabCounts = useMemo(() => ({
    all: receipts.length,
    pendingQC: receipts.filter(r => matchesQCQueue(r, 'PENDING')).length,
    passed: receipts.filter(r => matchesQCQueue(r, 'PASSED')).length,
    rejected: receipts.filter(r => matchesQCQueue(r, 'REJECTED')).length,
    onHold: receipts.filter(r => matchesQCQueue(r, 'ON_HOLD')).length,
  }), [receipts]);

  // Filter receipts for QC Queue
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      if (!matchesQCQueue(r, activeTab) || !matchesQCQueue(r, statusFilter)) return false;

      // 3. Warehouse Filter
      if (warehouseFilter !== 'ALL' && r.receiverWarehouseName && !r.receiverWarehouseName.includes(warehouseFilter)) {
        return false;
      }

      // 4. Search Filter
      if (searchTerm) {
        const q = searchTerm.toLowerCase().trim();
        const matchesGR = [getReceiptIrNumber(r), r.grNumber, r.sapDocNum, r.sapGrNumber].some(number => number?.toLowerCase().includes(q));
        const matchesIR = r.irPlanNumber?.toLowerCase().includes(q);
        const matchesSupplier = r.supplier?.toLowerCase().includes(q);
        const matchesDN = r.deliveryNoteNumber?.toLowerCase().includes(q);
        const matchesPO = r.poNumber?.toLowerCase().includes(q);
        const matchesItem = r.items?.some(
          (it) =>
            it.code.toLowerCase().includes(q) ||
            it.name.toLowerCase().includes(q) ||
            it.batches?.some((b) => b.batchNumber?.toLowerCase().includes(q)),
        );
        if (!matchesGR && !matchesIR && !matchesSupplier && !matchesDN && !matchesPO && !matchesItem) {
          return false;
        }
      }

      // 5. Date Range Filter
      if (dateRange && dateRange[0] && dateRange[1]) {
        const dateStr = r.actualReceiptDate || r.expectedDate || r.postingDate;
        if (dateStr) {
          const recDate = dayjs(dateStr, ['DD-MM-YYYY', 'YYYY-MM-DD']);
          if (recDate.isValid() && (recDate.isBefore(dateRange[0], 'day') || recDate.isAfter(dateRange[1], 'day'))) {
            return false;
          }
        }
      }

      return true;
    });
  }, [receipts, activeTab, statusFilter, warehouseFilter, searchTerm, dateRange]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setWarehouseFilter('ALL');
    setDateRange(null);
    message.info('Filters reset.');
  };

  // Start Inspection (QC-03)
  const handleStartInspection = (receipt: GoodsReceipt) => {
    setSelectedReceipt(receipt);
    const clonedItems = receipt.items.map((item) => ({
      ...item,
      qcAcceptedQty: item.qcAcceptedQty !== undefined ? item.qcAcceptedQty : item.receiveQty,
      qcRejectedQty: item.qcRejectedQty || 0,
      qcOnHoldQty: item.qcOnHoldQty || 0,
      qcChecks: item.qcChecks || {
        packagingCondition: 'Pass',
        productAppearance: 'Pass',
        quantityVerification: 'Pass',
        batchVerification: 'Pass',
        dateVerification: 'Pass',
        handlingTempCondition: 'Pass',
      },
      qcResult: item.qcResult || 'Pass',
      qcRejectedReason: item.qcRejectedReason || '',
      qcOnHoldReason: item.qcOnHoldReason || '',
      qcRemark: item.qcRemark || '',
    }));

    setInspectionItems(clonedItems);
    setOverallQcRemark(receipt.qcNotes || '');
    setIsDetailDrawerOpen(false);
    setIsInspectionPageOpen(true);
  };

  // Update item QC partition
  const handleUpdatePartition = (
    index: number,
    field: 'qcAcceptedQty' | 'qcRejectedQty' | 'qcOnHoldQty',
    value: number,
  ) => {
    const updated = [...inspectionItems];
    const target = updated[index];
    const received = target.receiveQty;

    (target as any)[field] = value;

    if (field === 'qcRejectedQty' || field === 'qcOnHoldQty') {
      const otherPartitions = (field === 'qcRejectedQty' ? target.qcOnHoldQty : target.qcRejectedQty) || 0;
      target.qcAcceptedQty = Math.max(0, received - value - otherPartitions);
    }

    if (target.qcRejectedQty && target.qcRejectedQty > 0) {
      target.qcResult = 'Fail';
    } else if (target.qcOnHoldQty && target.qcOnHoldQty > 0) {
      target.qcResult = 'Conditional Pass';
    } else {
      target.qcResult = 'Pass';
    }

    setInspectionItems(updated);
  };

  // Update Inspection Checklist
  const handleUpdateCheck = (
    itemIndex: number,
    checkKey: keyof QCInspectionCheck,
    value: 'Pass' | 'Fail' | 'N/A',
  ) => {
    const updated = [...inspectionItems];
    if (!updated[itemIndex].qcChecks) {
      updated[itemIndex].qcChecks = {
        packagingCondition: 'Pass',
        productAppearance: 'Pass',
        quantityVerification: 'Pass',
        batchVerification: 'Pass',
        dateVerification: 'Pass',
        handlingTempCondition: 'Pass',
      };
    }
    updated[itemIndex].qcChecks![checkKey] = value;
    setInspectionItems(updated);
  };

  // Submit QC Result
  const handleSubmitInspection = () => {
    if (!selectedReceipt) return;

    for (const item of inspectionItems) {
      const sum = (item.qcAcceptedQty || 0) + (item.qcRejectedQty || 0) + (item.qcOnHoldQty || 0);
      if (sum !== item.receiveQty) {
        message.error(
          `Item ${item.code}: Accepted (${item.qcAcceptedQty}) + Rejected (${item.qcRejectedQty}) + Hold (${item.qcOnHoldQty}) must equal Actual Received (${item.receiveQty}).`,
        );
        return;
      }
      if (item.qcRejectedQty && item.qcRejectedQty > 0 && !item.qcRejectedReason?.trim()) {
        message.error(`Item ${item.code} has rejected qty. Rejection reason is required.`);
        return;
      }
      if (item.qcOnHoldQty && item.qcOnHoldQty > 0 && !item.qcOnHoldReason?.trim()) {
        message.error(`Item ${item.code} has hold qty. Hold reason is required.`);
        return;
      }
    }

    const hasRejections = inspectionItems.some((i) => (i.qcRejectedQty || 0) > 0);
    const hasHolds = inspectionItems.some((i) => (i.qcOnHoldQty || 0) > 0);
    let overallResult: QCResultStatus = 'Pass';
    if (hasRejections) overallResult = 'Fail';
    else if (hasHolds) overallResult = 'Conditional Pass';

    const updatedReceipt: GoodsReceipt = {
      ...selectedReceipt,
      items: inspectionItems,
      qcResult: overallResult,
      qcInspectedBy: 'QC Lab (Demo)',
      qcInspectionDate: dayjs().format('YYYY-MM-DD HH:mm'),
      qcNotes: overallQcRemark,
      deliveryPlanStatus: 'Pending Supervisor',
      processState: 'PENDING_SUPERVISOR_REVIEW',
      activities: [
        ...(selectedReceipt.activities || []),
        {
          id: `act-qc-${Date.now()}`,
          title: `QC Inspection: ${getQCQueueState({ ...selectedReceipt, items: inspectionItems, qcResult: overallResult, deliveryPlanStatus: 'Pending Supervisor', processState: 'PENDING_SUPERVISOR_REVIEW' }).label}`,
          description: `Accepted: ${formatQuantities(inspectionItems, i => i.qcAcceptedQty ?? 0)}; Rejected: ${formatQuantities(inspectionItems, i => i.qcRejectedQty ?? 0)}; On Hold: ${formatQuantities(inspectionItems, i => i.qcOnHoldQty ?? 0)}. Sent to Supervisor for review. ${inspectionItems.map(i => [i.qcRejectedReason, i.qcOnHoldReason].filter(Boolean).join("; ")).filter(Boolean).join("; ")}`,
          performedBy: 'QC Lab (Demo)',
          timestamp: dayjs().format('YYYY-MM-DD HH:mm'),
          state: 'done',
        },
      ],
    };

    onSubmitQCReview(updatedReceipt);
    message.success(`QC result (${getQCQueueState(updatedReceipt).label}) submitted! Receiving record ${getReceiptIrNumber(updatedReceipt)} routed to Warehouse Supervisor.`);
    setIsInspectionPageOpen(false);
    setSelectedReceipt(updatedReceipt);
  };

  const handleExport = (format: ExportFormat) => {
    exportReceipts('qc-receipts', filteredReceipts, format);
  };

  // QC Queue Columns
  const columns: ColumnsType<GoodsReceipt> = [
    {
      title: 'Receiving #',
      dataIndex: 'grNumber',
      key: 'grNumber',
      width: 130,
      render: (_: string, record: GoodsReceipt) => (
        <span
          className="po-link"
          onClick={() => {
            setSelectedReceipt(record);
            setIsDetailDrawerOpen(true);
          }}
        >
          {getReceiptIrNumber(record) || '—'}
        </span>
      ),
    },
    {
      title: 'QC Status',
      key: 'status',
      width: 160,
      render: (_: unknown, record: GoodsReceipt) => {
        const state = getQCQueueState(record);
        return <InboundStatusBadge type="queue" value={state.label} color={state.color} />;
      },
    },
    {
      title: 'IR Schedule #',
      dataIndex: 'irPlanNumber',
      key: 'irPlanNumber',
      width: 170,
      render: (ir: string, record: GoodsReceipt) => <div>
        <Text strong>{ir || '—'}</Text>
        {record.parentIrNumber && <div><Text type="secondary" style={{ fontSize: 11 }}>
          From {record.parentIrNumber} · {record.qcFollowUpType === 'ON_HOLD' ? 'On Hold' : 'Rejected'}
        </Text></div>}
      </div>,
    },
    {
      title: 'WH Location',
      key: 'followUpLocation',
      width: 230,
      render: (_: unknown, record: GoodsReceipt) =>
        <span style={{ whiteSpace: 'nowrap' }}>{record.receiverWarehouseName || '—'}</span>,
    },
    {
      title: 'PO #',
      key: 'poNumber',
      width: 130,
      render: (_: any, record: GoodsReceipt) => (
        <span>
          {record.poNumber}
        </span>
      ),
    },
    {
      title: 'Vendor',
      dataIndex: 'supplier',
      key: 'vendor',
      width: 220,
      render: (sup: string) => <span className="vendor-name" style={{ whiteSpace: 'nowrap' }}>{sup}</span>,
    },
    {
      title: 'Received Qty',
      key: 'whReceived',
      width: 160,
      render: (_: any, record: GoodsReceipt) => {
        return (
          <div>
            <Text strong>{formatQuantities(record.items, i => i.receiveQty ?? 0)}</Text>
          </div>
        );
      },
    },
    ...([
      { title: 'Accepted', field: 'qcAcceptedQty' },
      { title: 'Rejected', field: 'qcRejectedQty' },
      { title: 'On Hold', field: 'qcOnHoldQty' },
    ] as const).map(({ title, field }) => ({
      title,
      key: field,
      width: 110,
      align: 'right' as const,
      render: (_: unknown, record: GoodsReceipt) => {
        const state = getQCQueueState(record);
        if (state.pending || (!state.passed && !state.rejected && !state.onHold)) return '—';
        return <Text>{formatQuantities(record.items, item => item[field] ?? 0)}</Text>;
      },
    })),
    {
      title: 'Reason / Next Step',
      key: 'qcFollowUp',
      width: 220,
      render: (_: unknown, record: GoodsReceipt) => {
        const state = getQCQueueState(record);
        if (!state.rejected && !state.onHold) return '—';
        const reasons = Array.from(new Set(record.items.flatMap(item => [
          (item.qcRejectedQty || 0) > 0 ? item.qcRejectedReason : undefined,
          (item.qcOnHoldQty || 0) > 0 ? item.qcOnHoldReason : undefined,
        ]).filter(Boolean)));
        return <Space direction="vertical" size={2}>
          <Text>{reasons.join('; ') || record.qcNotes || 'Reason not recorded'}</Text>
          <Text type="secondary">Next: {getQCFollowUp(record)}</Text>
        </Space>;
      },
    },
    {
      ...rowActionColumn,
      render: (_: any, record: GoodsReceipt) => {
        const isPending = getQCQueueState(record).pending;
        return (
          <Space>
            {isPending ? (
              <RowActionButton
                variant="primary"
                icon={<SafetyCertificateOutlined />}
                onClick={() => handleStartInspection(record)}
              >
                Start Inspection
              </RowActionButton>
            ) : (
              <RowActionButton
                icon={<EyeOutlined />}
                onClick={() => {
                  setSelectedReceipt(record);
                  setIsDetailDrawerOpen(true);
                }}
              >
                View Inspection
              </RowActionButton>
            )}
          </Space>
        );
      },
    },
  ];

  if (isInspectionPageOpen && selectedReceipt) {
    return <div className="procurement-workspace inbound-task-page qc-inspection-page">
      <WorkspaceTaskHeader title="QC Inspection" onBack={() => setIsInspectionPageOpen(false)} />
      <div className="create-plan-container">
      <section className="po-figma-details-card qc-inspection-hero" aria-label="Receiving record summary">
        <div className="qc-inspection-section-title">
          <FileTextOutlined />
          <span>Receiving Summary</span>
        </div>
        <div className="qc-inspection-summary-grid">
          {[
            ['Receiving #', getReceiptIrNumber(selectedReceipt)],
            ['IR Schedule #', selectedReceipt.irPlanNumber],
            ['PO #', selectedReceipt.poReferences?.map(po => po.poNumber).join(', ') || selectedReceipt.poNumber],
            ['Vendor', selectedReceipt.supplier],
            ['WH Location', selectedReceipt.receiverWarehouseName],
            ['Received Qty', formatQuantities(selectedReceipt.items, item => item.receiveQty)],
          ].map(([label, value]) => (
            <div className="qc-inspection-summary-field" key={label}>
              <span>{label}</span><strong>{value || '—'}</strong>
            </div>
          ))}
        </div>
      </section>
      <section className="qc-inspection-content" aria-label="Quality inspection">
        <div className="qc-inspection-table-card">
          <div className="qc-inspection-section-title">
            <SafetyCertificateOutlined />
            <span>Inspection Line Items ({inspectionItems.length})</span>
          </div>
          <Table
            className="po-custom-table qc-inspection-table"
            dataSource={inspectionItems.map((item, itemIdx) => ({ ...item, itemIdx, rowKey: `${item.code}-${itemIdx}` }))}
            rowKey="rowKey"
            pagination={false}
            scroll={{ x: 1500 }}
            columns={[
              { title: 'Item Code', dataIndex: 'code', key: 'code', width: 140,
                render: (code: string) => <Text strong>{code}</Text> },
              { title: 'Item Description', dataIndex: 'name', key: 'name', width: 230 },
              { title: 'PO #', dataIndex: 'poNumber', key: 'poNumber', width: 130 },
              { title: 'Received Qty', key: 'received', width: 130,
                render: (_: unknown, item: GRItem) => <Text strong>{item.receiveQty.toLocaleString()} {item.uom}</Text> },
              { title: 'Accepted', key: 'accepted', width: 145,
                render: (_: unknown, item: GRItem & { itemIdx: number }) => <InputNumber
                  min={0} max={item.receiveQty} value={item.qcAcceptedQty}
                  onChange={(value) => handleUpdatePartition(item.itemIdx, 'qcAcceptedQty', value || 0)}
                  style={{ width: 115 }} /> },
              { title: 'Rejected', key: 'rejected', width: 240,
                render: (_: unknown, item: GRItem & { itemIdx: number }) => <div className={`qc-inspection-disposition-cell${(item.qcRejectedQty || 0) > 0 ? ' has-reason' : ''}`}>
                  <InputNumber
                    min={0} max={item.receiveQty} value={item.qcRejectedQty}
                    onChange={(value) => handleUpdatePartition(item.itemIdx, 'qcRejectedQty', value || 0)}
                    style={{ width: 115 }}
                  />
                  {(item.qcRejectedQty || 0) > 0 && <div className="qc-inspection-reason-group">
                    <Input
                      aria-label={`Rejection reason for ${item.code}`}
                      status={!item.qcRejectedReason?.trim() ? 'error' : undefined}
                      placeholder="Describe defect (required)"
                      value={item.qcRejectedReason}
                      onChange={(event) => {
                        const updated = [...inspectionItems];
                        updated[item.itemIdx].qcRejectedReason = event.target.value;
                        setInspectionItems(updated);
                      }}
                    />
                    <span role={!item.qcRejectedReason?.trim() ? 'alert' : undefined} className="qc-inspection-required qc-inspection-required-rejected">
                      {!item.qcRejectedReason?.trim() ? 'Rejection reason required' : '\u00a0'}
                    </span>
                  </div>}
                </div> },
              { title: 'On Hold', key: 'hold', width: 240,
                render: (_: unknown, item: GRItem & { itemIdx: number }) => <div className={`qc-inspection-disposition-cell${(item.qcOnHoldQty || 0) > 0 ? ' has-reason' : ''}`}>
                  <InputNumber
                    min={0} max={item.receiveQty} value={item.qcOnHoldQty}
                    onChange={(value) => handleUpdatePartition(item.itemIdx, 'qcOnHoldQty', value || 0)}
                    style={{ width: 115 }}
                  />
                  {(item.qcOnHoldQty || 0) > 0 && <div className="qc-inspection-reason-group">
                    <Input
                      aria-label={`On-hold reason for ${item.code}`}
                      status={!item.qcOnHoldReason?.trim() ? 'warning' : undefined}
                      placeholder="Hold reason (required)"
                      value={item.qcOnHoldReason}
                      onChange={(event) => {
                        const updated = [...inspectionItems];
                        updated[item.itemIdx].qcOnHoldReason = event.target.value;
                        setInspectionItems(updated);
                      }}
                    />
                    <span role={!item.qcOnHoldReason?.trim() ? 'alert' : undefined} className="qc-inspection-required qc-inspection-required-hold">
                      {!item.qcOnHoldReason?.trim() ? 'On-hold reason required' : '\u00a0'}
                    </span>
                  </div>}
                </div> },
              { title: 'Validation', key: 'validation', width: 150,
                render: (_: unknown, item: GRItem) => {
                  const total = (item.qcAcceptedQty || 0) + (item.qcRejectedQty || 0) + (item.qcOnHoldQty || 0);
                  return <Tag color={total === item.receiveQty ? 'green' : 'red'}>
                    {total}/{item.receiveQty} {total === item.receiveQty ? 'Matched' : 'Unmatched'}
                  </Tag>;
                } },
            ]}
            expandable={{
              defaultExpandAllRows: true,
              expandedRowRender: (item: GRItem & { itemIdx: number }) => {
                const itemIdx = item.itemIdx;
                const checks = item.qcChecks || {
                  packagingCondition: 'Pass', productAppearance: 'Pass', quantityVerification: 'Pass',
                  batchVerification: 'Pass', dateVerification: 'Pass', handlingTempCondition: 'Pass',
                };
                return <div className="qc-inspection-row-details">
              {/* 6-Point Inspection Checklist */}
              <div className="qc-inspection-checklist">
                <Text strong style={{ fontSize: 13, color: '#475569', display: 'block', marginBottom: 12 }}>
                  6-Point Physical Quality Checks
                </Text>
                <Row gutter={[12, 8]}>
                  {[
                    { key: 'packagingCondition', label: '1. Packaging Condition' },
                    { key: 'productAppearance', label: '2. Product Appearance' },
                    { key: 'quantityVerification', label: '3. Quantity Verification' },
                    { key: 'batchVerification', label: '4. Batch & Lot No.' },
                    { key: 'dateVerification', label: '5. Date (Mfg/Exp)' },
                    { key: 'handlingTempCondition', label: '6. Storage Temp & Seal' },
                  ].map((chk) => (
                    <Col xs={12} sm={8} md={4} key={chk.key}>
                      <Text style={{ fontSize: 13, display: 'block', color: '#64748b' }}>{chk.label}</Text>
                      <Select
                        size="middle"
                        style={{ width: '100%', marginTop: 2 }}
                        value={(checks as any)[chk.key] || 'Pass'}
                        onChange={(v) => handleUpdateCheck(itemIdx, chk.key as any, v)}
                        options={[
                          { label: 'Pass', value: 'Pass' },
                          { label: 'Fail', value: 'Fail' },
                          { label: 'N/A', value: 'N/A' },
                        ]}
                      />
                    </Col>
                  ))}
                </Row>
              </div>

                </div>;
              },
            }}
          />
        </div>

        <div className="qc-inspection-remarks">
          <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
            Overall QC Summary Remarks
          </Text>
          <Input.TextArea
            rows={2}
            value={overallQcRemark}
            onChange={(e) => setOverallQcRemark(e.target.value)}
            placeholder="Optional summary remarks for Warehouse Supervisor"
          />
        </div>

      </section>

      <footer className="inbound-task-actions">
        <Button onClick={() => setIsInspectionPageOpen(false)}>Cancel</Button>
        <Button type="primary" icon={<SendOutlined />} onClick={handleSubmitInspection}>Submit to Supervisor</Button>
      </footer>
      </div>
    </div>;
  }

  return (
    <div className="procurement-workspace inbound-role-workspace">
      <WorkspaceHeader
        title="Quality Control — Inspection"
        onRefresh={onRefresh}
        onExport={handleExport}
      />

      {/* QC queues use the same ordering and counts in cards, tabs, and filters. */}
      <div className="summary-cards-row">
        {[
          { label: 'To Inspect', count: tabCounts.pendingQC, color: 'purple', icon: <SafetyCertificateOutlined /> },
          { label: 'On Hold', count: tabCounts.onHold, color: 'amber', icon: <StopOutlined /> },
          { label: 'Rejected', count: tabCounts.rejected, color: 'orange', icon: <CloseCircleOutlined /> },
          { label: 'Passed', count: tabCounts.passed, color: 'green', icon: <CheckCircleOutlined /> },
          { label: 'All Receipts', count: tabCounts.all, color: 'blue', icon: <FileDoneOutlined /> },
        ].map(card => <div className="kpi-card" key={card.label}>
          <div className="kpi-top"><span className="kpi-title">{card.label}</span><div className={`kpi-icon-badge ${card.color}`}>{card.icon}</div></div>
          <div className={`kpi-value ${card.color}`}>{card.count}</div>

        </div>)}
      </div>

      {/* 3. Single-Line Filter Toolbar Card with Title Labels */}
      <div className="filter-toolbar-card" style={{ padding: '12px 18px', background: '#ffffff', borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 240px', minWidth: 200, maxWidth: 300 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Search</span>
            <Input
              placeholder="Search Receiving #, IR Schedule #, vendor..."
              prefix={<SearchOutlined style={{ color: '#9ca3af', marginRight: 4 }} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
              style={{ height: 36, borderRadius: 6 }}
            />
          </div>

          {/* QC Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 160 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>QC Status</span>
            <Select
              style={{ width: '100%', height: 36 }}
              value={statusFilter}
              onChange={(value: QCQueue) => { setStatusFilter(value); setActiveTab('ALL'); }}
              options={(['ALL', 'PENDING', 'ON_HOLD', 'REJECTED', 'PASSED'] as QCQueue[]).map(value => ({ label: value === 'ALL' ? 'All Statuses' : qcQueueLabels[value], value }))}
            />
          </div>

          {/* Warehouse */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 170 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Warehouse</span>
            <Select
              style={{ width: '100%', height: 36 }}
              value={warehouseFilter}
              onChange={setWarehouseFilter}
              options={[
                { label: 'All Warehouses', value: 'ALL' },
                { label: 'WHM1 - Raw Materials', value: 'WHM1' },
                { label: 'WHM2 - Packaging', value: 'WHM2' },
                { label: 'WHM3 - Finished Goods', value: 'WHM3' },
              ]}
            />
          </div>

          {/* Date Range */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 230 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Date Range</span>
            <RangePicker
              style={{ width: '100%', height: 36, borderRadius: 6 }}
              value={dateRange}
              onChange={(d: any) => setDateRange(d)}
              format="YYYY-MM-DD"
              placeholder={['Start Date', 'End Date']}
            />
          </div>

          {/* Reset Button - Appears ONLY when custom filters are active */}
          {(Boolean(searchTerm) || statusFilter !== 'ALL' || warehouseFilter !== 'ALL' || dateRange !== null) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'flex-end' }}>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleResetFilters}
                style={{
                  height: 36,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#ca8504',
                  borderColor: '#fde047',
                  background: '#fefce8',
                  fontWeight: 600,
                  borderRadius: 6,
                }}
              >
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Main Content Card */}
      <div className="main-content-card">
        <div className="tab-action-bar">
          <div className="tabs-list">
            {(['PENDING', 'ON_HOLD', 'REJECTED', 'PASSED', 'ALL'] as QCQueue[]).map(queue => (
              <button key={queue} className={`tab-button ${activeTab === queue ? 'active' : ''}`}
                onClick={() => { setActiveTab(queue); setStatusFilter('ALL'); }}>
                <span>{qcQueueLabels[queue]}</span>
                <span className="tab-count-badge">{{ PENDING: tabCounts.pendingQC, ON_HOLD: tabCounts.onHold, REJECTED: tabCounts.rejected, PASSED: tabCounts.passed, ALL: tabCounts.all }[queue]}</span>
              </button>
            ))}
          </div>

        </div>

        {/* Table View */}
        <Table
          columns={columns}
          dataSource={filteredReceipts}
          rowKey="grNumber"
          pagination={workspacePagination}
          scroll={{ x: 1450 }}
          locale={{ emptyText: <WorkspaceEmpty filtered={Boolean(searchTerm || statusFilter !== 'ALL' || warehouseFilter !== 'ALL' || dateRange)} description={{ PENDING: 'No receipts to inspect. New work appears here after warehouse submission.', ON_HOLD: 'No receipts are on hold or awaiting retest.', REJECTED: 'No rejected or partially rejected receipts.', PASSED: 'No passed inspections yet.', ALL: 'No receiving records yet.' }[activeTab]} /> }}
          className="po-custom-table"
        />
      </div>

      {/* 5. Detail / QC Inspection Drawer (920px) */}
      <Drawer rootClassName="inbound-detail"
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: 24 }}>
            <Space size={10}>
              <SafetyCertificateOutlined style={{ color: '#722ed1', fontSize: 18 }} />
              <span style={{ fontWeight: 700, fontSize: 16 }}>
                QC Inspection Details: {selectedReceipt ? getReceiptIrNumber(selectedReceipt) : '—'}
              </span>
            </Space>
            {selectedReceipt && <InboundStatusBadge type="queue" color={getQCQueueState(selectedReceipt).color} value={getQCQueueState(selectedReceipt).label} />}
          </div>
        }
        open={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        width={920}
        styles={{ body: { padding: '20px 24px', background: '#f8fafc' } }}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Quality Control Inspection Record • Receiving record {selectedReceipt ? getReceiptIrNumber(selectedReceipt) : '—'}
            </Text>
            <Space size={12}>
              <Button onClick={() => setIsDetailDrawerOpen(false)}>Close</Button>
              {selectedReceipt && getQCQueueState(selectedReceipt).pending && (
                <Button
                  type="primary"
                  icon={<SafetyCertificateOutlined />}
                  onClick={() => {
                    setIsDetailDrawerOpen(false);
                    handleStartInspection(selectedReceipt);
                  }}
                  style={{ background: '#B49A00', borderColor: '#B49A00', fontWeight: 600 }}
                >
                  Start Inspection
                </Button>
              )}
            </Space>
          </div>
        }
      >
        {(() => {
          if (!selectedReceipt) return null;

          const totalReceivedQty = selectedReceipt.items.reduce((s, i) => s + (i.receiveQty || 0), 0);
          const totalAcceptedQty = selectedReceipt.items.reduce((s, i) => s + (i.qcAcceptedQty || 0), 0);
          const totalRejectedQty = selectedReceipt.items.reduce((s, i) => s + (i.qcRejectedQty || 0), 0);
          const totalOnHoldQty = selectedReceipt.items.reduce((s, i) => s + (i.qcOnHoldQty || 0), 0);
          const passRate = totalReceivedQty > 0 ? Math.min(100, Math.round((totalAcceptedQty / totalReceivedQty) * 1000) / 10) : 0;

          return (
            <div className="detail-drawer-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Dynamic QC Progress Banner */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e9d5ff',
                  borderRadius: 12,
                  padding: '16px 20px',
                  boxShadow: '0 1px 3px rgba(114, 46, 209, 0.08)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <SafetyCertificateOutlined style={{ color: '#722ed1', fontSize: 16 }} />
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#581c87' }}>
                      QC Inspection Verification & Disposition
                    </span>
                  </div>
                  <InboundStatusBadge type="queue" color={getQCQueueState(selectedReceipt).color} value={getQCQueueState(selectedReceipt).label} />
                </div>

                {new Set(selectedReceipt.items.map(item => item.uom)).size === 1 && <Progress
                  percent={passRate}
                  strokeColor="#722ed1"
                  trailColor="#e2e8f0"
                  status={selectedReceipt.qcResult === 'Fail' ? 'exception' : 'normal'}
                  style={{ marginBottom: 12 }}
                />}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 12 }}>
                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>WH Received</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a'}}>{formatQuantities(selectedReceipt.items, i => i.receiveQty ?? 0)}</div>
                  </div>
                  <div style={{ background: '#f0fdf4', padding: '10px 12px', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 500 }}>Accepted Qty</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a'}}>{formatQuantities(selectedReceipt.items, i => i.qcAcceptedQty ?? 0)}</div>
                  </div>
                  <div style={{ background: totalRejectedQty > 0 ? '#fef2f2' : '#f8fafc', padding: '10px 12px', borderRadius: 8, border: totalRejectedQty > 0 ? '1px solid #fecaca' : '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 11, color: totalRejectedQty > 0 ? '#dc2626' : '#64748b', fontWeight: 500 }}>Rejected Qty</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a'}}>{formatQuantities(selectedReceipt.items, i => i.qcRejectedQty ?? 0)}</div>
                  </div>
                  <div style={{ background: totalOnHoldQty > 0 ? '#fefce8' : '#f8fafc', padding: '10px 12px', borderRadius: 8, border: totalOnHoldQty > 0 ? '1px solid #fef08a' : '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 11, color: totalOnHoldQty > 0 ? '#854d0e' : '#64748b', fontWeight: 500 }}>On Hold Qty</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a'}}>{formatQuantities(selectedReceipt.items, i => i.qcOnHoldQty ?? 0)}</div>
                  </div>
                </div>
              </div>

              {/* 1. Exact Figma Inspection Details Card */}
              <div
                className="po-figma-details-card"
                style={{
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: '16px 20px',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                }}
              >
                <div
                  className="po-card-title"
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#111827',
                    marginBottom: 14,
                    lineHeight: 1.2,
                  }}
                >
                  QC Inspection & Logistics Header
                </div>
                <div className="po-grid-container" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Row 1: Receiving # vs IR Schedule # */}
                  <div className="po-grid-row" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                    <div className="label-value-pair" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                      <span className="field-label" style={{ width: 140, fontSize: 13, fontWeight: 500, color: '#6b7280', flexShrink: 0 }}>
                        Receiving #
                      </span>
                      <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                        :
                      </span>
                      <span className="field-value" style={{ fontSize: 14, fontWeight: 600, color: 'rgba(0,0,0,0.85)' }}>
                        {getReceiptIrNumber(selectedReceipt)}
                      </span>
                    </div>
                    <div className="label-value-pair" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                      <span className="field-label" style={{ width: 140, fontSize: 13, fontWeight: 500, color: '#6b7280', flexShrink: 0 }}>
                        IR Schedule #
                      </span>
                      <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                        :
                      </span>
                      <span className="field-value" style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                        {selectedReceipt.irPlanNumber}
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Vendor vs Delivery Note */}
                  <div className="po-grid-row" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                    <div className="label-value-pair" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                      <span className="field-label" style={{ width: 140, fontSize: 13, fontWeight: 500, color: '#6b7280', flexShrink: 0 }}>
                        Vendor / Supplier
                      </span>
                      <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                        :
                      </span>
                      <span className="field-value" style={{ fontSize: 14, fontWeight: 500, color: 'rgba(0,0,0,0.85)' }}>
                        {selectedReceipt.supplier}
                      </span>
                    </div>
                    <div className="label-value-pair" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                      <span className="field-label" style={{ width: 140, fontSize: 13, fontWeight: 500, color: '#6b7280', flexShrink: 0 }}>
                        Delivery Note (DN)
                      </span>
                      <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                        :
                      </span>
                      <span className="field-value" style={{ fontSize: 14, fontWeight: 500, color: 'rgba(0,0,0,0.85)' }}>
                        {selectedReceipt.deliveryNoteNumber || 'NA'}
                      </span>
                    </div>
                  </div>

                  {/* Row 3: QC Inspector vs Inspection Date */}
                  <div className="po-grid-row" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                    <div className="label-value-pair" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                      <span className="field-label" style={{ width: 140, fontSize: 13, fontWeight: 500, color: '#6b7280', flexShrink: 0 }}>
                        QC Inspector
                      </span>
                      <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                        :
                      </span>
                      <span className="field-value" style={{ fontSize: 14, fontWeight: 500, color: 'rgba(0,0,0,0.85)' }}>
                        {selectedReceipt.qcInspectedBy || 'QC Inspector (Chantrea)'}
                      </span>
                    </div>
                    <div className="label-value-pair" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                      <span className="field-label" style={{ width: 140, fontSize: 13, fontWeight: 500, color: '#6b7280', flexShrink: 0 }}>
                        Inspection Date
                      </span>
                      <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                        :
                      </span>
                      <span className="field-value" style={{ fontSize: 14, fontWeight: 500, color: 'rgba(0,0,0,0.85)' }}>
                        {selectedReceipt.qcInspectionDate || selectedReceipt.expectedDate || '2026-08-27'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Line Items & Inspection Disposition Breakdown */}
              <div
                className="drawer-section"
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '16px 20px',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                }}
              >
                <div
                  className="drawer-section-title"
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#0f172a',
                    marginBottom: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <SafetyCertificateOutlined style={{ color: '#722ed1' }} />
                  <span>Inspection Line Items & Disposition Breakdown ({selectedReceipt.items.length})</span>
                </div>
                <Table
                  size="small"
                  dataSource={selectedReceipt.items}
                  rowKey="code"
                  pagination={false}
                  className="po-custom-table"
                  columns={[
                    { title: 'Item Code', dataIndex: 'code', key: 'code', width: 120, render: (c) => <Text strong style={{ color: '#334155' }}>{c}</Text> },
                    { title: 'Item Name', dataIndex: 'name', key: 'name', render: (n) => <span style={{ fontWeight: 500 }}>{n}</span> },
                    { title: 'WH Received', dataIndex: 'receiveQty', key: 'receiveQty', width: 120, render: (q, r) => `${(q || 0).toLocaleString()} ${r.uom}` },
                    { title: 'Accepted', dataIndex: 'qcAcceptedQty', key: 'qcAcceptedQty', width: 110, render: (q, r) => <Text>{(q ?? 0).toLocaleString()} {r.uom}</Text> },
                    { title: 'Rejected', dataIndex: 'qcRejectedQty', key: 'qcRejectedQty', width: 110, render: (q, r) => <Text>{(q ?? 0).toLocaleString()} {r.uom}</Text> },
                    { title: 'On Hold', dataIndex: 'qcOnHoldQty', key: 'qcOnHoldQty', width: 110, render: (q, r) => <Text>{(q ?? 0).toLocaleString()} {r.uom}</Text> },
                    { title: 'Result', dataIndex: 'qcResult', key: 'qcResult', width: 110, render: (r) => <InboundStatusBadge type="qc" value={r || 'Pass'} /> },
                  ]}
                />
              </div>

              {/* 3. Audit Trail Card */}
              <AuditTrailTimeline receipt={selectedReceipt}
                  activities={selectedReceipt.activities}
                  adjustments={selectedReceipt.supervisorAdjustments}
                />
            </div>
          );
        })()}
      </Drawer>


    </div>
  );
};
