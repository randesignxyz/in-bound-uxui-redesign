/**
 * Mock Inbound Service implementation
 * Provides in-memory client-side data handling for static UI development
 * based on the SQL seed data in ../data/mockData.ts
 */

import type { TableViewSearchParams } from '@/components/DataCrud/TableView';
import type { Paging } from '@/services/API';
import type {
  InboundSupplierMasterListParams,
  InboundSupplierMasterApi,
  InboundUomMasterListParams,
  InboundUomMasterApi,
  InboundWarehouseMasterListParams,
  InboundWarehouseMasterApi,
  InboundItemMasterListParams,
  InboundItemMasterApi,
  InboundPurchaseOrderSearch,
  InboundPurchaseOrderApi,
  InboundGoodsReceiptSearch,
  InboundGoodsReceiptApi,
  InboundSaveGoodsReceiptInput,
  InboundGoodsReceiptStatusChangeInput,
  InboundLinkPoInput,
  InboundSubmitQcReviewInput,
  InboundSubmitSupervisorReviewInput,
  InboundMarkQcBadgeViewedInput,
  InboundDashboardSummaryParams,
  InboundDashboardSummaryApi,
  InboundSuccessPayloadResponse,
} from './dto';
import type {
  UpcomingInboundPurchaseOrder,
  UpcomingInboundGoodsReceipt,
} from '../core/type';
import {
  mapInboundPurchaseOrder,
  mapInboundPurchaseOrders,
  mapInboundGoodsReceipt,
  mapInboundDashboardSummary,
} from '../core/mappers';
import {
  MOCK_SUPPLIERS,
  MOCK_UOMS,
  MOCK_WAREHOUSES,
  MOCK_ITEMS,
  MOCK_PURCHASE_ORDERS,
  MOCK_GOODS_RECEIPTS,
  MOCK_DASHBOARD_SUMMARY,
} from '../data/mockData';

// Mutable in-memory store for interactive UI testing
let purchaseOrdersStore: InboundPurchaseOrderApi[] = JSON.parse(JSON.stringify(MOCK_PURCHASE_ORDERS));
let goodsReceiptsStore: InboundGoodsReceiptApi[] = JSON.parse(JSON.stringify(MOCK_GOODS_RECEIPTS));
let suppliersStore: InboundSupplierMasterApi[] = JSON.parse(JSON.stringify(MOCK_SUPPLIERS));
let uomsStore: InboundUomMasterApi[] = JSON.parse(JSON.stringify(MOCK_UOMS));
let warehousesStore: InboundWarehouseMasterApi[] = JSON.parse(JSON.stringify(MOCK_WAREHOUSES));
let itemsStore: InboundItemMasterApi[] = JSON.parse(JSON.stringify(MOCK_ITEMS));

function paginate<T>(items: T[], page: number = 1, pageSize: number = 10): {
  items: T[];
  list: T[];
  total: number;
  pageSize: number;
  current: number;
} {
  const startIndex = (page - 1) * pageSize;
  const list = items.slice(startIndex, startIndex + pageSize);
  return {
    items: list,
    list,
    total: items.length,
    pageSize,
    current: page,
  };
}

