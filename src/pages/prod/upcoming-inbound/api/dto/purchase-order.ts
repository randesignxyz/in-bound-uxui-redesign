import type { SortOrder } from 'antd/es/table/interface';

export interface InboundPurchaseOrderSearch {
  searchValue?: string;
  sort?: {
    po_number?: SortOrder;
    expected_date?: SortOrder;
    createdDate?: SortOrder;
  };
  advanceSearch?: {
    businessUnit?: string | null;
    business_unit?: string | null;
    supplier?: string | null;
    type?: string | null;
    expectedDate?: string | null;
    dateFrom?: string | null;
    dateTo?: string | null;
  };
}

export interface InboundPurchaseOrderCountParams {
  businessUnit?: string | null;
  business_unit?: string | null;
}

export interface InboundPoItemApi {
  lineNumber?: number | null;
  lineStatus?: string | null;
  expectedDate?: string | null;
  isAging?: boolean | null;
  aging?: boolean | null;
  is_aging?: boolean | null;
  code: string;
  name: string;
  poQty: number;
  receivedQty: number;
  remainingQty: number;
  uom: string;
  warehouseCode?: string | null;
  supplier: string;
}

export interface InboundPoPrLinkApi {
  pr_number: string;
  pr_doc_entry?: string | null;
  pr_doc_num?: string | null;
  pr_uuid?: string | null;
}

export interface InboundPoReceiptLogItemApi {
  code: string;
  name: string;
  qty: number;
}

export interface InboundPoReceiptLogApi {
  receipt_id?: number | null;
  receiving_number: string;
  status_label: string;
  received_by?: string | null;
  received_at?: string | null;
  total_received_qty: number;
  received_items: InboundPoReceiptLogItemApi[];
  approved_items: InboundPoReceiptLogItemApi[];
  rejected_items: InboundPoReceiptLogItemApi[];
}

export interface InboundPurchaseOrderApi {
  id?: number | null;
  business_unit: string;
  po_number: string;
  sap_doc_entry?: number | null;
  sap_doc_num?: string | null;
  supplier: string;
  expected_date: string;
  expected_time: string;
  receiver_warehouse?: string | null;
  delivery_note_number?: string | null;
  items: InboundPoItemApi[];
  total_items: number;
  total_qty: number;
  type: string;
  doc_status?: string | null;
  pr_links?: InboundPoPrLinkApi[];
  receipt_logs?: InboundPoReceiptLogApi[];
}
