import { SHOW_GLOBAL_AUDIT_TRAIL } from './core/workspaceFeatures';
import { formatQuantities, getPostingQuantity, getPostedQuantityForItem } from './core/quantity';
import { getQCQueueState } from './core/qcQueue';
import { createQCFollowUps } from './core/qcFollowUp';
import { getReceiptIrNumber } from './core/workflow/goods-receipt';
import React, { useEffect, useState } from 'react';
import {
  Card,
  Typography,
  Button,
  Radio,
  Badge,
  Row,
  Col,
  Space,
  Segmented,
  Tag,
  Alert,
  Modal,
  message,
  Tabs,
  Tooltip,
  Dropdown,
} from 'antd';
import {
  AppstoreOutlined,
  InboxOutlined,
  SafetyCertificateOutlined,
  AuditOutlined,
  CalendarOutlined,
  HistoryOutlined,
  CloudSyncOutlined,
  CheckCircleOutlined,
  RocketOutlined,
  InfoCircleOutlined,
  FileDoneOutlined,
  DownOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { history } from '@umijs/max';

import BreadCrumbCom from '@/pages/prod/shared/BreadCrumbCom';
import { ProdPaths } from '@/pages/prod';

// Workspaces
import { ProcurementWorkspace } from './workspaces/ProcurementWorkspace';
import { WarehouseWorkspace } from './workspaces/WarehouseWorkspace';
import { QCWorkspace } from './workspaces/QCWorkspace';
import { SupervisorWorkspace } from './workspaces/SupervisorWorkspace';
import { AuditTrailWorkspace } from './workspaces/AuditTrailWorkspace';
import { UserFlowWorkspace } from './workspaces/UserFlowWorkspace';

// Shared Components
import { AuditTrailTimeline } from './features/shared/AuditTrailTimeline';
import { InboundStatusBadge } from './features/shared/InboundStatusBadge';

// Initial Sample Data Store
import {
  loadLocalInboundSnapshot,
  resetLocalInboundSnapshot,
  saveLocalInboundSnapshot,
} from './data/localInboundStore';

import type {
  GoodsReceipt,
  PurchaseOrder,
  IRPlan,
  SupervisorAdjustmentAudit,
} from './core/type';

const { Text, Title } = Typography;

export type InboundRole = 'PROCUREMENT' | 'WAREHOUSE' | 'QC' | 'SUPERVISOR' | 'AUDIT_TIMELINE' | 'USER_FLOW';

const ROLE_OPTIONS: { label: string; value: InboundRole; icon: React.ReactNode; desc: string }[] = [
  { label: 'Procurement', value: 'PROCUREMENT', icon: <AppstoreOutlined />, desc: 'Purchase orders & IR scheduling' },
  { label: 'Warehouse', value: 'WAREHOUSE', icon: <InboxOutlined />, desc: 'Receiving, staging & verification' },
  { label: 'QC Lab', value: 'QC', icon: <SafetyCertificateOutlined />, desc: 'Quality sampling & inspection' },
  { label: 'Supervisor', value: 'SUPERVISOR', icon: <CheckCircleOutlined />, desc: 'Variance review & SAP posting' },
  { label: 'Audit Trail', value: 'AUDIT_TIMELINE', icon: <AuditOutlined />, desc: 'Full transaction lifecycle' },
  { label: 'User Flow', value: 'USER_FLOW', icon: <RocketOutlined />, desc: 'Interactive system flow' },
];

export default function InboundListview({ routeView }: { routeView?: string }) {
  const [activeRole, setActiveRole] = useState<InboundRole>('PROCUREMENT');

  // Shared browser-local data store across all roles.
  const [localSnapshot] = useState(loadLocalInboundSnapshot);
  const [irPlans, setIrPlans] = useState<IRPlan[]>(localSnapshot.irPlans);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(localSnapshot.purchaseOrders);
  const [receipts, setReceipts] = useState<GoodsReceipt[]>(localSnapshot.receipts);

  useEffect(() => {
    saveLocalInboundSnapshot({ irPlans, purchaseOrders, receipts });
  }, [irPlans, purchaseOrders, receipts]);

  useEffect(() => {
    setIrPlans((currentPlans) => {
      let hasChanges = false;
      const nextPlans = currentPlans.map((plan) => {
        const linkedReceipt = receipts.find((receipt) => receipt.irPlanNumber === plan.irPlanNumber);
        if (!linkedReceipt) return plan;

        const nextStatus: IRPlan['status'] =
          linkedReceipt.deliveryPlanStatus === 'Posted' ||
          linkedReceipt.processState === 'SAP_POSTED' ||
          linkedReceipt.sapPostingStatus === 'Posted'
            ? 'Completed'
            : linkedReceipt.deliveryPlanStatus === 'To Receive'
              ? 'Pending'
              : 'In Progress';

        if (plan.status === nextStatus) return plan;
        hasChanges = true;
        return { ...plan, status: nextStatus };
      });

      return hasChanges ? nextPlans : currentPlans;
    });
  }, [receipts]);

  useEffect(() => {
    setPurchaseOrders((currentPOs) => {
      let hasChanges = false;
      const nextPOs = currentPOs.map((po) => {
        if (po.docStatus !== 'Closed') return po;

        const linkedReceipts = receipts.filter(
          (receipt) =>
            !receipt.parentIrNumber &&
            (
            receipt.poNumber === po.poNumber ||
            receipt.poReferences?.some((reference) => reference.poNumber === po.poNumber) ||
            receipt.items?.some((item) => item.poNumber === po.poNumber)
            ),
        );
        const isFullyReceived =
          linkedReceipts.length > 0 &&
          linkedReceipts.every(
            (receipt) =>
              receipt.deliveryPlanStatus === 'Posted' ||
              receipt.processState === 'SAP_POSTED' ||
              receipt.sapPostingStatus === 'Posted',
          );

        if (isFullyReceived) return po;
        hasChanges = true;
        return { ...po, docStatus: 'In Progress', status: 'In Progress' };
      });

      return hasChanges ? nextPOs : currentPOs;
    });
  }, [receipts]);

  // Selected sample transaction for deep dive
  const sampleGR = receipts.find((r) => r.grNumber === 'GR000124') || receipts[0];

  // Refresh handler
  const handleRefresh = () => {
    message.success('Local inbound demo data refreshed.');
  };
  const handleResetDemo = () => {
    const snapshot = resetLocalInboundSnapshot();
    setIrPlans(snapshot.irPlans);
    setPurchaseOrders(snapshot.purchaseOrders);
    setReceipts(snapshot.receipts);
    setActiveRole('PROCUREMENT');
    message.success('Inbound demo reset to the original 10 open POs.');
  };

  // Procurement: Create IR Plan
  const handleCreateIRPlan = (newPlan: IRPlan) => {
    const scheduledDates = Array.from(
      new Set(
        newPlan.items.flatMap((item) =>
          item.schedules
            .filter((schedule) => (Number(schedule.plannedQty) || 0) > 0)
            .map((schedule) => schedule.deliveryDate || newPlan.deliveryDate),
        ),
      ),
    );

    const plansByDate = (scheduledDates.length > 0 ? scheduledDates : [newPlan.deliveryDate]).map(
      (deliveryDate, dateIndex) => {
        const items = newPlan.items
          .map((item) => {
            const schedules = item.schedules.filter(
              (schedule) =>
                (Number(schedule.plannedQty) || 0) > 0 &&
                (schedule.deliveryDate || newPlan.deliveryDate) === deliveryDate,
            );
            const allocatedQty = schedules.reduce(
              (sum, schedule) => sum + (Number(schedule.plannedQty) || 0),
              0,
            );
            return {
              ...item,
              allocatedQty,
              remainingQty: Math.max(0, item.totalPoQty - allocatedQty),
              schedules,
            };
          })
          .filter((item) => item.allocatedQty > 0);

        return {
          ...newPlan,
          id: `${newPlan.id}-${dateIndex + 1}`,
          irPlanNumber: `IR${String(irPlans.length + dateIndex + 1).padStart(4, '0')}`,
          deliveryPlanNumber:
            scheduledDates.length > 1
              ? `${newPlan.deliveryPlanNumber}-${dateIndex + 1}`
              : newPlan.deliveryPlanNumber,
          deliveryDate,
          items,
          totalItems: items.length,
          totalPlannedQty: items.reduce((sum, item) => sum + item.allocatedQty, 0),
        };
      },
    );

    setIrPlans((prev) => [...plansByDate, ...prev]);

    // Update corresponding Purchase Orders and their items in state dynamically
    const allActiveIRPlans = [...plansByDate, ...irPlans];
    setPurchaseOrders((prev) =>
      prev.map((po) => {
        if (plansByDate.some((plan) => plan.poNumbers.includes(po.poNumber))) {
          const updatedItems = (po.items || []).map((item) => {
            const allScheduledForThisItem = allActiveIRPlans
              .filter((plan) => plan.poNumbers?.includes(po.poNumber))
              .flatMap((plan) => plan.items || [])
              .filter(
                (it) =>
                  (it.poNumber === po.poNumber || !it.poNumber) &&
                  (it.itemCode === item.code || it.itemCode === (item as any).itemCode)
              )
              .reduce(
                (sum, it) =>
                  sum +
                  (Number(it.allocatedQty) ||
                    (it.schedules
                      ? it.schedules.reduce((s, sc) => s + (Number(sc.plannedQty) || 0), 0)
                      : 0) ||
                    0),
                0
              );

            const newReceived = allScheduledForThisItem;
            const newRemaining = Math.max(0, (Number(item.poQty) || 0) - newReceived);
            return {
              ...item,
              receivedQty: newReceived,
              remainingQty: newRemaining,
            };
          });

          const totalPoQty = updatedItems.reduce((s, i) => s + (Number(i.poQty) || 0), 0);
          const totalReceived = updatedItems.reduce((s, i) => s + (Number(i.receivedQty) || 0), 0);
          const isFullyPlanned = totalPoQty > 0 && totalReceived >= totalPoQty;

          return {
            ...po,
            items: updatedItems,
            status: isFullyPlanned ? 'Fully Scheduled' : 'Partially Scheduled',
            docStatus: totalReceived > 0 ? 'In Progress' : po.docStatus,
          };
        }
        return po;
      })
    );

    // Create one expected warehouse receipt for each IR date.
    const newReceipts = plansByDate.map((plan, planIndex) => {
      const timestamp = Date.now() + planIndex;
      return {
        id: timestamp,
        grNumber: `GR${String(receipts.length + 125 + planIndex).padStart(6, '0')}`,
        receivingNumber: `RCV${String(receipts.length + 125 + planIndex).padStart(6, '0')}`,
        businessUnit: 'OFL',
        irPlanNumber: plan.irPlanNumber,
        deliveryPlanNumber: plan.deliveryPlanNumber,
        deliveryPlanStatus: 'To Receive' as const,
        poNumber: plan.poNumbers[0] || 'UNASSIGNED',
        poReferences: plan.poNumbers.map((po) => ({
          poNumber: po,
          businessUnit: 'OFL',
          supplier: plan.vendor,
          expectedDate: plan.deliveryDate,
        })),
        supplier: plan.vendor,
        supplierNames: [plan.vendor],
        receiptType: 'Planned' as const,
        receiptSourceType: 'PLANNED' as const,
        poLinkStatus: 'NOT_REQUIRED' as const,
        deliveryNoteNumber: plan.deliveryNoteNumber || `DN-${String(timestamp).slice(-6)}`,
        deliveryNoteRemark: plan.deliveryNoteRemark || plan.notes,
        actualArrivalDate: plan.deliveryNoteDate || plan.deliveryDate,
        receiverWarehouseName: 'WHM1 - Main Raw Materials',
        expectedDate: plan.deliveryDate,
        postingDate: plan.deliveryDate,
        actualReceiptDate: plan.deliveryDate,
        status: 'Draft',
        processState: 'STORED_ON_HOLD' as const,
        displayStatus: 'Expected Delivery / To Receive',
        legacyStatus: 'Draft' as const,
        createdBy: plan.createdBy,
        createdDate: plan.createdAt,
        specMatch: true,
        qtyMatch: true,
        qualityCheckRequired: true,
        documentChecklist: {
          vendorDN: true,
          goodsReceiptPOForm: false,
          pmrmStockCardForm: false,
          supportingDocs: (plan.attachments || []).map((att) => ({
            fileName: att.name,
            source: 'WAREHOUSE' as const,
          })),
        },
        scenario: {
          scenarioId: 'sc-new',
          scenarioName: 'New Scheduled Inbound',
          scenarioPath: 'NORMAL' as const,
          stepNumber: 1,
          totalSteps: 6,
          stepTitle: 'Scheduled by Procurement',
        },
        activities: [
          {
            id: `act-init-${timestamp}`,
            title: 'IR Schedule Created',
            description: `Scheduled ${formatQuantities(plan.items, i => i.schedules.reduce((sum, schedule) => sum + schedule.plannedQty, 0))} across ${plan.items.length} items for PO #${plan.poNumbers.join(', ')}.`,
            performedBy: plan.createdBy || 'Procurement (Demo)',
            timestamp: plan.createdAt,
            state: 'done' as const,
          },
        ],
        items: plan.items.flatMap((item, itemIndex) =>
          item.schedules.map((schedule) => ({
            id: timestamp + itemIndex,
            code: item.itemCode,
            name: item.itemName,
            poNumber: item.poNumber,
            supplier: plan.vendor,
            uom: item.uom,
            poQty: schedule.plannedQty,
            plannedQty: schedule.plannedQty,
            receiveQty: schedule.plannedQty,
            actualReceivedQty: schedule.plannedQty,
            deliveryDate: schedule.deliveryDate,
            batches: [
              {
                id: `b-init-${timestamp}-${itemIndex}`,
                batchNumber: `LOT-${item.itemCode.slice(-4)}-${String(timestamp).slice(-3)}`,
                batchQty: schedule.plannedQty,
                productionDate: dayjs().subtract(5, 'day').format('YYYY-MM-DD'),
                expiryDate: dayjs().add(2, 'year').format('YYYY-MM-DD'),
                bestBeforeDate: dayjs().add(2, 'year').format('YYYY-MM-DD'),
                remark: `Scheduled for ${schedule.deliveryDate || plan.deliveryDate}`,
              },
            ],
          })),
        ),
      } as GoodsReceipt;
    });

    setReceipts((prev) => [...newReceipts, ...prev]);
  };

  const updateIRPlanStatus = (irPlanNumber: string | undefined, status: IRPlan['status']) => {
    if (!irPlanNumber) return;
    setIrPlans((prev) =>
      prev.map((plan) => (plan.irPlanNumber === irPlanNumber ? { ...plan, status } : plan)),
    );
  };

  // Warehouse: Save / Submit to QC
  const handleWarehouseSubmitToQC = (updatedGR: GoodsReceipt) => {
    const enrichedGR: GoodsReceipt = {
      ...updatedGR,
      deliveryPlanStatus: 'Waiting for QC',
      processState: 'QC_PENDING',
      displayStatus: 'Under QC Inspection',
    };

    setReceipts((prev) => prev.map((r) => (r.grNumber === enrichedGR.grNumber ? enrichedGR : r)));
    updateIRPlanStatus(enrichedGR.irPlanNumber, 'In Progress');
  };

  // QC: Submit Review to Supervisor
  const handleQCSubmitReview = (updatedGR: GoodsReceipt) => {
    const enrichedGR: GoodsReceipt = {
      ...updatedGR,
      deliveryPlanStatus: 'Pending Supervisor',
      processState: 'PENDING_SUPERVISOR_REVIEW',
      displayStatus: `${getQCQueueState(updatedGR).label} — Pending Supervisor Review`,
    };

    setReceipts((prev) => prev.map((r) => (r.grNumber === enrichedGR.grNumber ? enrichedGR : r)));
    updateIRPlanStatus(enrichedGR.irPlanNumber, 'In Progress');

    Modal.success({
      title: 'Inspection Submitted to Supervisor',
      content: (
        <div>
          <p>
            Receipt <b>{getReceiptIrNumber(enrichedGR)}</b> has an inspection result of <b>{getQCQueueState(updatedGR).label}</b> and is ready for Supervisor review.
          </p>
          <p style={{ color: '#64748b', fontSize: 13 }}>
            Would you like to switch to the <b>Supervisor Workspace</b> to approve and post to SAP?
          </p>
        </div>
      ),
      okText: 'Switch to Supervisor Workspace',
      cancelText: 'Stay in QC',
      okButtonProps: { style: { background: '#7c3aed', borderColor: '#7c3aed' } },
      onOk: () => setActiveRole('SUPERVISOR'),
    });
  };

  // Supervisor: Approve & Post to SAP
  const handleSupervisorApproveAndPost = (updatedGR: GoodsReceipt) => {
    const sapDoc = `SAP-GRPO-${Date.now().toString().slice(-5)}`;
    const enrichedGR: GoodsReceipt = {
      ...updatedGR,
      deliveryPlanStatus: 'Posted',
      processState: 'SAP_POSTED',
      displayStatus: 'Completed / Posted to SAP',
      sapDocNum: sapDoc,
      sapPostingStatus: 'Posted',
      postingDate: dayjs().format('YYYY-MM-DD HH:mm'),
      items: updatedGR.items.map(item => ({ ...item, sapPostedQty: item.sapPostedQty ?? getPostingQuantity(item) })),
      activities: [
        ...(updatedGR.activities || []),
        {
          id: `act-sup-${Date.now()}`,
          title: updatedGR.sapPostingStatus === 'Posting Failed' || updatedGR.processState === 'SAP_POSTING_FAILED' ? 'SAP Posting Retried — Posted' : 'Approved & Posted to SAP',
          description: `Posted ${formatQuantities(updatedGR.items, item => item.sapPostedQty ?? getPostingQuantity(item))} to SAP GR #${sapDoc}.`,
          performedBy: 'Supervisor (Demo)',
          timestamp: dayjs().format('YYYY-MM-DD HH:mm'),
          state: 'done',
        },
      ],
    };

    setReceipts((prev) => [
      ...createQCFollowUps(enrichedGR, prev),
      ...prev.map((r) => (r.grNumber === enrichedGR.grNumber ? enrichedGR : r)),
    ]);
    updateIRPlanStatus(enrichedGR.irPlanNumber, 'Completed');

    // Synchronize Purchase Order state: Mark PO as Closed or update received quantity
    const linkedPoNumbers = Array.from(new Set([
      updatedGR.poNumber,
      ...(updatedGR.poReferences || []).map((p) => p.poNumber),
      ...(updatedGR.items || []).map((i) => i.poNumber).filter(Boolean),
    ].filter(Boolean)));

    setPurchaseOrders((prev) =>
      prev.map((po) => {
        if (linkedPoNumbers.includes(po.poNumber)) {
          const updatedItems = po.items.map((item) => {
            const addedQty = getPostedQuantityForItem(updatedGR.items, po.poNumber, item.code, updatedGR.poNumber);
            const newReceived = Math.min(item.poQty, (item.receivedQty || 0) + addedQty);
            return {
              ...item,
              receivedQty: newReceived,
              remainingQty: Math.max(0, item.poQty - newReceived),
            };
          });

          const isFullyReceived = updatedItems.every((it) => it.receivedQty >= it.poQty);

          return {
            ...po,
            items: updatedItems,
            docStatus: isFullyReceived ? 'Closed' : 'In Progress',
            status: isFullyReceived ? 'Closed' : 'In Progress',
          };
        }
        return po;
      })
    );

    Modal.success({
      title: 'GRPO Successfully Posted to SAP B1',
      content: (
        <div>
          <p>
            Receipt <b>{getReceiptIrNumber(enrichedGR)}</b> has been approved and posted to SAP as Document <b>{sapDoc}</b>.
          </p>
          <p style={{ color: '#64748b', fontSize: 13 }}>
            Linked Purchase Order(s) <b>{linkedPoNumbers.join(', ')}</b> have been updated with the posted quantities in Procurement.
          </p>
        </div>
      ),
      okText: 'Back to Supervisor',
      cancelText: 'Stay in Supervisor',
      okButtonProps: { style: { background: '#B49A00', borderColor: '#B49A00' } },
      onOk: () => setActiveRole('SUPERVISOR'),
    });
  };

  // Supervisor: Send Back
  const handleSupervisorSendBack = (
    updatedGR: GoodsReceipt,
    target: 'WAREHOUSE' | 'QC',
    reason: string,
  ) => {
    setReceipts((prev) => prev.map((r) => (r.grNumber === updatedGR.grNumber ? updatedGR : r)));
    updateIRPlanStatus(updatedGR.irPlanNumber, 'In Progress');
  };

  // Supervisor: Adjust GR
  const handleSupervisorAdjustGR = (
    updatedGR: GoodsReceipt,
    adjustment: SupervisorAdjustmentAudit,
  ) => {
    setReceipts((prev) => prev.map((r) => (r.grNumber === updatedGR.grNumber ? updatedGR : r)));
    updateIRPlanStatus(updatedGR.irPlanNumber, 'In Progress');
  };

  // Supervisor: Manual SAP Sync
  const handleSupervisorManualSync = (updatedGR: GoodsReceipt, sapDocNum: string) => {
    setReceipts((prev) => [
      ...createQCFollowUps(updatedGR, prev),
      ...prev.map((r) => (r.grNumber === updatedGR.grNumber ? updatedGR : r)),
    ]);
    updateIRPlanStatus(updatedGR.irPlanNumber, 'Completed');

    // Synchronize only the PO items included in this receipt.
    const linkedPoNumbers = Array.from(new Set([
      updatedGR.poNumber,
      ...(updatedGR.poReferences || []).map((p) => p.poNumber),
      ...(updatedGR.items || []).map((i) => i.poNumber).filter(Boolean),
    ].filter(Boolean)));

    setPurchaseOrders((prev) =>
      prev.map((po) => {
        if (linkedPoNumbers.includes(po.poNumber)) {
          const updatedItems = po.items.map((item) => {
            const addedQty = getPostedQuantityForItem(updatedGR.items, po.poNumber, item.code, updatedGR.poNumber);

            return {
              ...item,
              receivedQty: Math.min(item.poQty, (item.receivedQty ?? 0) + addedQty),
              remainingQty: Math.max(0, item.poQty - (item.receivedQty ?? 0) - addedQty),
            };
          });

          const isFullyReceived = updatedItems.every((item) => item.receivedQty >= item.poQty);

          return {
            ...po,
            items: updatedItems,
            docStatus: isFullyReceived ? 'Closed' : 'In Progress',
            status: isFullyReceived ? 'Closed' : 'In Progress',
          };
        }
        return po;
      })
    );
  };

  // Live stage counts
  const stageStats = {
    procurement: purchaseOrders.filter((p) => p.docStatus === 'Open' || (p as any).status === 'Open' || (p as any).status === 'Pending').length,
    warehouse: receipts.filter((r) => r.deliveryPlanStatus === 'To Receive' || !r.deliveryPlanStatus || r.deliveryPlanStatus === 'In Progress').length,
    qc: receipts.filter((r) => r.deliveryPlanStatus === 'Waiting for QC' || r.processState === 'QC_PENDING').length,
    supervisor: receipts.filter((r) => r.deliveryPlanStatus === 'QC Completed' || r.processState === 'PENDING_SUPERVISOR_REVIEW').length,
    audit: receipts.length,
  };

  return (
    <div style={{ padding: '0 8px 24px', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Top Header with Breadcrumb, Role Selector and Live Device Sync */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 4px 14px',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <BreadCrumbCom
          separator="/"
          routes={[
            { label: 'Home', path: ProdPaths.prod },
            { label: 'Inbound Logistics Hub', path: '' },
          ]}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Dropdown
            menu={{
              selectedKeys: [activeRole],
              items: ROLE_OPTIONS.filter(opt => SHOW_GLOBAL_AUDIT_TRAIL || opt.value !== 'AUDIT_TIMELINE').map((opt) => ({
                key: opt.value,
                label: (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      minWidth: 220,
                      padding: '4px 2px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          fontSize: 15,
                          color: activeRole === opt.value ? '#2563eb' : '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {opt.icon}
                      </span>
                      <div>
                        <div
                          style={{
                            fontWeight: activeRole === opt.value ? 600 : 500,
                            color: activeRole === opt.value ? '#2563eb' : '#1e293b',
                            fontSize: 13,
                          }}
                        >
                          {opt.label}
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{opt.desc}</div>
                      </div>
                    </div>
                    {activeRole === opt.value && (
                      <CheckCircleOutlined style={{ color: '#2563eb', fontSize: 13, marginLeft: 12 }} />
                    )}
                  </div>
                ),
              })),
              onClick: ({ key }) => setActiveRole(key as InboundRole),
            }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                height: 36,
                padding: '0 12px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              }}
            >
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Role:</span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#0f172a',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {ROLE_OPTIONS.find((r) => r.value === activeRole)?.icon}
                {ROLE_OPTIONS.find((r) => r.value === activeRole)?.label}
              </span>
              <DownOutlined style={{ fontSize: 10, color: '#94a3b8', marginLeft: 2 }} />
            </Button>
          </Dropdown>
        </div>
      </div>

      {/* Main Workspace Body Based on Active Role */}
      {activeRole === 'PROCUREMENT' && (
        <ProcurementWorkspace
          purchaseOrders={purchaseOrders}
          irPlans={irPlans}
          receipts={receipts}
          onCreateIRPlan={handleCreateIRPlan}
          onRefresh={handleRefresh}
            onResetDemo={handleResetDemo}
          onNavigateToRole={(role) => { if (SHOW_GLOBAL_AUDIT_TRAIL || role !== 'AUDIT_TIMELINE') setActiveRole(role); }}
        />
      )}

      {activeRole === 'WAREHOUSE' && (
        <WarehouseWorkspace
          receipts={receipts}
          irPlans={irPlans}
          onSaveGR={(gr) => {
            setReceipts((prev) => {
              const exists = prev.some((r) => r.grNumber === gr.grNumber || r.id === gr.id);
              if (exists) {
                return prev.map((r) => (r.grNumber === gr.grNumber || r.id === gr.id ? gr : r));
              }
              return [gr, ...prev];
            });
          }}
          onSubmitToQC={handleWarehouseSubmitToQC}
          onRefresh={handleRefresh}
          onNavigateToRole={(role) => { if (SHOW_GLOBAL_AUDIT_TRAIL || role !== 'AUDIT_TIMELINE') setActiveRole(role); }}
        />
      )}

      {activeRole === 'QC' && (
        <QCWorkspace
          receipts={receipts}
          onSubmitQCReview={handleQCSubmitReview}
          onRefresh={handleRefresh}
          onNavigateToRole={(role) => { if (SHOW_GLOBAL_AUDIT_TRAIL || role !== 'AUDIT_TIMELINE') setActiveRole(role); }}
        />
      )}

      {activeRole === 'SUPERVISOR' && (
        <SupervisorWorkspace
          receipts={receipts}
          onApproveAndPostSAP={handleSupervisorApproveAndPost}
          onSendBack={handleSupervisorSendBack}
          onAdjustGR={handleSupervisorAdjustGR}
          onRetrySAPPosting={handleSupervisorApproveAndPost}
          onManualSAPSync={handleSupervisorManualSync}
          onRefresh={handleRefresh}
          onNavigateToRole={(role) => { if (SHOW_GLOBAL_AUDIT_TRAIL || role !== 'AUDIT_TIMELINE') setActiveRole(role); }}
        />
      )}

      {SHOW_GLOBAL_AUDIT_TRAIL && activeRole === 'AUDIT_TIMELINE' && (
        <AuditTrailWorkspace
          receipts={receipts}
          irPlans={irPlans}
          onRefresh={handleRefresh}
        />
      )}

      {activeRole === 'USER_FLOW' && (
        <UserFlowWorkspace
          onNavigateToRole={(role) => { if (SHOW_GLOBAL_AUDIT_TRAIL || role !== 'AUDIT_TIMELINE') setActiveRole(role); }}
        />
      )}
    </div>
  );
}
