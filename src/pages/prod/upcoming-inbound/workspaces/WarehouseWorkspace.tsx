import { RowActionButton, rowActionColumn } from '../shared/ui/RowActionButton';
import { RelatedActivity } from '../features/shared/RelatedActivity';
import { formatQuantities, getPostingQuantity } from '../core/quantity';
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
  Modal,
  Drawer,
  Form,
  DatePicker,
  TimePicker,
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
import {
  InboxOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  EyeOutlined,
  SafetyCertificateOutlined,
  CarOutlined,
  PhoneOutlined,
  FileDoneOutlined,
  SendOutlined,
  SaveOutlined,
  WarningOutlined,
  BarcodeOutlined,
  SyncOutlined,
  ReloadOutlined,
  FileTextOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  PaperClipOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type {
  GoodsReceipt,
  GRItem,
  ItemBatch,
  IRPlan,
} from '../core/type';
import { InboundStatusBadge } from '../features/shared/InboundStatusBadge';
import { AuditTrailTimeline } from '../features/shared/AuditTrailTimeline';
import { getReceiptIrNumber } from '../core/workflow/goods-receipt';
import './ProcurementWorkspace.less';

const { Text } = Typography;
const { RangePicker } = DatePicker;
const STORAGE_WAREHOUSE_OPTIONS = [
  { label: 'WHM1 - Main Raw Materials', value: 'WHM1 - Main Raw Materials' },
  { label: 'WHM2 - Packaging', value: 'WHM2 - Packaging' },
  { label: 'WHM3 - Finished Goods', value: 'WHM3 - Finished Goods' },
];

export interface WarehouseWorkspaceProps {
  receipts: GoodsReceipt[];
  irPlans: IRPlan[];
  onSaveGR: (gr: GoodsReceipt) => void;
  onSubmitToQC: (gr: GoodsReceipt) => void;
  onRefresh: () => void;
  onNavigateToRole?: (role: 'PROCUREMENT' | 'WAREHOUSE' | 'QC' | 'SUPERVISOR' | 'AUDIT_TIMELINE') => void;
}

export const WarehouseWorkspace: React.FC<WarehouseWorkspaceProps> = ({
  receipts,
  irPlans,
  onSaveGR,
  onSubmitToQC,
  onRefresh,
  onNavigateToRole,
}) => {
  const [activeTab, setActiveTab] = useState<string>('TO_RECEIVE');
  const [workspaceView, setWorkspaceView] = useState<'list' | 'physical-receive'>('list');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<any>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<GoodsReceipt | null>(null);
  const [selectedIRPlan, setSelectedIRPlan] = useState<IRPlan | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [isTempGrModalOpen, setIsTempGrModalOpen] = useState<boolean>(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState<boolean>(false);
  const [isIRPlanDrawerOpen, setIsIRPlanDrawerOpen] = useState<boolean>(false);

  // Dedicated Physical Receiving Form State
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState<string>('');
  const [deliveryNoteDate, setDeliveryNoteDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [deliveryNoteRemark, setDeliveryNoteRemark] = useState<string>('');
  const [truckPlateNumber, setTruckPlateNumber] = useState<string>('PP-2AB-9988');
  const [driverName, setDriverName] = useState<string>('Sokha Men');
  const [driverContact, setDriverContact] = useState<string>('+855 12 889 001');
  const [actualArrivalDate, setActualArrivalDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [actualArrivalTime, setActualArrivalTime] = useState<dayjs.Dayjs | null>(dayjs('09:15', 'HH:mm'));
  const [receiverWarehouse, setReceiverWarehouse] = useState<string>('');
  const [vendorAttachments, setVendorAttachments] = useState<{ uid: string; name: string; size?: number; type?: string; status?: string }[]>([]);

  // Open IR Plan Drawer with dynamic fallback if not found in irPlans
  const handleOpenIRPlan = (irNumber?: string, fallbackReceipt?: GoodsReceipt) => {
    if (!irNumber && !fallbackReceipt) return;
    const plan = irPlans.find((p) => p.irPlanNumber === irNumber || p.id === irNumber);
    if (plan) {
      setSelectedIRPlan(plan);
      const linkedReceipt = fallbackReceipt || receipts.find((r) => r.irPlanNumber === plan.irPlanNumber || r.id === (plan as any).id || (plan.poNumbers && plan.poNumbers.includes(r.poNumber)));
      if (linkedReceipt) {
        setSelectedReceipt(linkedReceipt);
      }
      setIsIRPlanDrawerOpen(true);
    } else if (fallbackReceipt) {
      const isCompleted = fallbackReceipt.deliveryPlanStatus === 'Received' || fallbackReceipt.deliveryPlanStatus === 'Posted' || fallbackReceipt.deliveryPlanStatus === 'QC Completed';
      const fallbackPlan: IRPlan = {
        id: fallbackReceipt.irPlanNumber || irNumber || 'IR-TEMP',
        irPlanNumber: fallbackReceipt.irPlanNumber || irNumber || 'IR-TEMP',
        deliveryPlanNumber: fallbackReceipt.deliveryPlanNumber || 'Plan 1',
        vendor: fallbackReceipt.supplier || 'Vendor',
        poNumbers: fallbackReceipt.poReferences?.map((p) => p.poNumber) || (fallbackReceipt.poNumber ? [fallbackReceipt.poNumber] : []),
        deliveryDate: fallbackReceipt.expectedDate || '2026-08-27',
        status: (isCompleted ? 'Completed' : fallbackReceipt.deliveryPlanStatus === 'In Progress' ? 'In Progress' : 'Confirmed') as any,
        items: fallbackReceipt.items.map((it, idx) => ({
          id: `item-${idx}`,
          poNumber: it.poNumber || fallbackReceipt.poNumber || '',
          itemCode: it.code,
          itemName: it.name,
          uom: it.uom,
          totalPoQty: it.poQty || it.plannedQty || 0,
          allocatedQty: it.plannedQty || it.poQty || 0,
          remainingQty: 0,
          schedules: [],
        })),
        totalPlannedQty: fallbackReceipt.items.reduce((s, i) => s + (i.plannedQty || i.poQty || 0), 0),
        totalItems: fallbackReceipt.items.length,
        createdBy: 'Keo Srey',
        createdAt: '2026-08-22',
        notes: fallbackReceipt.deliveryNoteRemark || 'Standard Delivery Plan',
      };
      setSelectedIRPlan(fallbackPlan);
      setSelectedReceipt(fallbackReceipt);
      setIsIRPlanDrawerOpen(true);
    }
  };

  // Active Receiving State
  const [receivingForm] = Form.useForm();
  const [activeItems, setActiveItems] = useState<GRItem[]>([]);
  const [dnValue, setDnValue] = useState<string>('');

  // Temp GR Form
  const [tempGrForm] = Form.useForm();

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: receipts.length,
      toReceive: receipts.filter((r) => r.deliveryPlanStatus === 'To Receive' || !r.deliveryPlanStatus).length,
      waitingQC: receipts.filter((r) => r.deliveryPlanStatus === 'Waiting for QC' || r.processState === 'QC_PENDING').length,
      completed: receipts.filter((r) => r.deliveryPlanStatus === 'Received' || r.deliveryPlanStatus === 'Posted' || r.deliveryPlanStatus === 'QC Completed').length,
      today: receipts.filter((r) => r.expectedDate?.includes('27-08-2026') || r.actualReceiptDate?.includes('27-08-2026')).length,
      overdue: receipts.filter((r) => r.expectedDate?.includes('26-08-2026') || r.irPlanNumber === 'IR0002').length,
    };
  }, [receipts]);

  // Filter receipts
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      // 1. Tab Filter
      if (activeTab === 'TO_RECEIVE' && !(r.deliveryPlanStatus === 'To Receive' || !r.deliveryPlanStatus)) {
        return false;
      }
      if (activeTab === 'WAITING_QC' && !(r.deliveryPlanStatus === 'Waiting for QC' || r.processState === 'QC_PENDING')) {
        return false;
      }
      if (activeTab === 'COMPLETED' && !(r.deliveryPlanStatus === 'Received' || r.deliveryPlanStatus === 'Posted' || r.deliveryPlanStatus === 'QC Completed')) {
        return false;
      }

      // 2. Status Dropdown Filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'OVERDUE' && !(r.expectedDate?.includes('26-08-2026') || r.irPlanNumber === 'IR0002')) {
          return false;
        }
        if (statusFilter !== 'OVERDUE' && r.deliveryPlanStatus !== statusFilter) {
          return false;
        }
      }

      // 3. Warehouse Filter
      if (warehouseFilter !== 'ALL') {
        const whMatch = (r.receiverWarehouseName && r.receiverWarehouseName.includes(warehouseFilter)) ||
          r.items?.some((it: any) => it.warehouseCode === warehouseFilter);
        if (!whMatch) return false;
      }

      // 4. Search Filter
      if (searchTerm) {
        const q = searchTerm.toLowerCase().trim();
        const matchesGR = [getReceiptIrNumber(r), r.grNumber, r.sapDocNum, r.sapGrNumber]
          .some(number => number?.toLowerCase().includes(q));
        const matchesIR = r.irPlanNumber?.toLowerCase().includes(q);
        const matchesSupplier = r.supplier?.toLowerCase().includes(q);
        const matchesDN = r.deliveryNoteNumber?.toLowerCase().includes(q);
        const matchesPO = r.poNumber?.toLowerCase().includes(q);
        const matchesDriver = r.driverName?.toLowerCase().includes(q);
        const matchesTruck = r.truckPlateNumber?.toLowerCase().includes(q);
        const matchesItem = r.items?.some(
          (it) =>
            it.code.toLowerCase().includes(q) ||
            it.name.toLowerCase().includes(q) ||
            it.batches?.some((b) => b.batchNumber?.toLowerCase().includes(q)),
        );
        if (!matchesGR && !matchesIR && !matchesSupplier && !matchesDN && !matchesPO && !matchesDriver && !matchesTruck && !matchesItem) {
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

  // Start physical receiving from an IR Plan or existing GR
  const handleStartReceiving = (receipt: GoodsReceipt) => {
    setSelectedReceipt(receipt);
    const clonedItems: GRItem[] = (receipt.items || []).map((it, idx) => {
      const planned = it.plannedQty || it.poQty || 0;
      const rec = it.receiveQty !== undefined ? it.receiveQty : (it.actualReceivedQty !== undefined ? it.actualReceivedQty : planned);
      const batches: ItemBatch[] = (it.batches && it.batches.length > 0)
        ? JSON.parse(JSON.stringify(it.batches))
        : [
            {
              id: `batch-${Date.now()}-${idx}`,
              batchNumber: `LOT-${dayjs().format('YYYYMM')}-${String(idx + 1).padStart(2, '0')}`,
              batchQty: rec,
              productionDate: dayjs().subtract(10, 'day').format('YYYY-MM-DD'),
              expiryDate: dayjs().add(2, 'year').format('YYYY-MM-DD'),
              bestBeforeDate: dayjs().add(2, 'year').format('YYYY-MM-DD'),
              remark: 'Standard Intake Lot',
            },
          ];
      return {
        ...it,
        plannedQty: planned,
        receiveQty: rec,
        actualReceivedQty: rec,
        isMissing: rec < planned,
        missingRemark: it.missingRemark || '',
        batches,
      };
    });

    const linkedPlan = irPlans.find(
      (p) =>
        p.irPlanNumber === receipt.irPlanNumber ||
        p.id === receipt.irPlanNumber ||
        (receipt.poNumber && p.poNumbers?.includes(receipt.poNumber)),
    );

    let initialAttachments: { uid: string; name: string; size?: number; type?: string; status?: string }[] = [];
    if (receipt.documentChecklist?.supportingDocs && receipt.documentChecklist.supportingDocs.length > 0) {
      initialAttachments = receipt.documentChecklist.supportingDocs.map((doc: any, i: number) => ({
        uid: `${i}`,
        name: typeof doc === 'string' ? doc : (doc.fileName || `Attachment-${i + 1}`),
        size: 1024,
        type: 'application/pdf',
        status: 'done',
      }));
    } else if (linkedPlan?.attachments && linkedPlan.attachments.length > 0) {
      initialAttachments = linkedPlan.attachments.map((att: any, i: number) => ({
        uid: att.uid || `att-${i}`,
        name: att.name || `Attachment-${i + 1}`,
        size: att.size || 1024,
        type: att.type || 'application/pdf',
        status: 'done',
      }));
    } else {
      // Default standard vendor delivery attachments from Procurement
      initialAttachments = [
        {
          uid: 'att-default-1',
          name: `Delivery_Note_${receipt.poNumber || receipt.grNumber || 'Vendor'}.pdf`,
          size: 245000,
          type: 'application/pdf',
          status: 'done',
        },
        {
          uid: 'att-default-2',
          name: `Vendor_Packing_Slip_${receipt.supplier || 'Vendor'}.pdf`,
          size: 184000,
          type: 'application/pdf',
          status: 'done',
        },
      ];
    }

    setActiveItems(clonedItems);
    setDeliveryNoteNumber(
      receipt.deliveryNoteNumber && !receipt.deliveryNoteNumber.startsWith('DN-TEMP')
        ? receipt.deliveryNoteNumber
        : linkedPlan?.deliveryNoteNumber || receipt.deliveryNoteNumber || `DN-${receipt.grNumber?.slice(-4) || '2026'}`
    );
    setDeliveryNoteDate(
      receipt.actualArrivalDate
        ? dayjs(receipt.actualArrivalDate)
        : linkedPlan?.deliveryNoteDate
          ? dayjs(linkedPlan.deliveryNoteDate)
          : dayjs()
    );
    setDeliveryNoteRemark(receipt.deliveryNoteRemark || linkedPlan?.deliveryNoteRemark || '');
    setTruckPlateNumber(receipt.truckPlateNumber || 'PP-2AB-9988');
    setDriverName(receipt.driverName || 'Sokha Men');
    setDriverContact(receipt.driverContact || '+855 12 889 001');
    setActualArrivalDate(receipt.actualArrivalDate ? dayjs(receipt.actualArrivalDate) : dayjs());
    setActualArrivalTime(receipt.actualArrivalTime ? dayjs(receipt.actualArrivalTime, 'HH:mm') : dayjs('09:15', 'HH:mm'));
    setReceiverWarehouse(receipt.storageWarehouseConfirmed ? receipt.receiverWarehouseName : '');
    setVendorAttachments(initialAttachments);
    setWorkspaceView('physical-receive');
  };

  // Add batch to item
  const handleAddBatch = (itemIndex: number) => {
    const updated = [...activeItems];
    const targetItem = updated[itemIndex];
    if (!targetItem.batches) targetItem.batches = [];

    const totalBatchQty = targetItem.batches.reduce((sum, b) => sum + (Number(b.batchQty) || 0), 0);
    const remainingQty = Math.max(0, targetItem.receiveQty - totalBatchQty);

    targetItem.batches.push({
      id: `batch-${Date.now()}-${targetItem.batches.length + 1}`,
      batchNumber: `LOT-${dayjs().format('YYYYMM')}-${targetItem.batches.length + 1}`,
      batchQty: remainingQty > 0 ? remainingQty : 0,
      productionDate: dayjs().subtract(10, 'day').format('YYYY-MM-DD'),
      expiryDate: dayjs().add(2, 'year').format('YYYY-MM-DD'),
      bestBeforeDate: dayjs().add(2, 'year').format('YYYY-MM-DD'),
      remark: 'Split lot',
    });

    setActiveItems(updated);
  };

  // Remove batch
  const handleRemoveBatch = (itemIndex: number, batchIndex: number) => {
    const updated = [...activeItems];
    if (updated[itemIndex].batches && updated[itemIndex].batches!.length > 1) {
      updated[itemIndex].batches!.splice(batchIndex, 1);
      setActiveItems(updated);
    } else {
      message.warning('At least one batch record is required for each received item.');
    }
  };

  // Update item receive qty
  const handleUpdateItemReceiveQty = (itemIndex: number, qty: number) => {
    const updated = [...activeItems];
    const item = updated[itemIndex];
    item.receiveQty = qty;
    item.actualReceivedQty = qty;
    const planned = item.plannedQty || item.poQty || 0;
    item.isMissing = qty < planned;
    if (qty >= planned) {
      item.missingRemark = '';
    }
    // Auto-sync single batch if only 1 batch exists
    if (item.batches && item.batches.length === 1) {
      item.batches[0].batchQty = qty;
    }
    setActiveItems(updated);
  };

  // Update item discrepancy remark
  const handleUpdateItemMissingRemark = (itemIndex: number, remark: string) => {
    const updated = [...activeItems];
    updated[itemIndex].missingRemark = remark;
    setActiveItems(updated);
  };

  // Update batch field
  const handleUpdateBatchField = (
    itemIndex: number,
    batchIndex: number,
    field: keyof ItemBatch,
    value: any,
  ) => {
    const updated = [...activeItems];
    if (updated[itemIndex].batches && updated[itemIndex].batches![batchIndex]) {
      (updated[itemIndex].batches![batchIndex] as any)[field] = value;
      setActiveItems(updated);
    }
  };

  // Validate receiving and proceed to Review GR (WH-04)
  const handleProceedToReview = () => {
    if (!receiverWarehouse) {
      message.error('Select the warehouse where the received goods will be stored.');
      return;
    }
    if (!deliveryNoteNumber?.trim()) {
      message.error('Delivery Note No. is required (or enter NA with remark).');
      return;
    }
    if (deliveryNoteNumber === 'NA' && !deliveryNoteRemark?.trim()) {
      message.error('Remark / Reason is strictly mandatory when Delivery Note is NA.');
      return;
    }

    for (const item of activeItems) {
      const planned = item.plannedQty || item.poQty || 0;
      const totalBatch = (item.batches || []).reduce((sum, b) => sum + (Number(b.batchQty) || 0), 0);
      if (totalBatch !== item.receiveQty) {
        message.error(
          `Item ${item.code}: Sum of Batch Qty (${totalBatch}) must equal Actual Received Qty (${item.receiveQty}).`,
        );
        return;
      }
      if (item.receiveQty < planned && !item.missingRemark?.trim()) {
        message.error(
          `Item ${item.code} has missing discrepancy (${planned - item.receiveQty} missing). Discrepancy remark is required.`,
        );
        return;
      }
    }

    setIsReviewModalOpen(true);
  };

  // Final submit to QC (WH-04 -> WH-05)
  const handleConfirmSubmitToQC = () => {
    if (!selectedReceipt) return;
    if (!receiverWarehouse) {
      message.error('Select the storage warehouse before submitting to QC.');
      return;
    }

    const updatedReceipt: GoodsReceipt = {
      ...selectedReceipt,
      deliveryNoteNumber,
      deliveryNoteRemark,
      truckPlateNumber,
      driverName,
      driverContact,
      actualArrivalDate: actualArrivalDate ? actualArrivalDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
      actualArrivalTime: actualArrivalTime ? actualArrivalTime.format('HH:mm') : dayjs().format('HH:mm'),
      receiverWarehouseName: receiverWarehouse,
      storageWarehouseConfirmed: true,
      deliveryPlanStatus: 'Waiting for QC',
      processState: 'QC_PENDING',
      displayStatus: 'Under QC Inspection',
      items: activeItems,
      documentChecklist: {
        ...(selectedReceipt.documentChecklist || { vendorDN: true, goodsReceiptPOForm: false, pmrmStockCardForm: false }),
        supportingDocs: vendorAttachments.map((f) => ({
          fileName: f.name,
          source: 'WAREHOUSE' as const,
        })),
      },
      activities: [
        ...(selectedReceipt.activities || []),
        {
          id: `act-${Date.now()}`,
          title: 'Physical Receiving Completed',
          description: `Received ${formatQuantities(activeItems, i => i.receiveQty ?? 0)} across ${activeItems.reduce((s, i) => s + (i.batches?.length || 0), 0)} batches. Stored in ${receiverWarehouse}. Submitted to QC.`,
          performedBy: 'Warehouse (Demo)',
          timestamp: dayjs().format('YYYY-MM-DD HH:mm'),
          state: 'done',
        },
      ],
    };

    onSubmitToQC(updatedReceipt);
    message.success(`Receiving record ${getReceiptIrNumber(updatedReceipt)} successfully submitted to QC Inspection!`);
    setIsReviewModalOpen(false);
    setWorkspaceView('list');
  };

  // Save Receiving as Draft (WH-03 -> To Receive / In Progress)
  const handleSaveDraftReceiving = () => {
    if (!selectedReceipt) return;

    const draftReceipt: GoodsReceipt = {
      ...selectedReceipt,
      deliveryNoteNumber: deliveryNoteNumber || selectedReceipt.deliveryNoteNumber,
      deliveryNoteRemark: deliveryNoteRemark || selectedReceipt.deliveryNoteRemark,
      truckPlateNumber: truckPlateNumber || selectedReceipt.truckPlateNumber,
      driverName: driverName || selectedReceipt.driverName,
      driverContact: driverContact || selectedReceipt.driverContact,
      actualArrivalDate: actualArrivalDate ? actualArrivalDate.format('YYYY-MM-DD') : selectedReceipt.actualArrivalDate,
      actualArrivalTime: actualArrivalTime ? actualArrivalTime.format('HH:mm') : selectedReceipt.actualArrivalTime,
      receiverWarehouseName: receiverWarehouse || selectedReceipt.receiverWarehouseName,
      storageWarehouseConfirmed: Boolean(receiverWarehouse),
      deliveryPlanStatus: 'To Receive',
      items: activeItems,
      documentChecklist: {
        ...(selectedReceipt.documentChecklist || { vendorDN: true, goodsReceiptPOForm: false, pmrmStockCardForm: false }),
        supportingDocs: vendorAttachments.map((f) => ({
          fileName: f.name,
          source: 'WAREHOUSE' as const,
        })),
      },
      activities: [
        ...(selectedReceipt.activities || []),
        {
          id: `act-draft-${Date.now()}`,
          title: 'Physical Receiving Draft Saved',
          description: `Draft counts recorded by Warehouse (${formatQuantities(activeItems, i => i.receiveQty ?? 0)}).`,
          performedBy: 'Warehouse (Demo)',
          timestamp: dayjs().format('YYYY-MM-DD HH:mm'),
          state: 'done',
        },
      ],
    };

    onSaveGR(draftReceipt);
    setSelectedReceipt(draftReceipt);
    setIsReviewModalOpen(false);
    message.success(`Receiving record ${getReceiptIrNumber(draftReceipt)} draft saved.`);
    setWorkspaceView('list');
  };

  // Create Temporary GR
  const handleCreateTempGR = () => {
    tempGrForm.validateFields().then((vals) => {
      const temporaryNumber = `RCV-TMP-${Date.now()}`;
      const tempGr = {
        id: Date.now(),
        grNumber: temporaryNumber,
        receivingNumber: temporaryNumber,
        irPlanNumber: 'TEMP_UNPLANNED',
        deliveryPlanNumber: 'Unscheduled',
        poNumber: 'UNLINKED_PO',
        supplier: vals.vendor,
        expectedDate: dayjs().format('DD-MM-YYYY'),
        actualReceiptDate: dayjs().format('DD-MM-YYYY'),
        actualArrivalDate: dayjs().format('YYYY-MM-DD'),
        actualArrivalTime: dayjs().format('HH:mm'),
        deliveryNoteNumber: vals.dnNumber || 'NA',
        truckPlateNumber: vals.truckPlate || 'PP-TEMP-01',
        deliveryPlanStatus: 'To Receive',
        processState: 'STORED_ON_HOLD',
        receiverWarehouseName: 'WHM1 - Main Raw Materials',
        activities: [
          {
            id: `act-temp-${Date.now()}`,
            title: 'Temporary Receiving Record Created',
            description: `Unplanned truck arrival received. Reason: ${vals.reason}`,
            performedBy: 'Warehouse (Demo)',
            timestamp: dayjs().format('YYYY-MM-DD HH:mm'),
            state: 'done',
          },
        ],
        items: [
          {
            id: Date.now(),
            code: vals.itemCode || 'TEMP-ITEM-01',
            name: vals.itemName || 'Urgent Arrival Goods',
            poNumber: 'PENDING_LINK',
            supplier: vals.vendor,
            uom: vals.uom || 'EA',
            poQty: 0,
            plannedQty: 0,
            receiveQty: Number(vals.qty) || 100,
            actualReceivedQty: Number(vals.qty) || 100,
            batches: [
              {
                id: `b-temp-${Date.now()}`,
                batchNumber: vals.batchNo || `TMP-${dayjs().format('MMDD')}`,
                batchQty: Number(vals.qty) || 100,
                productionDate: dayjs().format('YYYY-MM-DD'),
                expiryDate: dayjs().add(2, 'year').format('YYYY-MM-DD'),
              },
            ],
          },
        ],
      } as GoodsReceipt;

      onSaveGR(tempGr);
      message.success(`Temporary receiving record ${getReceiptIrNumber(tempGr)} logged in Exception Queue.`);
      setIsTempGrModalOpen(false);
      tempGrForm.resetFields();
    });
  };

  const handleExport = (format: ExportFormat) => {
    exportReceipts('warehouse-receipts', filteredReceipts, format);
  };

  // Table Columns matching Procurement design
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
      title: 'SAP GR #',
      key: 'sapGrNumber',
      width: 130,
      render: (_: unknown, record: GoodsReceipt) =>
        record.sapDocNum?.trim() || record.sapGrNumber?.trim() || '—',
    },
    {
      title: 'Status',
      dataIndex: 'deliveryPlanStatus',
      key: 'status',
      width: 150,
      render: (status: string) => (
        <InboundStatusBadge type="deliveryPlan" value={status || 'To Receive'} />
      ),
    },
    {
      title: 'IR Schedule #',
      dataIndex: 'irPlanNumber',
      key: 'irPlanNumber',
      width: 120,
      render: (ir: string, record: GoodsReceipt) => (
        <span
          className="po-link"
          style={{ color: '#0f172a', fontWeight: 600 }}
          onClick={() => handleOpenIRPlan(ir, record)}
        >
          {ir || '—'}
        </span>
      ),
    },
    {
      title: 'Vendor',
      dataIndex: 'supplier',
      key: 'vendor',
      render: (sup: string) => <span className="vendor-name">{sup}</span>,
    },
    {
      title: 'Delivery Date',
      dataIndex: 'expectedDate',
      key: 'deliveryDate',
      width: 140,
      render: (date: string) => {
        const isOverdue = date?.includes('26-08-2026');
        return (
          <div>
            <Space size={4}>
              <ClockCircleOutlined style={{ color: isOverdue ? '#dc2626' : '#64748b' }} />
              <span style={{ color: isOverdue ? '#dc2626' : 'inherit', fontWeight: isOverdue ? 600 : 400 }}>
                {date || '27-08-2026'}
              </span>
            </Space>
            {isOverdue && (
              <Tag color="error" style={{ display: 'block', width: 'fit-content', marginTop: 2, fontSize: 10 }}>
                Overdue
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: 'PO #',
      key: 'poRefs',
      width: 130,
      render: (_: any, record: GoodsReceipt) => (
        <Space wrap size={4}>
          {record.poReferences?.map((p) => (
            <span key={p.poNumber} style={{ color: '#0f172a', fontWeight: 600 }}>
              {p.poNumber}
            </span>
          )) || (
            <span style={{ color: '#0f172a', fontWeight: 600 }}>
              {record.poNumber}
            </span>
          )}
        </Space>
      ),
    },
    {
      title: 'Items',
      key: 'items',
      width: 100,
      render: (_: any, record: GoodsReceipt) => (
        <span style={{ fontWeight: 500 }}>{record.items.length} item(s)</span>
      ),
    },
    {
      ...rowActionColumn,
      render: (_: any, record: GoodsReceipt) => {
        const canReceive =
          record.deliveryPlanStatus === 'To Receive' ||
          record.deliveryPlanStatus === 'In Progress' ||
          record.deliveryPlanStatus === 'Partially Received' ||
          !record.deliveryPlanStatus;

        return (
          <Space>
            {canReceive ? (
              <RowActionButton
                variant="primary"
                icon={<InboxOutlined />}
                onClick={() => {
                    handleStartReceiving(record);
                }}
              >
                <span>Receive Goods</span>
              </RowActionButton>
            ) : (
              <RowActionButton
                onClick={() => {
                    setSelectedReceipt(record);
                  setIsDetailDrawerOpen(true);
                }}
              >
                <span>View Receipt</span>
              </RowActionButton>
            )}
          </Space>
        );
      },
    },
  ];

  // The receiving page contains the details; this dialog only confirms the hand-off.
  const receivingReviewModal = (
    <Modal
      title={
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <span style={{ display: 'grid', placeItems: 'center', width: 48, height: 48, borderRadius: '50%', background: '#fef9e7', color: '#B49A00', fontSize: 24 }}>
            <SafetyCertificateOutlined />
          </span>
          <span>Submit Goods Receipt to QC?</span>
        </div>
      }
      centered
      open={isReviewModalOpen}
      onCancel={() => setIsReviewModalOpen(false)}
      width={440}
      styles={{
        header: { textAlign: 'center', marginBottom: 12 },
        body: { textAlign: 'center', padding: '0 0 24px' },
        footer: { textAlign: 'center', marginTop: 8, paddingBottom: 4 },
      }}
      footer={
        <Space size={16}>
          <Button onClick={() => setIsReviewModalOpen(false)}>Cancel</Button>
          <Button
            type="primary"
            onClick={handleConfirmSubmitToQC}
            style={{ background: '#B49A00', borderColor: '#B49A00' }}
          >
            Confirm & Submit
          </Button>
        </Space>
      }
    >
      <Text>Send this goods receipt to QC for inspection?</Text>
    </Modal>
  );

  // -------------------------------------------------------------
  // VIEW: PHYSICAL RECEIVING & MULTI-BATCH INTAKE PAGE
  // -------------------------------------------------------------
  if (workspaceView === 'physical-receive' && selectedReceipt) {
    const totalPlannedQty = activeItems.reduce((s, i) => s + (i.plannedQty || i.poQty || 0), 0);
    const totalReceivedQty = activeItems.reduce((s, i) => s + (Number(i.receiveQty) || 0), 0);
    const totalDiscrepancy = totalPlannedQty - totalReceivedQty;
    const totalBatchesCount = activeItems.reduce((s, i) => s + (i.batches?.length || 0), 0);
    const poListStr =
      selectedReceipt.poReferences?.map((p) => p.poNumber).join(', ') ||
      selectedReceipt.poNumber ||
      'N/A';

    return (
      <div
        className="procurement-workspace create-ir-plan-view inbound-task-page"
        style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 24 }}
      >
        {/* 1. Top Back Navigation Header */}
        <WorkspaceTaskHeader title="Warehouse Receiving" onBack={() => setWorkspaceView('list')} />

        <div className="create-plan-container" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* 2. Combined Hero Details Card (3-Column Layout matching Procurement) */}
          <div
            className="po-figma-details-card combined-plan-hero-card"
            style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              padding: '16px 20px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 24 }}>
              {/* Column 1: Plan & PO Information */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="label-value-pair" style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="field-label" style={{ width: 110, fontSize: 13, fontWeight: 500, color: '#64748b', flexShrink: 0 }}>
                    IR Schedule #
                  </span>
                  <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                    :
                  </span>
                  <span className="field-value" style={{ fontSize: 14, fontWeight: 700, color: '#2563eb' }}>
                    {selectedReceipt.irPlanNumber}
                  </span>
                </div>
                <div className="label-value-pair" style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="field-label" style={{ width: 110, fontSize: 13, fontWeight: 500, color: '#64748b', flexShrink: 0 }}>
                    Delivery Plan
                  </span>
                  <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                    :
                  </span>
                  <span className="field-value" style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                    {selectedReceipt.deliveryPlanNumber || 'Plan 1'}
                  </span>
                </div>
                <div className="label-value-pair" style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="field-label" style={{ width: 110, fontSize: 13, fontWeight: 500, color: '#64748b', flexShrink: 0 }}>
                    PO Reference(s)
                  </span>
                  <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                    :
                  </span>
                  <span className="field-value" style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                    {poListStr}
                  </span>
                </div>
              </div>

              {/* Column 2: Scheduled Delivery & Warehouse */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="label-value-pair" style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="field-label" style={{ width: 110, fontSize: 13, fontWeight: 500, color: '#64748b', flexShrink: 0 }}>
                    Scheduled Date
                  </span>
                  <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                    :
                  </span>
                  <span className="field-value" style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                    {selectedReceipt.expectedDate || '2026-08-27'}
                  </span>
                </div>
                <div className="label-value-pair" style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="field-label" style={{ width: 110, fontSize: 13, fontWeight: 500, color: '#64748b', flexShrink: 0 }}>
                    Destination WH
                  </span>
                  <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                    :
                  </span>
                  <span className="field-value" style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                    {selectedReceipt.receiverWarehouseName || '—'}
                  </span>
                </div>
                <div className="label-value-pair" style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="field-label" style={{ width: 110, fontSize: 13, fontWeight: 500, color: '#64748b', flexShrink: 0 }}>
                    Total Expected
                  </span>
                  <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                    :
                  </span>
                  <span className="field-value" style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                    {formatQuantities(activeItems, i => i.plannedQty ?? i.poQty ?? 0)} ({activeItems.length} items)
                  </span>
                </div>
              </div>

              {/* Column 3: Vendor & Creator Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="label-value-pair" style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="field-label" style={{ width: 110, fontSize: 13, fontWeight: 500, color: '#64748b', flexShrink: 0 }}>
                    Vendor Name
                  </span>
                  <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                    :
                  </span>
                  <span className="field-value" style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                    {selectedReceipt.supplier || 'OMCam Co. Ltd'}
                  </span>
                </div>
                <div className="label-value-pair" style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="field-label" style={{ width: 110, fontSize: 13, fontWeight: 500, color: '#64748b', flexShrink: 0 }}>
                    Scheduled By
                  </span>
                  <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                    :
                  </span>
                  <span className="field-value" style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>
                    {selectedReceipt.createdBy || 'Keo Srey'}
                  </span>
                </div>
                <div className="label-value-pair" style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="field-label" style={{ width: 110, fontSize: 13, fontWeight: 500, color: '#64748b', flexShrink: 0 }}>
                    Intake Status
                  </span>
                  <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                    :
                  </span>
                  <InboundStatusBadge type="deliveryPlan" value={selectedReceipt.deliveryPlanStatus || 'To Receive'} />
                </div>
              </div>
            </div>
          </div>

          <div className="po-figma-details-card" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px' }}>
            <label htmlFor="receiving-storage-warehouse" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
              Store in Warehouse <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <Select
              id="receiving-storage-warehouse"
              placeholder="Select storage warehouse"
              value={receiverWarehouse || undefined}
              onChange={setReceiverWarehouse}
              options={STORAGE_WAREHOUSE_OPTIONS}
              style={{ width: '100%', maxWidth: 360, height: 36 }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
              Confirm where the received goods will be stored before submitting to QC.
            </div>
          </div>

          {/* 3. Delivery Note & Vehicle Logistics Form Card */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
              <FileTextOutlined style={{ color: '#B49A00', fontSize: 16 }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
                Delivery Note
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'start' }}>
              {/* Left Column: DN & Driver Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      Delivery Note (DN) No. <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <Input
                      placeholder="e.g. DN-2026-00892 or NA"
                      value={deliveryNoteNumber}
                      onChange={(e) => setDeliveryNoteNumber(e.target.value)}
                      prefix={<FileTextOutlined style={{ color: '#94a3b8' }} />}
                      style={{ borderRadius: 8, height: 36 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      DN Date
                    </label>
                    <DatePicker
                      placeholder="Select DN Date"
                      value={deliveryNoteDate}
                      onChange={(d: any) => setDeliveryNoteDate(d)}
                      style={{ width: '100%', borderRadius: 8, height: 36 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      Truck / Container Plate <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <Input
                      placeholder="e.g. PP-2AB-9988"
                      value={truckPlateNumber}
                      onChange={(e) => setTruckPlateNumber(e.target.value)}
                      prefix={<CarOutlined style={{ color: '#94a3b8' }} />}
                      style={{ borderRadius: 8, height: 36 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      Driver Name & Phone
                    </label>
                    <Input
                      placeholder="e.g. Sokha Men (+855 12 889 001)"
                      value={driverName ? `${driverName} (${driverContact})` : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDriverName(val);
                      }}
                      prefix={<PhoneOutlined style={{ color: '#94a3b8' }} />}
                      style={{ borderRadius: 8, height: 36 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      Actual Arrival Date
                    </label>
                    <DatePicker
                      placeholder="Arrival Date"
                      value={actualArrivalDate}
                      onChange={(d: any) => setActualArrivalDate(d)}
                      style={{ width: '100%', borderRadius: 8, height: 36 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      Arrival Time
                    </label>
                    <TimePicker
                      placeholder="Arrival Time"
                      value={actualArrivalTime}
                      onChange={(t: any) => setActualArrivalTime(t)}
                      format="HH:mm"
                      style={{ width: '100%', borderRadius: 8, height: 36 }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Intake Remarks / Discrepancy Explanation
                  </label>
                  <Input.TextArea
                    rows={2}
                    placeholder="Enter physical receiving notes, seal verification, driver remarks, or reason if DN is NA..."
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
                    Vendor Attachments ({vendorAttachments.length})
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
                    padding: '14px 12px',
                  }}
                  showUploadList={false}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <InboxOutlined style={{ fontSize: 24, color: '#B49A00' }} />
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                        Click or drag delivery files here to attach
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>
                        Attach DN copy, packing slip, container photos, or COA (PDF, PNG, JPG up to 15MB)
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
                      marginTop: 6,
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
                          padding: '6px 10px',
                          border: '1px solid #e2e8f0',
                          borderRadius: 6,
                          background: '#ffffff',
                        }}
                      >
                        <PaperClipOutlined style={{ color: '#B49A00', flexShrink: 0 }} />
                        <span
                          title={file.name}
                          onClick={() => message.info(`Opening document: ${file.name}`)}
                          style={{
                            minWidth: 0,
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: 11,
                            color: '#2563eb',
                            cursor: 'pointer',
                            textDecoration: 'underline',
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

          {/* 4. Multi-Item & Multi-Batch Receiving Table Card */}
          <div
            className="schedule-configuration-card"
            style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              padding: '18px 20px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarcodeOutlined style={{ color: '#B49A00', fontSize: 16 }} />
                <span style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
                  Received Items
                </span>
              </div>
              <span style={{ fontSize: 12, color: '#64748b' }}>
                Tip: Click <b>"+ Add Batch"</b> to split lot numbers or cartons for any item line.
              </span>
            </div>

            <Table
              dataSource={activeItems.flatMap((item, itemIdx) => {
                const batches =
                  item.batches && item.batches.length > 0
                    ? item.batches
                    : [
                        {
                          id: `batch-${itemIdx}-0`,
                          batchNumber: `LOT-${dayjs().format('YYYYMM')}-${itemIdx + 1}`,
                          batchQty: item.receiveQty || item.plannedQty || 0,
                          productionDate: dayjs().subtract(10, 'day').format('YYYY-MM-DD'),
                          expiryDate: dayjs().add(2, 'year').format('YYYY-MM-DD'),
                          bestBeforeDate: dayjs().add(2, 'year').format('YYYY-MM-DD'),
                          remark: '',
                        },
                      ];
                return batches.map((batch, bIdx) => ({
                  rowKey: `${item.code || itemIdx}-${bIdx}`,
                  itemIdx,
                  bIdx,
                  isMainRow: bIdx === 0,
                  docLine: item.poLineNumber || (itemIdx + 1),
                  itemCode: item.code,
                  itemName: item.name,
                  poNumber: item.poNumber,
                  plannedQty: item.plannedQty || item.poQty || 0,
                  receiveQty: item.receiveQty,
                  uom: item.uom,
                  batch,
                  parentItem: item,
                  totalBatches: batches.length,
                }));
              })}
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
                      <div style={{ minHeight: 32, display: 'flex', alignItems: 'center' }}>
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
                  render: (_, r: any) => {
                    if (r.isMainRow) {
                      return (
                        <div style={{ minHeight: 32, display: 'flex', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, color: '#334155', fontSize: 14 }}>{r.itemCode}</span>
                        </div>
                      );
                    }
                    return (
                      <div style={{ height: 32, display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 12 }}>
                        <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>↳</span>
                        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Lot #{r.bIdx + 1}</span>
                      </div>
                    );
                  },
                },
                {
                  title: 'Item Description',
                  key: 'itemName',
                  width: 240,
                  render: (_, r: any) => (
                    <div style={{ minHeight: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      {r.isMainRow ? (
                        <>
                          <span style={{ fontWeight: 600, color: '#334155', fontSize: 13 }}>{r.itemName}</span>
                          {r.parentItem.isMissing && (
                            <div style={{ marginTop: 4 }}>
                              <Input
                                size="small"
                                placeholder="Shortage reason (required)..."
                                value={r.parentItem.missingRemark}
                                onChange={(e) => handleUpdateItemMissingRemark(r.itemIdx, e.target.value)}
                                style={{ borderColor: '#fca5a5', background: '#fef2f2', fontSize: 11 }}
                              />
                            </div>
                          )}
                        </>
                      ) : (
                        <span style={{ color: '#cbd5e1' }}>—</span>
                      )}
                    </div>
                  ),
                },
                {
                  title: 'Planned Qty',
                  key: 'plannedQty',
                  width: 120,
                  render: (_, r: any) => (
                    <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
                      {r.isMainRow ? (
                        <span style={{ fontWeight: 600, color: '#334155', fontSize: 13 }}>
                          {r.plannedQty.toLocaleString()} {r.uom}
                        </span>
                      ) : (
                        <span style={{ color: '#cbd5e1' }}>—</span>
                      )}
                    </div>
                  ),
                },
                {
                  title: 'Actual Received Qty',
                  key: 'receiveQty',
                  width: 140,
                  render: (_, r: any) => (
                    <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
                      {r.isMainRow ? (
                        <InputNumber
                          style={{ width: 130, height: 32 }}
                          min={0}
                          value={r.receiveQty}
                          onChange={(val) => handleUpdateItemReceiveQty(r.itemIdx, val || 0)}
                          placeholder="Received Qty"
                          addonAfter={r.uom}
                        />
                      ) : (
                        <span style={{ color: '#cbd5e1' }}>—</span>
                      )}
                    </div>
                  ),
                },
                {
                  title: 'Batch / Lot Number',
                  key: 'batchNumber',
                  width: 150,
                  render: (_, r: any) => (
                    <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
                      <Input
                        style={{ height: 32, borderRadius: 6 }}
                        value={r.batch.batchNumber}
                        onChange={(e) => handleUpdateBatchField(r.itemIdx, r.bIdx, 'batchNumber', e.target.value)}
                        placeholder="LOT-YYYYMM"
                      />
                    </div>
                  ),
                },
                {
                  title: 'Batch Qty',
                  key: 'batchQty',
                  width: 120,
                  render: (_, r: any) => (
                    <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
                      <InputNumber
                        style={{ width: 110, height: 32 }}
                        min={0}
                        value={r.batch.batchQty}
                        onChange={(val) => handleUpdateBatchField(r.itemIdx, r.bIdx, 'batchQty', val || 0)}
                        placeholder="Qty"
                        addonAfter={r.uom}
                      />
                    </div>
                  ),
                },
                {
                  title: 'Mfg Date',
                  key: 'mfgDate',
                  width: 130,
                  render: (_, r: any) => (
                    <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
                      <DatePicker
                        style={{ width: 120, height: 32 }}
                        value={r.batch.productionDate ? dayjs(r.batch.productionDate) : undefined}
                        onChange={(d: any) =>
                          handleUpdateBatchField(r.itemIdx, r.bIdx, 'productionDate', d ? d.format('YYYY-MM-DD') : '')
                        }
                        placeholder="Mfg Date"
                      />
                    </div>
                  ),
                },
                {
                  title: 'Exp Date',
                  key: 'expDate',
                  width: 130,
                  render: (_, r: any) => (
                    <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
                      <DatePicker
                        style={{ width: 120, height: 32 }}
                        value={r.batch.expiryDate ? dayjs(r.batch.expiryDate) : undefined}
                        onChange={(d: any) =>
                          handleUpdateBatchField(r.itemIdx, r.bIdx, 'expiryDate', d ? d.format('YYYY-MM-DD') : '')
                        }
                        placeholder="Exp Date"
                      />
                    </div>
                  ),
                },
                {
                  ...rowActionColumn,
                  render: (_, r: any) => (
                    <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
                      {r.isMainRow ? (
                        <RowActionButton icon={<PlusOutlined />} onClick={() => handleAddBatch(r.itemIdx)}>
                          Add Batch
                        </RowActionButton>
                      ) : (
                        <RowActionButton variant="danger" icon={<DeleteOutlined />}
                          onClick={() => handleRemoveBatch(r.itemIdx, r.bIdx)}>
                          Remove
                        </RowActionButton>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </div>



          {/* 5. Sticky Bottom Action Bar with Live Metrics & Hand-off Buttons */}
          <div
            className="create-plan-footer inbound-task-actions"
            style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              padding: '14px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              position: 'sticky',
              bottom: 16,
              zIndex: 10,
            }}
          >
            {/* Live Metrics */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>Total Planned</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                  {formatQuantities(activeItems, i => i.plannedQty ?? i.poQty ?? 0)}
                </span>
              </div>
              <div style={{ width: 1, height: 28, background: '#e2e8f0' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>Total Received</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#16a34a' }}>
                  {formatQuantities(activeItems, i => i.receiveQty ?? 0)}
                </span>
              </div>
              <div style={{ width: 1, height: 28, background: '#e2e8f0' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>Discrepancy</span>
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: totalDiscrepancy > 0 ? '#dc2626' : '#64748b',
                  }}
                >
                  {formatQuantities(activeItems, i => (i.plannedQty ?? i.poQty ?? 0) - (i.receiveQty ?? 0))}
                </span>
              </div>
              <div style={{ width: 1, height: 28, background: '#e2e8f0' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>Batches Recorded</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#2563eb' }}>
                  {totalBatchesCount} Lots
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Button onClick={() => setWorkspaceView('list')} style={{ height: 36, borderRadius: 6, fontWeight: 500 }}>
                Cancel
              </Button>
              <Button
                icon={<SaveOutlined />}
                onClick={handleSaveDraftReceiving}
                style={{ height: 36, borderRadius: 6, fontWeight: 600 }}
              >
                Save Draft
              </Button>
              <Button
                type="primary"
                onClick={handleProceedToReview}
                style={{
                  background: '#B49A00',
                  borderColor: '#B49A00',
                  height: 36,
                  borderRadius: 6,
                  fontWeight: 600,
                  color: '#ffffff',
                }}
              >
                Review & Submit to QC
              </Button>
            </div>
          </div>
        </div>
        {receivingReviewModal}
      </div>
    );
  }

  return (
    <div className="procurement-workspace inbound-role-workspace inbound-warehouse">
      <WorkspaceHeader
        title="Warehouse — Receiving"
        onRefresh={onRefresh}
        onExport={handleExport}
      />

      {/* 2. KPI Summary Cards Grid */}
      <div className="summary-cards-row">
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Expected Today</span>
            <div className="kpi-icon-badge blue">
              <InboxOutlined />
            </div>
          </div>
          <div className="kpi-value blue">{tabCounts.today}</div>

        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Overdue Inbound</span>
            <div className="kpi-icon-badge orange">
              <WarningOutlined />
            </div>
          </div>
          <div className="kpi-value orange">{tabCounts.overdue}</div>

        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Waiting for QC</span>
            <div className="kpi-icon-badge purple">
              <SafetyCertificateOutlined />
            </div>
          </div>
          <div className="kpi-value purple">{tabCounts.waitingQC}</div>

        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Completed</span>
            <div className="kpi-icon-badge green">
              <CheckCircleOutlined />
            </div>
          </div>
          <div className="kpi-value green">{tabCounts.completed}</div>

        </div>
      </div>

      {/* 3. Single-Line Filter Toolbar Card with Title Labels */}
      <div className="filter-toolbar-card" style={{ padding: '12px 18px', background: '#ffffff', borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 240px', minWidth: 200, maxWidth: 300 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Search</span>
            <Input
              placeholder="Search Receiving #, SAP GR #, PO #, vendor..."
              prefix={<SearchOutlined style={{ color: '#9ca3af', marginRight: 4 }} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
              style={{ height: 36, borderRadius: 6 }}
            />
          </div>

          {/* Status Select */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 160 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Status</span>
            <Select
              style={{ width: '100%', height: 36 }}
              value={statusFilter}
              onChange={(value) => { setStatusFilter(value); setActiveTab('ALL'); }}
              options={[
                { label: 'All Statuses', value: 'ALL' },
                { label: 'To Receive', value: 'To Receive' },
                { label: 'Waiting for QC', value: 'Waiting for QC' },
                { label: 'Stored / Completed', value: 'Stored' },
                { label: 'Overdue', value: 'OVERDUE' },
              ]}
            />
          </div>

          {/* Warehouse Select */}
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
                { label: 'WH-02 - QC Follow-Up', value: 'WH-02' },
              ]}
            />
          </div>

          {/* Date Range Picker */}
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

      {/* 4. Main Content Card with Custom Tab Bar */}
      <div className="main-content-card">
        <div className="tab-action-bar">
          <div className="tabs-list">
            <button
              className={`tab-button ${activeTab === 'TO_RECEIVE' ? 'active' : ''}`}
              onClick={() => { setActiveTab('TO_RECEIVE'); setStatusFilter('ALL'); }}
            >
              <span>To Receive</span>
              <span className="tab-count-badge">{tabCounts.toReceive}</span>
            </button>

            <button
              className={`tab-button ${activeTab === 'WAITING_QC' ? 'active' : ''}`}
              onClick={() => { setActiveTab('WAITING_QC'); setStatusFilter('ALL'); }}
            >
              <span>Waiting for QC</span>
              <span className="tab-count-badge">{tabCounts.waitingQC}</span>
            </button>

            <button
              className={`tab-button ${activeTab === 'COMPLETED' ? 'active' : ''}`}
              onClick={() => { setActiveTab('COMPLETED'); setStatusFilter('ALL'); }}
            >
              <span>Completed</span>
              <span className="tab-count-badge">{tabCounts.completed}</span>
            </button>

            <button
              className={`tab-button ${activeTab === 'ALL' ? 'active' : ''}`}
              onClick={() => { setActiveTab('ALL'); setStatusFilter('ALL'); }}
            >
              <span>All Receipts</span>
              <span className="tab-count-badge">{tabCounts.all}</span>
            </button>
          </div>

        </div>

        {/* Table View */}
        <Table
          columns={columns}
          dataSource={filteredReceipts}
          rowKey="grNumber"
          pagination={workspacePagination}
          scroll={{ x: 1000 }}
          locale={{ emptyText: <WorkspaceEmpty filtered={Boolean(searchTerm || statusFilter !== 'ALL' || warehouseFilter !== 'ALL' || dateRange)} description="No receipts in this queue. Scheduled deliveries appear here after procurement planning." /> }}
          className="po-custom-table"
        />
      </div>

      {/* 5. Detail / Track Intake Drawer for Warehouse Goods Receipt */}
      <Drawer rootClassName="inbound-detail"
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: 24 }}>
            <Space size={8}>
              <FileTextOutlined style={{ color: '#2563eb', fontSize: 18 }} />
              <span style={{ fontWeight: 700, fontSize: 16 }}>
                Receiving Details: {selectedReceipt ? getReceiptIrNumber(selectedReceipt) : '—'}
              </span>
            </Space>
            <Space>
              {selectedReceipt && (
                <InboundStatusBadge type="deliveryPlan" value={selectedReceipt.deliveryPlanStatus || 'To Receive'} />
              )}
            </Space>
          </div>
        }
        open={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        width={920}
        styles={{ body: { padding: '20px 24px', background: '#f8fafc' } }}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Warehouse Intake Record • IR Schedule {selectedReceipt?.irPlanNumber}
            </Text>
            <Space size={12}>
              <Button onClick={() => setIsDetailDrawerOpen(false)}>Close</Button>
              {selectedReceipt && (selectedReceipt.deliveryPlanStatus === 'To Receive' || selectedReceipt.deliveryPlanStatus === 'In Progress') && (
                <Button
                  type="primary"
                  className="btn-po-action"
                  icon={<InboxOutlined />}
                  onClick={() => {
                    setIsDetailDrawerOpen(false);
                    handleStartReceiving(selectedReceipt);
                  }}
                >
                  Receive Goods
                </Button>
              )}
            </Space>
          </div>
        }
      >
        {(() => {
          if (!selectedReceipt) return null;

          return (
            <div className="detail-drawer-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* 1. Exact Figma Shipment & Logistics Details Card */}
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
                  Shipment & Logistics Details
                </div>
                <div className="po-grid-container" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Row 1: GR # vs IR Schedule # */}
                  <div className="po-grid-row" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                    <div className="label-value-pair" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                      <span className="field-label" style={{ width: 140, fontSize: 13, fontWeight: 500, color: '#6b7280', flexShrink: 0 }}>
                        Receiving #
                      </span>
                      <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                        :
                      </span>
                      <span className="field-value" style={{ fontSize: 14, fontWeight: 600, color: 'rgba(0,0,0,0.85)' }}>
                        {getReceiptIrNumber(selectedReceipt) || '—'}
                      </span>
                    </div>
                    <div className="label-value-pair" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                      <span className="field-label" style={{ width: 140, fontSize: 13, fontWeight: 500, color: '#6b7280', flexShrink: 0 }}>
                        IR Schedule #
                      </span>
                      <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                        :
                      </span>
                      <span
                        className="field-value po-link"
                        style={{ fontSize: 14, fontWeight: 600, color: '#2563eb', cursor: 'pointer' }}
                        onClick={() => {
                          setIsDetailDrawerOpen(false);
                          handleOpenIRPlan(selectedReceipt.irPlanNumber, selectedReceipt);
                        }}
                      >
                        {selectedReceipt.irPlanNumber}
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Vendor vs Delivery Plan */}
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
                        Delivery Plan
                      </span>
                      <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                        :
                      </span>
                      <span className="field-value" style={{ fontSize: 14, fontWeight: 500, color: 'rgba(0,0,0,0.85)' }}>
                        {selectedReceipt.deliveryPlanNumber || 'Plan 1'}
                      </span>
                    </div>
                  </div>

                  {/* Row 3: Delivery Note (DN) vs Truck Plate */}
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
                        Truck Plate No.
                      </span>
                      <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                        :
                      </span>
                      <span className="field-value" style={{ fontSize: 14, fontWeight: 500, color: 'rgba(0,0,0,0.85)' }}>
                        {selectedReceipt.truckPlateNumber || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Row 4: Driver & Contact vs Receiving Warehouse */}
                  <div className="po-grid-row" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                    <div className="label-value-pair" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                      <span className="field-label" style={{ width: 140, fontSize: 13, fontWeight: 500, color: '#6b7280', flexShrink: 0 }}>
                        Driver & Contact
                      </span>
                      <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                        :
                      </span>
                      <span className="field-value" style={{ fontSize: 14, fontWeight: 500, color: 'rgba(0,0,0,0.85)' }}>
                        {selectedReceipt.driverContact || selectedReceipt.driverName || 'N/A'}
                      </span>
                    </div>
                    <div className="label-value-pair" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                      <span className="field-label" style={{ width: 140, fontSize: 13, fontWeight: 500, color: '#6b7280', flexShrink: 0 }}>
                        Receiving Warehouse
                      </span>
                      <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                        :
                      </span>
                      <span className="field-value" style={{ fontSize: 14, fontWeight: 500, color: 'rgba(0,0,0,0.85)' }}>
                        {selectedReceipt.receiverWarehouseName || 'WHM1 - Main Raw Materials'}
                      </span>
                    </div>
                  </div>

                  {/* Row 5: Expected Date vs Actual Arrival */}
                  <div className="po-grid-row" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                    <div className="label-value-pair" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                      <span className="field-label" style={{ width: 140, fontSize: 13, fontWeight: 500, color: '#6b7280', flexShrink: 0 }}>
                        Expected Date
                      </span>
                      <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                        :
                      </span>
                      <span className="field-value" style={{ fontSize: 14, fontWeight: 500, color: 'rgba(0,0,0,0.85)' }}>
                        {selectedReceipt.expectedDate}
                      </span>
                    </div>
                    <div className="label-value-pair" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                      <span className="field-label" style={{ width: 140, fontSize: 13, fontWeight: 500, color: '#6b7280', flexShrink: 0 }}>
                        Actual Arrival
                      </span>
                      <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                        :
                      </span>
                      <span className="field-value" style={{ fontSize: 14, fontWeight: 500, color: 'rgba(0,0,0,0.85)' }}>
                        {selectedReceipt.actualArrivalDate || 'Pending dock arrival'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Line Items & Batches Breakdown Table Card */}
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
                  <span>Line Items & Batches Intake Breakdown ({selectedReceipt.items.length})</span>
                </div>
                <Table
                  size="small"
                  dataSource={selectedReceipt.items}
                  rowKey="code"
                  pagination={false}
                  className="po-custom-table"
                  columns={[
                    {
                      title: 'Item Code',
                      dataIndex: 'code',
                      key: 'code',
                      width: 120,
                      render: (c) => <Text strong style={{ color: '#334155' }}>{c}</Text>,
                    },
                    {
                      title: 'Item Name & Description',
                      dataIndex: 'name',
                      key: 'name',
                      render: (name) => (
                        <span style={{ fontWeight: 500, whiteSpace: 'nowrap', display: 'block' }}>
                          {name}
                        </span>
                      ),
                    },
                    {
                      title: 'Planned QTY',
                      key: 'planned',
                      width: 110,
                      render: (_, r) => (
                        <Text strong>
                          {(r.plannedQty || r.poQty).toLocaleString()} <span style={{ fontSize: 11, color: '#64748b' }}>{r.uom}</span>
                        </Text>
                      ),
                    },
                    {
                      title: 'Received QTY',
                      dataIndex: 'receiveQty',
                      key: 'receiveQty',
                      width: 110,
                      render: (q, r) => (
                        <span style={{ color: q > 0 ? '#16a34a' : '#64748b', fontWeight: q > 0 ? 600 : 400 }}>
                          {(q || 0).toLocaleString()} <span style={{ fontSize: 11, color: '#64748b' }}>{r.uom}</span>
                        </span>
                      ),
                    },
                    {
                      title: 'Remaining',
                      key: 'remaining',
                      width: 110,
                      render: (_, r) => {
                        const planned = r.plannedQty || r.poQty || 0;
                        const rec = r.receiveQty || 0;
                        const rem = Math.max(0, planned - rec);
                        return (
                          <Text strong style={{ color: rem > 0 ? '#ca8504' : '#16a34a' }}>
                            {rem.toLocaleString()} <span style={{ fontSize: 11, color: '#64748b' }}>{r.uom}</span>
                          </Text>
                        );
                      },
                    },
                    {
                      title: 'Recorded Batches',
                      key: 'batches',
                      render: (_, r) => (
                        <Space direction="vertical" size={2}>
                          {r.batches?.map((b) => (
                            <div key={b.batchNumber} style={{ fontSize: 12 }}>
                              <Tag color="blue" style={{ fontSize: 10 }}>{b.batchNumber}</Tag>
                              <span style={{ fontWeight: 600 }}>{b.batchQty} {r.uom}</span>
                              <span style={{ fontSize: 11, color: '#64748b', marginLeft: 4 }}>Exp: {b.expiryDate}</span>
                            </div>
                          )) || <Text type="secondary">Pending intake</Text>}
                        </Space>
                      ),
                    },
                    {
                      title: 'Intake Status',
                      key: 'intakeStatus',
                      width: 130,
                      render: (_, r) => {
                        const planned = r.plannedQty || r.poQty || 0;
                        const rec = r.receiveQty || 0;
                        if (rec >= planned && planned > 0) {
                          return <Tag color="green" style={{ whiteSpace: 'nowrap' }}>Fully Received</Tag>;
                        }
                        if (rec > 0) {
                          return (
                            <Tag color="blue" style={{ whiteSpace: 'nowrap' }}>
                              Partial ({rec}/{planned})
                            </Tag>
                          );
                        }
                        return <Tag color="default" style={{ whiteSpace: 'nowrap' }}>Pending Intake</Tag>;
                      },
                    },
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

      {/* 5A. IR Schedule (IR Plan) Drawer */}
      <Drawer rootClassName="inbound-detail"
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: 24 }}>
            <Space size={10}>
              <FileTextOutlined style={{ color: '#2563eb', fontSize: 18 }} />
              <span style={{ fontWeight: 700, fontSize: 16 }}>
                IR Schedule: {selectedIRPlan?.irPlanNumber}
              </span>
              {selectedIRPlan?.deliveryPlanNumber && (
                <Tag color="cyan">{selectedIRPlan.deliveryPlanNumber}</Tag>
              )}
            </Space>
            {selectedIRPlan && (
              <InboundStatusBadge type="deliveryPlan" value={selectedIRPlan.status || 'Confirmed'} />
            )}
          </div>
        }
        open={isIRPlanDrawerOpen}
        onClose={() => setIsIRPlanDrawerOpen(false)}
        width={920}
        styles={{ body: { padding: '20px 24px', background: '#f8fafc' } }}
        footer={null}
      >
        {selectedIRPlan && (
          <div className="detail-drawer-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                      {selectedIRPlan.irPlanNumber}
                    </span>
                  </div>
                  <div className="label-value-pair" style={{ display: 'flex', alignItems: 'center' }}>
                    <span className="field-label" style={{ width: 105, fontSize: 13, fontWeight: 500, color: '#64748b', flexShrink: 0 }}>
                      PO #
                    </span>
                    <span className="field-colon" style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', marginRight: 8, flexShrink: 0 }}>
                      :
                    </span>
                    <span className="field-value">
                      <span style={{ color: '#0f172a', fontWeight: 600 }}>
                        {selectedIRPlan.poNumbers?.[0] || selectedIRPlan.items?.[0]?.poNumber || '26000977'}
                      </span>
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
                      {(selectedIRPlan as any).vendorCode || 'V000374'}
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
                      {selectedIRPlan.vendor}
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
                      {selectedIRPlan.createdBy || 'Keo Srey'}
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
                      {selectedIRPlan.createdAt || '2026-08-22'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

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
                <span>Planned Line Items & Allocation ({selectedIRPlan.items?.length || 0})</span>
              </div>
              <Table
                size="small"
                dataSource={(selectedIRPlan.items || []).flatMap((item, itemIdx) => {
                  if (item.schedules && item.schedules.length > 0) {
                    return item.schedules
                      .filter((sched) => (Number(sched.plannedQty) || 0) > 0)
                      .map((sched, sIdx) => ({
                      rowKey: `${item.itemCode || itemIdx}-${sIdx}`,
                      isMainRow: sIdx === 0,
                      itemCode: item.itemCode,
                      itemName: item.itemName,
                      poNumber: item.poNumber || selectedIRPlan.poNumbers?.[0] || '26000977',
                      totalPoQty: item.totalPoQty || item.allocatedQty,
                      uom: item.uom,
                      irQty: sched.plannedQty,
                      remainingQty: item.remainingQty,
                      deliveryDate: sched.deliveryDate || selectedIRPlan.deliveryDate,
                      parentItem: item,
                      }));
                  }
                  if ((Number(item.allocatedQty) || 0) <= 0) return [];
                  return [
                    {
                      rowKey: `${item.itemCode || itemIdx}-0`,
                      isMainRow: true,
                      itemCode: item.itemCode,
                      itemName: item.itemName,
                      poNumber: item.poNumber || selectedIRPlan.poNumbers?.[0] || '26000977',
                      totalPoQty: item.totalPoQty || item.allocatedQty,
                      uom: item.uom,
                      irQty: item.allocatedQty,
                      remainingQty: item.remainingQty,
                      deliveryDate: selectedIRPlan.deliveryDate,
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
                    render: (date: string) => <span>{date || selectedIRPlan.deliveryDate || '2026-08-27'}</span>,
                  },
                ]}
              />
            </div>
            <RelatedActivity receipts={receipts.filter(receipt => receipt.irPlanNumber === selectedIRPlan.irPlanNumber)} plans={[selectedIRPlan]} />
          </div>
        )}
      </Drawer>

      {receivingReviewModal}

      {/* Temporary GR Creation Modal (Exception Flow) */}
      <Modal
        title={
          <Space>
            <WarningOutlined style={{ color: '#ca8504' }} />
            <span>Create Temporary GR / Without PO (Exception Flow)</span>
          </Space>
        }
        open={isTempGrModalOpen}
        onCancel={() => setIsTempGrModalOpen(false)}
        onOk={handleCreateTempGR}
        okText="Create Temporary GR"
      >
        <Alert
          message="Isolated Exception Flow"
          description="Temporary GRs without SAP PO are kept completely separate from the standard Planned Inbound flow. A SAP PO must be linked before final supervisor approval."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form form={tempGrForm} layout="vertical">
          <Form.Item label="Vendor / Supplier Name" name="vendor" rules={[{ required: true }]}>
            <Input placeholder="e.g. OMCam Co. Ltd" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Delivery Note (DN)" name="dnNumber" rules={[{ required: true }]}>
                <Input placeholder="DN or NA" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Truck Plate No." name="truckPlate">
                <Input placeholder="e.g. PP-3CC-1234" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Item Description / Temp Code" name="itemName" rules={[{ required: true }]}>
                <Input placeholder="e.g. Urgent Preforms" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Received Quantity" name="qty" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Arrival Reason & Explanation" name="reason" rules={[{ required: true }]}>
            <Input.TextArea rows={2} placeholder="Explain why goods arrived before PO issuance" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
