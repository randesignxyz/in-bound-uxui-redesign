export interface POItem {
  lineNumber?: number;
  lineStatus?: string;
  expectedDate?: string;
  isAging?: boolean;
  code: string;
  name: string;
  poQty: number;
  receivedQty: number;
  remainingQty: number;
  uom: string;
  warehouseCode?: string;
  supplier: string;
}

export interface POPrLink {
  prNumber: string;
  prDocEntry?: string;
  prDocNum?: string;
  prUuid?: string;
}

export interface POReceiptLogItem {
  code: string;
  name: string;
  qty: number;
}

export interface POReceiptLog {
  receiptId?: number;
  receivingNumber: string;
  statusLabel: string;
  receivedBy?: string;
  receivedAt?: string;
  totalReceivedQty: number;
  receivedItems: POReceiptLogItem[];
  approvedItems: POReceiptLogItem[];
  rejectedItems: POReceiptLogItem[];
}

export interface PurchaseOrder {
  businessUnit?: string;
  poNumber: string;
  vendorCode?: string;
  sapDocEntry?: number;
  sapDocNum?: string;
  supplier: string;
  docDate?: string;
  totalAmount?: number;
  expectedDate: string;
  expectedTime: string;
  receiverWarehouse?: string;
  deliveryNoteNumber?: string;
  items: POItem[];
  totalItems: number;
  totalQty: number;
  type: 'Planned' | 'Unplanned';
  docStatus?: string;
  prLinks?: POPrLink[];
  receiptLogs?: POReceiptLog[];
}

export interface PurchaseOrderReceiptState {
  hasOutstandingQty: boolean;
  hasLinkedReceipts: boolean;
  hasBlockingReceipt: boolean;
  isClosedPo: boolean;
  isFullyReceived: boolean;
  canCreateInboundReceiving: boolean;
  displayStatus: 'Fully Received' | 'In Progress' | 'Ready to Receive' | 'Closed';
}
