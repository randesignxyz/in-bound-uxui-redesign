import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Collapse,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Col,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  Upload,
  message,
} from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CloseCircleFilled,
  DeleteOutlined,
  DownOutlined,
  InboxOutlined,
  PlusOutlined,
  RightOutlined,
  WarningFilled,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  buildReceiptExceptionReason,
  hasReceiptDiscrepancy,
} from '../../../core/workflow';
import type { GRItem, PurchaseOrder } from '../../../core/workflow';

import type { InboundWarehouseMasterApi, UpcomingInboundGoodsReceipt } from '../../../core/type';
import {
  applyUploadedSupportingDocs,
  getSupportingUploadFilePreview,
  hasIncompleteAppFilesUpload,
  normalizeUploadFileList,
  stageSupportingDocBeforeUpload,
  supportingDocsToUploadFiles,
  uploadPendingSupportingDocs,
  uploadFilesToSupportingDocs,
  SupportingDocPreviewModal,
  SupportingDocsList,
} from '../../supporting-documents';
import { FullscreenModal } from '../../../shared/ui/FullscreenModal';

const { Text } = Typography;

interface GRCreationModalProps {
  open: boolean;
  onClose: () => void;
  purchaseOrders: PurchaseOrder[];
  onSaveDraft: (data: Record<string, unknown>) => Promise<boolean> | boolean;
  onSubmit: (data: Record<string, unknown>) => Promise<boolean> | boolean;
  initialReceipt?: UpcomingInboundGoodsReceipt | null;
  correctionMode?: boolean;
  warehouseOptions?: InboundWarehouseMasterApi[];
}

type ReceiptItemTableRow =
  | (GRItem & { index: number; key: string; rowType?: 'item' })
  | {
      key: string;
      rowType: 'batchAction';
      splitKey: string;
      sourceIndex: number;
      batchRowCount: number;
      disabled: boolean;
    };

function isBatchActionRow(row: ReceiptItemTableRow): row is Extract<ReceiptItemTableRow, { rowType: 'batchAction' }> {
  return row.rowType === 'batchAction';
}

function canDeferPoLine(expectedDate?: string) {
  return Boolean(expectedDate && !dayjs(expectedDate).isBefore(dayjs(), 'day'));
}

function buildInitialItems(purchaseOrders: PurchaseOrder[]): GRItem[] {
  return purchaseOrders.flatMap((purchaseOrder) =>
    purchaseOrder.items.map((item) => {
      const expectedDate = item.expectedDate || purchaseOrder.expectedDate;
      const isFutureLine = Boolean(expectedDate && dayjs(expectedDate).isAfter(dayjs(), 'day'));

      return {
        poLineNumber: item.lineNumber,
        code: item.code,
        name: item.name,
        poNumber: purchaseOrder.poNumber,
        expectedDate,
        supplier: purchaseOrder.supplier,
        poQty: item.remainingQty,
        receiveQty: 0,
        uom: item.uom,
        productDate: '',
        expiryDate: '',
        batchNumber: '',
        barcode: '',
        isDeferred: isFutureLine,
        isMissing: false,
        missingRemark: '',
      };
    }),
  );
}

function deriveReceiptType(purchaseOrders: PurchaseOrder[]) {
  return purchaseOrders.every((purchaseOrder) => purchaseOrder.type === 'Planned')
    ? 'Planned'
    : 'Unplanned';
}

function requiresTraceabilityFields(item: GRItem) {
  return !item.isDeferred && !item.isMissing && item.receiveQty > 0;
}

function hasInvalidDateOrder(productDate?: string, expiryDate?: string) {
  if (!productDate || !expiryDate) return false;

  return dayjs(productDate).isAfter(dayjs(expiryDate), 'day');
}

function renderRequiredLabel(label: string) {
  return (
    <span>
      <span style={{ color: '#ff4d4f', marginInlineEnd: 4 }}>*</span>
      {label}
    </span>
  );
}

function getItemSplitKey(item: Pick<GRItem, 'poNumber' | 'poLineNumber' | 'code'>) {
  return `${item.poNumber || 'NO_PO'}::${item.poLineNumber ?? item.code}::${item.code}`;
}

function getSplitQuantityErrorIndexes(items: GRItem[]) {
  const splitQtyByItem = new Map<string, { totalQty: number; maxQty: number; indexes: number[] }>();

  items.forEach((item, index) => {
    if (item.isDeferred || item.isMissing) return;
    const splitKey = getItemSplitKey(item);
    const current = splitQtyByItem.get(splitKey) || { totalQty: 0, maxQty: item.poQty, indexes: [] };
    current.totalQty += item.receiveQty;
    current.maxQty = Math.max(current.maxQty, item.poQty);
    current.indexes.push(index);
    splitQtyByItem.set(splitKey, current);
  });

  return Array.from(splitQtyByItem.values())
    .filter(({ totalQty, maxQty }) => totalQty > maxQty)
    .flatMap(({ indexes }) => indexes);
}

function getSplitReceivedQty(items: GRItem[], targetItem: Pick<GRItem, 'poNumber' | 'poLineNumber' | 'code'>) {
  const splitKey = getItemSplitKey(targetItem);
  return items
    .filter((item) => !item.isDeferred && !item.isMissing && getItemSplitKey(item) === splitKey)
    .reduce((sum, item) => sum + item.receiveQty, 0);
}

function getShortSplitLineCount(items: GRItem[], poNumber: string) {
  const seenKeys = new Set<string>();
  return items.filter((item) => {
    if (item.poNumber !== poNumber || item.isDeferred || item.isMissing) return false;
    const splitKey = getItemSplitKey(item);
    if (seenKeys.has(splitKey)) return false;
    seenKeys.add(splitKey);
    return getSplitReceivedQty(items, item) < item.poQty;
  }).length;
}

function buildInitialPoDeliveryNotes(
  purchaseOrders: PurchaseOrder[],
  initialReceipt?: UpcomingInboundGoodsReceipt | null,
) {
  const receiptPoReferences = new Map(
    (initialReceipt?.poReferences || []).map((reference) => [reference.poNumber, reference]),
  );

  return purchaseOrders.reduce<Record<string, string>>((result, purchaseOrder) => {
    result[purchaseOrder.poNumber] =
      receiptPoReferences.get(purchaseOrder.poNumber)?.deliveryNoteNumber || '';
    return result;
  }, {});
}


function buildInitialPoUploadFiles(
  purchaseOrders: PurchaseOrder[],
  initialReceipt?: UpcomingInboundGoodsReceipt | null,
) {
  return purchaseOrders.reduce<Record<string, UploadFile[]>>((result, purchaseOrder) => {
    const poNumber = purchaseOrder.poNumber;
    const poDocs =
      initialReceipt?.documentChecklist.supportingDocs.filter((doc) => doc.poNumber === poNumber) || [];
    result[poNumber] = supportingDocsToUploadFiles(poDocs);
    return result;
  }, {});
}

