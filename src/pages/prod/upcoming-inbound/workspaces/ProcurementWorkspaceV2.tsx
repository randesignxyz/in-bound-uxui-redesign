import { RowActionButton, rowActionColumn } from '../shared/ui/RowActionButton';
import { RelatedActivity } from '../features/shared/RelatedActivity';
import { WorkspaceTaskHeader, WorkspaceHeader, WorkspaceEmpty, workspacePagination } from '../shared/ui/WorkspaceUI';
import { exportWorkspace, type ExportFormat } from '../shared/ui/workspaceExport';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Input,
  Select,
  Modal,
  Drawer,
  Form,
  DatePicker,
  InputNumber,
  Row,
  Col,
  Alert,
  Divider,
  message,
  Tooltip,
  Progress,
  Upload,
} from 'antd';
import type { InputRef } from 'antd';
import {
  PlusOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  SearchOutlined,
  EyeOutlined,
  FileTextOutlined,
  SendOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  WarningOutlined,
  InboxOutlined,
  RightOutlined,
  LeftOutlined,
  DownOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  ScheduleOutlined,
  SyncOutlined,
  ShopOutlined,
  CloseCircleOutlined,
  FileDoneOutlined,
  CarOutlined,
  PaperClipOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type {
  PurchaseOrder,
  IRPlan,
  IRPlanItem,
  IESPlanningStatus,
  GoodsReceipt,
} from '../core/type';
import { InboundStatusBadge } from '../features/shared/InboundStatusBadge';
import './ProcurementWorkspace.less';

const { Text, Title } = Typography;

export interface ProcurementWorkspaceV2Props {
  purchaseOrders: PurchaseOrder[];
  irPlans: IRPlan[];
  receipts?: GoodsReceipt[];
  onCreateIRPlan: (newPlan: IRPlan) => void;
  onRefresh: () => void;
  onResetDemo?: () => void;
  versionSwitcher?: React.ReactNode;
}

interface ScheduleDraftItem {
  poNumber: string;
  itemCode: string;
  itemName: string;
  uom: string;
  totalPoQty: number;
  remainingQty: number;
  schedules: {
    deliveryPlanNumber: string;
    deliveryDate: string;
    plannedQty: number;
    warehouseCode: string;
    notes?: string;
  }[];
}

type TabKeyV2 = 'OPEN' | 'IN_PROGRESS' | 'IR_PLANS' | 'QC_REJECTED' | 'CLOSED';

export const ProcurementWorkspaceV2: React.FC<ProcurementWorkspaceV2Props> = ({
  purchaseOrders,
  irPlans,
  receipts = [],
  onCreateIRPlan,
  onRefresh,
  onResetDemo,
  versionSwitcher,
}) => {
  const [workspaceView, setWorkspaceView] = useState<'list' | 'create-ir-plan'>('list');
  // QC follow-ups are displayed as IRs, but never included in PO scheduling totals.
  const followUpIRPlans = useMemo<IRPlan[]>(() => receipts.filter(receipt => receipt.parentIrNumber).map(receipt => ({
    id: receipt.grNumber,
    irPlanNumber: receipt.irPlanNumber || receipt.grNumber,
    parentIrNumber: receipt.parentIrNumber,
    qcFollowUpType: receipt.qcFollowUpType,
    deliveryPlanNumber: 'QC Follow-Up',
    vendor: receipt.supplier,
    poNumbers: Array.from(new Set(receipt.items.map(item => item.poNumber || receipt.poNumber))),
    deliveryDate: receipt.createdDate?.split('T')[0] || receipt.expectedDate || '',
    status: receipt.processState === 'SAP_POSTED' ? 'Completed' : receipt.qcFollowUpType === 'REJECTED' ? 'Rejected' : 'In Progress',
    items: receipt.items.map((item, index) => ({
      id: `${receipt.grNumber}-${index}`,
      poNumber: item.poNumber || receipt.poNumber,
      itemCode: item.code,
      itemName: item.name,
      uom: item.uom,
      totalPoQty: item.poQty,
      allocatedQty: item.receiveQty,
      remainingQty: 0,
      schedules: [{ id: `${receipt.grNumber}-${index}`, deliveryPlanNumber: 'QC Follow-Up', deliveryDate: receipt.createdDate?.split('T')[0] || '', plannedQty: item.receiveQty }],
    })),
    totalPlannedQty: receipt.items.reduce((sum, item) => sum + item.receiveQty, 0),
    totalItems: receipt.items.length,
    createdBy: receipt.createdBy,
    createdAt: receipt.createdDate,
  })), [receipts]);
  const visibleIRPlans = useMemo(() => [...followUpIRPlans, ...irPlans], [followUpIRPlans, irPlans]);
  const [isCreatingMoreIR, setIsCreatingMoreIR] = useState(false);
  const [activeCreatingPO, setActiveCreatingPO] = useState<PurchaseOrder | null>(null);
  const [activeTab, setActiveTab] = useState<TabKeyV2>('OPEN');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [planningFilter, setPlanningFilter] = useState<string>('ALL');
  const [vendorFilter, setVendorFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  // Modals / Drawer state
  const [selectedPlanDetail, setSelectedPlanDetail] = useState<IRPlan | null>(null);
  const [selectedPODetail, setSelectedPODetail] = useState<PurchaseOrder | null>(null);

  // Form for schedule configuration
  const [form] = Form.useForm();
  const [scheduleDraftItems, setScheduleDraftItems] = useState<ScheduleDraftItem[]>([]);
  const searchInputRef = useRef<InputRef>(null);

  // Delivery Note & Vendor Attachments state for Create IR Plan
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState<string>('');
  const [deliveryNoteDate, setDeliveryNoteDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [deliveryNoteRemark, setDeliveryNoteRemark] = useState<string>('');
  const [vendorAttachments, setVendorAttachments] = useState<
    Array<{
      uid: string;
      name: string;
      size?: number;
      type?: string;
      status?: string;
      url?: string;
    }>
  >([]);

  // Keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute planning status for each PO dynamically
  const getPOPlanningStatus = (po: PurchaseOrder): IESPlanningStatus => {
    if (po.docStatus === 'Closed') return 'FULLY_PLANNED';
    const totalPoQty = po.totalQty || po.items?.reduce((s, i) => s + (i.poQty || 0), 0) || 0;

    const plannedInIr = irPlans.filter((p) => p.poNumbers?.includes(po.poNumber));
    const totalScheduled = plannedInIr.reduce((sum, p) => {
      const poItems = p.items?.filter((it) => it.poNumber === po.poNumber);
      if (poItems && poItems.length > 0) {
        return sum + poItems.reduce((s, it) => s + (Number(it.allocatedQty) || (it.schedules ? it.schedules.reduce((scSum, sc) => scSum + (Number(sc.plannedQty) || 0), 0) : 0) || 0), 0);
      }
      return sum + (p.totalPlannedQty || 0);
    }, 0);

    const totalReceived = Math.max(po.items?.reduce((s, i) => s + (i.receivedQty || 0), 0) || 0, totalScheduled);

    if (totalPoQty > 0 && totalReceived >= totalPoQty) return 'FULLY_PLANNED';
    if (totalReceived > 0 || po.docStatus === 'In Progress') return 'PARTIALLY_PLANNED';
    return 'NOT_PLANNED';
  };

  // Vendor list for filter dropdown
  const vendorOptions = useMemo(() => {
    const vendors = Array.from(new Set(purchaseOrders.map((p) => p.supplier).filter(Boolean)));
    return [
      { label: 'All Vendors', value: 'ALL' },
      ...vendors.map((v) => ({ label: v, value: v })),
    ];
  }, [purchaseOrders]);

  // Tab counts based on 5-tab lifecycle workflow
  const tabCounts = useMemo(() => {
    const openPOs = purchaseOrders.filter((po) => {
      if (po.docStatus === 'In Progress' || po.docStatus === 'Rejected' || po.docStatus === 'Closed') return false;
      const planStatus = getPOPlanningStatus(po);
      return planStatus === 'NOT_PLANNED';
    });

    const inProgressPOs = purchaseOrders.filter((po) => {
      if (po.docStatus === 'Closed' || po.docStatus === 'Rejected') return false;
      const planStatus = getPOPlanningStatus(po);
      return (
        po.docStatus === 'In Progress' ||
        planStatus === 'FULLY_PLANNED' ||
        planStatus === 'PARTIALLY_PLANNED' ||
        po.items?.some((it) => (it.receivedQty || 0) > 0 && (it.receivedQty || 0) < it.poQty)
      );
    });

    const qcRejectedPOs = purchaseOrders.filter((po) => {
      return po.docStatus === 'Rejected' || (po as any).qcStatus === 'Reject';
    });

    const closedPOs = purchaseOrders.filter((po) => po.docStatus === 'Closed');

    return {
      open: openPOs.length,
      inProgress: inProgressPOs.length,
      irPlans: visibleIRPlans.length,
      qcRejected: qcRejectedPOs.length,
      closed: closedPOs.length,
    };
  }, [purchaseOrders, irPlans, visibleIRPlans]);

  // Filtered POs based on the 5 tabs
  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const planStatus = getPOPlanningStatus(po);

      // Tab filtering
      if (activeTab === 'OPEN') {
        if (po.docStatus === 'In Progress' || po.docStatus === 'Rejected' || po.docStatus === 'Closed') return false;
        if (planStatus !== 'NOT_PLANNED') return false;
      } else if (activeTab === 'IN_PROGRESS') {
        if (po.docStatus === 'Closed' || po.docStatus === 'Rejected') return false;
        const isInProg =
          po.docStatus === 'In Progress' ||
          planStatus === 'FULLY_PLANNED' ||
          planStatus === 'PARTIALLY_PLANNED' ||
          po.items?.some((it) => (it.receivedQty || 0) > 0 && (it.receivedQty || 0) < it.poQty);
        if (!isInProg) return false;
      } else if (activeTab === 'QC_REJECTED') {
        const isRej = po.docStatus === 'Rejected' || (po as any).qcStatus === 'Reject';
        if (!isRej) return false;
      } else if (activeTab === 'CLOSED') {
        if (po.docStatus !== 'Closed') return false;
      }

      // Planning Status Dropdown Filter
      if (planningFilter !== 'ALL' && planStatus !== planningFilter) {
        return false;
      }

      // PO Status Dropdown filter
      if (statusFilter !== 'ALL' && po.docStatus !== statusFilter) {
        return false;
      }

      // Vendor filter
      if (vendorFilter !== 'ALL' && po.supplier !== vendorFilter) {
        return false;
      }

      // Search filter
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesPO = po.poNumber.toLowerCase().includes(q);
        const matchesSupplier = po.supplier.toLowerCase().includes(q);
        const matchesItem = po.items.some(
          (item) => item.code.toLowerCase().includes(q) || item.name.toLowerCase().includes(q),
        );
        if (!matchesPO && !matchesSupplier && !matchesItem) {
          return false;
        }
      }

      // Date range filter
      if (dateRange && dateRange[0] && dateRange[1]) {
        const poDate = dayjs(po.docDate);
        if (poDate.isBefore(dateRange[0], 'day') || poDate.isAfter(dateRange[1], 'day')) {
          return false;
        }
      }

      return true;
    });
  }, [purchaseOrders, activeTab, planningFilter, statusFilter, vendorFilter, searchTerm, dateRange, irPlans]);

  // Filtered IR Plans for IR_PLANS tab
  const filteredIRPlans = useMemo(() => {
    return visibleIRPlans.filter((plan) => {
      // Status filter
      if (statusFilter !== 'ALL' && plan.status !== statusFilter) {
        return false;
      }
      // Vendor filter
      if (vendorFilter !== 'ALL' && plan.vendor !== vendorFilter) {
        return false;
      }
      // Search filter
      if (searchTerm) {
        const q = searchTerm.toLowerCase().trim();
        const matchesPlan = plan.irPlanNumber.toLowerCase().includes(q);
        const matchesDeliveryNum = plan.deliveryPlanNumber?.toLowerCase().includes(q);
        const matchesVendor = plan.vendor.toLowerCase().includes(q);
        const matchesPOs = plan.poNumbers.some((p) => p.toLowerCase().includes(q));
        const matchesItems = plan.items.some(
          (i) => i.itemCode.toLowerCase().includes(q) || i.itemName.toLowerCase().includes(q),
        );
        if (!matchesPlan && !matchesDeliveryNum && !matchesVendor && !matchesPOs && !matchesItems) {
          return false;
        }
      }
      // Date range filter
      if (dateRange && dateRange[0] && dateRange[1]) {
        const planDate = dayjs(plan.deliveryDate, ['DD-MM-YYYY', 'YYYY-MM-DD']);
        if (planDate.isValid() && (planDate.isBefore(dateRange[0], 'day') || planDate.isAfter(dateRange[1], 'day'))) {
          return false;
        }
      }
      return true;
    });
  }, [visibleIRPlans, statusFilter, vendorFilter, searchTerm, dateRange]);

  // Pagination slice

  // Navigate to Dedicated Create IR Plan Page
  const handleNavigateToCreatePlan = (poToUse?: PurchaseOrder) => {
    const po = poToUse || selectedPODetail || purchaseOrders[0];
    if (!po) {
      message.warning('Please select a PO to create an Inbound Receiving Schedule.');
      return;
    }
    setActiveCreatingPO(po);
    setIsCreatingMoreIR(
      irPlans.some(
        (plan) =>
          plan.poNumbers?.includes(po.poNumber) &&
          plan.items?.some((item) => (Number(item.allocatedQty) || 0) > 0),
      ),
    );

    const initialDate = po.expectedDate || '2026-08-27';
    const drafts: ScheduleDraftItem[] = [];
    (po.items || []).forEach((item) => {
      const scheduledQtyInIRs = irPlans
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

      const irQty = Math.max(Number(item.receivedQty) || 0, scheduledQtyInIRs);
      const pendingQty = Math.max(0, (Number(item.poQty) || 0) - irQty);

      drafts.push({
        poNumber: po.poNumber,
        itemCode: item.code,
        itemName: item.name,
        uom: item.uom,
        totalPoQty: item.poQty,
        remainingQty: pendingQty,
        schedules: [
          {
            deliveryPlanNumber: 'Plan 1',
            deliveryDate: initialDate,
            plannedQty: pendingQty,
            warehouseCode: item.warehouseCode || 'WHM1',
            notes: '',
          },
        ],
      });
    });

    setScheduleDraftItems(drafts);
    setDeliveryNoteNumber(`DN-${po.poNumber || '2026'}-01`);
    setDeliveryNoteDate(dayjs(initialDate));
    setDeliveryNoteRemark('');
    setVendorAttachments([
      {
        uid: 'att-default-1',
        name: `Delivery_Note_${po.poNumber || 'PO'}.pdf`,
        size: 245000,
        type: 'application/pdf',
        status: 'done',
      },
      {
        uid: 'att-default-2',
        name: `Vendor_Packing_Slip_${po.vendorCode || 'V01'}.pdf`,
        size: 184000,
        type: 'application/pdf',
        status: 'done',
      },
    ]);
    form.setFieldsValue({
      irPlanNumber: `IR${String(irPlans.length + 1).padStart(4, '0')}`,
      deliveryPlanNumber: 'Plan 1',
      vendor: po.supplier || 'Supplier',
      deliveryDate: dayjs(initialDate),
      notes: 'Initial Inbound Schedule configuration',
    });
    setSelectedPODetail(null);
    setWorkspaceView('create-ir-plan');
  };

  const handleAddScheduleSplit = (itemIndex: number) => {
    const updated = [...scheduleDraftItems];
    const targetItem = updated[itemIndex];
    const lastSched = targetItem.schedules[targetItem.schedules.length - 1];
    const nextDate = lastSched?.deliveryDate
      ? dayjs(lastSched.deliveryDate).add(1, 'day').format('YYYY-MM-DD')
      : dayjs().add(1, 'day').format('YYYY-MM-DD');

    targetItem.schedules.push({
      deliveryPlanNumber: `Plan ${targetItem.schedules.length + 1}`,
      deliveryDate: nextDate,
      plannedQty: 0,
      warehouseCode: 'WHM1',
      notes: 'Split schedule',
    });
    setScheduleDraftItems(updated);
  };

  const handleRemoveScheduleSplit = (itemIndex: number, schedIndex: number) => {
    const updated = [...scheduleDraftItems];
    if (updated[itemIndex].schedules.length > 1) {
      updated[itemIndex].schedules.splice(schedIndex, 1);
      setScheduleDraftItems(updated);
    } else {
      message.warning('At least one delivery schedule must exist for each item.');
    }
  };

  const handleUpdateScheduleValue = (
    itemIndex: number,
    schedIndex: number,
    field: string,
    value: any,
  ) => {
    const updated = [...scheduleDraftItems];
    updated[itemIndex].schedules[schedIndex] = {
      ...updated[itemIndex].schedules[schedIndex],
      [field]: value,
    };
    setScheduleDraftItems(updated);
  };

  const handleUpdateTotalIRQty = (itemIndex: number, val: number) => {
    const updated = [...scheduleDraftItems];
    const targetItem = { ...updated[itemIndex] };
    const currentSchedules = [...targetItem.schedules];
    if (currentSchedules.length <= 1) {
      currentSchedules[0] = {
        ...currentSchedules[0],
        plannedQty: val,
      };
    } else {
      currentSchedules[0] = {
        ...currentSchedules[0],
        plannedQty: val,
      };
    }
    targetItem.schedules = currentSchedules;
    updated[itemIndex] = targetItem;
    setScheduleDraftItems(updated);
  };

  const handleConfirmPlan = () => {
    const hasOverAllocated = scheduleDraftItems.some((draft) => {
      const itemTotal = draft.schedules.reduce((sum, s) => sum + (Number(s.plannedQty) || 0), 0);
      return itemTotal > draft.totalPoQty;
    });

    if (hasOverAllocated) {
      message.error('One or more items exceed the total PO Order QTY. Please adjust the quantities before confirming.');
      return;
    }

    const po = activeCreatingPO || purchaseOrders[0];
    let totalPlanned = 0;
    const finalItems: IRPlanItem[] = scheduleDraftItems
      .map((draft, idx) => {
        const positiveSchedules = draft.schedules.filter((s) => (Number(s.plannedQty) || 0) > 0);
        const itemTotal = positiveSchedules.reduce((sum, s) => sum + (Number(s.plannedQty) || 0), 0);
        totalPlanned += itemTotal;
        return {
          id: `item-${idx + 1}`,
          poNumber: draft.poNumber,
          itemCode: draft.itemCode,
          itemName: draft.itemName,
          uom: draft.uom,
          totalPoQty: draft.totalPoQty,
          allocatedQty: itemTotal,
          remainingQty: Math.max(0, draft.totalPoQty - itemTotal),
          schedules: positiveSchedules.map((s, sIdx) => ({
            id: `s-${idx}-${sIdx}`,
            deliveryPlanNumber: s.deliveryPlanNumber || `Plan ${sIdx + 1}`,
            deliveryDate: s.deliveryDate || po?.expectedDate || '2026-08-28',
            plannedQty: Number(s.plannedQty) || 0,
            warehouseCode: s.warehouseCode || po?.receiverWarehouse || 'WHM1',
            notes: s.notes || '',
          })),
        };
      })
      .filter((item) => item.allocatedQty > 0);

    // Collect all scheduled dates across items
    const allDates = Array.from(
      new Set(
        scheduleDraftItems.flatMap((draft) =>
          draft.schedules
            .filter((s) => (Number(s.plannedQty) || 0) > 0)
            .map((s) => s.deliveryDate)
            .filter(Boolean)
        )
      )
    );
    const formattedDates = allDates.map((d) => dayjs(d).format('DD-MM-YYYY')).join(', ');
    const firstDeliveryDate = scheduleDraftItems[0]?.schedules[0]?.deliveryDate || po?.expectedDate || '2026-08-28';

    const newIRPlan: IRPlan = {
      id: `ir-${Date.now()}`,
      irPlanNumber: `IR${String(irPlans.length + 1).padStart(4, '0')}`,
      deliveryPlanNumber: 'Plan 1',
      vendor: po?.supplier || 'Supplier',
      poNumbers: Array.from(new Set(scheduleDraftItems.map((i) => i.poNumber))),
      deliveryDate: formattedDates || dayjs(firstDeliveryDate).format('DD-MM-YYYY'),
      status: 'Pending',
      totalPlannedQty: totalPlanned,
      totalItems: finalItems.length,
      createdBy: 'Procurement (Demo)',
      createdAt: dayjs().format('YYYY-MM-DD HH:mm'),
      notes: deliveryNoteRemark || 'Inbound Receiving Plan generated from PO',
      deliveryNoteNumber: deliveryNoteNumber || `DN-${po?.poNumber || '2026'}-01`,
      deliveryNoteDate: deliveryNoteDate ? deliveryNoteDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
      deliveryNoteRemark: deliveryNoteRemark,
      attachments: vendorAttachments.map((f) => ({
        uid: f.uid,
        name: f.name,
        size: f.size,
        type: f.type,
      })),
      items: finalItems,
    };

    onCreateIRPlan(newIRPlan);
    message.success(
      `IR Schedule ${newIRPlan.irPlanNumber} confirmed! Sent to Warehouse Expected Inbound queue.`,
    );
    setWorkspaceView('list');
    setActiveTab('IR_PLANS');
  };

  const handleExport = (format: ExportFormat) => {
    if (activeTab === 'IR_PLANS') {
      exportWorkspace('inbound-schedules', [
        ['IR Schedule #', 'Status'],
        ...filteredIRPlans.map(plan => [plan.irPlanNumber, plan.status]),
      ], format);
    } else {
      exportWorkspace('purchase-orders', [
        ['PO #', 'Vendor', 'Status'],
        ...filteredPOs.map(po => [po.poNumber, po.supplier, po.docStatus]),
      ], format);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setPlanningFilter('ALL');
    setVendorFilter('ALL');
    setDateRange(null);
    message.info('Filters reset.');
  };
  const handleResetDemo = () => {
    onResetDemo?.();
    setWorkspaceView('list');
    setActiveTab('OPEN');
    setSelectedRowKeys([]);
    setSearchTerm('');
    setPlanningFilter('ALL');
    setStatusFilter('ALL');
    setVendorFilter('ALL');
    setDateRange(null);
  };

  // Table Columns for V2 (Option 1 Workflow)
  const poColumns = useMemo<ColumnsType<PurchaseOrder>>(() => {
    const cols: ColumnsType<PurchaseOrder> = [
      {
        title: 'PO # (DocNum)',
        dataIndex: 'poNumber',
        key: 'poNumber',
        width: 130,
        render: (num: string, record: PurchaseOrder) => (
          <span
            className="po-link"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPODetail(record);
            }}
          >
            {num}
          </span>
        ),
      },
      {
        title: 'Vendor Code',
        dataIndex: 'vendorCode',
        key: 'vendorCode',
        width: 115,
        render: (code: string, record: PurchaseOrder) => (
          <span className="vendor-code">{code || `V${record.poNumber.slice(-6)}`}</span>
        ),
      },
      {
        title: 'Vendor',
        dataIndex: 'supplier',
        key: 'supplier',
        render: (sup: string) => <span className="vendor-name">{sup}</span>,
      },
      {
        title: 'Doc Date',
        dataIndex: 'docDate',
        key: 'docDate',
        width: 105,
        render: (date: string) => <span>{date || '22-08-26'}</span>,
      },
      {
        title: <span style={{ whiteSpace: 'nowrap' }}>Delivery Date</span>,
        dataIndex: 'expectedDate',
        key: 'expectedDate',
        width: 120,
        render: (date: string) => <span style={{ whiteSpace: 'nowrap' }}>{date || '22-08-26'}</span>,
      },
      {
        title: 'Total Amount',
        dataIndex: 'totalAmount',
        key: 'totalAmount',
        width: 110,
        render: (amount: number) => (
          <span className="amount-cell">
            {amount ? `$${amount.toLocaleString()}` : '$6,500'}
          </span>
        ),
      },
    ];

    if (activeTab !== 'OPEN') {
      cols.push({
        title: 'Planning Status',
        key: 'planningStatus',
        width: 140,
        render: (_: any, record: PurchaseOrder) => {
          const planStatus = getPOPlanningStatus(record);
          return <InboundStatusBadge type="planning" value={planStatus} />;
        },
      });
    }

    if (activeTab === 'IN_PROGRESS') {
      cols.push({
        title: 'IR Scheduled',
        key: 'irScheduled',
        width: 115,
        render: (_: any, record: PurchaseOrder) => (
          <span style={{ fontWeight: 600, color: '#334155' }}>
            {irPlans.filter((plan) => plan.poNumbers?.includes(record.poNumber)).length}
          </span>
        ),
      });
    }

    cols.push({
      ...rowActionColumn,
      render: (_: any, record: PurchaseOrder) => {
        if (record.docStatus === 'Rejected') {
          return (
            <RowActionButton
              variant="danger"
              icon={<SendOutlined />}
              onClick={() => {
                message.warning(`Initiated Vendor Return / Credit Note claim with ${record.supplier} for PO ${record.poNumber}.`);
              }}
            >
              Vendor Return
            </RowActionButton>
          );
        }

        if (record.docStatus === 'In Progress') {
          return (
            <RowActionButton
              onClick={() => {
                setSelectedPODetail(record);
              }}
            >
              Track Intake
            </RowActionButton>
          );
        }

        const planStatus = getPOPlanningStatus(record);
        if (planStatus === 'FULLY_PLANNED' || record.docStatus === 'Closed') {
          return (
            <RowActionButton
              onClick={() => {
                setSelectedPODetail(record);
              }}
            >
              {activeTab === 'CLOSED' || record.docStatus === 'Closed' ? 'View Inbound' : 'View Plan'}
            </RowActionButton>
          );
        }

        return (
          <RowActionButton
            variant="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              handleNavigateToCreatePlan(record);
            }}
          >
            <span>Create IR</span>
          </RowActionButton>
        );
      },
    });

    return cols;
  }, [activeTab, irPlans, purchaseOrders]);

  // IR Schedule Table Columns
  const irPlanColumns: ColumnsType<IRPlan> = [
    {
      title: 'IR Schedule #',
      dataIndex: 'irPlanNumber',
      key: 'irPlanNumber',
      width: 140,
      render: (num: string, record: IRPlan) => (
        <span
          className="po-link"
          onClick={() => {
            setSelectedPlanDetail(record);
          }}
        >
          {num}
        </span>
      ),
    },
    {
      title: 'PO #',
      key: 'poNumbers',
      width: 130,
      render: (_: any, record: IRPlan) => {
        const poNum = record.poNumbers?.[0] || record.items?.[0]?.poNumber || '26000977';
        return (
          <span
            className="po-link"
            onClick={() => {
              const foundPo = purchaseOrders.find((p) => p.poNumber === poNum) || {
                poNumber: poNum,
                docNum: poNum,
                supplier: record.vendor,
                docDate: record.createdAt?.split(' ')[0] || '2026-08-22',
                expectedDate: record.deliveryDate || '2026-08-27',
                docStatus: record.status === 'Completed' ? 'Closed' : record.status === 'Rejected' ? 'Rejected' : 'In Progress',
                totalQty: record.totalPlannedQty || 2000,
                totalAmount: 6500,
                items: record.items?.map((it) => ({
                  code: it.itemCode,
                  name: it.itemName,
                  poQty: it.totalPoQty || it.allocatedQty,
                  receivedQty: it.allocatedQty,
                  remainingQty: it.remainingQty || 0,
                  uom: it.uom,
                })) || [],
              };
              setSelectedPODetail(foundPo as any);
            }}
          >
            {poNum}
          </span>
        );
      },
    },
    {
      title: 'Vendor',
      dataIndex: 'vendor',
      key: 'vendor',
      render: (v: string) => <span className="vendor-name">{v}</span>,
    },
    {
      title: 'Origin / QC',
      key: 'parentIrNumber',
      width: 160,
      render: (_: unknown, record: IRPlan) => record.parentIrNumber
        ? <span>From {record.parentIrNumber} · {record.qcFollowUpType === 'ON_HOLD' ? 'On Hold' : 'Rejected'}</span>
        : '—',
    },
    {
      title: 'IR Schedule Date',
      dataIndex: 'deliveryDate',
      key: 'deliveryDate',
      width: 160,
      render: (date: string) => <span>{date || '—'}</span>,
    },
    {
      title: 'Schedule Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (s: string) => (
        <InboundStatusBadge type="deliveryPlan" value={s || 'Pending'} />
      ),
    },
    {
      title: 'Created By',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 130,
      render: (user: string) => (
        <span style={{ fontWeight: 500, color: '#1e293b' }}>{user || 'Keo Srey'}</span>
      ),
    },
    {
      ...rowActionColumn,
      render: (_: any, record: IRPlan) => (
        <RowActionButton
          onClick={() => {
            setSelectedPlanDetail(record);
          }}
        >
          View Schedule
        </RowActionButton>
      ),
    },
  ];

  // -------------------------------------------------------------
  // VIEW: CREATE IR PLAN PAGE
  // -------------------------------------------------------------
  if (workspaceView === 'create-ir-plan') {
    const totalOrderQty = scheduleDraftItems.reduce((s, i) => s + i.totalPoQty, 0);
    const totalAllocatedQty = scheduleDraftItems.reduce((s, i) => {
      const itemAlloc = i.schedules.reduce((is, sc) => is + (Number(sc.plannedQty) || 0), 0);
      return s + itemAlloc;
    }, 0);
    const pendingToAllocate = Math.max(0, totalOrderQty - totalAllocatedQty);
    const currentPO = activeCreatingPO || purchaseOrders[0];

    return (
      <div className="procurement-workspace create-ir-plan-view inbound-task-page" style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 24 }}>
        {/* Top Breadcrumb / Action Header */}
        <WorkspaceTaskHeader title="Create IR Schedule" onBack={() => setWorkspaceView('list')} />

        <div className="create-plan-container" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Combined Purchase Order Details & Schedule Allocation Header Card */}
          <div
            className="po-figma-details-card combined-plan-hero-card"
            style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              padding: '14px 18px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {/* Card Body: 3-Column Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 24 }}>
              {/* Column 1: PO Basic Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="label-value-pair" style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="field-label" style={{ width: 105, fontSize: 13, fontWeight: 500, color: '#64748b', flexShrink: 0 }}>
                    PO # (DocNum)
                  </span>
                  <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                    :
                  </span>
                  <span className="field-value" style={{ fontSize: 14, fontWeight: 700, color: '#2563eb' }}>
                    {currentPO?.poNumber}
                  </span>
                </div>
                <div className="label-value-pair" style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="field-label" style={{ width: 105, fontSize: 13, fontWeight: 500, color: '#64748b', flexShrink: 0 }}>
                    Doc Date
                  </span>
                  <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                    :
                  </span>
                  <span className="field-value" style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>
                    {currentPO?.docDate || '2026-08-22'}
                  </span>
                </div>
              </div>

              {/* Column 2: Schedule & Amount */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="label-value-pair" style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="field-label" style={{ width: 105, fontSize: 13, fontWeight: 500, color: '#64748b', flexShrink: 0 }}>
                    Delivery Date
                  </span>
                  <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                    :
                  </span>
                  <span className="field-value" style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                    {currentPO?.expectedDate || '2026-08-22'}
                  </span>
                </div>
                <div className="label-value-pair" style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="field-label" style={{ width: 105, fontSize: 13, fontWeight: 500, color: '#64748b', flexShrink: 0 }}>
                    Total Amount
                  </span>
                  <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                    :
                  </span>
                  <span className="field-value" style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                    ${currentPO?.totalAmount ? currentPO.totalAmount.toLocaleString() : '14,600'}
                  </span>
                </div>
              </div>

              {/* Column 3: Vendor Information */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="label-value-pair" style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="field-label" style={{ width: 105, fontSize: 13, fontWeight: 500, color: '#64748b', flexShrink: 0 }}>
                    Vendor Code
                  </span>
                  <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                    :
                  </span>
                  <span className="field-value" style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                    {currentPO?.vendorCode || 'V000374'}
                  </span>
                </div>
                <div className="label-value-pair" style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="field-label" style={{ width: 105, fontSize: 13, fontWeight: 500, color: '#64748b', flexShrink: 0 }}>
                    Vendor Name
                  </span>
                  <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                    :
                  </span>
                  <span className="field-value" style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>
                    {currentPO?.supplier}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Note & Vendor Documentation Card */}
          <div
            className="po-figma-details-card delivery-note-card"
            style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              padding: '20px 24px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {/* 2-Column Form & Upload Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 18, alignItems: 'start' }}>
              {/* Left Column: Delivery Note Form Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#475569',
                        marginBottom: 4,
                      }}
                    >
                      Delivery Note No. <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <Input
                      placeholder="e.g. DN-2026-00892"
                      value={deliveryNoteNumber}
                      onChange={(e) => setDeliveryNoteNumber(e.target.value)}
                      prefix={<FileTextOutlined style={{ color: '#94a3b8' }} />}
                      style={{ borderRadius: 8, height: 34 }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#475569',
                        marginBottom: 4,
                      }}
                    >
                      Delivery Note Date
                    </label>
                    <DatePicker
                      placeholder="Select Date"
                      value={deliveryNoteDate}
                      onChange={(d: dayjs.Dayjs | null) => setDeliveryNoteDate(d)}
                      style={{ width: '100%', borderRadius: 8, height: 34 }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#475569',
                      marginBottom: 4,
                    }}
                  >
                    Remarks
                  </label>
                  <Input.TextArea
                    rows={2}
                    placeholder="Enter any driver name, vehicle number, delivery instructions, or notes from vendor..."
                    value={deliveryNoteRemark}
                    onChange={(e) => setDeliveryNoteRemark(e.target.value)}
                    style={{ borderRadius: 8 }}
                  />
                </div>
              </div>

              {/* Right Column: File Upload Area & Attachments List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569' }}>
                    Attachments ({vendorAttachments.length})
                  </label>
                </div>
                <Upload.Dragger
                  multiple
                  fileList={vendorAttachments as any}
                  beforeUpload={(file) => {
                    const newAtt = {
                      uid: `${Date.now()}-${file.name}`,
                      name: file.name,
                      size: file.size,
                      type: file.type,
                      status: 'done',
                    };
                    setVendorAttachments((prev) => [...prev, newAtt as any]);
                    message.success(`${file.name} attached.`);
                    return false;
                  }}
                  onRemove={(file) => {
                    setVendorAttachments((prev) => prev.filter((f) => f.uid !== file.uid));
                  }}
                  style={{
                    background: '#f8fafc',
                    border: '1.5px dashed #cbd5e1',
                    borderRadius: 8,
                    padding: '7px 12px',
                  }}
                  showUploadList={false}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '2px 0' }}>
                    <InboxOutlined style={{ fontSize: 20, color: '#B49A00' }} />
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                        Click or drag vendor files here to attach
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>
                        Supports PDF, PNG, JPG, DOCX, XLSX (up to 15MB)
                      </p>
                    </div>
                  </div>
                </Upload.Dragger>
                {vendorAttachments.length > 0 && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      gap: 6,
                    }}
                  >
                    {vendorAttachments.map((file) => (
                      <div
                        key={file.uid}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          minWidth: 0,
                          padding: '5px 8px',
                          border: '1px solid #e2e8f0',
                          borderRadius: 6,
                          background: '#ffffff',
                        }}
                      >
                        <PaperClipOutlined style={{ color: '#B49A00', flexShrink: 0 }} />
                        <span
                          title={file.name}
                          style={{
                            minWidth: 0,
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: 11,
                            color: '#475569',
                          }}
                        >
                          {file.name}
                        </span>
                        <Button
                          type="text"
                          size="small"
                          icon={<CloseCircleOutlined />}
                          onClick={() =>
                            setVendorAttachments((prev) => prev.filter((item) => item.uid !== file.uid))
                          }
                          aria-label={`Remove ${file.name}`}
                          style={{
                            flexShrink: 0,
                            width: 20,
                            height: 20,
                            padding: 0,
                            color: '#94a3b8',
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="schedule-configuration-card">
            <Table
              dataSource={scheduleDraftItems.flatMap((item, itemIdx) =>
                item.schedules.map((sched, sIdx) => ({
                  rowKey: `${item.itemCode}-${sIdx}`,
                  itemIdx,
                  sIdx,
                  isMainRow: sIdx === 0,
                  docLine: (item as any).lineNumber || (item as any).poLineNumber || (itemIdx + 1),
                  itemCode: item.itemCode,
                  itemName: item.itemName,
                  poNumber: item.poNumber,
                  totalPoQty: item.totalPoQty,
                  remainingQty: item.remainingQty,
                  uom: item.uom,
                  plannedQty: sched.plannedQty,
                  deliveryDate: sched.deliveryDate,
                  parentItem: item,
                }))
              )}
              rowKey="rowKey"
              pagination={false}
              className="po-custom-table schedule-items-table"
              columns={[
                {
                  title: 'Docline #',
                  key: 'docLine',
                  width: 90,
                  render: (_, r: any) =>
                    r.isMainRow ? (
                      <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, color: '#64748b', fontSize: 13 }}>{r.docLine}</span>
                      </div>
                    ) : (
                      <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
                        <span style={{ color: '#cbd5e1' }}>—</span>
                      </div>
                    ),
                },
                {
                  title: 'Item Code',
                  key: 'itemCode',
                  width: 140,
                  render: (_, r) => {
                    if (r.isMainRow) {
                      return (
                        <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, color: '#334155', fontSize: 14 }}>{r.itemCode}</span>
                        </div>
                      );
                    }
                    return (
                      <div style={{ height: 32, display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 8 }}>
                        <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>↳</span>
                      </div>
                    );
                  },
                },
                {
                  title: 'Item Description',
                  key: 'itemName',
                  width: 280,
                  render: (_, r) => (
                    <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
                      {r.isMainRow ? (
                        <span style={{ fontWeight: 600, color: '#334155', fontSize: 14 }}>{r.itemName}</span>
                      ) : (
                        <span style={{ color: '#cbd5e1' }}>—</span>
                      )}
                    </div>
                  ),
                },
                {
                  title: 'Order Qty',
                  key: 'totalPoQty',
                  width: 130,
                  render: (_, r) => (
                    <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
                      {r.isMainRow ? (
                        <span style={{ fontWeight: 500, color: '#334155', fontSize: 14 }}>
                          {r.totalPoQty.toLocaleString()} {r.uom}
                        </span>
                      ) : (
                        <span style={{ color: '#cbd5e1' }}>—</span>
                      )}
                    </div>
                  ),
                },
                ...(isCreatingMoreIR
                  ? [
                      {
                        title: 'Remaining Qty',
                        key: 'remainingQty',
                        width: 140,
                        render: (_: any, r: any) => (
                          <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
                            {r.isMainRow ? (
                              <span
                                style={{
                                  fontWeight: 700,
                                  color: r.remainingQty > 0 ? '#ea580c' : '#16a34a',
                                  fontSize: 14,
                                }}
                              >
                                {r.remainingQty.toLocaleString()} {r.uom}
                              </span>
                            ) : (
                              <span style={{ color: '#cbd5e1' }}>—</span>
                            )}
                          </div>
                        ),
                      },
                    ]
                  : []),
                {
                  title: 'IR Qty',
                  key: 'irQty',
                  width: 140,
                  render: (_, r) => (
                    <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
                      <InputNumber
                        style={{ width: 120, height: 32 }}
                        min={0}
                        value={r.plannedQty === 0 ? undefined : r.plannedQty}
                        onChange={(val) =>
                          handleUpdateScheduleValue(r.itemIdx, r.sIdx, 'plannedQty', val || 0)
                        }
                        placeholder="IR Qty"
                        addonAfter={r.uom}
                      />
                    </div>
                  ),
                },
                {
                  title: 'Pending Qty',
                  key: 'pendingQty',
                  width: 130,
                  render: (_, r) => {
                    if (r.isMainRow) {
                      const allocated = r.parentItem.schedules.reduce(
                        (sum: number, s: any) => sum + (Number(s.plannedQty) || 0),
                        0
                      );
                      const rem = (isCreatingMoreIR ? r.remainingQty : r.totalPoQty) - allocated;
                      return (
                        <div style={{ height: 32, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span
                            style={{
                              fontWeight: 700,
                              color: rem > 0 ? '#ea580c' : '#94a3b8',
                              fontSize: 14,
                            }}
                          >
                            {rem.toLocaleString()}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>
                            {r.uom}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
                        <span style={{ color: '#cbd5e1' }}>—</span>
                      </div>
                    );
                  },
                },
                {
                  title: 'IR Schedule',
                  key: 'schedule',
                  width: 180,
                  render: (_, r) => (
                    <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
                      <DatePicker
                        style={{ width: 150, height: 32 }}
                        value={r.deliveryDate ? dayjs(r.deliveryDate) : undefined}
                        onChange={(d: dayjs.Dayjs | null) =>
                          handleUpdateScheduleValue(
                            r.itemIdx,
                            r.sIdx,
                            'deliveryDate',
                            d ? d.format('YYYY-MM-DD') : ''
                          )
                        }
                        placeholder="Delivery Date"
                      />
                    </div>
                  ),
                },
                {
                  ...rowActionColumn,
                  render: (_, r) => (
                    <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
                      {r.isMainRow ? (
                        <RowActionButton icon={<PlusOutlined />} onClick={() => handleAddScheduleSplit(r.itemIdx)}>
                          Split Date
                        </RowActionButton>
                      ) : (
                        <RowActionButton variant="danger" icon={<DeleteOutlined />}
                          onClick={() => handleRemoveScheduleSplit(r.itemIdx, r.sIdx)}>
                          Remove
                        </RowActionButton>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </div>


          <div
            className="page-footer-actions inbound-task-actions"
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: '16px 24px',
              boxShadow: 'none',
            }}
          >
            <Space size={14}>
              <Button
                onClick={() => setWorkspaceView('list')}
                size="large"
                className="cancel-btn"
                style={{
                  height: 40,
                  padding: '0 24px',
                  borderRadius: 8,
                  fontWeight: 500,
                  color: '#475569',
                  borderColor: '#cbd5e1',
                  boxShadow: 'none',
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={handleConfirmPlan}
                size="large"
                icon={<SendOutlined />}
                className="confirm-plan-btn"
                style={{
                  height: 40,
                  padding: '0 28px',
                  borderRadius: 8,
                  fontWeight: 600,
                  background: '#B49A00',
                  borderColor: '#B49A00',
                  border: '1px solid #B49A00',
                  color: '#ffffff',
                  boxShadow: 'none',
                  outline: 'none',
                }}
              >
                Create IR
              </Button>
            </Space>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MAIN LIST VIEW: PURCHASE ORDERS MANAGEMENT (V2 Option 1 Workflow)
  // -------------------------------------------------------------
  return (
    <div className="procurement-workspace inbound-role-workspace">
      <WorkspaceHeader
        title="Procurement — Purchase Orders"
        onRefresh={onRefresh}
        onExport={handleExport}
        onResetDemo={handleResetDemo}
      />

      {/* 2. KPI Summary Cards Grid matching the 5 Lifecycle Stages */}
      <div className="summary-cards-row">
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Open POs</span>
            <div className={`kpi-icon-badge ${tabCounts.open === 0 ? 'zero' : 'blue'}`}>
              <InboxOutlined />
            </div>
          </div>
          <div className={`kpi-value ${tabCounts.open === 0 ? 'zero' : 'blue'}`}>{tabCounts.open}</div>

        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">In Progress</span>
            <div className={`kpi-icon-badge ${tabCounts.inProgress === 0 ? 'zero' : 'amber'}`}>
              <SyncOutlined />
            </div>
          </div>
          <div className={`kpi-value ${tabCounts.inProgress === 0 ? 'zero' : 'amber'}`}>{tabCounts.inProgress}</div>

        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">IR Schedules</span>
            <div className={`kpi-icon-badge ${tabCounts.irPlans === 0 ? 'zero' : 'purple'}`}>
              <ScheduleOutlined />
            </div>
          </div>
          <div className={`kpi-value ${tabCounts.irPlans === 0 ? 'zero' : 'purple'}`}>{tabCounts.irPlans}</div>

        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">QC Rejected</span>
            <div className={`kpi-icon-badge ${tabCounts.qcRejected === 0 ? 'zero' : 'orange'}`}>
              <CloseCircleOutlined style={{ color: tabCounts.qcRejected === 0 ? '#94a3b8' : '#ef4444' }} />
            </div>
          </div>
          <div className={`kpi-value ${tabCounts.qcRejected === 0 ? 'zero' : 'orange'}`} style={tabCounts.qcRejected === 0 ? { color: '#94a3b8' } : { color: '#dc2626' }}>{tabCounts.qcRejected}</div>

        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Closed / History</span>
            <div className={`kpi-icon-badge ${tabCounts.closed === 0 ? 'zero' : 'green'}`}>
              <CheckCircleOutlined />
            </div>
          </div>
          <div className={`kpi-value ${tabCounts.closed === 0 ? 'zero' : 'green'}`}>{tabCounts.closed}</div>

        </div>
      </div>

      {/* 3. Single-Line Filter Toolbar Card with Title Labels */}
      <div className="filter-toolbar-card" style={{ padding: '12px 18px', background: '#ffffff', borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 220px', minWidth: 200, maxWidth: 300 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Search</span>
            <Input
              ref={searchInputRef}
              placeholder="Search PO #, vendor, item..."
              prefix={<SearchOutlined style={{ color: '#9ca3af', marginRight: 4 }} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
              style={{ height: 36, borderRadius: 6 }}
            />
          </div>

          {/* Planning Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 175 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Planning Status</span>
            <Select
              style={{ width: '100%', height: 36 }}
              value={planningFilter}
              onChange={(val) => setPlanningFilter(val)}
              options={[
                { label: 'All Planning', value: 'ALL' },
                { label: 'Not Planned', value: 'NOT_PLANNED' },
                { label: 'Partially', value: 'PARTIALLY_PLANNED' },
                { label: 'Fully', value: 'FULLY_PLANNED' },
              ]}
            />
          </div>

          {/* PO Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 140 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>PO Status</span>
            <Select
              style={{ width: '100%', height: 36 }}
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={[
                { label: 'All PO', value: 'ALL' },
                { label: 'Open', value: 'Open' },
                { label: 'In Progress', value: 'In Progress' },
                { label: 'Closed', value: 'Closed' },
                { label: 'Rejected', value: 'Rejected' },
              ]}
            />
          </div>

          {/* Vendor */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 180 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Vendor</span>
            <Select
              style={{ width: '100%', height: 36 }}
              value={vendorFilter}
              onChange={(val) => setVendorFilter(val)}
              options={vendorOptions}
            />
          </div>

          {/* Date Range */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 230 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Date Range</span>
            <DatePicker.RangePicker
              style={{ width: '100%', height: 36, borderRadius: 6 }}
              value={dateRange}
              onChange={(dates: any) => setDateRange(dates)}
              placeholder={['Start Date', 'End Date']}
            />
          </div>

          {/* Reset Button - Appears ONLY when custom filters are active */}
          {(Boolean(searchTerm) || planningFilter !== 'ALL' || statusFilter !== 'ALL' || vendorFilter !== 'ALL' || dateRange !== null) && (
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

      {/* 4. Main Content Card with 5-Tab Lifecycle */}
      <div className="main-content-card">
        <div className="tab-action-bar">
          <div className="tabs-list">
            <button
              className={`tab-button ${activeTab === 'OPEN' ? 'active' : ''}`}
              onClick={() => setActiveTab('OPEN')}
            >
              <span>Open POs</span>
              <span className="tab-count-badge">{tabCounts.open}</span>
            </button>
            <button
              className={`tab-button ${activeTab === 'IN_PROGRESS' ? 'active' : ''}`}
              onClick={() => setActiveTab('IN_PROGRESS')}
            >
              <span>In Progress</span>
              <span className="tab-count-badge">{tabCounts.inProgress}</span>
            </button>
            <button
              className={`tab-button ${activeTab === 'IR_PLANS' ? 'active' : ''}`}
              onClick={() => setActiveTab('IR_PLANS')}
            >
              <span>IR Schedules</span>
              <span className="tab-count-badge">{tabCounts.irPlans}</span>
            </button>
            <button
              className={`tab-button ${activeTab === 'QC_REJECTED' ? 'active' : ''}`}
              onClick={() => setActiveTab('QC_REJECTED')}
            >
              <span>QC Rejected</span>
              <span className="tab-count-badge">{tabCounts.qcRejected}</span>
            </button>
            <button
              className={`tab-button ${activeTab === 'CLOSED' ? 'active' : ''}`}
              onClick={() => setActiveTab('CLOSED')}
            >
              <span>Closed / History</span>
              <span className="tab-count-badge">{tabCounts.closed}</span>
            </button>
          </div>

        </div>

        {/* View Switcher */}
        {activeTab === 'IR_PLANS' ? (
          <Table
            columns={irPlanColumns}
            dataSource={filteredIRPlans}
            rowKey="id"
            pagination={workspacePagination}
            scroll={{ x: 1000 }}
            locale={{ emptyText: <WorkspaceEmpty filtered={Boolean(searchTerm || statusFilter !== 'ALL' || vendorFilter !== 'ALL' || dateRange)} description="No inbound schedules in this queue. Create an IR from an open purchase order." /> }}
            className="po-custom-table"
          />
        ) : (
          <>
            <Table
              columns={poColumns}
              dataSource={filteredPOs}
              rowKey="poNumber"
              pagination={workspacePagination}
              scroll={{ x: 1000 }}
              locale={{ emptyText: <WorkspaceEmpty filtered={Boolean(searchTerm || planningFilter !== 'ALL' || statusFilter !== 'ALL' || vendorFilter !== 'ALL' || dateRange)} description="No purchase orders in this queue. Choose another status or refresh to check for updates." /> }}
              className="po-custom-table"
              onRow={(record) => ({
                onClick: () => {
                  setSelectedPODetail(record);
                },
                style: { cursor: 'pointer' },
              })}
              rowClassName={(record) =>
                record.poNumber === selectedPODetail?.poNumber ? 'focused-po-row' : ''
              }
            />

          </>
        )}
      </div>

      {/* 5. Detail / Track Intake Drawer */}
      <Drawer rootClassName="inbound-detail"
        title={
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', paddingRight: 24 }}>
            <Space size={8}>
              <FileTextOutlined style={{ color: '#2563eb', fontSize: 18 }} />
              <span style={{ fontWeight: 700, fontSize: 16 }}>
                Purchase Order Details
              </span>
            </Space>
          </div>
        }
        open={!!selectedPODetail}
        onClose={() => setSelectedPODetail(null)}
        width={920}
        styles={{ body: { padding: '20px 24px', background: '#f8fafc' } }}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Sourced from SAP Business One • Inbound Planning & Intake via IES
            </Text>
            <Space size={12}>
              <Button onClick={() => setSelectedPODetail(null)}>Close</Button>
              {selectedPODetail?.docStatus !== 'Closed' &&
                selectedPODetail?.items?.some(
                  (item) =>
                    (Number(item.remainingQty) ||
                      Math.max(0, (Number(item.poQty) || 0) - (Number(item.receivedQty) || 0))) > 0,
                ) && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleNavigateToCreatePlan(selectedPODetail || undefined)}
                  style={{
                    background: '#B49A00',
                    borderColor: '#B49A00',
                    fontWeight: 600,
                    borderRadius: 6,
                    boxShadow: '0 2px 6px rgba(180, 154, 0, 0.25)',
                  }}
                >
                  {irPlans.some((plan) => plan.poNumbers?.includes(selectedPODetail?.poNumber || ''))
                    ? 'Create More IR'
                    : 'Create IR'}
                </Button>
              )}
            </Space>
          </div>
        }
      >
        {(() => {
          const currentPO = purchaseOrders.find((p) => p.poNumber === selectedPODetail?.poNumber) || selectedPODetail;
          if (!currentPO) return null;

          // Dynamically compute line items breakdown with IRS sub-rows (supporting multi-date schedules)
          const enrichedPoRows: any[] = (currentPO.items || ([] as any[])).flatMap((item: any, itemIdx: number) => {
            const matchingPlanItems = irPlans
              .filter((plan) => plan.poNumbers?.includes(currentPO.poNumber))
              .flatMap((plan) =>
                (plan.items || [])
                  .filter(
                    (it) =>
                      (it.poNumber === currentPO.poNumber || !it.poNumber) &&
                      (it.itemCode === item.code || it.itemCode === (item as any).itemCode)
                  )
                  .map((it) => ({ ...it, planNumber: plan.irPlanNumber, planRef: plan }))
              );

            const allSchedules: Array<{
              deliveryPlanNumber: string;
              deliveryDate: string;
              plannedQty: number;
              planNumber?: string;
              planRef?: IRPlan;
            }> = [];

            matchingPlanItems.forEach((it) => {
              if (it.schedules && it.schedules.length > 0) {
                it.schedules.forEach((s) => {
                  if ((Number(s.plannedQty) || 0) > 0) {
                    allSchedules.push({
                      deliveryPlanNumber: s.deliveryPlanNumber || 'Plan 1',
                      deliveryDate: s.deliveryDate || it.planRef?.deliveryDate || '',
                      plannedQty: Number(s.plannedQty) || 0,
                      planNumber: it.planNumber,
                      planRef: it.planRef,
                    });
                  }
                });
              } else if ((Number(it.allocatedQty) || 0) > 0) {
                allSchedules.push({
                  deliveryPlanNumber: 'Plan 1',
                  deliveryDate: it.planRef?.deliveryDate || '',
                  plannedQty: Number(it.allocatedQty) || 0,
                  planNumber: it.planNumber,
                  planRef: it.planRef,
                });
              }
            });

            const totalAllocated = allSchedules.reduce((sum, s) => sum + s.plannedQty, 0);
            const irQty = Math.max(Number(item.receivedQty) || 0, totalAllocated);
            const pendingQty = Math.max(0, (Number(item.poQty) || 0) - irQty);

            if (allSchedules.length > 0) {
              return allSchedules.map((sched, sIdx) => ({
                rowKey: `${item.code || itemIdx}-${sIdx}`,
                isMainRow: sIdx === 0,
                code: item.code,
                name: item.name,
                uom: item.uom,
                poQty: item.poQty,
                receivedQty: sched.plannedQty,
                totalIrQty: irQty,
                remainingQty: pendingQty,
                poDeliveryDate: item.expectedDate || currentPO.expectedDate || '2026-08-27',
                irScheduleNumber: sched.planNumber || '—',
                irScheduleDate: sched.deliveryDate || '—',
                irStatus: sched.planRef?.status || 'Pending',
                planRef: sched.planRef,
              }));
            }

            return [
              {
                rowKey: `${item.code || itemIdx}-0`,
                isMainRow: true,
                code: item.code,
                name: item.name,
                uom: item.uom,
                poQty: item.poQty,
                receivedQty: 0,
                totalIrQty: 0,
                remainingQty: item.poQty,
                poDeliveryDate: item.expectedDate || currentPO.expectedDate || '2026-08-27',
                irScheduleNumber: '—',
                irScheduleDate: '—',
                irStatus: '—' as any,
                planRef: undefined,
              },
            ];
          });

          const totalPoQty = currentPO.totalQty || (currentPO.items || []).reduce((s, i) => s + (i.poQty || 0), 0) || 0;
          const totalReceivedQty = (currentPO.items || []).reduce((sum, item) => {
            const row = enrichedPoRows.find((r) => r.code === item.code && r.isMainRow);
            return sum + (row ? row.totalIrQty : 0);
          }, 0);
          const totalRemainingQty = Math.max(0, totalPoQty - totalReceivedQty);
          const percentReceived = totalPoQty > 0 ? Math.min(100, Math.round((totalReceivedQty / totalPoQty) * 1000) / 10) : 0;

          // Linked IRs and Goods Receipts
          const linkedIRs = irPlans.filter((p) => p.poNumbers.includes(currentPO.poNumber));
          const linkedGRs = receipts.filter(
            (r) =>
              r.poNumber === currentPO.poNumber ||
              r.poReferences?.some((pr) => pr.poNumber === currentPO.poNumber) ||
              r.items?.some((it) => it.poNumber === currentPO.poNumber),
          );

          return (
            <div className="detail-drawer-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* 1. Exact Figma Purchase Order Details Card */}
              <div
                className="po-figma-details-card"
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
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
                    color: '#0f172a',
                    marginBottom: 14,
                    lineHeight: 1.2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <FileTextOutlined style={{ color: '#ca8504' }} />
                  <span>PO Summary</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 24 }}>
                  {/* Column 1: PO Basic Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="label-value-pair" style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="field-label" style={{ width: 110, fontSize: 13, fontWeight: 500, color: '#64748b', flexShrink: 0 }}>
                        PO Number
                      </span>
                      <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                        :
                      </span>
                      <span className="field-value" style={{ fontSize: 14, fontWeight: 700, color: '#2563eb' }}>
                        {currentPO.poNumber}
                      </span>
                    </div>
                    <div className="label-value-pair" style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="field-label" style={{ width: 110, fontSize: 13, fontWeight: 500, color: '#64748b', flexShrink: 0 }}>
                        Order Date
                      </span>
                      <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                        :
                      </span>
                      <span className="field-value" style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>
                        {currentPO.docDate || '2026-08-22'}
                      </span>
                    </div>
                  </div>

                  {/* Column 2: Schedule & Amount */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="label-value-pair" style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="field-label" style={{ width: 115, fontSize: 13, fontWeight: 500, color: '#64748b', flexShrink: 0 }}>
                        Expected Delivery
                      </span>
                      <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                        :
                      </span>
                      <span className="field-value" style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                        {currentPO.expectedDate || '2026-08-22'}
                      </span>
                    </div>
                    <div className="label-value-pair" style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="field-label" style={{ width: 115, fontSize: 13, fontWeight: 500, color: '#64748b', flexShrink: 0 }}>
                        Total Amount
                      </span>
                      <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                        :
                      </span>
                      <span className="field-value" style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                        ${currentPO.totalAmount ? currentPO.totalAmount.toLocaleString() : '6,500'}
                      </span>
                    </div>
                  </div>

                  {/* Column 3: Vendor Information */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="label-value-pair" style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="field-label" style={{ width: 105, fontSize: 13, fontWeight: 500, color: '#64748b', flexShrink: 0 }}>
                        Vendor Code
                      </span>
                      <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                        :
                      </span>
                      <span className="field-value" style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                        {currentPO.vendorCode || 'V000374'}
                      </span>
                    </div>
                    <div className="label-value-pair" style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="field-label" style={{ width: 105, fontSize: 13, fontWeight: 500, color: '#64748b', flexShrink: 0 }}>
                        Vendor Name
                      </span>
                      <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                        :
                      </span>
                      <span className="field-value" style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>
                        {currentPO.supplier}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Line Items Breakdown */}
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
                  <InboxOutlined style={{ color: '#ca8504' }} />
                  <span>Line Items ({(currentPO.items || []).length})</span>
                </div>
                <Table
                  size="small"
                  dataSource={enrichedPoRows}
                  rowKey="rowKey"
                  pagination={false}
                  className="po-custom-table"
                  columns={[
                    {
                      title: 'Item Code',
                      dataIndex: 'code',
                      key: 'code',
                      width: 120,
                      render: (_, r: any) =>
                        r.isMainRow ? (
                          <Text strong style={{ color: '#334155' }}>{r.code}</Text>
                        ) : (
                          <div style={{ paddingLeft: 8 }}>
                            <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>↳</span>
                          </div>
                        ),
                    },
                    {
                      title: 'Item Description',
                      dataIndex: 'name',
                      key: 'name',
                      render: (_, r: any) =>
                        r.isMainRow ? (
                          <span style={{ fontWeight: 500 }}>{r.name}</span>
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>—</span>
                        ),
                    },
                    {
                      title: 'Order Qty',
                      dataIndex: 'poQty',
                      key: 'poQty',
                      width: 110,
                      render: (_, r: any) =>
                        r.isMainRow ? (
                          <span>{(r.poQty || 0).toLocaleString()} {r.uom}</span>
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>—</span>
                        ),
                    },
                    {
                      title: 'IR Qty',
                      dataIndex: 'receivedQty',
                      key: 'irQty',
                      width: 110,
                      render: (_, r: any) => (
                        <span style={{ color: '#0f172a', fontWeight: 600 }}>
                          {(r.receivedQty || 0).toLocaleString()} {r.uom}
                        </span>
                      ),
                    },
                    {
                      title: 'Pending Qty',
                      dataIndex: 'remainingQty',
                      key: 'remainingQty',
                      width: 120,
                      render: (_, r: any) => {
                        if (!r.isMainRow) return <span style={{ color: '#cbd5e1' }}>—</span>;
                        const rem = r.remainingQty || 0;
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span
                              style={{
                                fontWeight: 700,
                                color: rem > 0 ? '#ea580c' : '#94a3b8',
                                fontSize: 14,
                              }}
                            >
                              {rem.toLocaleString()}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>
                              {r.uom}
                            </span>
                          </div>
                        );
                      },
                    },
                    {
                      title: 'IR Schedule #',
                      dataIndex: 'irScheduleNumber',
                      key: 'irScheduleNumber',
                      width: 140,
                      hidden: linkedIRs.length === 0,
                      render: (_, r: any) => {
                        if (r.irScheduleNumber === '—') {
                          return <span style={{ color: '#94a3b8' }}>—</span>;
                        }
                        return (
                          <span
                            className="po-link"
                            style={{ fontWeight: 600, color: '#2563eb', cursor: 'pointer' }}
                            onClick={() => {
                              if (r.planRef) {
                                setSelectedPODetail(null);
                                setSelectedPlanDetail(r.planRef);
                              }
                            }}
                          >
                            {r.irScheduleNumber}
                          </span>
                        );
                      },
                    },
                    {
                      title: 'IR Status',
                      dataIndex: 'irStatus',
                      key: 'irStatus',
                      width: 110,
                      hidden: linkedIRs.length === 0,
                      render: (status: string) =>
                        status === '—' ? (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        ) : (
                          <InboundStatusBadge type="deliveryPlan" value={status} />
                        ),
                    },
                  ]}
                />
              </div>
              <RelatedActivity receipts={linkedGRs} plans={linkedIRs} />
            </div>
          );
        })()}
      </Drawer>

      {/* 6. IR Schedule (IR Plan) Drawer */}
      <Drawer rootClassName="inbound-detail"
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: 24 }}>
            <Space size={10}>
              <FileTextOutlined style={{ color: '#2563eb', fontSize: 18 }} />
              <span style={{ fontWeight: 700, fontSize: 16 }}>
                IR Schedule: {selectedPlanDetail?.irPlanNumber}
              </span>
              {selectedPlanDetail?.deliveryPlanNumber && (
                <Tag color="cyan">{selectedPlanDetail.deliveryPlanNumber}</Tag>
              )}
            </Space>
            {selectedPlanDetail && (
              <InboundStatusBadge type="deliveryPlan" value={selectedPlanDetail.status || 'Pending'} />
            )}
          </div>
        }
        open={!!selectedPlanDetail}
        onClose={() => setSelectedPlanDetail(null)}
        width={920}
        styles={{ body: { padding: '20px 24px', background: '#f8fafc' } }}
        footer={null}
      >
        {selectedPlanDetail && (
          <div className="detail-drawer-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {selectedPlanDetail.parentIrNumber && (
              <Alert
                type="info"
                showIcon
                message={`${selectedPlanDetail.qcFollowUpType === 'ON_HOLD' ? 'On-Hold' : 'Rejected'} follow-up from ${selectedPlanDetail.parentIrNumber}`}
                description="Existing stock for OMM at WH-02. This child IR is for QC traceability and does not create another PO delivery."
              />
            )}
            {/* 1. Planning Overview Header Card */}
            <div
              className="po-figma-details-card"
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
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
                  color: '#0f172a',
                  marginBottom: 14,
                  lineHeight: 1.2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <CalendarOutlined style={{ color: '#2563eb' }} />
                <span>IR Schedule Details</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: 24 }}>
                {/* Column 1: Schedule & PO Reference */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="label-value-pair" style={{ display: 'flex', alignItems: 'center' }}>
                    <span className="field-label" style={{ width: 105, fontSize: 13, fontWeight: 500, color: '#64748b', flexShrink: 0 }}>
                      IR Schedule #
                    </span>
                    <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                      :
                    </span>
                    <span className="field-value" style={{ fontSize: 14, fontWeight: 700, color: '#2563eb' }}>
                      {selectedPlanDetail.irPlanNumber}
                    </span>
                  </div>
                  <div className="label-value-pair" style={{ display: 'flex', alignItems: 'center' }}>
                    <span className="field-label" style={{ width: 105, fontSize: 13, fontWeight: 500, color: '#64748b', flexShrink: 0 }}>
                      PO #
                    </span>
                    <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                      :
                    </span>
                    <span className="field-value" style={{ fontSize: 14, fontWeight: 600 }}>
                      {(() => {
                        const poList = (selectedPlanDetail.poNumbers && selectedPlanDetail.poNumbers.length > 0)
                          ? selectedPlanDetail.poNumbers
                          : [selectedPlanDetail.items?.[0]?.poNumber || '26000977'];

                        return poList.map((poNum, pIdx) => (
                          <span key={poNum}>
                            {pIdx > 0 && <span style={{ color: '#94a3b8', margin: '0 4px' }}>, </span>}
                            <span
                              className="po-link"
                              style={{ color: '#2563eb', fontWeight: 600, cursor: 'pointer' }}
                              onClick={() => {
                                const foundPo = purchaseOrders.find((p) => p.poNumber === poNum) || {
                                  poNumber: poNum,
                                  docNum: poNum,
                                  supplier: selectedPlanDetail.vendor,
                                  docDate: selectedPlanDetail.createdAt?.split(' ')[0] || '2026-08-22',
                                  expectedDate: selectedPlanDetail.deliveryDate || '2026-08-27',
                                  docStatus: selectedPlanDetail.status === 'Completed' ? 'Closed' : selectedPlanDetail.status === 'Rejected' ? 'Rejected' : 'In Progress',
                                  totalQty: selectedPlanDetail.totalPlannedQty || 2000,
                                  totalAmount: 6500,
                                  items: selectedPlanDetail.items?.map((it) => ({
                                    code: it.itemCode,
                                    name: it.itemName,
                                    poQty: it.totalPoQty || it.allocatedQty,
                                    receivedQty: it.allocatedQty,
                                    remainingQty: it.remainingQty || 0,
                                    uom: it.uom,
                                  })) || [],
                                };
                                setSelectedPlanDetail(null);
                                setSelectedPODetail(foundPo as any);
                              }}
                            >
                              {poNum}
                            </span>
                          </span>
                        ));
                      })()}
                    </span>
                  </div>
                </div>

                {/* Column 2: Vendor Information */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="label-value-pair" style={{ display: 'flex', alignItems: 'center' }}>
                    <span className="field-label" style={{ width: 105, fontSize: 13, fontWeight: 500, color: '#64748b', flexShrink: 0 }}>
                      Vendor Code
                    </span>
                    <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                      :
                    </span>
                    <span className="field-value" style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                      {purchaseOrders.find((p) => selectedPlanDetail.poNumbers?.includes(p.poNumber))?.vendorCode || (selectedPlanDetail as any).vendorCode || 'V000374'}
                    </span>
                  </div>
                  <div className="label-value-pair" style={{ display: 'flex', alignItems: 'center' }}>
                    <span className="field-label" style={{ width: 105, fontSize: 13, fontWeight: 500, color: '#64748b', flexShrink: 0 }}>
                      Vendor Name
                    </span>
                    <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                      :
                    </span>
                    <span className="field-value" style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>
                      {selectedPlanDetail.vendor}
                    </span>
                  </div>
                </div>

                {/* Column 3: Creation Audit Information */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="label-value-pair" style={{ display: 'flex', alignItems: 'center' }}>
                    <span className="field-label" style={{ width: 105, fontSize: 13, fontWeight: 500, color: '#64748b', flexShrink: 0 }}>
                      Created By
                    </span>
                    <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                      :
                    </span>
                    <span className="field-value" style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>
                      {selectedPlanDetail.createdBy || 'Keo Srey'}
                    </span>
                  </div>
                  <div className="label-value-pair" style={{ display: 'flex', alignItems: 'center' }}>
                    <span className="field-label" style={{ width: 105, fontSize: 13, fontWeight: 500, color: '#64748b', flexShrink: 0 }}>
                      Created Date
                    </span>
                    <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                      :
                    </span>
                    <span className="field-value" style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>
                      {selectedPlanDetail.createdAt || '2026-08-22'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Delivery Note & Vendor Documentation Details Card */}
            {(selectedPlanDetail.deliveryNoteNumber || (selectedPlanDetail.attachments && selectedPlanDetail.attachments.length > 0)) && (
              <div
                className="po-figma-details-card"
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '16px 20px',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                }}
              >
                <div
                  className="po-card-title"
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#0f172a',
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <FileTextOutlined style={{ color: '#B49A00' }} />
                  <span>Documents</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div className="label-value-pair" style={{ display: 'flex', alignItems: 'center' }}>
                    <span className="field-label" style={{ width: 110, fontSize: 13, fontWeight: 500, color: '#64748b', flexShrink: 0 }}>
                      Delivery Note #
                    </span>
                    <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>:</span>
                    <span className="field-value" style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                      {selectedPlanDetail.deliveryNoteNumber || '—'}
                    </span>
                  </div>
                  <div className="label-value-pair" style={{ display: 'flex', alignItems: 'center' }}>
                    <span className="field-label" style={{ width: 110, fontSize: 13, fontWeight: 500, color: '#64748b', flexShrink: 0 }}>
                      Delivery Date
                    </span>
                    <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>:</span>
                    <span className="field-value" style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>
                      {selectedPlanDetail.deliveryNoteDate || selectedPlanDetail.deliveryDate || '—'}
                    </span>
                  </div>
                  <div className="label-value-pair" style={{ display: 'flex', alignItems: 'center' }}>
                    <span className="field-label" style={{ width: 110, fontSize: 13, fontWeight: 500, color: '#64748b', flexShrink: 0 }}>
                      Supporting Files
                    </span>
                    <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {selectedPlanDetail.attachments && selectedPlanDetail.attachments.length > 0 ? (
                        selectedPlanDetail.attachments.map((att, aIdx) => (
                          <Tag
                            key={aIdx}
                            icon={<PaperClipOutlined style={{ color: '#B49A00' }} />}
                            color="default"
                            style={{ margin: 0, borderRadius: 4, fontSize: 12 }}
                          >
                            {att.name}
                          </Tag>
                        ))
                      ) : (
                        <span style={{ color: '#94a3b8' }}>None</span>
                      )}
                    </div>
                  </div>
                </div>
                {selectedPlanDetail.deliveryNoteRemark && (
                  <div
                    style={{
                      marginTop: 12,
                      fontSize: 13,
                      color: '#475569',
                      background: '#f8fafc',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid #f1f5f9',
                    }}
                  >
                    <span style={{ fontWeight: 600, color: '#334155' }}>Vendor Note: </span>
                    {selectedPlanDetail.deliveryNoteRemark}
                  </div>
                )}
              </div>
            )}

            {/* 2. Scheduled Line Items & Allocation Breakdown */}
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
                <InboxOutlined style={{ color: '#ca8504' }} />
                <span>Planned Line Items & Allocation ({selectedPlanDetail.items?.length || 0})</span>
              </div>
              <Table
                size="small"
                dataSource={(selectedPlanDetail.items || []).flatMap((item, itemIdx) => {
                  if (item.schedules && item.schedules.length > 0) {
                    return item.schedules.map((sched, sIdx) => ({
                      rowKey: `${item.itemCode || itemIdx}-${sIdx}`,
                      isMainRow: sIdx === 0,
                      itemCode: item.itemCode,
                      itemName: item.itemName,
                      poNumber: item.poNumber || selectedPlanDetail.poNumbers?.[0] || '26000977',
                      totalPoQty: item.totalPoQty || item.allocatedQty,
                      uom: item.uom,
                      irQty: sched.plannedQty,
                      remainingQty: selectedPlanDetail.status === 'Completed' ? 0 : item.remainingQty,
                      deliveryDate: sched.deliveryDate || selectedPlanDetail.deliveryDate,
                      parentItem: item,
                    }));
                  }
                  return [
                    {
                      rowKey: `${item.itemCode || itemIdx}-0`,
                      isMainRow: true,
                      itemCode: item.itemCode,
                      itemName: item.itemName,
                      poNumber: item.poNumber || selectedPlanDetail.poNumbers?.[0] || '26000977',
                      totalPoQty: item.totalPoQty || item.allocatedQty,
                      uom: item.uom,
                      irQty: item.allocatedQty,
                      remainingQty: selectedPlanDetail.status === 'Completed' ? 0 : item.remainingQty,
                      deliveryDate: selectedPlanDetail.deliveryDate,
                      parentItem: item,
                    },
                  ];
                })}
                rowKey="rowKey"
                pagination={false}
                className="po-custom-table"
                columns={[
                  {
                    title: 'Item Code',
                    dataIndex: 'itemCode',
                    key: 'itemCode',
                    width: 120,
                    render: (_, r: any) => {
                      if (r.isMainRow) {
                        return <Text strong style={{ color: '#334155' }}>{r.itemCode}</Text>;
                      }
                      return (
                        <div style={{ paddingLeft: 8 }}>
                          <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>↳</span>
                        </div>
                      );
                    },
                  },
                  {
                    title: 'Item Description',
                    dataIndex: 'itemName',
                    key: 'itemName',
                    render: (_, r: any) =>
                      r.isMainRow ? (
                        <span style={{ fontWeight: 500 }}>{r.itemName}</span>
                      ) : (
                        <span style={{ color: '#cbd5e1' }}>—</span>
                      ),
                  },
                  {
                    title: 'Order Qty',
                    dataIndex: 'totalPoQty',
                    key: 'totalPoQty',
                    width: 110,
                    render: (_, r: any) =>
                      r.isMainRow ? `${(r.totalPoQty || 0).toLocaleString()} ${r.uom}` : <span style={{ color: '#cbd5e1' }}>—</span>,
                  },
                  {
                    title: 'IR Qty',
                    dataIndex: 'irQty',
                    key: 'irQty',
                    width: 120,
                    render: (_, r: any) => (
                      <span style={{ fontWeight: 600, color: (r.irQty || 0) > 0 ? '#2563eb' : '#94a3b8' }}>
                        {(r.irQty || 0).toLocaleString()} <span style={{ fontSize: 11, color: '#94a3b8' }}>{r.uom}</span>
                      </span>
                    ),
                  },
                  {
                    title: 'Pending Qty',
                    dataIndex: 'remainingQty',
                    key: 'remainingQty',
                    width: 120,
                    render: (_, r: any) => {
                      if (!r.isMainRow) return <span style={{ color: '#cbd5e1' }}>—</span>;
                      const rem = r.remainingQty !== undefined ? r.remainingQty : Math.max(0, (r.totalPoQty || 0) - (r.irQty || 0));
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span
                            style={{
                              fontWeight: 700,
                              color: rem > 0 ? '#ea580c' : '#94a3b8',
                              fontSize: 14,
                            }}
                          >
                            {rem.toLocaleString()}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>
                            {r.uom}
                          </span>
                        </div>
                      );
                    },
                  },
                  {
                    title: 'IR Schedule Date',
                    dataIndex: 'deliveryDate',
                    key: 'deliveryDate',
                    width: 135,
                    render: (date: string) => <span>{date || selectedPlanDetail.deliveryDate || '2026-08-27'}</span>,
                  },
                ]}
              />
            </div>
            <RelatedActivity receipts={receipts.filter(receipt => receipt.irPlanNumber === selectedPlanDetail.irPlanNumber)} plans={[selectedPlanDetail]} />
          </div>
        )}
      </Drawer>
    </div>
  );
};
