import type {
  InboundPoItemApi,
  InboundPurchaseOrderApi,
  UpcomingInboundPurchaseOrder,
} from '../type';
import {
  readArray,
  readNumber,
  readString,
  readValue,
  normalizeEnum,
  formatDisplayTimestamp,
} from './helpers';

const PO_TYPE_VALUES: UpcomingInboundPurchaseOrder['type'][] = ['Planned', 'Unplanned'];

function mapInboundPurchaseOrderItem(item: InboundPoItemApi): UpcomingInboundPurchaseOrder['items'][number] {
  return {
    lineNumber: readNumber(item, 'lineNumber', 'line_number') ?? undefined,
    lineStatus: readValue<string | null>(item, 'lineStatus', 'line_status') ?? undefined,
    expectedDate: readValue<string | null>(item, 'expectedDate', 'expected_date') ?? undefined,
    isAging: readValue<boolean | null>(item, 'isAging', 'is_aging', 'aging') ?? false,
    code: readString(item, 'code'),
    name: readString(item, 'name'),
    poQty: readNumber(item, 'poQty', 'po_qty') ?? 0,
    receivedQty: readNumber(item, 'receivedQty', 'received_qty') ?? 0,
    remainingQty: readNumber(item, 'remainingQty', 'remaining_qty') ?? 0,
    uom: readString(item, 'uom'),
    warehouseCode: readValue<string | null>(item, 'warehouseCode', 'warehouse_code') ?? undefined,
    supplier: readString(item, 'supplier'),
  };
}

function mapInboundPoPrLink(link: any): NonNullable<UpcomingInboundPurchaseOrder['prLinks']>[number] {
  return {
    prNumber: readString(link, 'prNumber', 'pr_number'),
    prDocEntry: readValue<string | null>(link, 'prDocEntry', 'pr_doc_entry') ?? undefined,
    prDocNum: readValue<string | null>(link, 'prDocNum', 'pr_doc_num') ?? undefined,
    prUuid: readValue<string | null>(link, 'prUuid', 'pr_uuid') ?? undefined,
  };
}

function mapInboundPoReceiptLogItem(
  item: any,
): NonNullable<UpcomingInboundPurchaseOrder['receiptLogs']>[number]['receivedItems'][number] {
  return {
    code: readString(item, 'code'),
    name: readString(item, 'name'),
    qty: readNumber(item, 'qty') ?? 0,
  };
}

function mapInboundPoReceiptLog(log: any): NonNullable<UpcomingInboundPurchaseOrder['receiptLogs']>[number] {
  return {
    receiptId: readValue<number | null>(log, 'receiptId', 'receipt_id') ?? undefined,
    receivingNumber: readString(log, 'receivingNumber', 'receiving_number'),
    statusLabel: readString(log, 'statusLabel', 'status_label'),
    receivedBy: readValue<string | null>(log, 'receivedBy', 'received_by') ?? undefined,
    receivedAt: formatDisplayTimestamp(readValue<string | null>(log, 'receivedAt', 'received_at')),
    totalReceivedQty: readNumber(log, 'totalReceivedQty', 'total_received_qty') ?? 0,
    receivedItems: readArray<any>(log, 'receivedItems', 'received_items').map(mapInboundPoReceiptLogItem),
    approvedItems: readArray<any>(log, 'approvedItems', 'approved_items').map(mapInboundPoReceiptLogItem),
    rejectedItems: readArray<any>(log, 'rejectedItems', 'rejected_items').map(mapInboundPoReceiptLogItem),
  };
}

export function mapInboundPurchaseOrder(api: InboundPurchaseOrderApi): UpcomingInboundPurchaseOrder {
  const items = readArray<InboundPoItemApi>(api, 'items');
  const prLinks = readArray<any>(api, 'prLinks', 'pr_links');
  const receiptLogs = readArray<any>(api, 'receiptLogs', 'receipt_logs');

  return {
    id: readValue<number | null>(api, 'id') ?? undefined,
    businessUnit: readString(api, 'businessUnit', 'business_unit'),
    poNumber: readString(api, 'poNumber', 'po_number'),
    sapDocEntry: readNumber(api, 'sapDocEntry', 'sap_doc_entry') ?? undefined,
    sapDocNum: readValue<string | null>(api, 'sapDocNum', 'sap_doc_num') ?? undefined,
    supplier: readString(api, 'supplier'),
    expectedDate: readString(api, 'expectedDate', 'expected_date'),
    expectedTime: readString(api, 'expectedTime', 'expected_time'),
    receiverWarehouse:
      readValue<string | null>(api, 'receiverWarehouse', 'receiver_warehouse') ?? undefined,
    deliveryNoteNumber: readValue<string | null>(api, 'deliveryNoteNumber', 'delivery_note_number') ?? undefined,
    items: items.map(mapInboundPurchaseOrderItem),
    totalItems: readNumber(api, 'totalItems', 'total_items') ?? items.length,
    totalQty:
      readNumber(api, 'totalQty', 'total_qty') ??
      items.reduce((sum, item) => sum + (readNumber(item, 'poQty', 'po_qty') ?? 0), 0),
    type: normalizeEnum(readString(api, 'type'), PO_TYPE_VALUES, 'Planned'),
    docStatus: readValue<string | null>(api, 'docStatus', 'doc_status') ?? undefined,
    prLinks: prLinks.map(mapInboundPoPrLink).filter((link) => link.prNumber),
    receiptLogs: receiptLogs.map(mapInboundPoReceiptLog),
  };
}

export function mapInboundPurchaseOrders(orders: InboundPurchaseOrderApi[]): UpcomingInboundPurchaseOrder[] {
  if (!Array.isArray(orders)) return [];
  return orders.map(mapInboundPurchaseOrder);
}
