import React, { useEffect, useState } from 'react';
import { Button, Descriptions, Divider, Spin, Tag, Space, Typography, Modal, Timeline, Input } from 'antd';
import { ProCard, ProTable } from '@ant-design/pro-components';
import { DrawerForm } from '@ant-design/pro-form';
import type { ProColumns } from '@ant-design/pro-table';
import { ExportOutlined, HistoryOutlined, UserOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import { getPurchaseOrderReceiptState, type PurchaseOrder, type POItem, type GoodsReceipt } from '../../../core/workflow';

import type { InboundWarehouseMasterApi } from '../../../core/type';
import { upcomingInboundService } from '../../../api/service';

// ─── Constants ───────────────────────────────────────────────────────────────

const { Text } = Typography;

const PR_PROCESS_PATH_PREFIX = '/external/data-form/requisition_request_process/';
// ─── Types ────────────────────────────────────────────────────────────────────

interface PODetailSidebarProps {
  open: boolean;
  onClose: () => void;
  po: PurchaseOrder | null;
  canCreateInboundReceiving?: boolean;
  onCreateGR: (po: PurchaseOrder) => void;
  onOpenReceiptInNewTab: (receiptId: number) => void;
  warehouseOptions?: InboundWarehouseMasterApi[];
  goodsReceipts?: GoodsReceipt[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getReceiptLogStatusColor(statusLabel: string) {
  if (statusLabel.includes('Rejected')) return 'error';
  if (statusLabel.includes('Pending')) return 'warning';
  if (statusLabel.includes('Approved')) return 'success';
  if (statusLabel.includes('Draft')) return 'default';
  return 'processing';
}

function getReceiptItemLabel(name: string, code: string) {
  return name?.trim() || code?.trim() || 'Item';
}

function isAgingPOItem(item: POItem, poExpectedDate?: string) {
  if (typeof item.isAging === 'boolean') return item.isAging;
  const expectedDate = item.expectedDate || poExpectedDate;
  if (!expectedDate || item.remainingQty <= 0) return false;
  return dayjs(expectedDate).isValid() && dayjs(expectedDate).isBefore(dayjs(), 'day');
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// ─── Main Component ───────────────────────────────────────────────────────────

export function PODetailSidebar({
  open,
  onClose,
  po,
  canCreateInboundReceiving = true,
  onCreateGR,
  onOpenReceiptInNewTab,
  goodsReceipts = [],
}: PODetailSidebarProps) {
  const [drawerOpen, setDrawerOpen] = useState(open);
  const [renderedPO, setRenderedPO] = useState<PurchaseOrder | null>(po);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditSearchQuery, setAuditSearchQuery] = useState('');

  useEffect(() => {
    if (po) {
      setRenderedPO(po);
    }
    setDrawerOpen(open);
  }, [open, po]);

  const currentPO = po || renderedPO;



  const [fetchedActivities, setFetchedActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const services = upcomingInboundService;

  useEffect(() => {
    if (isAuditModalOpen && currentPO?.poNumber) {
      setActivitiesLoading(true);
      services.getPoActivities(currentPO.poNumber)
        .then((data) => {
          setFetchedActivities(data || []);
        })
        .catch((err) => {
          console.error('Failed to fetch PO activities:', err);
        })
        .finally(() => {
          setActivitiesLoading(false);
        });
    }
  }, [isAuditModalOpen, currentPO?.poNumber, services]);

  if (!currentPO) return null;

  // ─── Derived Data ───────────────────────────────────────────────────────────

  const receiptLogs = currentPO?.receiptLogs || [];
  const linkedReceiptLogs = receiptLogs.filter((log, index, logs) =>
    typeof log.receiptId === 'number' &&
    logs.findIndex((candidate) => candidate.receiptId === log.receiptId) === index,
  );

  const deliveryNotes = currentPO.deliveryNoteNumber
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean) || [];

  const prLinks = currentPO.prLinks || [];
  const receiverWarehouse = currentPO.receiverWarehouse?.trim();

  const receiptState = getPurchaseOrderReceiptState(currentPO, goodsReceipts);

  const shouldShowCreateInboundReceiving =
    canCreateInboundReceiving && receiptState.canCreateInboundReceiving;
  const poStatusTagColor =
    receiptState.displayStatus === 'Fully Received'
      ? 'success'
      : receiptState.displayStatus === 'In Progress'
        ? 'warning'
        : receiptState.displayStatus === 'Closed'
          ? 'default'
          : 'processing';

  // ─── Table Columns ──────────────────────────────────────────────────────────

  const itemColumns: ProColumns<POItem>[] = [
    {
      title: 'No',
      render: (_: any, _r: POItem, index: number) => index + 1,
      width: 50,
    },
    {
      title: 'Item Code',
      dataIndex: 'code',
    },
    {
      title: 'Item Name',
      dataIndex: 'name',
      render: (_: any, r: POItem) => (
        <Space size={6} wrap>
          <span>{r.name}</span>
          {isAgingPOItem(r, currentPO.expectedDate) && (
            <Tag color="error" bordered={false}>
              Aging
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Expected',
      dataIndex: 'expectedDate',
      width: 112,
      render: (_: any, r: POItem) => {
        const expectedDate = r.expectedDate || currentPO.expectedDate || '-';
        return (
          <Space size={4} direction="vertical">
            <span>{expectedDate}</span>
          </Space>
        );
      },
    },
    { title: 'PO Qty', dataIndex: 'poQty', valueType: 'digit' },
    { title: 'Received', dataIndex: 'receivedQty', valueType: 'digit' },
    {
      title: 'Remaining',
      dataIndex: 'remainingQty',
      valueType: 'digit',
      render: (_: any, r: POItem) => (
        <span style={{ color: r.remainingQty > 0 ? '#1890ff' : '#52c41a', fontWeight: 600 }}>
          {r.remainingQty.toLocaleString()}
        </span>
      ),
    },
    { title: 'UoM', dataIndex: 'uom', width: 60 },
    { title: 'Supplier', dataIndex: 'supplier' },
  ];

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <DrawerForm
      title="Purchase Order Detail"
      open={drawerOpen}
      onOpenChange={(visible: boolean) => setDrawerOpen(visible)}
      submitter={false}
      width={880}
      drawerProps={{
        destroyOnClose: false,
        extra: (
          <Space>
            <Button icon={<HistoryOutlined />} onClick={() => setIsAuditModalOpen(true)}>
              View System Log
            </Button>
            {shouldShowCreateInboundReceiving ? (
              <Button type="primary" onClick={() => onCreateGR(currentPO)}>
                Create Inbound Receiving
              </Button>
            ) : (
              <Tag color={poStatusTagColor} style={{ fontSize: '13px', padding: '4px 10px', fontWeight: 600 }}>
                {receiptState.displayStatus}
              </Tag>
            )}
          </Space>
        ),
        afterOpenChange: (visible) => {
          if (!visible) {
            onClose();
            setRenderedPO(null);
          }
        },
        bodyStyle: {
          paddingInline: 16,
          paddingTop: 16,
          paddingBottom: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', minHeight: 0 }}>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: 16 }}>
          <Spin spinning={false}>
            <ProCard bodyStyle={{ paddingInline: 8, paddingTop: 8, paddingBottom: 8 }}>

              {/* ── PO Summary ── */}
              <Descriptions column={2} size="small">
                <Descriptions.Item label="PO Number" style={{ fontWeight: 'bolder' }}>
                  {currentPO.poNumber}
                </Descriptions.Item>
                <Descriptions.Item label="Supplier" style={{ fontWeight: 'bolder' }}>
                  {currentPO.supplier}
                </Descriptions.Item>

                <Descriptions.Item label="Type">
                  <Tag color={currentPO.type === 'Planned' ? 'green' : 'orange'}>
                    {currentPO.type}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="SAP PO Status">
                  <Tag
                    color={
                      currentPO.docStatus?.toUpperCase() === 'C' ||
                      currentPO.docStatus?.toLowerCase() === 'closed'
                        ? 'success'
                        : 'processing'
                    }
                  >
                    {currentPO.docStatus?.toUpperCase() === 'C' ||
                    currentPO.docStatus?.toLowerCase() === 'closed'
                      ? 'Complete'
                      : currentPO.docStatus?.toUpperCase() === 'O' ||
                        currentPO.docStatus?.toLowerCase() === 'open'
                      ? 'Open'
                      : currentPO.docStatus || 'Open'}
                  </Tag>
                </Descriptions.Item>

                <Descriptions.Item label="Receiver Warehouse">
                  {receiverWarehouse ? (
                    <Tag bordered={false} color="processing">
                      {receiverWarehouse}
                    </Tag>
                  ) : (
                    <Text type="secondary">-</Text>
                  )}
                </Descriptions.Item>

                <Descriptions.Item label="Expected Date">
                  {currentPO.expectedDate || 'Unplanned'}
                </Descriptions.Item>
                <Descriptions.Item label="Expected Time">
                  {currentPO.expectedTime || '—'}
                </Descriptions.Item>

                <Descriptions.Item label="Linked PR" span={2}>
                  {prLinks.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {prLinks.map((link) => {
                        const prHref = link.prUuid
                          ? `${PR_PROCESS_PATH_PREFIX}${link.prUuid}`
                          : undefined;
                        return prHref ? (
                          <Button
                            key={link.prNumber}
                            type="link"
                            icon={<ExportOutlined />}
                            href={prHref}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              paddingInline: 0,
                              height: 'auto',
                              lineHeight: '1.2',
                              justifyContent: 'flex-start',
                              width: 'fit-content',
                            }}
                          >
                            {link.prNumber}
                          </Button>
                        ) : (
                          <Text key={link.prNumber} type="secondary">
                            {link.prNumber}
                          </Text>
                        );
                      })}
                    </div>
                  ) : (
                    <Text type="secondary">No linked PR from SAP</Text>
                  )}
                </Descriptions.Item>

                <Descriptions.Item label="Delivery Note" span={2}>
                  {deliveryNotes.length > 0 ? (
                    <Space size={[8, 8]} wrap>
                      {deliveryNotes.map((deliveryNote) => (
                        <Tag key={deliveryNote} color="processing" bordered={false}>
                          {deliveryNote}
                        </Tag>
                      ))}
                    </Space>
                  ) : (
                    <Text type="secondary">-</Text>
                  )}
                </Descriptions.Item>

                <Descriptions.Item label="Total Items">
                  {currentPO.totalItems}
                </Descriptions.Item>
                <Descriptions.Item label="Total Qty">
                  {currentPO.totalQty.toLocaleString()}
                </Descriptions.Item>

                <Descriptions.Item label="Link IR" span={2}>
                  {linkedReceiptLogs.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {linkedReceiptLogs.map((log) => (
                        <Button
                          key={`linked-ir-${log.receiptId}`}
                          type="link"
                          icon={<ExportOutlined />}
                          style={{
                            paddingInline: 0,
                            height: 'auto',
                            lineHeight: '1.2',
                            justifyContent: 'flex-start',
                            width: 'fit-content',
                          }}
                          onClick={() => {
                            if (typeof log.receiptId === 'number') {
                              onOpenReceiptInNewTab(log.receiptId);
                            }
                          }}
                        >
                          {log.receivingNumber}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <Text type="secondary">-</Text>
                  )}
                </Descriptions.Item>
              </Descriptions>

              <Divider />

              {/* ── PO Items Table ── */}
              <ProTable<POItem>
                headerTitle="PO Items"
                size="small"
                search={false}
                rowKey={(item) => `${item.lineNumber ?? item.code}-${item.code}`}
                dataSource={currentPO.items}
                options={{ density: false, fullScreen: false, reload: false, setting: false }}
                pagination={false}
                columns={itemColumns}
              />

              <Divider />

              {/* ── Inbound Updates ── */}
              <div style={{ marginBottom: 12 }}>
                <Text strong>Inbound Updates</Text>
              </div>

              {receiptLogs.length > 0 ? (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  {receiptLogs.map((log) => (
                    <ProCard
                      key={log.receivingNumber}
                      bordered
                      bodyStyle={{ padding: 12 }}
                      style={{ background: '#fafafa' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <Space wrap size={[8, 8]}>
                          <Text strong>{log.receivingNumber}</Text>
                          <Tag color={getReceiptLogStatusColor(log.statusLabel)}>
                            {log.statusLabel}
                          </Tag>
                        </Space>
                        <Text type="secondary">
                          {log.receivedBy ? `Received by ${log.receivedBy}` : 'Warehouse received'}
                          {log.receivedAt ? ` • ${log.receivedAt}` : ''}
                        </Text>
                      </div>

                      <div style={{ marginTop: 8 }}>
                        <Text>Total received: {log.totalReceivedQty.toLocaleString()} qty</Text>
                      </div>

                      <div style={{ marginTop: 10 }}>
                        <Text strong>Received items</Text>
                        <div style={{ marginTop: 6 }}>
                          <Space size={[6, 6]} wrap>
                            {log.receivedItems.map((item) => (
                              <Tag
                                key={`received-${log.receivingNumber}-${item.code}-${item.qty}`}
                                color="processing"
                              >
                                {getReceiptItemLabel(item.name, item.code)} x{item.qty}
                              </Tag>
                            ))}
                          </Space>
                        </div>
                      </div>

                      {log.approvedItems.length > 0 && (
                        <div style={{ marginTop: 10 }}>
                          <Text strong>Approved to supervisor</Text>
                          <div style={{ marginTop: 6 }}>
                            <Space size={[6, 6]} wrap>
                              {log.approvedItems.map((item) => (
                                <Tag
                                  key={`approved-${log.receivingNumber}-${item.code}-${item.qty}`}
                                  color="success"
                                >
                                  {getReceiptItemLabel(item.name, item.code)} x{item.qty}
                                </Tag>
                              ))}
                            </Space>
                          </div>
                        </div>
                      )}

                      {log.rejectedItems.length > 0 && (
                        <div style={{ marginTop: 10 }}>
                          <Text strong>Returned / rejected</Text>
                          <div style={{ marginTop: 6 }}>
                            <Space size={[6, 6]} wrap>
                              {log.rejectedItems.map((item) => (
                                <Tag
                                  key={`rejected-${log.receivingNumber}-${item.code}-${item.qty}`}
                                  color="error"
                                >
                                  {getReceiptItemLabel(item.name, item.code)} x{item.qty}
                                </Tag>
                              ))}
                            </Space>
                          </div>
                        </div>
                      )}
                    </ProCard>
                  ))}
                </Space>
              ) : (
                <Text type="secondary">No inbound activity has been recorded for this PO yet.</Text>
              )}

            </ProCard>
          </Spin>
        </div>
      </div>
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <HistoryOutlined style={{ color: '#1890ff' }} />
            <span style={{ fontWeight: 600, fontSize: 16 }}>Purchase Order System Log Trail</span>
            <Tag color="blue">{currentPO.poNumber}</Tag>
          </div>
        }
        open={isAuditModalOpen}
        onCancel={() => {
          setIsAuditModalOpen(false);
          setAuditSearchQuery('');
        }}
        footer={null}
        width={720}
        bodyStyle={{ padding: '16px 24px', maxHeight: '70vh', overflowY: 'auto' }}
      >
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search audit actions, users, receiving numbers or remarks..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            value={auditSearchQuery}
            onChange={(e) => setAuditSearchQuery(e.target.value)}
            allowClear
          />
        </div>

        {(() => {
          if (activitiesLoading) {
            return (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 0' }}>
                <Spin tip="Loading system logs..." />
              </div>
            );
          }

          const filteredActivities = (fetchedActivities || []).filter((act) => {
            const query = auditSearchQuery.toLowerCase();
            return (
              act.title?.toLowerCase().includes(query) ||
              act.description?.toLowerCase().includes(query) ||
              act.performedBy?.toLowerCase().includes(query) ||
              act.timestamp?.toLowerCase().includes(query) ||
              act.grNumber?.toLowerCase().includes(query)
            );
          });

          if (filteredActivities.length === 0) {
            return (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#8c8c8c' }}>
                {fetchedActivities.length === 0
                  ? 'No system activities have been logged yet for Goods Receipts under this Purchase Order.'
                  : 'No activities matched your search.'}
              </div>
            );
          }

          return (
            <Timeline style={{ marginTop: 16 }}>
              {filteredActivities.map((act, index) => {
                const isRejected = act.title?.toLowerCase().includes('reject') || act.title?.toLowerCase().includes('exception');
                const isApproved = act.title?.toLowerCase().includes('approve') || act.title?.toLowerCase().includes('post') || act.title?.toLowerCase().includes('sync');
                const isDraft = act.title?.toLowerCase().includes('draft') || act.title?.toLowerCase().includes('create');

                let dotColor = '#1890ff';
                if (isRejected) dotColor = '#ff4d4f';
                else if (isApproved) dotColor = '#52c41a';
                else if (isDraft) dotColor = '#bfbfbf';

                return (
                  <Timeline.Item
                    key={index}
                    color={dotColor}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, color: isRejected ? '#cf1322' : '#262626' }}>
                          {act.title}
                        </span>
                        <Space size={8}>
                          <Tag color="cyan" style={{ margin: 0 }}>
                            {act.grNumber}
                          </Tag>
                          <Tag
                            color={act.performedBy ? 'blue' : 'default'}
                            icon={<UserOutlined />}
                            style={{ margin: 0 }}
                          >
                            {act.performedBy || 'System'}
                          </Tag>
                        </Space>
                      </div>

                      <div style={{ fontSize: 11, color: '#8c8c8c' }}>
                        {act.timestamp}
                      </div>

                      {act.description && act.description !== act.title && (
                        <div style={{
                          marginTop: 6,
                          padding: '8px 12px',
                          background: '#fafafa',
                          borderLeft: '3px solid #d9d9d9',
                          borderRadius: '0 4px 4px 0',
                          fontSize: 12,
                          color: '#595959',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word'
                        }}>
                          {act.description}
                        </div>
                      )}
                    </div>
                  </Timeline.Item>
                );
              })}
            </Timeline>
          );
        })()}
      </Modal>
    </DrawerForm>
  );
}
