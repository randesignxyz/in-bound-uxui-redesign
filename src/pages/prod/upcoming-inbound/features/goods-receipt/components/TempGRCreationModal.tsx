import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Upload,
  message,
} from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, InboxOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  buildReceiptExceptionReason,
  goodsReceiptSourceLabel,
  hasReceiptDiscrepancy,
} from '../../../core/workflow';
import type { GRItem } from '../../../core/workflow';

import type {
  InboundItemMasterApi,
  InboundSupplierMasterApi,
  InboundUomMasterApi,
  InboundWarehouseMasterApi,
  UpcomingInboundGoodsReceipt,
} from '../../../core/type';
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

interface TempGRCreationModalProps {
  open: boolean;
  onClose: () => void;
  onSaveDraft: (data: Record<string, unknown>) => Promise<boolean> | boolean;
  onSubmit: (data: Record<string, unknown>) => Promise<boolean> | boolean;
  initialReceipt?: UpcomingInboundGoodsReceipt | null;
  correctionMode?: boolean;
  availableBusinessUnits?: string[];
  itemOptions?: InboundItemMasterApi[];
  supplierOptions?: InboundSupplierMasterApi[];
  uomOptions?: InboundUomMasterApi[];
  warehouseOptions?: InboundWarehouseMasterApi[];
  onSupplierSearch?: (searchValue: string, businessUnit: string) => Promise<void> | void;
  onUomSearch?: (searchValue: string, businessUnit: string) => Promise<void> | void;
  onWarehouseSearch?: (searchValue: string, businessUnit: string) => Promise<void> | void;
  onItemSearch?: (searchValue: string, businessUnit: string) => Promise<void> | void;
}

const MASTER_DATA_PAGE_SIZE = 20;
const MASTER_DATA_SEARCH_DEBOUNCE_MS = 300;

function buildEmptyItem(): GRItem {
  return {
    code: '',
    name: '',
    poNumber: '',
    supplier: '',
    poQty: 0,
    receiveQty: 0,
    uom: '',
    productDate: '',
    expiryDate: '',
    batchNumber: '',
    barcode: '',
    isMissing: false,
    missingRemark: '',
  };
}

function hasInvalidDateOrder(productDate?: string, expiryDate?: string) {
  if (!productDate || !expiryDate) return false;

  return dayjs(productDate).isAfter(dayjs(expiryDate), 'day');
}

function getUomOptionLabel(option: InboundUomMasterApi) {
  const code = option.uom_code?.trim() || '';
  const name = option.uom_name?.trim() || '';

  if (!code) return name;
  if (!name || code.toUpperCase() === name.toUpperCase()) return code;

  return `${code} - ${name}`;
}

function renderRequiredLabel(label: string) {
  return (
    <span>
      <span style={{ color: '#ff4d4f', marginInlineEnd: 4 }}>*</span>
      {label}
    </span>
  );
}

function parseWholeNumberInput(value: string | undefined) {
  const digitsOnly = (value || '').replace(/[^\d]/g, '');
  return digitsOnly ? Number(digitsOnly) : 0;
}

function preventNonNumericKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
  const allowedKeys = new Set([
    'Backspace',
    'Delete',
    'Tab',
    'Enter',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
  ]);

  if (allowedKeys.has(event.key)) {
    return;
  }

  if (!/^\d$/.test(event.key)) {
    event.preventDefault();
  }
}

