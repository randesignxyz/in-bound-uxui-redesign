import type { TableViewSearchParams } from '@/components/DataCrud/TableView';
import type { Paging } from '@/services/API';
import type { RequestActions, ServiceApiType } from '@/services/apiGateway';
import { singleRequest } from '@/services/apiGateway';
import type {
  InboundPurchaseOrderSearch,
  InboundPurchaseOrderCountParams,
  InboundPurchaseOrderApi,
  InboundSuccessPayloadResponse,
} from '../dto';
import type { UpcomingInboundPurchaseOrder } from '../../core/type';
import {
  mapInboundPurchaseOrder,
  mapInboundPurchaseOrders,
} from '../../core/mappers';
import { toBackendPage, mapPaging } from './helpers';

type InboundPurchaseOrderAdvanceSearch = NonNullable<InboundPurchaseOrderSearch['advanceSearch']>;
type InboundPurchaseOrderDetailByKeyParams = {
  po_number: string;
  business_unit: string;
};

function buildPurchaseOrderSearchPayload(
  params: TableViewSearchParams<InboundPurchaseOrderAdvanceSearch>,
): InboundPurchaseOrderSearch {
  return {
    searchValue: params.criteria?.searchValue,
    sort: params.criteria?.sort as InboundPurchaseOrderSearch['sort'],
    advanceSearch: params.criteria?.advanceSearch,
  };
}

const UpcomingInboundAction = {
  pagePurchaseOrders: (
    params: TableViewSearchParams<InboundPurchaseOrderAdvanceSearch>,
  ): ServiceApiType<InboundPurchaseOrderSearch> => ({
    type: 'PAGING_QUERY',
    endpoint: 'PROD',
    actionName: 'inbound-fetch-paging-purchase-order',
    payload: buildPurchaseOrderSearchPayload(params),
    pagination: {
      pageSize: params.pagination?.pageSize,
      page: toBackendPage(params.pagination?.current),
    },
  }),

  detailPurchaseOrder: (id: number): ServiceApiType<{ id: number }> => ({
    type: 'FETCH_QUERY',
    endpoint: 'PROD',
    actionName: 'inbound-detail-purchase-order',
    payload: { id },
  }),

  detailPurchaseOrderByKey: (
    params: InboundPurchaseOrderDetailByKeyParams,
  ): ServiceApiType<InboundPurchaseOrderDetailByKeyParams> => ({
    type: 'FETCH_QUERY',
    endpoint: 'PROD',
    actionName: 'inbound-detail-purchase-order-by-key',
    payload: params,
  }),

  listPurchaseOrders: (): ServiceApiType<Record<string, never>> => ({
    type: 'LIST_QUERY',
    endpoint: 'PROD',
    actionName: 'inbound-list-purchase-order',
    payload: {},
  }),

  getPurchaseOrderCounts: (
    params: InboundPurchaseOrderCountParams,
  ): ServiceApiType<InboundPurchaseOrderCountParams> => ({
    type: 'LIST_QUERY',
    endpoint: 'PROD',
    actionName: 'inbound-get-count-purchase-order',
    payload: params,
  }),

  syncPurchaseOrdersFromSap: (): ServiceApiType<Record<string, never>> => ({
    type: 'EXEC',
    endpoint: 'PROD',
    actionName: 'inbound-sync-po-from-sap',
    payload: {},
  }),
};

export const purchaseOrderServiceAPI = (requestAction: RequestActions) => {
  return {
    pagePurchaseOrders: async (
      params: TableViewSearchParams<InboundPurchaseOrderAdvanceSearch>,
    ): Promise<Paging<UpcomingInboundPurchaseOrder>> => {
      const response = (await singleRequest<InboundPurchaseOrderApi>(
        UpcomingInboundAction.pagePurchaseOrders(params),
      )(requestAction)) as Paging<InboundPurchaseOrderApi>;
      return mapPaging(response, mapInboundPurchaseOrder);
    },

    detailPurchaseOrder: async (id: number): Promise<UpcomingInboundPurchaseOrder> => {
      const response = (await singleRequest<InboundPurchaseOrderApi>(
        UpcomingInboundAction.detailPurchaseOrder(id),
      )(requestAction)) as InboundPurchaseOrderApi;
      return mapInboundPurchaseOrder(response);
    },

    detailPurchaseOrderByKey: async (
      params: InboundPurchaseOrderDetailByKeyParams,
    ): Promise<UpcomingInboundPurchaseOrder> => {
      const response = (await singleRequest<InboundPurchaseOrderApi>(
        UpcomingInboundAction.detailPurchaseOrderByKey(params),
      )(requestAction)) as InboundPurchaseOrderApi;
      return mapInboundPurchaseOrder(response);
    },

    listPurchaseOrders: async (): Promise<UpcomingInboundPurchaseOrder[]> => {
      const response = (await singleRequest<InboundPurchaseOrderApi>(
        UpcomingInboundAction.listPurchaseOrders(),
      )(requestAction)) as InboundPurchaseOrderApi[];
      return mapInboundPurchaseOrders(response);
    },

    syncPurchaseOrdersFromSap: async (): Promise<
      InboundSuccessPayloadResponse<Record<string, unknown>>
    > => {
      return (await singleRequest<InboundSuccessPayloadResponse<Record<string, unknown>>>(
        UpcomingInboundAction.syncPurchaseOrdersFromSap(),
      )(requestAction)) as InboundSuccessPayloadResponse<Record<string, unknown>>;
    },
  };
};
