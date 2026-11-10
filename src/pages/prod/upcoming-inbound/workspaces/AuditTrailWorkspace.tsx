import { RowActionButton, rowActionColumn } from '../shared/ui/RowActionButton';
import { WorkspaceHeader, WorkspaceEmpty, workspacePagination } from '../shared/ui/WorkspaceUI';
import { exportWorkspace, type ExportFormat } from '../shared/ui/workspaceExport';
import { AuditTrailTimeline } from '../features/shared/AuditTrailTimeline';
import { getPostingQuantity, formatQuantities } from '../core/quantity';
import { getReceiptIrNumber } from '../core/workflow/goods-receipt';
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
  DatePicker,
  Row,
  Col,
  Alert,
  Divider,
  Timeline,
  Tooltip,
  message,
  Progress,
} from 'antd';
import {
  HistoryOutlined,
  AuditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  UserOutlined,
  ExportOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  FileTextOutlined,
  FileDoneOutlined,
  EyeOutlined,
  SafetyCertificateOutlined,
  InboxOutlined,
  SendOutlined,
  EditOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type {
  GoodsReceipt,
  GRActivity,
  SupervisorAdjustmentAudit,
  IRPlan,
} from '../core/type';
import { InboundStatusBadge } from '../features/shared/InboundStatusBadge';
import './ProcurementWorkspace.less';

const { Text } = Typography;
const { RangePicker } = DatePicker;
const postedQuantity = (receipt: GoodsReceipt, item: GoodsReceipt['items'][number]) => item.sapPostedQty ?? (receipt.sapPostingStatus === 'Posted' || receipt.processState === 'SAP_POSTED' ? getPostingQuantity(item) : 0);

export interface AuditTrailWorkspaceProps {
  receipts: GoodsReceipt[];
  irPlans?: IRPlan[];
  onRefresh: () => void;
}

interface FlattenedAuditEvent {
  id: string;
  grNumber: string;
  irPlanNumber: string;
  poNumber: string;
  supplier: string;
  eventTitle: string;
  description: string;
  department: 'Procurement' | 'Warehouse' | 'QC' | 'Supervisor' | 'System';
  performedBy: string;
  timestamp: string;
  state: 'done' | 'active' | 'error' | 'pending' | string;
  receiptRef: GoodsReceipt;
}

export const AuditTrailWorkspace: React.FC<AuditTrailWorkspaceProps> = ({
  receipts,
  irPlans = [],
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'ALL_EVENTS' | 'ADJUSTMENTS' | 'VISUAL_JOURNEY'>('ALL_EVENTS');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [selectedGrFilter, setSelectedGrFilter] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<any>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<GoodsReceipt | null>(receipts[0] || null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState<boolean>(false);

  // Flatten all activities across all receipts
  const allEvents: FlattenedAuditEvent[] = useMemo(() => {
    const list: FlattenedAuditEvent[] = [];

    receipts.forEach((r) => {
      if (r.activities?.length) {
        r.activities.forEach((act, idx) => {
          let dept: 'Procurement' | 'Warehouse' | 'QC' | 'Supervisor' | 'System' = 'Warehouse';
          const title = act.title.toLowerCase();
          if (/supervisor/i.test(act.performedBy || '') || /supervisor|post|sap/.test(title)) dept = 'Supervisor';
          else if (/\bir\b|schedule|procurement|plan/.test(title)) dept = 'Procurement';
          else if (title.includes('qc') || title.includes('inspection')) dept = 'QC';
          else if (title.includes('supervisor') || title.includes('post') || title.includes('sap')) dept = 'Supervisor';
          else if (title.includes('system') || title.includes('sync')) dept = 'System';

          list.push({
            id: act.id || `evt-${r.id}-${idx}`,
            grNumber: r.grNumber || 'N/A',
            irPlanNumber: r.irPlanNumber || 'N/A',
            poNumber: r.poNumber || 'N/A',
            supplier: r.supplier || 'N/A',
            eventTitle: act.title,
            description: act.description,
            department: dept,
            performedBy: act.performedBy || 'System User',
            timestamp: act.timestamp,
            state: act.state || 'done',
            receiptRef: r,
          });
        });
      }
    });

    return list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
  }, [receipts]);

  // Extract all supervisor adjustments
  const allAdjustments = useMemo(() => {
    const list: (SupervisorAdjustmentAudit & { grNumber: string; supplier: string; receiptRef: GoodsReceipt })[] = [];
    receipts.forEach((r) => {
      if (r.supervisorAdjustments) {
        r.supervisorAdjustments.forEach((adj) => {
          list.push({
            ...adj,
            grNumber: r.grNumber,
            supplier: r.supplier,
            receiptRef: r,
          });
        });
      }
    });
    return list;
  }, [receipts]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      allEvents: allEvents.length,
      adjustments: allAdjustments.length,
      postedSap: receipts.filter((r) => r.deliveryPlanStatus === 'Posted' || r.sapDocNum).length,
      discrepancies: receipts.filter((r) => r.items.some((i) => (i.plannedQty || i.poQty || 0) !== i.receiveQty)).length,
      activeWorkflows: receipts.filter((r) => r.deliveryPlanStatus !== 'Posted').length,
    };
  }, [allEvents, allAdjustments, receipts]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return allEvents.filter((evt) => {
      if (dateRange?.[0] && dateRange?.[1]) {
        const date = dayjs(evt.timestamp);
        if (!date.isValid() || date.isBefore(dateRange[0], 'day') || date.isAfter(dateRange[1], 'day')) return false;
      }
      // Department Filter
      if (deptFilter !== 'ALL' && evt.department !== deptFilter) {
        return false;
      }

      // GR Transaction Filter
      if (selectedGrFilter !== 'ALL' && evt.grNumber !== selectedGrFilter) {
        return false;
      }

      // Search Filter
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const mTitle = evt.eventTitle.toLowerCase().includes(q);
        const mDesc = evt.description.toLowerCase().includes(q);
        const mGR = getReceiptIrNumber(evt.receiptRef).toLowerCase().includes(q) || evt.grNumber.toLowerCase().includes(q);
        const mIR = evt.irPlanNumber.toLowerCase().includes(q);
        const mPO = evt.poNumber.toLowerCase().includes(q);
        const mUser = evt.performedBy.toLowerCase().includes(q);
        const mSup = evt.supplier.toLowerCase().includes(q);
        if (!mTitle && !mDesc && !mGR && !mIR && !mPO && !mUser && !mSup) {
          return false;
        }
      }

      return true;
    });
  }, [allEvents, deptFilter, selectedGrFilter, searchTerm, dateRange]);

  const filteredAdjustments = allAdjustments.filter(adjustment => {
    if (deptFilter !== 'ALL' && deptFilter !== 'Supervisor') return false;
    if (selectedGrFilter !== 'ALL' && adjustment.grNumber !== selectedGrFilter) return false;
    if (dateRange?.[0] && dateRange?.[1]) {
      const date = dayjs(adjustment.timestamp);
      if (!date.isValid() || date.isBefore(dateRange[0], 'day') || date.isAfter(dateRange[1], 'day')) return false;
    }
    const query = searchTerm.toLowerCase();
    return [adjustment.itemCode, adjustment.itemName, adjustment.reason, adjustment.changedBy,
      getReceiptIrNumber(adjustment.receiptRef), adjustment.receiptRef.poNumber, adjustment.receiptRef.irPlanNumber,
      adjustment.supplier].some(value => value?.toLowerCase().includes(query));
  });

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setDeptFilter('ALL');
    setSelectedGrFilter('ALL');
    setDateRange(null);
    message.info('Audit filters reset.');
  };

  const handleExport = (format: ExportFormat) => {
    if (activeTab === 'ADJUSTMENTS') {
      exportWorkspace('inbound-adjustments', [
        ['Timestamp', 'Receiving #', 'Item', 'Previous Quantity', 'New Quantity', 'Reason', 'Changed By'],
        ...filteredAdjustments.map(entry => [entry.timestamp, getReceiptIrNumber(entry.receiptRef), entry.itemCode,
          entry.previousValue, entry.newValue, entry.reason, entry.changedBy]),
      ], format);
      return;
    }
    exportWorkspace('inbound-activity', [
      ['Timestamp', 'Receiving #', 'IR Schedule #', 'PO #', 'Role', 'Action', 'Details', 'Performed By'],
      ...filteredEvents.map(event => [event.timestamp, getReceiptIrNumber(event.receiptRef), event.irPlanNumber, event.poNumber, event.department, event.eventTitle, event.description, event.performedBy]),
    ], format);
  };

  const getTimelineIcon = (state: string) => {
    switch (state) {
      case 'done':
        return <CheckCircleOutlined style={{ color: '#16a34a', fontSize: 16 }} />;
      case 'active':
        return <ClockCircleOutlined style={{ color: '#2563eb', fontSize: 16 }} />;
      case 'error':
        return <CloseCircleOutlined style={{ color: '#dc2626', fontSize: 16 }} />;
      default:
        return <ExclamationCircleOutlined style={{ color: '#ca8504', fontSize: 16 }} />;
    }
  };

  const getDeptTag = (dept: string) => {
    switch (dept) {
      case 'Procurement':
        return <Tag color="blue">Procurement</Tag>;
      case 'Warehouse':
        return <Tag color="orange">Warehouse</Tag>;
      case 'QC':
        return <Tag color="purple">QC Inspection</Tag>;
      case 'Supervisor':
        return <Tag color="green">Supervisor</Tag>;
      default:
        return <Tag color="cyan">System</Tag>;
    }
  };

  // Event Columns
  const eventColumns: ColumnsType<FlattenedAuditEvent> = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 145,
      render: (t) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>{t.split(' ')[0]}</Text>
          <div style={{ fontSize: 11, color: '#64748b' }}>{t.split(' ')[1] || '09:00'}</div>
        </div>
      ),
    },
    {
      title: 'IR Schedule #',
      key: 'irPlanNumber',
      width: 120,
      render: (_: any, record: FlattenedAuditEvent) => <span>{record.irPlanNumber || '—'}</span>,
    },
    {
      title: 'Receiving #',
      dataIndex: 'grNumber',
      key: 'grNumber',
      width: 130,
      render: (gr: string, record: FlattenedAuditEvent) => (
        <span
          className="po-link"
          onClick={() => {
            setSelectedReceipt(record.receiptRef);
            setIsDetailDrawerOpen(true);
          }}
        >
          {getReceiptIrNumber(record.receiptRef) || '—'}
        </span>
      ),
    },
    {
      title: 'PO #',
      dataIndex: 'poNumber',
      key: 'poNumber',
      width: 120,
      render: (po: string) => (
        <span className="po-link">{po}</span>
      ),
    },
    {
      title: 'Department / Role',
      dataIndex: 'department',
      key: 'department',
      width: 130,
      render: (dept) => getDeptTag(dept),
    },
    {
      title: 'Action & Event Log',
      key: 'event',
      render: (_: any, record: FlattenedAuditEvent) => (
        <div>
          <Space size={6}>
            {getTimelineIcon(record.state)}
            <Text strong style={{ color: '#0f172a' }}>{record.eventTitle}</Text>
          </Space>
          <div style={{ color: '#475569', fontSize: 12, marginTop: 2, paddingLeft: 22 }}>
            {record.description}
          </div>
        </div>
      ),
    },
    {
      title: 'Performed By',
      dataIndex: 'performedBy',
      key: 'performedBy',
      width: 150,
      render: (user) => (
        <span style={{ fontSize: 12, color: '#334155' }}>
          <UserOutlined style={{ marginRight: 4, color: '#94a3b8' }} />
          {user}
        </span>
      ),
    },
    {
      ...rowActionColumn,
      render: (_: any, record: FlattenedAuditEvent) => (
        <RowActionButton
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedReceipt(record.receiptRef);
            setIsDetailDrawerOpen(true);
          }}
        >
          View Activity
        </RowActionButton>
      ),
    },
  ];

  // Adjustment Columns
  const adjustmentColumns = [
    {
      title: 'Receiving #',
      dataIndex: 'grNumber',
      key: 'grNumber',
      width: 130,
      render: (gr: string, record: any) => (
        <span
          className="po-link"
          onClick={() => {
            setSelectedReceipt(record.receiptRef);
            setIsDetailDrawerOpen(true);
          }}
        >
          {getReceiptIrNumber(record.receiptRef)}
        </span>
      ),
    },
    {
      title: 'PO #',
      key: 'poNumber',
      width: 120,
      render: (_: any, record: any) => (
        <span className="po-link">
          {record.receiptRef?.poNumber}
        </span>
      ),
    },
    {
      title: 'Item Code',
      dataIndex: 'itemCode',
      key: 'itemCode',
      width: 130,
      render: (code: string, record: any) => (
        <div>
          <Text strong style={{ color: '#2563eb' }}>{code}</Text>
          <div style={{ fontSize: 11, color: '#64748b' }}>{record.itemName}</div>
        </div>
      ),
    },
    {
      title: 'Original Value',
      dataIndex: 'previousValue',
      key: 'previousValue',
      width: 110,
      render: (val: any) => <Text delete type="secondary">{val} PCS</Text>,
    },
    {
      title: 'Adjusted Value',
      dataIndex: 'newValue',
      key: 'newValue',
      width: 120,
      render: (val: any) => <Text strong style={{ color: '#16a34a' }}>{val} PCS</Text>,
    },
    {
      title: 'Mandatory Rationale & Reason',
      dataIndex: 'reason',
      key: 'reason',
      render: (text: string) => (
        <div style={{ background: '#fffbeb', padding: '4px 8px', borderRadius: 4, border: '1px solid #fef3c7', fontSize: 12, color: '#92400e' }}>
          {text}
        </div>
      ),
    },
    {
      title: 'Modified By / Time',
      key: 'auditMeta',
      width: 160,
      render: (_: any, record: any) => (
        <div>
          <div style={{ fontSize: 12, fontWeight: 500 }}>
            <UserOutlined style={{ marginRight: 4, color: '#ca8504' }} />
            {record.changedBy}
          </div>
          <div style={{ fontSize: 11, color: '#64748b' }}>{record.timestamp}</div>
        </div>
      ),
    },
  ];

  return (
    <div className="procurement-workspace inbound-role-workspace">
      <WorkspaceHeader title="Audit Trail — Activity History"
        onRefresh={onRefresh} onExport={handleExport} />

      {/* 2. KPI Summary Cards Grid */}
      <div className="summary-cards-row">
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Total Audit Events</span>
            <div className="kpi-icon-badge blue">
              <HistoryOutlined />
            </div>
          </div>
          <div className="kpi-value blue">{tabCounts.allEvents}</div>

        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Supervisor Adjustments</span>
            <div className="kpi-icon-badge amber">
              <AuditOutlined />
            </div>
          </div>
          <div className="kpi-value amber">{tabCounts.adjustments}</div>

        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Posted to SAP</span>
            <div className="kpi-icon-badge green">
              <CheckCircleOutlined />
            </div>
          </div>
          <div className="kpi-value green">{tabCounts.postedSap}</div>

        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Discrepancy Alerts</span>
            <div className="kpi-icon-badge orange">
              <ExclamationCircleOutlined />
            </div>
          </div>
          <div className="kpi-value orange">{tabCounts.discrepancies}</div>

        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Active Workflows</span>
            <div className="kpi-icon-badge purple">
              <FileTextOutlined />
            </div>
          </div>
          <div className="kpi-value purple">{tabCounts.activeWorkflows}</div>

        </div>
      </div>

      {/* 3. Single-Line Filter Toolbar Card with Title Labels */}
      <div className="filter-toolbar-card" style={{ padding: '12px 18px', background: '#ffffff', borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 240px', minWidth: 200, maxWidth: 300 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Search</span>
            <Input
              placeholder="Search event, Receiving #, PO #, user, reason..."
              prefix={<SearchOutlined style={{ color: '#9ca3af', marginRight: 4 }} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
              style={{ height: 36, borderRadius: 6 }}
            />
          </div>

          {/* Department / Stage */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 190 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Department / Stage</span>
            <Select
              style={{ width: '100%', height: 36 }}
              value={deptFilter}
              onChange={setDeptFilter}
              options={[
                { label: 'All Departments', value: 'ALL' },
                { label: 'Procurement (Planning)', value: 'Procurement' },
                { label: 'Warehouse (Receiving)', value: 'Warehouse' },
                { label: 'QC Inspection', value: 'QC' },
                { label: 'Supervisor (Approval & SAP)', value: 'Supervisor' },
                { label: 'System Automation', value: 'System' },
              ]}
            />
          </div>

          {/* Specific Receiving Record */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 180 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Receiving Record</span>
            <Select
              style={{ width: '100%', height: 36 }}
              value={selectedGrFilter}
              onChange={setSelectedGrFilter}
              options={[
                { label: 'All Shipments', value: 'ALL' },
                ...receipts.map((r) => ({
                  label: `${getReceiptIrNumber(r)} (${r.supplier})`,
                  value: r.grNumber,
                })),
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
          {(Boolean(searchTerm) || deptFilter !== 'ALL' || selectedGrFilter !== 'ALL' || dateRange !== null) && (
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
            <button
              className={`tab-button ${activeTab === 'ALL_EVENTS' ? 'active' : ''}`}
              onClick={() => setActiveTab('ALL_EVENTS')}
            >
              <span>Chronological Event Log</span>
              <span className="tab-count-badge">{tabCounts.allEvents}</span>
            </button>

            <button
              className={`tab-button ${activeTab === 'ADJUSTMENTS' ? 'active' : ''}`}
              onClick={() => setActiveTab('ADJUSTMENTS')}
            >
              <span>Supervisor Adjustments</span>
              <span className="tab-count-badge">{tabCounts.adjustments}</span>
            </button>

            <button
              className={`tab-button ${activeTab === 'VISUAL_JOURNEY' ? 'active' : ''}`}
              onClick={() => setActiveTab('VISUAL_JOURNEY')}
            >
              <span>Visual Journey & Lifecycle</span>
            </button>
          </div>

        </div>

        {/* Tab 1: Chronological Event Log */}
        {activeTab === 'ALL_EVENTS' && (
          <Table
            columns={eventColumns}
            dataSource={filteredEvents}
            rowKey="id"
            pagination={workspacePagination}
            locale={{ emptyText: <WorkspaceEmpty filtered={Boolean(searchTerm || deptFilter !== 'ALL' || selectedGrFilter !== 'ALL' || dateRange)} description="No activity recorded yet." /> }}
            className="po-custom-table"
          />
        )}

        {/* Tab 2: Supervisor Adjustments */}
        {activeTab === 'ADJUSTMENTS' && (
          <div>
            <Alert
              message="Quantity Adjustment History"
              description="Review original and adjusted quantities, the recorded reason, and who made each change."
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={adjustmentColumns}
              dataSource={filteredAdjustments}
              rowKey="id"
              pagination={workspacePagination}
              className="po-custom-table"
            />
          </div>
        )}

        {/* Tab 3: Visual Journey & Lifecycle Deep Dive */}
        {activeTab === 'VISUAL_JOURNEY' && (
          <div style={{ padding: '8px 4px' }}>
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <Space size={12}>
                <Text strong>Select Shipment Journey:</Text>
                <Select
                  style={{ width: 300 }}
                  value={selectedReceipt ? getReceiptIrNumber(selectedReceipt) : '—'}
                  onChange={(val) => {
                    const found = receipts.find((r) => r.grNumber === val);
                    if (found) setSelectedReceipt(found);
                  }}
                  options={receipts.map((r) => ({
                    label: `${getReceiptIrNumber(r)} - ${r.supplier} (PO: ${r.poNumber})`,
                    value: r.grNumber,
                  }))}
                />
              </Space>
              {selectedReceipt && (
                <Space>
                  <InboundStatusBadge type="deliveryPlan" value={selectedReceipt.deliveryPlanStatus || 'Posted'} />
                  {selectedReceipt.sapDocNum && <Tag color="green">SAP: {selectedReceipt.sapDocNum}</Tag>}
                </Space>
              )}
            </div>

            {selectedReceipt && (
              <Row gutter={[24, 24]}>
                {/* Visual Step Cards */}
                <Col xs={24} md={14}>
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <HistoryOutlined style={{ color: '#2563eb' }} />
                      <span>End-to-End Inbound Journey: {getReceiptIrNumber(selectedReceipt)}</span>
                    </div>

                    <AuditTrailTimeline receipt={selectedReceipt} activities={selectedReceipt.activities} adjustments={selectedReceipt.supervisorAdjustments} />
                  </div>
                </Col>

                {/* 6-Quantity Ownership Matrix */}
                <Col xs={24} md={10}>
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileTextOutlined style={{ color: '#ca8504' }} />
                      <span>Multi-Department Ownership Matrix</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#eff6ff', borderRadius: 6 }}>
                        <div>
                          <Tag color="blue">Procurement</Tag>
                          <span style={{ fontSize: 12, color: '#1e3a8a' }}>Planned Order QTY</span>
                        </div>
                        <Text strong style={{ fontSize: 14 }}>
                          {formatQuantities(selectedReceipt.items, i => i.plannedQty ?? i.poQty ?? 0)}
                        </Text>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#fff7ed', borderRadius: 6 }}>
                        <div>
                          <Tag color="orange">Warehouse</Tag>
                          <span style={{ fontSize: 12, color: '#9a3412' }}>Actual Received QTY</span>
                        </div>
                        <Text strong style={{ fontSize: 14, color: '#ea580c' }}>
                          {formatQuantities(selectedReceipt.items, i => i.receiveQty ?? 0)}
                        </Text>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#faf5ff', borderRadius: 6 }}>
                        <div>
                          <Tag color="purple">QC Inspection</Tag>
                          <span style={{ fontSize: 12, color: '#581c87' }}>QC Accepted QTY</span>
                        </div>
                        <Text strong style={{ fontSize: 14, color: '#9333ea' }}>
                          {formatQuantities(selectedReceipt.items, i => i.qcAcceptedQty ?? 0)}
                        </Text>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f0fdf4', borderRadius: 6 }}>
                        <div>
                          <Tag color="green">Supervisor</Tag>
                          <span style={{ fontSize: 12, color: '#14532d' }}>Final SAP Posted QTY</span>
                        </div>
                        <Text strong style={{ fontSize: 14, color: '#16a34a' }}>
                          {formatQuantities(selectedReceipt.items, i => postedQuantity(selectedReceipt, i))}
                        </Text>
                      </div>
                    </div>

                    <Button
                      type="primary"
                      icon={<EyeOutlined />}
                      onClick={() => setIsDetailDrawerOpen(true)}
                      style={{ width: '100%', marginTop: 18, background: '#B49A00', borderColor: '#B49A00', height: 36, fontWeight: 600 }}
                    >
                      View Activity
                    </Button>
                  </div>
                </Col>
              </Row>
            )}
          </div>
        )}
      </div>

      {/* 5. Detail Drawer (920px) */}
      <Drawer rootClassName="inbound-detail"
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: 24 }}>
            <Space size={10}>
              <HistoryOutlined style={{ color: '#2563eb', fontSize: 18 }} />
              <span style={{ fontWeight: 700, fontSize: 16 }}>
                Inbound Transaction Audit: {selectedReceipt ? getReceiptIrNumber(selectedReceipt) : '—'}
              </span>
            </Space>
            {selectedReceipt && (
              <InboundStatusBadge type="deliveryPlan" value={selectedReceipt.deliveryPlanStatus || 'Posted'} />
            )}
          </div>
        }
        open={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        width={920}
        styles={{ body: { padding: '20px 24px', background: '#f8fafc' } }}
        footer={
          selectedReceipt && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Audit Trail & Historical Traceability Log
              </Text>
              <Space size={12}>
                <Button onClick={() => setIsDetailDrawerOpen(false)}>Close</Button>
              </Space>
            </div>
          )
        }
      >
        {selectedReceipt && (() => {
          const totalPlanned = selectedReceipt.items?.reduce((s, i) => s + (i.plannedQty || i.poQty || 0), 0) || 0;
          const totalReceived = selectedReceipt.items?.reduce((s, i) => s + (i.receiveQty || 0), 0) || 0;
          const totalQcAccepted = selectedReceipt.items?.reduce((s, i) => s + (i.qcAcceptedQty || 0), 0) || 0;
          const totalFinalPosted = selectedReceipt.items?.reduce((s, i) => s + postedQuantity(selectedReceipt, i), 0) || 0;
          const fulfillmentRate = totalPlanned > 0 ? Math.min(100, Math.round((totalFinalPosted / totalPlanned) * 1000) / 10) : 100;

          return (
            <div className="detail-drawer-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Top End-to-End Lifecycle Summary Banner */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #bfdbfe',
                  borderRadius: 12,
                  padding: '16px 20px',
                  boxShadow: '0 1px 3px rgba(37, 99, 235, 0.08)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <HistoryOutlined style={{ color: '#2563eb', fontSize: 16 }} />
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#1e3a8a' }}>
                      End-to-End Inbound Execution Summary
                    </span>
                  </div>
                  <Tag
                    color={selectedReceipt.deliveryPlanStatus === 'Posted' ? 'success' : 'processing'}
                    style={{ fontSize: 12, fontWeight: 600, padding: '2px 10px', borderRadius: 12 }}
                  >
                    {selectedReceipt.deliveryPlanStatus === 'Posted' ? 'Completed & Posted' : 'In Progress'}
                  </Tag>
                </div>

                {new Set(selectedReceipt.items.map(item => item.uom)).size === 1 && <Progress
                  percent={fulfillmentRate}
                  strokeColor="#2563eb"
                  trailColor="#e2e8f0"
                  status={selectedReceipt.deliveryPlanStatus === 'Posted' ? 'normal' : 'active'}
                  style={{ marginBottom: 12 }}
                />}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 12 }}>
                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>Planned PO Qty</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a'}}>{formatQuantities(selectedReceipt.items, i => i.plannedQty ?? i.poQty ?? 0)}</div>
                  </div>
                  <div style={{ background: '#eff6ff', padding: '10px 12px', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                    <div style={{ fontSize: 11, color: '#1e40af', fontWeight: 500 }}>WH Received</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a'}}>{formatQuantities(selectedReceipt.items, i => i.receiveQty ?? 0)}</div>
                  </div>
                  <div style={{ background: '#f0fdf4', padding: '10px 12px', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: 11, color: '#166534', fontWeight: 500 }}>QC Accepted</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a'}}>{formatQuantities(selectedReceipt.items, i => i.qcAcceptedQty ?? 0)}</div>
                  </div>
                  <div style={{ background: '#fefce8', padding: '10px 12px', borderRadius: 8, border: '1px solid #fef08a' }}>
                    <div style={{ fontSize: 11, color: '#854d0e', fontWeight: 500 }}>Final SAP Posted</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a'}}>{formatQuantities(selectedReceipt.items, i => postedQuantity(selectedReceipt, i))}</div>
                  </div>
                </div>
              </div>

              {/* 1. Exact Figma Details Card */}
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
                  Transaction & Logistics Details
                </div>
                <div className="po-grid-container" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="po-grid-row" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                    <div className="label-value-pair" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                      <span className="field-label" style={{ width: 140, fontSize: 13, fontWeight: 500, color: '#6b7280', flexShrink: 0 }}>
                        Receiving #
                      </span>
                      <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                        :
                      </span>
                      <span className="field-value" style={{ fontSize: 14, fontWeight: 600, color: '#2563eb' }}>
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
                      <span className="field-value" style={{ fontSize: 14, fontWeight: 500, color: 'rgba(0,0,0,0.85)' }}>
                        {selectedReceipt.irPlanNumber}
                      </span>
                    </div>
                  </div>

                  <div className="po-grid-row" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                    <div className="label-value-pair" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                      <span className="field-label" style={{ width: 140, fontSize: 13, fontWeight: 500, color: '#6b7280', flexShrink: 0 }}>
                        PO Reference
                      </span>
                      <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                        :
                      </span>
                      <span className="field-value" style={{ fontSize: 14, fontWeight: 500, color: 'rgba(0,0,0,0.85)' }}>
                        {selectedReceipt.poNumber}
                      </span>
                    </div>
                    <div className="label-value-pair" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                      <span className="field-label" style={{ width: 140, fontSize: 13, fontWeight: 500, color: '#6b7280', flexShrink: 0 }}>
                        Supplier / Vendor
                      </span>
                      <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                        :
                      </span>
                      <span className="field-value" style={{ fontSize: 14, fontWeight: 500, color: 'rgba(0,0,0,0.85)' }}>
                        {selectedReceipt.supplier}
                      </span>
                    </div>
                  </div>

                  <div className="po-grid-row" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
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
                    <div className="label-value-pair" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                      <span className="field-label" style={{ width: 140, fontSize: 13, fontWeight: 500, color: '#6b7280', flexShrink: 0 }}>
                        SAP GR #
                      </span>
                      <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                        :
                      </span>
                      <span className="field-value" style={{ fontSize: 14, fontWeight: 600, color: selectedReceipt.sapDocNum ? '#16a34a' : '#ca8504' }}>
                        {selectedReceipt.sapDocNum || 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Line Items & Quantity Tracking */}
              <div
                className="drawer-section"
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '16px 20px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
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
                  <FileTextOutlined style={{ color: '#ca8504' }} />
                  <span>Line Items & Quantity Tracking ({selectedReceipt.items?.length || 0})</span>
                </div>
                <Table
                  size="small"
                  dataSource={selectedReceipt.items}
                  rowKey="code"
                  pagination={false}
                  className="po-custom-table"
                  columns={[
                    { title: 'Item Code', dataIndex: 'code', key: 'code', render: (c) => <Text strong style={{ color: '#2563eb' }}>{c}</Text> },
                    { title: 'Item Name & Description', dataIndex: 'name', key: 'name' },
                    { title: 'PO / Plan', key: 'plan', render: (_, r) => `${r.plannedQty || r.poQty} ${r.uom}` },
                    { title: 'WH Received', dataIndex: 'receiveQty', key: 'receiveQty', render: (q, r) => `${q} ${r.uom}` },
                    { title: 'QC Accepted', dataIndex: 'qcAcceptedQty', key: 'qcAcceptedQty', render: (q, r) => <Text>{q ?? 0} {r.uom}</Text> },
                    { title: 'Final Posted', key: 'final', render: (_, r) => <Text strong style={{ color: '#0f172a' }}>{postedQuantity(selectedReceipt, r)} {r.uom}</Text> },
                  ]}
                />
              </div>

              <AuditTrailTimeline receipt={selectedReceipt} activities={selectedReceipt.activities} adjustments={selectedReceipt.supervisorAdjustments} />
            </div>
          );
        })()}
      </Drawer>
    </div>
  );
};