export function TempGRCreationModal({
  open,
  onClose,
  onSaveDraft,
  onSubmit,
  initialReceipt,
  correctionMode = false,
  availableBusinessUnits = [],
  itemOptions = [],
  supplierOptions = [],
  uomOptions = [],
  warehouseOptions = [],
  onSupplierSearch,
  onUomSearch,
  onWarehouseSearch,
  onItemSearch,
}: TempGRCreationModalProps) {
  const [postingDate, setPostingDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [actualReceiptDate, setActualReceiptDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [supplier, setSupplier] = useState('');
  const [selectedWarehouseCode, setSelectedWarehouseCode] = useState('');
  const [businessUnit, setBusinessUnit] = useState('');
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState('');
  const [items, setItems] = useState<GRItem[]>([buildEmptyItem()]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [warehouseSearch, setWarehouseSearch] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [uomSearch, setUomSearch] = useState('');
  const [previewState, setPreviewState] = useState<{
    fileName?: string;
    url?: string;
    revokeOnClose?: boolean;
  } | null>(null);

  useEffect(() => {
    if (!open) return;
    setWarehouseSearch('');
    setSupplierSearch('');
    setItemSearch('');
    setUomSearch('');
    if (initialReceipt) {
      setPostingDate(initialReceipt.postingDate || dayjs().format('YYYY-MM-DD'));
      setActualReceiptDate(initialReceipt.actualReceiptDate || dayjs().format('YYYY-MM-DD'));
      setBusinessUnit(initialReceipt.businessUnit || availableBusinessUnits[0] || '');
      setSelectedWarehouseCode(initialReceipt.receiverWarehouseName || '');
      
      const matchingSupplier = supplierOptions.find(
        (s) => s.supplier_name?.trim() === initialReceipt.supplier?.trim()
      );
      setSupplier(matchingSupplier?.supplier_code || initialReceipt.supplier || '');

      setDeliveryNoteNumber(initialReceipt.deliveryNoteNumber || '');
      setItems(
        initialReceipt.items.map((item) => ({
          ...item,
          qcDecision: undefined,
          qcRemark: '',
        })),
      );
      setUploadedFiles(supportingDocsToUploadFiles(initialReceipt.documentChecklist.supportingDocs || []));
      setErrors({});
      return;
    }
    setPostingDate(dayjs().format('YYYY-MM-DD'));
    setActualReceiptDate(dayjs().format('YYYY-MM-DD'));
    setBusinessUnit(availableBusinessUnits.length === 1 ? availableBusinessUnits[0] : '');
    setSelectedWarehouseCode('');
    setSupplier('');
    setDeliveryNoteNumber('');
    setItems([buildEmptyItem()]);
    setUploadedFiles([]);
    setErrors({});
  }, [availableBusinessUnits, initialReceipt, open, supplierOptions]);

  useEffect(() => {
    if (!open) return undefined;

    const timeout = window.setTimeout(() => {
      onSupplierSearch?.(supplierSearch, businessUnit);
    }, MASTER_DATA_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [businessUnit, onSupplierSearch, open, supplierSearch]);

  useEffect(() => {
    if (!open) return undefined;

    const timeout = window.setTimeout(() => {
      onWarehouseSearch?.(warehouseSearch, businessUnit);
    }, MASTER_DATA_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [businessUnit, onWarehouseSearch, open, warehouseSearch]);

  useEffect(() => {
    if (!open) return undefined;

    const timeout = window.setTimeout(() => {
      onItemSearch?.(itemSearch, businessUnit);
    }, MASTER_DATA_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [businessUnit, itemSearch, onItemSearch, open]);

  useEffect(() => {
    if (!open) return undefined;

    const timeout = window.setTimeout(() => {
      onUomSearch?.(uomSearch, businessUnit);
    }, MASTER_DATA_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [businessUnit, onUomSearch, open, uomSearch]);

  const visibleSupplierOptions = useMemo(
    () =>
      supplierOptions
        .filter((option) => !businessUnit || !option.business_unit || option.business_unit === businessUnit)
        .map((option) => {
          const code = option.supplier_code?.trim() || '';
          const name = option.supplier_name?.trim() || '';
          return {
            label: code ? `${code} - ${name}` : name,
            value: code,
          };
        })
        .filter((option) => Boolean(option.value)),
    [businessUnit, supplierOptions],
  );

  const visibleItemOptions = useMemo(
    () =>
      itemOptions
        .filter((option) => !businessUnit || !option.business_unit || option.business_unit === businessUnit)
        .map((option) => ({
          label: option.item_code,
          value: option.item_code,
          itemName: option.item_name,
          uom: option.uom,
        })),
    [businessUnit, itemOptions],
  );

  const itemOptionByCode = useMemo(
    () =>
      new Map(
        visibleItemOptions.map((option) => [
          option.value,
          {
            itemName: option.itemName,
            uom: option.uom,
          },
        ]),
      ),
    [visibleItemOptions],
  );

  const visibleUomOptions = useMemo(
    () =>
      uomOptions
        .filter((option) => !businessUnit || !option.business_unit || option.business_unit === businessUnit)
        .map((option) => ({
          label: getUomOptionLabel(option),
          value: option.uom_code,
        })),
    [businessUnit, uomOptions],
  );

  const visibleWarehouseOptions = useMemo(
    () => {
      const filteredOptions = warehouseOptions.filter((option) => {
          const optionBusinessUnit = option.business_unit?.trim().toUpperCase();
          const selectedBusinessUnit = businessUnit.trim().toUpperCase();
          return !selectedBusinessUnit || !optionBusinessUnit || optionBusinessUnit === selectedBusinessUnit;
        });
      const sourceOptions = filteredOptions.length > 0 ? filteredOptions : warehouseOptions;

      return sourceOptions
        .map((option) => ({
          label: option.warehouse_code,
          value: option.warehouse_code,
        }));
    },
    [businessUnit, warehouseOptions],
  );

  const displayedWarehouseOptions = useMemo(() => {
    const normalizedSearch = warehouseSearch.trim().toLowerCase();
    const filtered = normalizedSearch
      ? visibleWarehouseOptions.filter((option) =>
          option.label.toLowerCase().includes(normalizedSearch)
        )
      : visibleWarehouseOptions;

    const sliced = filtered.slice(0, MASTER_DATA_PAGE_SIZE);

    if (
      selectedWarehouseCode &&
      !sliced.some((opt) => opt.value === selectedWarehouseCode)
    ) {
      const selectedOption = visibleWarehouseOptions.find(
        (opt) => opt.value === selectedWarehouseCode
      );
      if (selectedOption) {
        sliced.push(selectedOption);
      }
    }

    return sliced;
  }, [visibleWarehouseOptions, warehouseSearch, selectedWarehouseCode]);

  const displayedSupplierOptions = useMemo(() => {
    const normalizedSearch = supplierSearch.trim().toLowerCase();
    const filtered = normalizedSearch
      ? visibleSupplierOptions.filter((option) =>
          option.label.toLowerCase().includes(normalizedSearch)
        )
      : visibleSupplierOptions;

    const sliced = filtered.slice(0, MASTER_DATA_PAGE_SIZE);

    if (
      supplier &&
      !sliced.some((opt) => opt.value === supplier)
    ) {
      const selectedOption = visibleSupplierOptions.find(
        (opt) => opt.value === supplier
      );
      if (selectedOption) {
        sliced.push(selectedOption);
      }
    }

    return sliced;
  }, [visibleSupplierOptions, supplierSearch, supplier]);

  const displayedItemOptions = useMemo(() => {
    const normalizedSearch = itemSearch.trim().toLowerCase();
    const filtered = normalizedSearch
      ? visibleItemOptions.filter((option) =>
          option.label.toLowerCase().includes(normalizedSearch) ||
          (option.itemName && option.itemName.toLowerCase().includes(normalizedSearch))
        )
      : visibleItemOptions;

    const sliced = filtered.slice(0, MASTER_DATA_PAGE_SIZE);

    const selectedCodes = new Set(items.map((item) => item.code).filter(Boolean));
    selectedCodes.forEach((code) => {
      if (!sliced.some((opt) => opt.value === code)) {
        const selectedOption = visibleItemOptions.find(
          (opt) => opt.value === code
        );
        if (selectedOption) {
          sliced.push(selectedOption);
        }
      }
    });

    return sliced;
  }, [visibleItemOptions, itemSearch, items]);

  const displayedUomOptions = useMemo(() => {
    const normalizedSearch = uomSearch.trim().toLowerCase();
    const filtered = normalizedSearch
      ? visibleUomOptions.filter((option) =>
          option.label.toLowerCase().includes(normalizedSearch) ||
          option.value.toLowerCase().includes(normalizedSearch)
        )
      : visibleUomOptions;

    const sliced = filtered.slice(0, MASTER_DATA_PAGE_SIZE);

    const selectedUoms = new Set(items.map((item) => item.uom).filter(Boolean));
    selectedUoms.forEach((uom) => {
      if (!sliced.some((opt) => opt.value === uom)) {
        const selectedOption = visibleUomOptions.find((opt) => opt.value === uom);
        if (selectedOption) {
          sliced.push(selectedOption);
        }
      }
    });

    return sliced;
  }, [items, uomSearch, visibleUomOptions]);

  const updateItem = useCallback((index: number, field: keyof GRItem, value: unknown) => {
    setItems((prev) =>
      prev.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        if (field === 'poQty') {
          const nextQty = Math.max(0, Math.trunc(Number(value) || 0));
          return {
            ...item,
            poQty: nextQty,
            receiveQty: Math.min(item.receiveQty, nextQty),
          };
        }

        if (field === 'receiveQty') {
          const nextValue = Math.max(0, Math.trunc(Number(value) || 0));
          return { ...item, receiveQty: Math.min(nextValue, item.poQty) };
        }

        return { ...item, [field]: value } as GRItem;
      }),
    );

    setErrors((prev) => {
      const nextErrors = {
        ...prev,
        [`${String(field)}-${index}`]: false,
        [`duplicate-${index}`]: false,
      };

      if (field === 'poQty' || field === 'receiveQty') {
        delete nextErrors[`poQty-${index}`];
        delete nextErrors[`receiveQty-${index}`];
      }

      if (field === 'productDate' || field === 'expiryDate') {
        delete nextErrors[`productDate-${index}`];
        delete nextErrors[`expiryDate-${index}`];
      }

      return nextErrors;
    });
  }, []);

  const handleSelectItemCode = useCallback(
    (index: number, value: string) => {
      const selectedItem = itemOptionByCode.get(value);
      setItems((prev) =>
        prev.map((item, itemIndex) =>
          itemIndex !== index
            ? item
            : {
                ...item,
                code: value,
                name: selectedItem?.itemName || '',
                uom: selectedItem?.uom || '',
              },
        ),
      );
      setErrors((prev) => ({
        ...prev,
        [`code-${index}`]: false,
        [`name-${index}`]: false,
        [`uom-${index}`]: false,
        [`duplicate-${index}`]: false,
      }));
    },
    [itemOptionByCode],
  );

  const addItemRow = () => setItems((prev) => [...prev, buildEmptyItem()]);

  const removeItemRow = (index: number) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, itemIndex) => itemIndex !== index)));
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (key.endsWith(`-${index}`)) delete next[key];
      });
      return next;
    });
  };

  const handleUploadChange: UploadProps['onChange'] = (info) => {
    setUploadedFiles(normalizeUploadFileList(info.fileList, 10, 'WAREHOUSE'));
  };

  const removeFile = (uid: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.uid !== uid));
  };

  const validate = () => {
    const nextErrors: Record<string, boolean> = {};
    if (!supplier.trim()) nextErrors.supplier = true;
    if (availableBusinessUnits.length > 1 && !businessUnit.trim()) nextErrors.businessUnit = true;
    if (!selectedWarehouseCode.trim()) nextErrors.warehouseCode = true;
    if (!deliveryNoteNumber.trim()) nextErrors.deliveryNote = true;

    const itemCodes = new Set<string>();

    items.forEach((item, index) => {
      if (!item.code) nextErrors[`code-${index}`] = true;
      if (!item.name.trim()) nextErrors[`name-${index}`] = true;
      if (!item.uom.trim()) nextErrors[`uom-${index}`] = true;
      if (item.code) {
        if (itemCodes.has(item.code)) {
          nextErrors[`duplicate-${index}`] = true;
        } else {
          itemCodes.add(item.code);
        }
      }

      if (item.poQty <= 0) nextErrors[`poQty-${index}`] = true;

      if (item.receiveQty <= 0) nextErrors[`receiveQty-${index}`] = true;
      if (item.receiveQty > item.poQty) {
        nextErrors[`poQty-${index}`] = true;
        nextErrors[`receiveQty-${index}`] = true;
      }
      if (!item.productDate) nextErrors[`productDate-${index}`] = true;
      if (!item.expiryDate) nextErrors[`expiryDate-${index}`] = true;
      if (hasInvalidDateOrder(item.productDate, item.expiryDate)) {
        nextErrors[`productDate-${index}`] = true;
        nextErrors[`expiryDate-${index}`] = true;
      }
      if (!item.batchNumber?.trim()) nextErrors[`batchNumber-${index}`] = true;
    });

    if (hasIncompleteAppFilesUpload(uploadedFiles)) {
      nextErrors.supportingDocs = true;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = (
    submissionMode: 'draft' | 'submit',
    supportingDocs = uploadFilesToSupportingDocs(uploadedFiles, 'WAREHOUSE'),
  ) => {
    const selectedSupplier = supplierOptions.find(
      (s) => s.supplier_code === supplier
    );
    const supplierName = selectedSupplier?.supplier_name || supplier;

    const normalizedItems = items.map((item) => ({
      ...item,
      supplier: supplierName.trim(),
    }));
    const supplierNames = initialReceipt?.supplierNames ?? [];

    return {
      id: initialReceipt?.id,
      grNumber: initialReceipt?.grNumber,
      receivingNumber: initialReceipt?.receivingNumber || initialReceipt?.grNumber,
      businessUnit: businessUnit.trim(),
      poNumber: '',
      supplier: supplierName.trim(),
      poReferences: initialReceipt?.poReferences || [],
      supplierNames: supplierNames.length > 0 ? supplierNames : [supplierName.trim()],
      receiptType: 'Unplanned',
      receiptSourceType: initialReceipt?.receiptSourceType || 'TEMP_NO_PO',
      poLinkStatus: initialReceipt?.poLinkStatus || 'WAITING_PO',
      linkedPoNumber: initialReceipt?.linkedPoNumber,
      tempReferenceNo: initialReceipt?.tempReferenceNo,
      expectedDate: '',
      expectedTime: '',
      postingDate,
      actualReceiptDate,
      deliveryNoteNumber,
      receiverWarehouseName: selectedWarehouseCode.trim(),
      items: normalizedItems,
      uploadedFiles: supportingDocs,
      specMatch: true,
      qtyMatch: !hasReceiptDiscrepancy(normalizedItems),
      qualityCheckRequired: true,
      qcResult: 'Pending',
      exceptionReason: buildReceiptExceptionReason(normalizedItems),
      processState: correctionMode || submissionMode === 'draft' ? 'GRPO_DRAFT' : 'QC_PENDING',
      documentChecklist: {
        vendorDN: deliveryNoteNumber.trim().length > 0,
        goodsReceiptPOForm: true,
        pmrmStockCardForm: false,
        supportingDocs,
      },
    };
  };

  const handleSaveDraft = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const supportingDocs = await uploadPendingSupportingDocs(uploadedFiles, 'WAREHOUSE');
      setUploadedFiles((prev) => applyUploadedSupportingDocs(prev, supportingDocs));
      const shouldClose = await onSaveDraft(buildPayload('draft', supportingDocs));
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
    const currentHasDiscrepancy = items.some((item) => item.poQty > item.receiveQty);
    Modal.confirm({
      title: 'Submit to QC?',
      content: currentHasDiscrepancy
        ? 'This receipt has discrepancies and will still be submitted to QC with exception details.'
        : 'This will submit the inbound receiving to QC for review.',
      okText: 'Confirm',
      cancelText: 'Cancel',
      onOk: async () => {
        setIsSubmitting(true);
        try {
          const supportingDocs = await uploadPendingSupportingDocs(uploadedFiles, 'WAREHOUSE');
          setUploadedFiles((prev) => applyUploadedSupportingDocs(prev, supportingDocs));
          const shouldClose = await onSubmit(
            buildPayload(correctionMode ? 'draft' : 'submit', supportingDocs),
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

  const itemColumns: ColumnsType<GRItem & { index: number }> = useMemo(
    () => [
      {
        title: renderRequiredLabel('Item'),
        key: 'item',
        width: 240,
        render: (_, record) => (
          <div
            data-testid={`temp-gr-item-identity-${record.index}`}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}
          >
            <Select
              showSearch
              value={record.code || undefined}
              onChange={(value) => {
                handleSelectItemCode(record.index, value);
                setItemSearch('');
              }}
              onSearch={setItemSearch}
              onDropdownVisibleChange={(visible) => {
                if (!visible) {
                  setItemSearch('');
                }
              }}
              filterOption={false}
              placeholder="Item code"
              options={displayedItemOptions}
              notFoundContent="No item master data"
              status={
                errors[`code-${record.index}`] || errors[`duplicate-${record.index}`]
                  ? 'error'
                  : undefined
              }
              style={{ width: 180, flex: '0 0 180px' }}
            />
            <Input
              placeholder="Item name"
              value={record.name}
              readOnly
              status={errors[`name-${record.index}`] ? 'error' : undefined}
              style={{ flex: 1, minWidth: 0 }}
            />
          </div>
        ),
      },
      {
        title: renderRequiredLabel('Qty'),
        key: 'poQty',
        width: 92,
        render: (_, record) => (
          <InputNumber
            min={0}
            precision={0}
            step={1}
            parser={parseWholeNumberInput}
            value={record.poQty === 0 ? null : record.poQty}
            placeholder="0"
            onChange={(value) => updateItem(record.index, 'poQty', value ?? 0)}
            onKeyDown={preventNonNumericKeyDown}
            status={errors[`poQty-${record.index}`] ? 'error' : undefined}
            style={{ width: '100%' }}
            inputMode="numeric"
          />
        ),
      },
      {
        title: renderRequiredLabel('Received'),
        key: 'receiveQty',
        width: 92,
        render: (_, record) => (
          <InputNumber
            min={0}
            max={record.poQty > 0 ? record.poQty : undefined}
            precision={0}
            step={1}
            parser={parseWholeNumberInput}
            value={record.receiveQty === 0 ? null : record.receiveQty}
            placeholder="0"
            onChange={(value) => updateItem(record.index, 'receiveQty', value ?? 0)}
            onKeyDown={preventNonNumericKeyDown}
            status={errors[`receiveQty-${record.index}`] ? 'error' : undefined}
            style={{ width: '100%' }}
            inputMode="numeric"
          />
        ),
      },
      {
        title: renderRequiredLabel('UoM'),
        key: 'uom',
        width: 140,
        render: (_, record) => (
          <Select
            showSearch
            value={record.uom || undefined}
            onChange={(value) => {
              updateItem(record.index, 'uom', value);
              setUomSearch('');
            }}
            onSearch={setUomSearch}
            onDropdownVisibleChange={(visible) => {
              if (!visible) {
                setUomSearch('');
              }
            }}
            filterOption={false}
            status={errors[`uom-${record.index}`] ? 'error' : undefined}
            placeholder="UoM"
            options={displayedUomOptions}
            notFoundContent="No UOM master data"
            popupMatchSelectWidth={220}
            listHeight={360}
            style={{ width: '100%' }}
          />
        ),
      },
      {
        title: 'Product Date',
        key: 'productDate',
        width: 132,
        render: (_, record) => (
          <DatePicker
            style={{ width: '100%' }}
            value={record.productDate ? dayjs(record.productDate) : null}
            onChange={(date: dayjs.Dayjs | null) =>
              updateItem(record.index, 'productDate', date ? date.format('YYYY-MM-DD') : '')
            }
            disabledDate={(current: dayjs.Dayjs) =>
              Boolean(record.expiryDate) && current.isAfter(dayjs(record.expiryDate), 'day')
            }
            status={errors[`productDate-${record.index}`] ? 'error' : undefined}
          />
        ),
      },
      {
        title: 'Expiry',
        key: 'expiryDate',
        width: 132,
        render: (_, record) => (
          <DatePicker
            style={{ width: '100%' }}
            value={record.expiryDate ? dayjs(record.expiryDate) : null}
            onChange={(date: dayjs.Dayjs | null) =>
              updateItem(record.index, 'expiryDate', date ? date.format('YYYY-MM-DD') : '')
            }
            disabledDate={(current: dayjs.Dayjs) =>
              Boolean(record.productDate) && current.isBefore(dayjs(record.productDate), 'day')
            }
            status={errors[`expiryDate-${record.index}`] ? 'error' : undefined}
          />
        ),
      },
      {
        title: renderRequiredLabel('Batch Number'),
        key: 'batchNumber',
        width: 140,
        render: (_, record) => (
          <Input
            value={record.batchNumber}
            onChange={(event) => updateItem(record.index, 'batchNumber', event.target.value)}
            status={errors[`batchNumber-${record.index}`] ? 'error' : undefined}
            placeholder="Batch number"
          />
        ),
      },
      {
        title: '',
        key: 'action',
        width: 60,
        render: (_, record) => (
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            disabled={items.length === 1}
            onClick={() => removeItemRow(record.index)}
          />
        ),
      },
    ],
    [errors, handleSelectItemCode, items.length, displayedItemOptions, displayedUomOptions, updateItem],
  );

  return (
    <FullscreenModal
      title={correctionMode ? 'Warehouse Recheck Temporary Inbound Receiving' : 'Receive without PO'}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 0' }}>
          <Descriptions column={4} size="small" style={{ marginBottom: 10 }}>
            <Descriptions.Item label="Source">
              <Tag color="purple">{goodsReceiptSourceLabel.TEMP_NO_PO}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Receipt Type">
              <Tag color="orange">Unplanned</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="PO Link">
              <Tag color="warning">Waiting PO</Tag>
            </Descriptions.Item>
          </Descriptions>

          <Form layout="vertical" style={{ marginBottom: 10 }}>
            <Row gutter={24}>
              <Col span={8}>
                <Form.Item
                  label="Business Unit"
                  required={availableBusinessUnits.length > 1}
                  validateStatus={errors.businessUnit ? 'error' : undefined}
                  help={errors.businessUnit ? 'Required' : undefined}
                >
                  <Select
                    value={businessUnit || undefined}
                    onChange={(value) => {
                      setBusinessUnit(value);
                      setSelectedWarehouseCode('');
                      setItems([buildEmptyItem()]);
                      setErrors((prev) => ({ ...prev, businessUnit: false, warehouseCode: false }));
                    }}
                    disabled={availableBusinessUnits.length <= 1 || correctionMode}
                    placeholder="Select BU"
                    options={availableBusinessUnits.map((value) => ({ label: value, value }))}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Supplier"
                  required
                  validateStatus={errors.supplier ? 'error' : undefined}
                  help={errors.supplier ? 'Required' : undefined}
                >
                  <Select
                    showSearch
                    value={supplier || undefined}
                    onChange={(value) => {
                      setSupplier(value);
                      setSupplierSearch('');
                    }}
                    onSearch={setSupplierSearch}
                    onDropdownVisibleChange={(visible) => {
                      if (!visible) {
                        setSupplierSearch('');
                      }
                    }}
                    filterOption={false}
                    placeholder="Supplier name"
                    options={displayedSupplierOptions}
                    notFoundContent="No supplier master data"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Posting Date" required>
                  <DatePicker
                    style={{ width: '100%' }}
                    value={postingDate ? dayjs(postingDate) : null}
                    onChange={(_: any, dateStr: string | string[]) => setPostingDate(dateStr as string)}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col span={8}>
                <Form.Item
                  label="Receiver Warehouse"
                  required
                  validateStatus={errors.warehouseCode ? 'error' : undefined}
                  help={errors.warehouseCode ? 'Required' : undefined}
                >
                  <Select
                    showSearch
                    value={selectedWarehouseCode || undefined}
                    onChange={(value) => {
                      setSelectedWarehouseCode(value);
                      setErrors((prev) => ({ ...prev, warehouseCode: false }));
                      setWarehouseSearch('');
                    }}
                    onSearch={setWarehouseSearch}
                    onDropdownVisibleChange={(visible) => {
                      if (!visible) {
                        setWarehouseSearch('');
                      }
                    }}
                    filterOption={false}
                    placeholder="Select warehouse"
                    options={displayedWarehouseOptions}
                    notFoundContent="No warehouse master data"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Delivery Note Number"
                  required
                  validateStatus={errors.deliveryNote ? 'error' : undefined}
                  help={errors.deliveryNote ? 'Required' : undefined}
                >
                  <Input
                    value={deliveryNoteNumber}
                    onChange={(event) => setDeliveryNoteNumber(event.target.value)}
                    placeholder="From vendor paperwork"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>

          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <h4 style={{ margin: 0 }}>Item Receipt</h4>
              <Button icon={<PlusOutlined />} onClick={addItemRow}>
                Add Item
              </Button>
            </div>
            <Card size="small" style={{ borderRadius: 12 }}>
              <Table
                size="small"
                columns={itemColumns}
                dataSource={items.map((item, index) => ({
                  ...item,
                  index,
                  key: `temp-row-${index}`,
                }))}
                pagination={false}
                scroll={{ x: 1360 }}
              />
            </Card>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h4 style={{ marginBottom: 12 }}>Documents</h4>
            <Form.Item
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
                    onRemove={(file: UploadFile) => {
                      removeFile(file.uid);
                      return true;
                    }}
                    onPreview={(file: UploadFile) => void handlePreviewFile(file)}
                    accept=".pdf,.doc,.docx,image/*"
                    listType="text"
                  >
                    <Button icon={<InboxOutlined />} size="large" style={{ width: '100%', height: 44 }}>
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
                  />
                </div>
              </div>
            </Form.Item>
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
              <Button type="primary" onClick={handleSubmit} disabled={isSubmitting} loading={isSubmitting}>
                Submit for QC
              </Button>
            )}
          </Space>
        </div>
      </div>
      <SupportingDocPreviewModal
        open={Boolean(previewState)}
        fileName={previewState?.fileName}
        previewUrl={previewState?.url}
        revokeOnClose={previewState?.revokeOnClose}
        onClose={() => setPreviewState(null)}
      />
    </FullscreenModal>
  );
}