export const mockUpcomingInboundService = {
  // ================= Purchase Orders =================
  pagePurchaseOrders: async (
    params: TableViewSearchParams<NonNullable<InboundPurchaseOrderSearch['advanceSearch']>>,
  ): Promise<any> => {
    let filtered = [...purchaseOrdersStore];
    const { searchValue, advanceSearch } = params.criteria || {};

    if (advanceSearch?.businessUnit || advanceSearch?.business_unit) {
      const bu = (advanceSearch.businessUnit || advanceSearch.business_unit || '').toUpperCase();
      filtered = filtered.filter((po) => po.business_unit?.toUpperCase() === bu);
    }
    if (advanceSearch?.supplier) {
      const sup = advanceSearch.supplier.toLowerCase();
      filtered = filtered.filter((po) => po.supplier?.toLowerCase().includes(sup));
    }
    if (advanceSearch?.type) {
      const t = advanceSearch.type.toLowerCase();
      filtered = filtered.filter((po) => po.type?.toLowerCase() === t);
    }
    if (searchValue) {
      const search = searchValue.toLowerCase();
      filtered = filtered.filter(
        (po) =>
          po.po_number?.toLowerCase().includes(search) ||
          po.supplier?.toLowerCase().includes(search) ||
          po.items?.some((it) => it.name?.toLowerCase().includes(search) || it.code?.toLowerCase().includes(search)),
      );
    }

    const current = params.pagination?.current || 1;
    const pageSize = params.pagination?.pageSize || 10;
    const paginated = paginate(filtered, current, pageSize);
    const mapped = mapInboundPurchaseOrders(paginated.items);

    return {
      items: mapped,
      list: mapped,
      total: paginated.total,
      pageSize: paginated.pageSize,
      current: paginated.current,
    };
  },

  detailPurchaseOrder: async (id: number): Promise<UpcomingInboundPurchaseOrder> => {
    const po = purchaseOrdersStore.find((item) => item.id === id) || purchaseOrdersStore[0];
    return mapInboundPurchaseOrder(po);
  },

  detailPurchaseOrderByKey: async (params: {
    po_number: string;
    business_unit: string;
  }): Promise<UpcomingInboundPurchaseOrder> => {
    const po =
      purchaseOrdersStore.find(
        (item) =>
          item.po_number === params.po_number &&
          item.business_unit?.toUpperCase() === params.business_unit?.toUpperCase(),
      ) || purchaseOrdersStore.find((item) => item.po_number === params.po_number) || purchaseOrdersStore[0];
    return mapInboundPurchaseOrder(po);
  },

  listPurchaseOrders: async (): Promise<UpcomingInboundPurchaseOrder[]> => {
    return mapInboundPurchaseOrders(purchaseOrdersStore);
  },

  syncPurchaseOrdersFromSap: async (): Promise<InboundSuccessPayloadResponse<Record<string, unknown>>> => {
    return {
      message: 'Synced purchase orders from SAP successfully (mock)',
      data: {},
    };
  },

  // ================= Goods Receipts =================
  pageGoodsReceipts: async (params: any): Promise<any> => {
    let filtered = [...goodsReceiptsStore];
    const criteria = params.criteria || {};

    if (criteria.businessUnit || criteria.business_unit) {
      const bu = (criteria.businessUnit || criteria.business_unit || '').toUpperCase();
      filtered = filtered.filter((gr) => gr.businessUnit?.toUpperCase() === bu);
    }
    if (criteria.status) {
      const st = criteria.status.toUpperCase();
      filtered = filtered.filter((gr) => gr.status?.toUpperCase() === st);
    }
    if (criteria.searchValue) {
      const search = criteria.searchValue.toLowerCase();
      filtered = filtered.filter(
        (gr) =>
          gr.receivingNumber?.toLowerCase().includes(search) ||
          gr.poNumber?.toLowerCase().includes(search) ||
          gr.supplier?.toLowerCase().includes(search),
      );
    }

    const current = params.pagination?.current || 1;
    const pageSize = params.pagination?.pageSize || 10;
    const paginated = paginate(filtered, current, pageSize);
    const mapped = paginated.items.map(mapInboundGoodsReceipt);

    return {
      items: mapped,
      list: mapped,
      total: paginated.total,
      pageSize: paginated.pageSize,
      current: paginated.current,
    };
  },

  detailGoodsReceipt: async (id: number): Promise<UpcomingInboundGoodsReceipt> => {
    const gr = goodsReceiptsStore.find((item) => item.id === id) || goodsReceiptsStore[0];
    return mapInboundGoodsReceipt(gr);
  },

  saveGoodsReceipt: async (
    data: InboundSaveGoodsReceiptInput,
  ): Promise<InboundSuccessPayloadResponse<UpcomingInboundGoodsReceipt>> => {
    const existingIndex = goodsReceiptsStore.findIndex((g) => g.id === data.id);
    let targetGr: InboundGoodsReceiptApi;

    if (existingIndex >= 0) {
      goodsReceiptsStore[existingIndex] = {
        ...goodsReceiptsStore[existingIndex],
        ...data,
        items: data.items as any,
      } as InboundGoodsReceiptApi;
      targetGr = goodsReceiptsStore[existingIndex];
    } else {
      const newId = goodsReceiptsStore.length + 1;
      targetGr = {
        id: newId,
        receiving_number: `GR-2026-${String(newId).padStart(4, '0')}`,
        po_number: (data as any).po_number || null,
        business_unit: (data as any).business_unit || 'OFL',
        supplier: data.supplier || 'Supplier',
        received_date: (data as any).received_date || new Date().toISOString().slice(0, 10),
        received_time: (data as any).received_time || '12:00',
        receiver_warehouse: (data as any).receiver_warehouse || 'WHM1',
        delivery_note_number: data.delivery_note_number || 'DN-AUTO',
        status: 'PENDING_QC',
        status_label: 'Pending QC',
        received_by: 'Static Dev',
        total_items: data.items?.length || 0,
        total_qty: data.items?.reduce((acc: number, it: any) => acc + Number(it.receiveQty || it.received_qty || 0), 0) || 0,
        items: (data.items || []).map((it: any, idx: number) => ({
          id: idx + 1,
          code: it.code || it.item_code,
          name: it.name || it.item_name,
          receiveQty: it.receiveQty || it.received_qty,
          poQty: it.poQty || it.received_qty,
          uom: it.uom,
          condition: 'Good',
          isMissing: false,
        })),
        supporting_documents: (data as any).supporting_documents || [],
      } as any;
      goodsReceiptsStore.unshift(targetGr);
    }

    return {
      message: 'Saved goods receipt successfully (mock)',
      data: mapInboundGoodsReceipt(targetGr),
    } as any;
  },

  changeGoodsReceiptStatus: async (
    data: InboundGoodsReceiptStatusChangeInput,
  ): Promise<InboundSuccessPayloadResponse<UpcomingInboundGoodsReceipt>> => {
    const gr = goodsReceiptsStore.find((g) => g.id === data.id);
    if (gr) {
      gr.status = data.state || (data as any).status;
      (gr as any).status_label = (data.state || (data as any).status || '').replace('_', ' ');
    }
    return {
      message: 'Updated goods receipt status (mock)',
      data: mapInboundGoodsReceipt(gr || goodsReceiptsStore[0]),
    } as any;
  },

  linkPoToTempReceipt: async (
    data: InboundLinkPoInput,
  ): Promise<InboundSuccessPayloadResponse<UpcomingInboundGoodsReceipt>> => {
    const gr = goodsReceiptsStore.find((g) => g.id === data.id);
    if (gr) {
      gr.poNumber = data.poNumber || (data as any).po_number;
    }
    return {
      message: 'Linked PO to receipt (mock)',
      data: mapInboundGoodsReceipt(gr || goodsReceiptsStore[0]),
    } as any;
  },

  submitQcReview: async (
    data: InboundSubmitQcReviewInput,
  ): Promise<InboundSuccessPayloadResponse<UpcomingInboundGoodsReceipt>> => {
    const gr = goodsReceiptsStore.find((g) => g.id === data.id);
    if (gr) {
      (gr as any).qc_status = (data as any).qc_status || 'PASSED';
      (gr as any).qc_by = 'QC Inspector';
      (gr as any).qc_at = new Date().toISOString();
      gr.status = (data as any).qc_status === 'PASSED' ? 'AWAITING_SUPERVISOR' : 'REJECTED';
    }
    return {
      message: 'Submitted QC review (mock)',
      data: mapInboundGoodsReceipt(gr || goodsReceiptsStore[0]),
    } as any;
  },

  submitSupervisorReview: async (
    data: InboundSubmitSupervisorReviewInput,
  ): Promise<InboundSuccessPayloadResponse<UpcomingInboundGoodsReceipt>> => {
    const gr = goodsReceiptsStore.find((g) => g.id === data.id);
    if (gr) {
      gr.status = (data as any).decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      (gr as any).status_label = (data as any).decision === 'APPROVE' ? 'Approved' : 'Rejected';
    }
    return {
      message: 'Submitted supervisor review (mock)',
      data: mapInboundGoodsReceipt(gr || goodsReceiptsStore[0]),
    } as any;
  },

  markQcBadgeViewed: async (
    data: InboundMarkQcBadgeViewedInput,
  ): Promise<InboundSuccessPayloadResponse<UpcomingInboundGoodsReceipt>> => {
    const gr = goodsReceiptsStore.find((g) => g.id === data.id);
    return {
      message: 'Marked QC badge viewed (mock)',
      data: mapInboundGoodsReceipt(gr || goodsReceiptsStore[0]),
    };
  },

  getGrActivities: async (id: number): Promise<any[]> => {
    const gr = goodsReceiptsStore.find((g) => g.id === id);
    return (gr as any)?.activities || [
      { id: 1, activity_name: 'Receiving created', created_by: 'Static Dev', created_date: '2026-03-06 10:00' },
    ];
  },

  getPoActivities: async (poNumber: string): Promise<any[]> => {
    return [
      { id: 1, activity_name: `PO ${poNumber} synced from SAP`, created_by: 'System', created_date: '2026-03-05 08:00' },
    ];
  },

  // ================= Master Data =================
  syncMasterDataFromSap: async (): Promise<InboundSuccessPayloadResponse<Record<string, unknown>>> => {
    return {
      message: 'Master data synced successfully from SAP (mock)',
      data: {},
    };
  },

  listSuppliers: async (
    params: InboundSupplierMasterListParams = {},
  ): Promise<InboundSupplierMasterApi[]> => {
    let list = [...suppliersStore];
    if (params.businessUnit || params.business_unit) {
      const bu = (params.businessUnit || params.business_unit || '').toUpperCase();
      list = list.filter((s) => s.business_unit.toUpperCase() === bu || s.business_unit === 'ALL');
    }
    if (params.searchValue) {
      const q = params.searchValue.toLowerCase();
      list = list.filter(
        (s) => s.supplier_name.toLowerCase().includes(q) || s.supplier_code.toLowerCase().includes(q),
      );
    }
    return list;
  },

  listUoms: async (params: InboundUomMasterListParams = {}): Promise<InboundUomMasterApi[]> => {
    let list = [...uomsStore];
    if (params.businessUnit || params.business_unit) {
      const bu = (params.businessUnit || params.business_unit || '').toUpperCase();
      list = list.filter((u) => u.business_unit.toUpperCase() === bu || u.business_unit === 'ALL');
    }
    if (params.searchValue) {
      const q = params.searchValue.toLowerCase();
      list = list.filter(
        (u) => u.uom_name.toLowerCase().includes(q) || u.uom_code.toLowerCase().includes(q),
      );
    }
    return list;
  },

  listWarehouses: async (
    params: InboundWarehouseMasterListParams = {},
  ): Promise<InboundWarehouseMasterApi[]> => {
    let list = [...warehousesStore];
    if (params.businessUnit || params.business_unit) {
      const bu = (params.businessUnit || params.business_unit || '').toUpperCase();
      list = list.filter((w) => w.business_unit.toUpperCase() === bu || w.business_unit === 'ALL');
    }
    if (params.searchValue) {
      const q = params.searchValue.toLowerCase();
      list = list.filter(
        (w) => w.warehouse_name.toLowerCase().includes(q) || w.warehouse_code.toLowerCase().includes(q),
      );
    }
    return list;
  },

  listItems: async (params: InboundItemMasterListParams = {}): Promise<InboundItemMasterApi[]> => {
    let list = [...itemsStore];
    if (params.businessUnit || params.business_unit) {
      const bu = (params.businessUnit || params.business_unit || '').toUpperCase();
      list = list.filter((it) => it.business_unit.toUpperCase() === bu || it.business_unit === 'ALL');
    }
    if (params.searchValue) {
      const q = params.searchValue.toLowerCase();
      list = list.filter(
        (it) => it.item_name.toLowerCase().includes(q) || it.item_code.toLowerCase().includes(q),
      );
    }
    return list;
  },

  // ================= Dashboard =================
  getDashboardSummary: async (
    params: InboundDashboardSummaryParams = {},
  ): Promise<InboundDashboardSummaryApi> => {
    return mapInboundDashboardSummary(MOCK_DASHBOARD_SUMMARY);
  },

  buildExportReport: async (params: any): Promise<any> => {
    return {
      success: true,
      reportUrl: '#',
    };
  },
};