function summarizeDeliveryNotes(deliveryNotes: string[]) {
  const normalizedDeliveryNotes = Array.from(
    new Set(deliveryNotes.map((deliveryNote) => deliveryNote.trim()).filter(Boolean)),
  );

  if (normalizedDeliveryNotes.length === 0) {
    return '';
  }
  if (normalizedDeliveryNotes.length === 1) {
    return normalizedDeliveryNotes[0];
  }
  return `${normalizedDeliveryNotes.length} DNs`;
}

export function GRCreationModal({
  open,
  onClose,
  purchaseOrders,
  onSaveDraft,
  onSubmit,
  initialReceipt,
  correctionMode = false,
  warehouseOptions: warehouseMasterOptions = [],
}: GRCreationModalProps) {
  const selectedPOCount = purchaseOrders.length;
  const selectedPOReferences = [...purchaseOrders]
    .sort((left, right) => left.poNumber.localeCompare(right.poNumber))
    .map((purchaseOrder) => ({
      poNumber: purchaseOrder.poNumber,
      businessUnit: purchaseOrder.businessUnit,
      supplier: purchaseOrder.supplier,
      expectedDate: purchaseOrder.expectedDate,
      expectedTime: purchaseOrder.expectedTime,
    }));
  const supplierNames = Array.from(
    new Set(purchaseOrders.map((purchaseOrder) => purchaseOrder.supplier)),
  );
  const receiptType = deriveReceiptType(purchaseOrders);
  const firstPO = purchaseOrders[0];
  const isMultiPOReceipt = selectedPOCount > 1;
  const warehouseOptions = useMemo(
    () => {
      const filteredWarehouses = warehouseMasterOptions.filter((warehouse) => {
          const warehouseBusinessUnit = warehouse.business_unit?.trim().toUpperCase();
          const poBusinessUnits = new Set(
            purchaseOrders
              .map((purchaseOrder) => purchaseOrder.businessUnit?.trim().toUpperCase())
              .filter(Boolean),
          );
          return poBusinessUnits.size === 0 || !warehouseBusinessUnit || poBusinessUnits.has(warehouseBusinessUnit);
        });
      const sourceWarehouses = filteredWarehouses.length > 0 ? filteredWarehouses : warehouseMasterOptions;

      return sourceWarehouses
        .map((warehouse) => {
          const code = warehouse.warehouse_code?.trim();
          return {
            label: code,
            value: code,
          };
        })
        .filter((option): option is { label: string; value: string } => Boolean(option.value));
    },
    [purchaseOrders, warehouseMasterOptions],
  );

  const [postingDate, setPostingDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [actualReceiptDate, setActualReceiptDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState('');
  const [selectedWarehouseCode, setSelectedWarehouseCode] = useState('');
  const [warehouseSearch, setWarehouseSearch] = useState('');
  const [poDeliveryNotes, setPoDeliveryNotes] = useState<Record<string, string>>({});
  const [items, setItems] = useState<GRItem[]>(() => buildInitialItems(purchaseOrders));
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [poUploadedFiles, setPoUploadedFiles] = useState<Record<string, UploadFile[]>>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const displayedWarehouseOptions = useMemo(() => {
    const normalizedSearch = warehouseSearch.trim().toLowerCase();
    const filtered = normalizedSearch
      ? warehouseOptions.filter((option) =>
          option.label.toLowerCase().includes(normalizedSearch)
        )
      : warehouseOptions;

    const sliced = filtered.slice(0, 20);

    if (
      selectedWarehouseCode &&
      !sliced.some((opt) => opt.value === selectedWarehouseCode)
    ) {
      const selectedOption = warehouseOptions.find(
        (opt) => opt.value === selectedWarehouseCode
      );
      if (selectedOption) {
        sliced.push(selectedOption);
      }
    }

    return sliced;
  }, [warehouseOptions, warehouseSearch, selectedWarehouseCode]);

  const [previewState, setPreviewState] = useState<{
    fileName?: string;
    url?: string;
    revokeOnClose?: boolean;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeItemPanels, setActiveItemPanels] = useState<string[]>([]);
  const [collapsedSplitKeys, setCollapsedSplitKeys] = useState<Record<string, boolean>>({});

  const updateItem = useCallback((index: number, field: keyof GRItem, value: unknown) => {
    let nextItem: GRItem | null = null;
    setItems((prev) =>
      prev.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        if (field === 'receiveQty') {
          const nextQty = Math.min(Math.max(0, Number(value) || 0), item.poQty);
          nextItem =
            nextQty > 0 && item.isMissing
              ? { ...item, receiveQty: nextQty, isMissing: false, missingRemark: '' }
              : { ...item, receiveQty: nextQty };
          return nextItem;
        }
        nextItem = { ...item, [field]: value } as GRItem;
        return nextItem;
      }),
    );
    setErrors((prev) => {
      const nextErrors = {
        ...prev,
        [`${String(field)}-${index}`]: false,
      };

      if (field === 'productDate' || field === 'expiryDate') {
        delete nextErrors[`productDate-${index}`];
        delete nextErrors[`expiryDate-${index}`];
      }

      if (field === 'receiveQty' && nextItem && !requiresTraceabilityFields(nextItem)) {
        delete nextErrors[`productDate-${index}`];
        delete nextErrors[`expiryDate-${index}`];
        delete nextErrors[`batchNumber-${index}`];
      }

      return nextErrors;
    });
  }, []);

  const setReceiptStatus = useCallback((index: number, status: 'Good' | 'Missing' | 'NotArrived') => {
    setItems((prev) =>
      prev.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        if (status === 'NotArrived' && !canDeferPoLine(item.expectedDate)) {
          return item;
        }

        if (status === 'Good') {
          return {
            ...item,
            isDeferred: false,
            isMissing: false,
            receiveQty: item.receiveQty,
          };
        }

        if (status === 'NotArrived') {
          return {
            ...item,
            isDeferred: true,
            isMissing: false,
            receiveQty: 0,
            productDate: '',
            expiryDate: '',
            batchNumber: '',
            barcode: '',
            missingRemark: '',
          };
        }

        return {
          ...item,
          isDeferred: false,
          isMissing: true,
          receiveQty: 0,
          productDate: '',
          expiryDate: '',
          batchNumber: '',
          barcode: '',
        };
      }),
    );
    setErrors((prev) => ({
      ...prev,
      [`receiveQty-${index}`]: false,
      [`productDate-${index}`]: false,
      [`expiryDate-${index}`]: false,
      [`batchNumber-${index}`]: false,
      [`missingRemark-${index}`]: false,
    }));
  }, []);

  const addBatchRow = useCallback((index: number) => {
    setItems((prev) => {
      const sourceItem = prev[index];
      if (!sourceItem) return prev;

      const nextBatchRow: GRItem = {
        ...sourceItem,
        receiveQty: 0,
        productDate: '',
        expiryDate: '',
        batchNumber: '',
        barcode: '',
        isDeferred: false,
        isMissing: false,
        missingRemark: '',
      };

      return [
        ...prev.slice(0, index + 1),
        nextBatchRow,
        ...prev.slice(index + 1),
      ];
    });
    const sourceItem = items[index];
    if (sourceItem) {
      setCollapsedSplitKeys((prev) => ({ ...prev, [getItemSplitKey(sourceItem)]: false }));
    }
    setErrors({});
  }, [items]);

  const removeBatchRow = useCallback((index: number) => {
    setItems((prev) => {
      const sourceItem = prev[index];
      if (!sourceItem) return prev;

      const splitRowCount = prev.filter((item) => getItemSplitKey(item) === getItemSplitKey(sourceItem)).length;
      if (splitRowCount <= 1) return prev;

      return prev.filter((_, itemIndex) => itemIndex !== index);
    });
    setErrors({});
  }, []);

  const handleUploadChange: UploadProps['onChange'] = (info) => {
    setUploadedFiles(normalizeUploadFileList(info.fileList, 10, 'WAREHOUSE'));
  };

  const removeFile = (uid: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.uid !== uid));
  };

  const handlePoUploadChange = (poNumber: string): UploadProps['onChange'] => (info) => {
    setPoUploadedFiles((prev) => ({
      ...prev,
      [poNumber]: normalizeUploadFileList(
        info.fileList.map((file) => ({
          ...file,
          poNumber,
        })),
        10,
        'WAREHOUSE',
      ),
    }));
    setErrors((prev) => ({ ...prev, [`supportingDocs-${poNumber}`]: false }));
  };

  const removePoFile = (poNumber: string, uid: string) => {
    setPoUploadedFiles((prev) => ({
      ...prev,
      [poNumber]: (prev[poNumber] || []).filter((file) => file.uid !== uid),
    }));
  };

  const validate = (): boolean => {
    const nextErrors: Record<string, boolean> = {};
    if (!postingDate) nextErrors.postingDate = true;
    if (warehouseOptions.length > 0 && !selectedWarehouseCode.trim()) nextErrors.warehouseCode = true;
    if (isMultiPOReceipt) {
      purchaseOrders.forEach((purchaseOrder) => {
        const poNumber = purchaseOrder.poNumber;
        if (!poDeliveryNotes[poNumber]?.trim()) {
          nextErrors[`deliveryNote-${poNumber}`] = true;
        }
        if (hasIncompleteAppFilesUpload(poUploadedFiles[poNumber] || [])) {
          nextErrors[`supportingDocs-${poNumber}`] = true;
        }
      });
    } else if (!deliveryNoteNumber.trim()) {
      nextErrors.deliveryNote = true;
    }
    if (!items.some((item) => !item.isDeferred)) {
      nextErrors.receivableItems = true;
    }

    const splitQuantityErrorIndexes = getSplitQuantityErrorIndexes(items);
    splitQuantityErrorIndexes.forEach((index) => {
      nextErrors[`receiveQty-${index}`] = true;
    });

    items.forEach((item, index) => {
      if (item.isDeferred) {
        return;
      }
      if (item.isMissing) {
        if (!item.missingRemark?.trim()) nextErrors[`missingRemark-${index}`] = true;
        return;
      }
      if (item.receiveQty <= 0) nextErrors[`receiveQty-${index}`] = true;
      if (requiresTraceabilityFields(item)) {
        if (!item.productDate) nextErrors[`productDate-${index}`] = true;
        if (!item.expiryDate) nextErrors[`expiryDate-${index}`] = true;
        if (hasInvalidDateOrder(item.productDate, item.expiryDate)) {
          nextErrors[`productDate-${index}`] = true;
          nextErrors[`expiryDate-${index}`] = true;
        }
        if (!item.batchNumber?.trim()) nextErrors[`batchNumber-${index}`] = true;
      }
    });

    if (!isMultiPOReceipt && hasIncompleteAppFilesUpload(uploadedFiles)) {
      nextErrors.supportingDocs = true;
    }

    setErrors(nextErrors);
    if (nextErrors.receivableItems) {
      message.error('Select at least one PO line to receive or mark missing.');
    } else if (splitQuantityErrorIndexes.length > 0) {
      message.error('Split batch received quantity cannot exceed the PO line quantity.');
    }
    return Object.keys(nextErrors).length === 0;
  };

  const validateDraftDateOrder = () => {
    const nextDateErrors: Record<string, boolean> = {};
    const splitQuantityErrorIndexes = getSplitQuantityErrorIndexes(items);

    items.forEach((item, index) => {
      if (!requiresTraceabilityFields(item)) {
        return;
      }

      if (hasInvalidDateOrder(item.productDate, item.expiryDate)) {
        nextDateErrors[`productDate-${index}`] = true;
        nextDateErrors[`expiryDate-${index}`] = true;
      }
    });
    splitQuantityErrorIndexes.forEach((index) => {
      nextDateErrors[`receiveQty-${index}`] = true;
    });

    setErrors((prev) => {
      const next = { ...prev };

      items.forEach((_, index) => {
        delete next[`receiveQty-${index}`];
        delete next[`productDate-${index}`];
        delete next[`expiryDate-${index}`];
      });

      return {
        ...next,
        ...nextDateErrors,
      };
    });

    if (splitQuantityErrorIndexes.length > 0) {
      message.error('Split batch received quantity cannot exceed the PO line quantity.');
    }

    return Object.keys(nextDateErrors).length === 0;
  };

  const buildGRData = (
    submissionMode: 'draft' | 'submit',
    supportingDocs = uploadFilesToSupportingDocs(uploadedFiles, 'WAREHOUSE'),
    poSupportingDocs: Record<string, UploadFile[]> = poUploadedFiles,
  ) => {
    const itemsBySplitKey = new Map<string, GRItem[]>();
    items.forEach((item) => {
      const splitKey = getItemSplitKey(item);
      const group = itemsBySplitKey.get(splitKey) || [];
      group.push(item);
      itemsBySplitKey.set(splitKey, group);
    });

    const filteredItems: GRItem[] = [];
    itemsBySplitKey.forEach((group) => {
      if (group.length <= 1) {
        filteredItems.push(...group);
      } else {
        const activeRows = group.filter((item) => !item.isMissing && !item.isDeferred);
        if (activeRows.length > 0) {
          filteredItems.push(...activeRows);
        } else {
          filteredItems.push(group[0]);
        }
      }
    });

    const receivableItems = filteredItems.filter((item) => !item.isDeferred);
    const hasDiscrepancy = hasReceiptDiscrepancy(receivableItems);
    const exceptionReason = buildReceiptExceptionReason(receivableItems);
    const nextProcessState =
      correctionMode || submissionMode === 'draft'
        ? 'GRPO_DRAFT'
        : 'QC_PENDING';
    const poReferences = selectedPOReferences.map((reference) => ({
      ...reference,
      deliveryNoteNumber:
        isMultiPOReceipt
          ? poDeliveryNotes[reference.poNumber] || ''
          : deliveryNoteNumber,
    }));
    const normalizedSupportingDocs = isMultiPOReceipt
      ? purchaseOrders.flatMap((purchaseOrder) =>
          uploadFilesToSupportingDocs(poSupportingDocs[purchaseOrder.poNumber] || [], 'WAREHOUSE').map((doc) => ({
            ...doc,
            poNumber: purchaseOrder.poNumber,
          })),
        )
      : supportingDocs;
    const summarizedDeliveryNote = isMultiPOReceipt
      ? summarizeDeliveryNotes(Object.values(poDeliveryNotes))
      : deliveryNoteNumber;

    return {
      id: initialReceipt?.id,
      grNumber: initialReceipt?.grNumber,
      receivingNumber: initialReceipt?.receivingNumber || initialReceipt?.grNumber,
      receiptSourceType: initialReceipt?.receiptSourceType || 'PLANNED',
      poLinkStatus: initialReceipt?.poLinkStatus || 'NOT_REQUIRED',
      linkedPoNumber: initialReceipt?.linkedPoNumber,
      tempReferenceNo: initialReceipt?.tempReferenceNo,
      pendingPOReason: initialReceipt?.pendingPOReason,
      poNumber:
        selectedPOCount === 1
          ? firstPO?.poNumber || ''
          : `${selectedPOCount} POs`,
      supplier:
        supplierNames.length === 1 ? supplierNames[0] : `${supplierNames.length} suppliers`,
      poReferences,
      supplierNames,
      receiptType,
      expectedDate: firstPO?.expectedDate,
      expectedTime: firstPO?.expectedTime,
      postingDate,
      actualReceiptDate,
      deliveryNoteNumber: summarizedDeliveryNote,
      receiverWarehouseName: selectedWarehouseCode.trim(),
      items: receivableItems,
      uploadedFiles: normalizedSupportingDocs,
      specMatch: true,
      qtyMatch: !hasDiscrepancy,
      qualityCheckRequired: true,
      qcResult: 'Pending',
      exceptionReason,
      processState: nextProcessState,
      documentChecklist: {
        vendorDN: isMultiPOReceipt
          ? Object.values(poDeliveryNotes).some((value) => value.trim().length > 0)
          : deliveryNoteNumber.trim().length > 0,
        goodsReceiptPOForm: true,
        pmrmStockCardForm: false,
        supportingDocs: normalizedSupportingDocs,
      },
    };
  };

  const handleSaveDraft = async () => {
    if (!validateDraftDateOrder()) return;
    setIsSubmitting(true);
    try {
      const supportingDocs = isMultiPOReceipt
        ? []
        : await uploadPendingSupportingDocs(uploadedFiles, 'WAREHOUSE');
      const uploadedPoSupportingDocs = isMultiPOReceipt
        ? await Promise.all(
            purchaseOrders.map(
              async (purchaseOrder): Promise<[string, UploadFile[]]> => [
                purchaseOrder.poNumber,
                applyUploadedSupportingDocs(
                  poUploadedFiles[purchaseOrder.poNumber] || [],
                  await uploadPendingSupportingDocs(
                    poUploadedFiles[purchaseOrder.poNumber] || [],
                    'WAREHOUSE',
                  ),
                ),
              ],
            ),
          )
        : [];
      if (!isMultiPOReceipt) {
        setUploadedFiles((prev) => applyUploadedSupportingDocs(prev, supportingDocs));
      } else {
        setPoUploadedFiles((prev) =>
          uploadedPoSupportingDocs.reduce<Record<string, UploadFile[]>>((next, [poNumber, docs]) => {
            next[poNumber] = docs;
            return next;
          }, { ...prev }),
        );
      }
      const shouldClose = await onSaveDraft(
        buildGRData(
          'draft',
          supportingDocs,
          Object.fromEntries(uploadedPoSupportingDocs) as Record<string, UploadFile[]>,
        ),
      );
      if (shouldClose) {
        onClose();
      }
    } catch (error: any) {
      message.error(error?.message || 'Failed to prepare supporting documents.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    Modal.confirm({
      title: 'Submit to QC?',
      content: 'This will submit the inbound receiving to QC for review.',
      okText: 'Confirm',
      cancelText: 'Cancel',
      onOk: async () => {
        setIsSubmitting(true);
        try {
          const supportingDocs = isMultiPOReceipt
            ? []
            : await uploadPendingSupportingDocs(uploadedFiles, 'WAREHOUSE');
          const uploadedPoSupportingDocs = isMultiPOReceipt
            ? await Promise.all(
                purchaseOrders.map(
                  async (purchaseOrder): Promise<[string, UploadFile[]]> => [
                    purchaseOrder.poNumber,
                    applyUploadedSupportingDocs(
                      poUploadedFiles[purchaseOrder.poNumber] || [],
                      await uploadPendingSupportingDocs(
                        poUploadedFiles[purchaseOrder.poNumber] || [],
                        'WAREHOUSE',
                      ),
                    ),
                  ],
                ),
              )
            : [];
          if (!isMultiPOReceipt) {
            setUploadedFiles((prev) => applyUploadedSupportingDocs(prev, supportingDocs));
          } else {
            setPoUploadedFiles((prev) =>
              uploadedPoSupportingDocs.reduce<Record<string, UploadFile[]>>((next, [poNumber, docs]) => {
                next[poNumber] = docs;
                return next;
              }, { ...prev }),
            );
          }
          const shouldClose = await onSubmit(
            buildGRData(
              correctionMode ? 'draft' : 'submit',
              supportingDocs,
              Object.fromEntries(uploadedPoSupportingDocs) as Record<string, UploadFile[]>,
            ),
          );
          if (shouldClose) {
            onClose();
          }
        } catch (error: any) {
          message.error(error?.message || 'Failed to prepare supporting documents.');
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  const handlePreviewFile = async (file: UploadFile) => {
    const preview = await getSupportingUploadFilePreview(file);
    if (preview) {
      setPreviewState({
        fileName: file.name,
        url: preview.url,
        revokeOnClose: preview.revokeOnClose,
      });
      return;
    }

    message.error('Preview is not available for this file.');
  };



  useEffect(() => {
    if (!open) return;
    setWarehouseSearch('');
    if (initialReceipt) {
      setPostingDate(initialReceipt.postingDate || dayjs().format('YYYY-MM-DD'));
      setActualReceiptDate(initialReceipt.actualReceiptDate || dayjs().format('YYYY-MM-DD'));
      setDeliveryNoteNumber(initialReceipt.deliveryNoteNumber || '');
      setSelectedWarehouseCode(initialReceipt.receiverWarehouseName || '');
      setPoDeliveryNotes(buildInitialPoDeliveryNotes(purchaseOrders, initialReceipt));
      setItems(
        initialReceipt.items.map((item) => ({
          ...item,
          qcDecision: undefined,
          qcRemark: '',
        })),
      );
      setUploadedFiles(supportingDocsToUploadFiles(initialReceipt.documentChecklist.supportingDocs || []));
      setPoUploadedFiles(buildInitialPoUploadFiles(purchaseOrders, initialReceipt));
      setErrors({});
      setActiveItemPanels(purchaseOrders.map((purchaseOrder) => purchaseOrder.poNumber));
      setCollapsedSplitKeys({});

      return;
    }

    setPostingDate(dayjs().format('YYYY-MM-DD'));
    setActualReceiptDate(dayjs().format('YYYY-MM-DD'));
    setDeliveryNoteNumber('');
    setSelectedWarehouseCode('');
    setPoDeliveryNotes(buildInitialPoDeliveryNotes(purchaseOrders));
    setItems(buildInitialItems(purchaseOrders));
    setUploadedFiles([]);
    setPoUploadedFiles(buildInitialPoUploadFiles(purchaseOrders));
    setErrors({});
    setActiveItemPanels(purchaseOrders.map((purchaseOrder) => purchaseOrder.poNumber));
    setCollapsedSplitKeys({});
  }, [correctionMode, initialReceipt, open, purchaseOrders]);

  const groupedItems = purchaseOrders.map((purchaseOrder) => ({
    poNumber: purchaseOrder.poNumber,
    supplier: purchaseOrder.supplier,
    expectedDate: purchaseOrder.expectedDate,
    expectedTime: purchaseOrder.expectedTime,
    type: purchaseOrder.type,
    missingCount: items.filter((item) => item.poNumber === purchaseOrder.poNumber && item.isMissing)
      .length,
    shortCount: getShortSplitLineCount(items, purchaseOrder.poNumber),
    deferredCount: items.filter(
      (item) => item.poNumber === purchaseOrder.poNumber && item.isDeferred,
    ).length,
    rows: items
      .map((item, index) => ({
        ...item,
        index,
        key: `${item.poNumber}-${item.poLineNumber ?? item.code}-${index}`,
      }))
      .filter((item) => item.poNumber === purchaseOrder.poNumber),
  }));

  const hasDiscrepancy = hasReceiptDiscrepancy(items);
  const hasMissingItems = items.some((item) => item.isMissing);
  const hasAvailableItems = items.some((item) => !item.isDeferred && !item.isMissing);
  const getSplitMeta = (record: GRItem & { index: number }) => {
    const splitKey = getItemSplitKey(record);
    const splitIndexes = items
      .map((item, index) => ({ key: getItemSplitKey(item), index }))
      .filter((item) => item.key === splitKey)
      .map((item) => item.index);
    const firstIndex = Math.min(...splitIndexes);
    const lastIndex = Math.max(...splitIndexes);
    const childPosition = splitIndexes.indexOf(record.index);

    return {
      splitKey,
      rowCount: splitIndexes.length,
      isParent: record.index === firstIndex,
      isChild: record.index !== firstIndex,
      isLast: record.index === lastIndex,
      childPosition,
      collapsed: Boolean(collapsedSplitKeys[splitKey]),
    };
  };

  const getVisibleItemRows = (rows: Array<GRItem & { index: number; key: string }>): ReceiptItemTableRow[] => {
    const visibleRows: ReceiptItemTableRow[] = [];

    rows.forEach((record) => {
      const meta = getSplitMeta(record);
      const isVisibleItemRow = meta.isParent || !meta.collapsed;

      if (isVisibleItemRow) {
        visibleRows.push(record);
      }

      const shouldShowBatchActionRow = meta.isLast || (meta.isParent && meta.collapsed);
      if (isVisibleItemRow && shouldShowBatchActionRow) {
        visibleRows.push({
          key: `${meta.splitKey}-batch-action`,
          rowType: 'batchAction',
          splitKey: meta.splitKey,
          sourceIndex: meta.isParent && meta.collapsed ? Math.max(...items
            .map((item, index) => ({ key: getItemSplitKey(item), index }))
            .filter((item) => item.key === meta.splitKey)
            .map((item) => item.index)) : record.index,
          batchRowCount: meta.rowCount,
          disabled: Boolean(record.isMissing || record.isDeferred),
        });
      }
    });

    return visibleRows;
  };

  const toggleSplitRows = (splitKey: string) => {
    setCollapsedSplitKeys((prev) => ({ ...prev, [splitKey]: !prev[splitKey] }));
  };

  const itemColumns: ColumnsType<ReceiptItemTableRow> = [
    {
      title: '',
      key: 'expandCollapse',
      width: 50,
      align: 'center',
      render: (_, record) => {
        if (isBatchActionRow(record)) {
          return {
            children: (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  padding: '6px 10px',
                }}
              >
                <Button
                  type="link"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => addBatchRow(record.sourceIndex)}
                  disabled={record.disabled}
                  style={{ height: 22, padding: 0, fontSize: 12, fontWeight: 600 }}
                >
                  {record.batchRowCount > 1 ? 'Add Batch Row' : 'Add Batch'}
                </Button>
              </div>
            ),
            props: { colSpan: 11 },
          };
        }

        const meta = getSplitMeta(record);
        if (meta.isChild) {
          return null;
        }

        if (meta.rowCount > 1) {
          return (
            <Button
              type={meta.collapsed ? 'primary' : 'default'}
              size="small"
              icon={meta.collapsed ? <RightOutlined /> : <DownOutlined />}
              onClick={() => toggleSplitRows(meta.splitKey)}
              style={{
                width: 26,
                minWidth: 26,
                height: 24,
                padding: 0,
                borderColor: '#1677ff',
                boxShadow: '0 0 0 2px rgba(22, 119, 255, 0.08)',
              }}
            />
          );
        }

        return null;
      },
    },
    {
      title: 'Item',
      dataIndex: 'code',
      key: 'code',
      width: 154,
      render: (_, record) => {
        if (isBatchActionRow(record)) {
          return { props: { colSpan: 0 } };
        }

        const meta = getSplitMeta(record);
        const splitReceivedQty = getSplitReceivedQty(items, record);
        const shortQty = record.isDeferred ? 0 : Math.max(0, record.poQty - splitReceivedQty);

        if (meta.isChild) {
          return (
            <div
              style={{
                minHeight: 34,
                display: 'flex',
                alignItems: 'center',
                borderLeft: '2px solid #d6e4ff',
                paddingLeft: 12,
                color: '#8c8c8c',
                fontSize: 12,
              }}
            >
              Batch {meta.childPosition + 1}
            </div>
          );
        }

        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 500 }}>{record.code}</span>
              {meta.rowCount > 1 && (
                <Tag color="processing" style={{ marginInlineEnd: 0 }}>
                  {meta.rowCount} rows
                </Tag>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              {record.isDeferred ? (
                <Tag color="default" style={{ marginInlineEnd: 0 }}>Not arrived</Tag>
              ) : record.isMissing ? (
                <CloseCircleFilled style={{ color: '#ff4d4f', flex: 'none' }} />
              ) : shortQty > 0 ? (
                <WarningFilled style={{ color: '#faad14', flex: 'none' }} />
              ) : null}
              <div style={{ fontSize: 12, color: '#666' }}>{record.name}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Expected',
      dataIndex: 'expectedDate',
      key: 'expectedDate',
      width: 112,
      render: (value: string | undefined, record) =>
        isBatchActionRow(record) ? { props: { colSpan: 0 } } : getSplitMeta(record).isChild ? '-' : value || '-',
    },
    {
      title: 'PO Qty',
      dataIndex: 'poQty',
      key: 'poQty',
      width: 76,
      align: 'right',
      render: (value: number, record) => {
        if (isBatchActionRow(record)) {
          return { props: { colSpan: 0 } };
        }

        if (getSplitMeta(record).isChild) {
          return <span style={{ color: '#bfbfbf' }}>-</span>;
        }

        const splitReceivedQty = getSplitReceivedQty(items, record);
        const shortQty = Math.max(0, record.poQty - splitReceivedQty);

        return (
          <div style={{ textAlign: 'right' }}>
            <span style={{ display: 'block' }}>{value.toLocaleString()}</span>
            {record.isMissing ? (
              <span style={{ display: 'block', fontSize: 11, color: '#cf1322' }}>Missing item</span>
            ) : record.isDeferred ? (
              <span style={{ display: 'block', fontSize: 11, color: '#595959' }}>Not arrived</span>
            ) : shortQty > 0 ? (
              <span style={{ display: 'block', fontSize: 11, color: '#ad6800' }}>Short by {shortQty}</span>
            ) : null}
          </div>
        );
      },
    },
    {
      title: hasAvailableItems ? renderRequiredLabel('Receive Qty') : 'Receive Qty',
      key: 'receiveQty',
      width: 124,
      render: (_, record) => {
        if (isBatchActionRow(record)) {
          return { props: { colSpan: 0 } };
        }

        const splitReceivedQty = getSplitReceivedQty(items, record);
        const hasExceeded = !record.isDeferred && !record.isMissing && splitReceivedQty > record.poQty;
        const exceededAmount = splitReceivedQty - record.poQty;

        return (
          <Space direction="vertical" size={2} style={{ width: '100%' }}>
            <InputNumber
              min={0}
              max={record.poQty}
              value={record.receiveQty === 0 ? null : record.receiveQty}
              placeholder='0'
              onChange={(value) => updateItem(record.index, 'receiveQty', value ?? 0)}
              parser={(value) => {
                const parsed = Number(value?.replace(/[^\d]/g, ''));
                return isNaN(parsed) ? 0 : parsed;
              }}
              formatter={(value) => (value !== undefined && value !== null ? String(Math.floor(Number(value))) : '')}
              precision={0}
              onKeyDown={(e) => {
                const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
                if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              style={{ width: '100%' }}
              controls
              disabled={record.isMissing || record.isDeferred}
              status={(errors[`receiveQty-${record.index}`] || hasExceeded) ? 'error' : undefined}
            />
            {hasExceeded && (
              <span style={{ display: 'block', fontSize: 11, color: '#ff4d4f', lineHeight: '1.2', marginTop: 2 }}>
                Exceeds limit of {record.poQty.toLocaleString()} by {exceededAmount.toLocaleString()}
              </span>
            )}
          </Space>
        );
      },
    },
    {
      title: 'UoM',
      dataIndex: 'uom',
      key: 'uom',
      width: 48,
      render: (value: string | undefined, record) =>
        isBatchActionRow(record) ? { props: { colSpan: 0 } } : value,
    },
    {
      title: hasAvailableItems ? renderRequiredLabel('Product Date') : 'Product Date',
      key: 'productDate',
      width: 132,
      render: (_, record) =>
        isBatchActionRow(record) ? { props: { colSpan: 0 } } : (
          <DatePicker
            style={{ width: '100%' }}
            value={record.productDate ? dayjs(record.productDate) : null}
            onChange={(date: any) =>
              updateItem(record.index, 'productDate', date ? date.format('YYYY-MM-DD') : '')
            }
            disabledDate={(current: any) =>
              Boolean(record.expiryDate) && current.isAfter(dayjs(record.expiryDate), 'day')
            }
            disabled={record.isMissing || record.isDeferred}
            status={errors[`productDate-${record.index}`] ? 'error' : undefined}
          />
        ),
    },
    {
      title: hasAvailableItems ? renderRequiredLabel('Expiry') : 'Expiry',
      key: 'expiryDate',
      width: 132,
      render: (_, record) =>
        isBatchActionRow(record) ? { props: { colSpan: 0 } } : (
          <DatePicker
            style={{ width: '100%' }}
            value={record.expiryDate ? dayjs(record.expiryDate) : null}
            onChange={(date: any) =>
              updateItem(record.index, 'expiryDate', date ? date.format('YYYY-MM-DD') : '')
            }
            disabledDate={(current: any) =>
              Boolean(record.productDate) && current.isBefore(dayjs(record.productDate), 'day')
            }
            disabled={record.isMissing || record.isDeferred}
            status={errors[`expiryDate-${record.index}`] ? 'error' : undefined}
          />
        ),
    },
    {
      title: hasAvailableItems ? renderRequiredLabel('Batch Number') : 'Batch Number',
      key: 'batchNumber',
      width: 136,
      render: (_, record) =>
        isBatchActionRow(record) ? { props: { colSpan: 0 } } : (
          <Input
            value={record.batchNumber}
            onChange={(event) => updateItem(record.index, 'batchNumber', event.target.value)}
            disabled={record.isMissing || record.isDeferred}
            status={errors[`batchNumber-${record.index}`] ? 'error' : undefined}
            placeholder="Batch no."
          />
        ),
    },
    {
      title: hasAvailableItems ? renderRequiredLabel('Receipt Status') : 'Receipt Status',
      key: 'receiptStatus',
      width: 150,
      render: (_, record) => {
        if (isBatchActionRow(record)) {
          return { props: { colSpan: 0 } };
        }

        const splitReceivedQty = getSplitReceivedQty(items, record);
        const shortQty = record.isDeferred ? 0 : Math.max(0, record.poQty - splitReceivedQty);
        const hasShortQty = !record.isDeferred && !record.isMissing && shortQty > 0;
        const deferAllowed = canDeferPoLine(record.expectedDate);
        const receiptStatus = record.isDeferred && deferAllowed ? 'NotArrived' : record.isMissing ? 'Missing' : 'Good';
        const isMissingStatus = receiptStatus === 'Missing';
        const isDeferredStatus = receiptStatus === 'NotArrived';

        return (
          <Space direction="vertical" size={6} style={{ width: '100%' }}>
            <div
              style={{
                width: '100%',
                padding: 2,
                borderRadius: 8,
                backgroundColor: isDeferredStatus ? '#f5f5f5' : isMissingStatus ? '#fff1f0' : hasShortQty ? '#fffbe6' : '#f6ffed',
              }}
            >
              <Select
                value={receiptStatus}
                style={{ width: '100%' }}
                onChange={(value: 'Good' | 'Missing' | 'NotArrived') => setReceiptStatus(record.index, value)}
                options={[
                  { value: 'Good', label: 'Good' },
                  { value: 'Missing', label: 'Missing' },
                  ...(deferAllowed ? [{ value: 'NotArrived' as const, label: 'Not Arrived' }] : []),
                ]}
              />
            </div>
          </Space>
        );
      },
    },
    {
      title: hasMissingItems ? renderRequiredLabel('Remark') : 'Remark',
      key: 'remark',
      width: 176,
      render: (_, record) => {
        if (isBatchActionRow(record)) {
          return { props: { colSpan: 0 } };
        }

        return (
          <Input.TextArea
            autoSize={{ minRows: 1, maxRows: 3 }}
            placeholder='Add remark'
            value={record.missingRemark}
            onChange={(event) => updateItem(record.index, 'missingRemark', event.target.value)}
            status={errors[`missingRemark-${record.index}`] ? 'error' : undefined}
          />
        );
      },
    },
    {
      title: '',
      key: 'batchActions',
      width: 48,
      fixed: 'right',
      render: (_, record) => {
        if (isBatchActionRow(record)) {
          return {
            children: null,
            props: { colSpan: 1 },
          };
        }

        const meta = getSplitMeta(record);
        const canRemove = meta.rowCount > 1 && meta.isChild;

        return canRemove ? (
          <Tooltip title="Remove batch row">
            <Button
              type="text"
              size="small"
              className="delete-btn-gray"
              icon={<DeleteOutlined />}
              onClick={() => removeBatchRow(record.index)}
            />
          </Tooltip>
        ) : null;
      },
    },
  ];



  return (
    <>
      <style>
        {`
          .inbound-batch-child-row > td {
            background: #fcfdff;
            border-top: 0;
          }
          .inbound-batch-action-row > td {
            padding: 0 !important;
            background: #f8fbff !important;
            border-top: 1px solid #d6e4ff !important;
            border-bottom: 1px dashed #1677ff !important;
          }
          .delete-btn-gray {
            color: #8c8c8c !important;
          }
          .delete-btn-gray:hover {
            color: #ff4d4f !important;
            background-color: #fff1f0 !important;
          }
        `}
      </style>
      <FullscreenModal
        title={correctionMode ? 'Warehouse Recheck Inbound Receiving' : 'Create Inbound Receiving'}
        open={open}
        onCancel={onClose}
        footer={null}
        destroyOnClose
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 24px 0' }}>
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ marginBottom: 8 }}>Selected Purchase Orders</h4>
              <Table
                size="small"
                rowKey="poNumber"
                pagination={false}
                tableLayout="fixed"
                dataSource={purchaseOrders}
                columns={[
                  { title: 'PO Number', dataIndex: 'poNumber', key: 'poNumber', width: 140 },
                  {
                    title: 'Supplier',
                    dataIndex: 'supplier',
                    key: 'supplier',
                    width: 220,
                    ellipsis: true,
                  },
                  {
                    title: 'Expected Date',
                    key: 'expectedDate',
                    width: 170,
                    render: (_, record: PurchaseOrder) =>
                      record.expectedDate
                        ? `${record.expectedDate} ${record.expectedTime || ''}`.trim()
                        : 'Unplanned',
                  },
                  {
                    title: renderRequiredLabel('Posting Date'),
                    key: 'postingDate',
                    width: 150,
                    render: (_: unknown, __: PurchaseOrder, index: number) => ({
                      children:
                        index === 0 ? (
                          <DatePicker
                            value={postingDate ? dayjs(postingDate) : null}
                            onChange={(_: any, dateStr: any) => {
                              setPostingDate(dateStr as string);
                              setErrors((prev) => ({ ...prev, postingDate: false }));
                            }}
                            style={{ width: 128 }}
                            status={errors.postingDate ? 'error' : undefined}
                          />
                        ) : null,
                      props: {
                        rowSpan: index === 0 ? purchaseOrders.length : 0,
                      },
                    }),
                  },
                  { title: 'Items', dataIndex: 'totalItems', key: 'totalItems', width: 72 },
                  {
                    title: 'Total Qty',
                    dataIndex: 'totalQty',
                    key: 'totalQty',
                    width: 96,
                    render: (value: number) => value.toLocaleString(),
                  },
                ]}
              />
            </div>

          {isMultiPOReceipt && (
            <Form layout="vertical" style={{ marginBottom: 6 }}>
              <Row gutter={24}>
                <Col span={6}>
                  <Form.Item
                    label="Receiver Warehouse"
                    required
                    validateStatus={errors.warehouseCode ? 'error' : undefined}
                    help={errors.warehouseCode ? 'Required' : undefined}
                  >
                    <Select
                      showSearch
                      placeholder="Select warehouse"
                      value={selectedWarehouseCode || undefined}
                      options={displayedWarehouseOptions}
                      filterOption={false}
                      onSearch={setWarehouseSearch}
                      onDropdownVisibleChange={(visible) => {
                        if (!visible) {
                          setWarehouseSearch('');
                        }
                      }}
                      onChange={(value) => {
                        setSelectedWarehouseCode(value);
                        setErrors((prev) => ({ ...prev, warehouseCode: false }));
                        setWarehouseSearch('');
                      }}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          )}

          {!isMultiPOReceipt && (
            <Form layout="vertical" style={{ marginBottom: 6 }}>
              <Row gutter={24}>
                <Col span={6}>
                  <Form.Item
                    label="Receiver Warehouse"
                    required
                    validateStatus={errors.warehouseCode ? 'error' : undefined}
                    help={errors.warehouseCode ? 'Required' : undefined}
                  >
                    <Select
                      showSearch
                      placeholder="Select warehouse"
                      value={selectedWarehouseCode || undefined}
                      options={displayedWarehouseOptions}
                      filterOption={false}
                      onSearch={setWarehouseSearch}
                      onDropdownVisibleChange={(visible) => {
                        if (!visible) {
                          setWarehouseSearch('');
                        }
                      }}
                      onChange={(value) => {
                        setSelectedWarehouseCode(value);
                        setErrors((prev) => ({ ...prev, warehouseCode: false }));
                        setWarehouseSearch('');
                      }}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    label="Delivery Note Number"
                    required
                    validateStatus={errors.deliveryNote ? 'error' : undefined}
                    help={errors.deliveryNote ? 'Required' : undefined}
                  >
                    <Input
                      placeholder="From truck paperwork"
                      size="middle"
                      style={{ minHeight: 38 }}
                      value={deliveryNoteNumber}
                      onChange={(event) => {
                        setDeliveryNoteNumber(event.target.value);
                        setErrors((prev) => ({ ...prev, deliveryNote: false }));
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Documents"
                    validateStatus={errors.supportingDocs ? 'error' : undefined}
                    help={errors.supportingDocs ? 'Remove failed files before continuing.' : undefined}
                    style={{ marginBottom: 8 }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '140px minmax(0, 1fr)',
                        gap: 12,
                        alignItems: 'start',
                      }}
                    >
                      <div>
                        <Upload
                          multiple
                          beforeUpload={stageSupportingDocBeforeUpload}
                          fileList={uploadedFiles}
                          showUploadList={false}
                          onChange={handleUploadChange}
                          onRemove={(file: any) => removeFile(file.uid)}
                          onPreview={(file: any) => void handlePreviewFile(file)}
                          accept=".pdf,.doc,.docx,image/*"
                          listType="text"
                        >
                          <Button icon={<InboxOutlined />} size="middle" style={{ width: '100%', height: 38 }}>
                            Upload Files
                          </Button>
                        </Upload>
                      </div>
                      <div>
                        <SupportingDocsList
                          files={uploadedFiles}
                          fallbackSource="WAREHOUSE"
                          onRemoveFile={removeFile}
                          displayMode="grid"
                          collapsedLimit={5}
                          fitCountInRow={4}
                        />
                      </div>
                    </div>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          )}

          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <h4 style={{ margin: 0 }}>Item Receipt</h4>
            </div>
            <Collapse
              activeKey={activeItemPanels}
              destroyInactivePanel
              onChange={(keys) =>
                setActiveItemPanels(
                  Array.isArray(keys)
                    ? keys.map((key) => String(key))
                    : keys
                      ? [String(keys)]
                      : [],
                )
              }
              items={groupedItems.map((group) => ({
                key: group.poNumber,
                style: {
                  marginBottom: 16,
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: '#fff',
                },
                label: (
                  <div
                    data-testid={`item-receipt-panel-header-${group.poNumber}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 16,
                      width: '100%',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 4 }}>
                        Purchase Order
                      </div>
                      <Space size={8} wrap style={{ marginBottom: 2 }}>
                        <Text strong style={{ fontSize: 16 }}>
                          {group.poNumber}
                        </Text>
                        <Tag color={group.type === 'Planned' ? 'blue' : 'orange'}>
                          {group.type}
                        </Tag>
                      </Space>
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        {group.supplier}
                      </Text>
                    </div>
                    <Space size={8} wrap style={{ justifyContent: 'flex-end' }}>
                      <Tag bordered={false} color="default" style={{ paddingInline: 10 }}>
                        {group.rows.length} item{group.rows.length !== 1 ? 's' : ''}
                      </Tag>
                      {group.missingCount > 0 && (
                        <Tag bordered={false} color="error" style={{ paddingInline: 10 }}>
                          {group.missingCount} missing
                        </Tag>
                      )}
                      {group.shortCount > 0 && (
                        <Tag bordered={false} color="warning" style={{ paddingInline: 10 }}>
                          {group.shortCount} short
                        </Tag>
                      )}
                      {group.deferredCount > 0 && (
                        <Tag bordered={false} color="default" style={{ paddingInline: 10 }}>
                          {group.deferredCount} not arrived
                        </Tag>
                      )}

                    </Space>
                  </div>
                ),
                children: (
                  <div data-testid={`item-receipt-panel-body-${group.poNumber}`}>
                    {isMultiPOReceipt && (
                      <Card
                        size="small"
                        bordered={false}
                        style={{ marginBottom: 16, background: '#fafafa' }}
                        bodyStyle={{ padding: 16 }}
                      >
                        <Row gutter={16}>
                          <Col span={8}>
                            <Form.Item
                              label="Delivery Note Number"
                              required
                              validateStatus={errors[`deliveryNote-${group.poNumber}`] ? 'error' : undefined}
                              help={errors[`deliveryNote-${group.poNumber}`] ? 'Required' : undefined}
                              style={{ marginBottom: 0 }}
                            >
                              <Input
                                placeholder={`DN for ${group.poNumber}`}
                                value={poDeliveryNotes[group.poNumber] || ''}
                                onChange={(event) => {
                                  const value = event.target.value;
                                  setPoDeliveryNotes((prev) => ({
                                    ...prev,
                                    [group.poNumber]: value,
                                  }));
                                  setErrors((prev) => ({
                                    ...prev,
                                    [`deliveryNote-${group.poNumber}`]: false,
                                  }));
                                }}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={16}>
                            <Form.Item
                              label="Documents"
                              validateStatus={errors[`supportingDocs-${group.poNumber}`] ? 'error' : undefined}
                              help={
                                errors[`supportingDocs-${group.poNumber}`]
                                  ? 'Remove failed files before continuing.'
                                  : undefined
                              }
                              style={{ marginBottom: 0 }}
                            >
                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: '140px minmax(0, 1fr)',
                                  gap: 12,
                                  alignItems: 'start',
                                }}
                              >
                                <div>
                                  <Upload
                                    multiple
                                    beforeUpload={stageSupportingDocBeforeUpload}
                                    fileList={poUploadedFiles[group.poNumber] || []}
                                    showUploadList={false}
                                    onChange={handlePoUploadChange(group.poNumber)}
                                    onRemove={(file: any) => removePoFile(group.poNumber, file.uid)}
                                    onPreview={(file: any) => void handlePreviewFile(file)}
                                    accept=".pdf,.doc,.docx,image/*"
                                    listType="text"
                                  >
                                    <Button
                                      icon={<InboxOutlined />}
                                      size="middle"
                                      style={{ width: '100%', height: 38 }}
                                    >
                                      Upload Files
                                    </Button>
                                  </Upload>
                                </div>
                                <div>
                                  <SupportingDocsList
                                    files={poUploadedFiles[group.poNumber] || []}
                                    fallbackSource="WAREHOUSE"
                                    onRemoveFile={(uid) => removePoFile(group.poNumber, uid)}
                                    displayMode="grid"
                                    collapsedLimit={5}
                                    fitCountInRow={4}
                                  />
        </div>
        <SupportingDocPreviewModal
          open={Boolean(previewState)}
          fileName={previewState?.fileName}
          previewUrl={previewState?.url}
          revokeOnClose={previewState?.revokeOnClose}
          onClose={() => setPreviewState(null)}
        />
      </div>
                            </Form.Item>
                          </Col>
                        </Row>
                      </Card>
                    )}
                    <Table
                      size="small"
                      columns={itemColumns}
                      dataSource={getVisibleItemRows(group.rows)}
                      pagination={false}
                      rowKey="key"
                      rowClassName={(record) => {
                        if (isBatchActionRow(record)) return 'inbound-batch-action-row';
                        return getSplitMeta(record).isChild ? 'inbound-batch-child-row' : '';
                      }}
                      scroll={{ x: 'max-content' }}
                      tableLayout="auto"
                    />
                  </div>
                ),
              }))}
            />
          </div>

          </div>

          <div
            style={{
              textAlign: 'right',
              borderTop: '1px solid #f0f0f0',
              padding: '16px 24px',
              background: '#fff',
            }}
          >
            <Space>
              <Button onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSaveDraft} loading={isSubmitting}>
                {correctionMode ? 'Save Correction' : 'Save Draft'}
              </Button>
              {!correctionMode && (
                <Button
                  type="primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  loading={isSubmitting}
                >
                  {hasDiscrepancy ? 'Submit Exception' : 'Submit for QC'}
                </Button>
              )}
            </Space>
          </div>
        </div>
      </FullscreenModal>


    </>
  );
}
