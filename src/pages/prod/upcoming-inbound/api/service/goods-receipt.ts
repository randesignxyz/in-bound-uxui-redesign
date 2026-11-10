import type { TableViewSearchParams } from '@/components/DataCrud/TableView';
import type { Paging } from '@/services/API';
import type { RequestActions, ServiceApiType } from '@/services/apiGateway';
import { singleRequest } from '@/services/apiGateway';
import type {
  InboundGoodsReceiptSearch,
  InboundGoodsReceiptCountParams,
  InboundGoodsReceiptApi,
  InboundSaveGoodsReceiptInput,
  InboundGoodsReceiptStatusChangeInput,
  InboundSaveActivityInput,
  InboundLinkPoInput,
  InboundSubmitQcReviewInput,
  InboundSubmitSupervisorReviewInput,
  InboundMarkQcBadgeViewedInput,
  InboundSuccessPayloadResponse,
} from '../dto';
import type { UpcomingInboundGoodsReceipt } from '../../core/type';
import { mapInboundGoodsReceipt } from '../../core/mappers';
import { toBackendPage, mapPaging, mapPayloadResponse } from './helpers';

type InboundGoodsReceiptTableParams = Omit<TableViewSearchParams<any>, 'criteria'> & {
  criteria?: InboundGoodsReceiptSearch;
};

const UpcomingInboundAction = {
  pageGoodsReceipts: (
    params: InboundGoodsReceiptTableParams,
  ): ServiceApiType<InboundGoodsReceiptSearch> => ({
    type: 'PAGING_QUERY',
    endpoint: 'PROD',
    actionName: 'inbound-fetch-paging-goods-receipt',
    payload: params.criteria || {},
    pagination: {
      pageSize: params.pagination?.pageSize,
      page: toBackendPage(params.pagination?.current),
    },
  }),

  detailGoodsReceipt: (id: number): ServiceApiType<{ id: number }> => ({
    type: 'FETCH_QUERY',
    endpoint: 'PROD',
    actionName: 'inbound-detail-goods-receipt',
    payload: { id },
  }),

  getGoodsReceiptCounts: (
    params: InboundGoodsReceiptCountParams,
  ): ServiceApiType<InboundGoodsReceiptCountParams> => ({
    type: 'LIST_QUERY',
    endpoint: 'PROD',
    actionName: 'inbound-get-count-goods-receipt',
    payload: params,
  }),

  saveGoodsReceipt: (
    data: InboundSaveGoodsReceiptInput,
  ): ServiceApiType<InboundSaveGoodsReceiptInput> => ({
    type: 'EXEC',
    endpoint: 'PROD',
    actionName: 'inbound-save-goods-receipt',
    payload: data,
  }),

  changeGoodsReceiptStatus: (
    data: InboundGoodsReceiptStatusChangeInput,
  ): ServiceApiType<InboundGoodsReceiptStatusChangeInput> => ({
    type: 'EXEC',
    endpoint: 'PROD',
    actionName: 'inbound-status-change-goods-receipt',
    payload: data,
  }),

  saveActivity: (data: InboundSaveActivityInput): ServiceApiType<InboundSaveActivityInput> => ({
    type: 'EXEC',
    endpoint: 'PROD',
    actionName: 'inbound-save-activity',
    payload: data,
  }),

  linkPoToTempReceipt: (data: InboundLinkPoInput): ServiceApiType<InboundLinkPoInput> => ({
    type: 'EXEC',
    endpoint: 'PROD',
    actionName: 'inbound-link-po-to-temp-gr',
    payload: data,
  }),

  submitQcReview: (
    data: InboundSubmitQcReviewInput,
  ): ServiceApiType<InboundSubmitQcReviewInput> => ({
    type: 'EXEC',
    endpoint: 'PROD',
    actionName: 'inbound-submit-qc-review',
    payload: data,
  }),

  submitSupervisorReview: (
    data: InboundSubmitSupervisorReviewInput,
  ): ServiceApiType<InboundSubmitSupervisorReviewInput> => ({
    type: 'EXEC',
    endpoint: 'PROD',
    actionName: 'inbound-submit-supervisor-review',
    payload: data,
  }),

  markQcBadgeViewed: (
    data: InboundMarkQcBadgeViewedInput,
  ): ServiceApiType<InboundMarkQcBadgeViewedInput> => ({
    type: 'EXEC',
    endpoint: 'PROD',
    actionName: 'inbound-mark-qc-badge-viewed',
    payload: data,
  }),

  getGrActivities: (id: number): ServiceApiType<{ id: number }> => ({
    type: 'LIST_QUERY',
    endpoint: 'PROD',
    actionName: 'inbound-goods-receipt-activities',
    payload: { id },
  }),

  getPoActivities: (poNumber: string): ServiceApiType<{ poNumber: string }> => ({
    type: 'LIST_QUERY',
    endpoint: 'PROD',
    actionName: 'inbound-purchase-order-activities',
    payload: { poNumber },
  }),
};

export const goodsReceiptServiceAPI = (requestAction: RequestActions) => {
  return {
    pageGoodsReceipts: async (
      params: InboundGoodsReceiptTableParams,
    ): Promise<Paging<UpcomingInboundGoodsReceipt>> => {
      const response = (await singleRequest<InboundGoodsReceiptApi>(
        UpcomingInboundAction.pageGoodsReceipts(params),
      )(requestAction)) as Paging<InboundGoodsReceiptApi>;
      return mapPaging(response, mapInboundGoodsReceipt);
    },

    detailGoodsReceipt: async (id: number): Promise<UpcomingInboundGoodsReceipt> => {
      const response = (await singleRequest<InboundGoodsReceiptApi>(
        UpcomingInboundAction.detailGoodsReceipt(id),
      )(requestAction)) as InboundGoodsReceiptApi;
      return mapInboundGoodsReceipt(response);
    },

    saveGoodsReceipt: async (
      data: InboundSaveGoodsReceiptInput,
    ): Promise<InboundSuccessPayloadResponse<UpcomingInboundGoodsReceipt>> => {
      const response = (await singleRequest<InboundSuccessPayloadResponse<InboundGoodsReceiptApi>>(
        UpcomingInboundAction.saveGoodsReceipt(data),
      )(requestAction)) as InboundSuccessPayloadResponse<InboundGoodsReceiptApi>;
      return mapPayloadResponse(response, mapInboundGoodsReceipt);
    },

    changeGoodsReceiptStatus: async (
      data: InboundGoodsReceiptStatusChangeInput,
    ): Promise<InboundSuccessPayloadResponse<UpcomingInboundGoodsReceipt>> => {
      const response = (await singleRequest<InboundSuccessPayloadResponse<InboundGoodsReceiptApi>>(
        UpcomingInboundAction.changeGoodsReceiptStatus(data),
      )(requestAction)) as InboundSuccessPayloadResponse<InboundGoodsReceiptApi>;
      return mapPayloadResponse(response, mapInboundGoodsReceipt);
    },

    linkPoToTempReceipt: async (
      data: InboundLinkPoInput,
    ): Promise<InboundSuccessPayloadResponse<UpcomingInboundGoodsReceipt>> => {
      const response = (await singleRequest<InboundSuccessPayloadResponse<InboundGoodsReceiptApi>>(
        UpcomingInboundAction.linkPoToTempReceipt(data),
      )(requestAction)) as InboundSuccessPayloadResponse<InboundGoodsReceiptApi>;
      return mapPayloadResponse(response, mapInboundGoodsReceipt);
    },

    submitQcReview: async (
      data: InboundSubmitQcReviewInput,
    ): Promise<InboundSuccessPayloadResponse<UpcomingInboundGoodsReceipt>> => {
      const response = (await singleRequest<InboundSuccessPayloadResponse<InboundGoodsReceiptApi>>(
        UpcomingInboundAction.submitQcReview(data),
      )(requestAction)) as InboundSuccessPayloadResponse<InboundGoodsReceiptApi>;
      return mapPayloadResponse(response, mapInboundGoodsReceipt);
    },

    submitSupervisorReview: async (
      data: InboundSubmitSupervisorReviewInput,
    ): Promise<InboundSuccessPayloadResponse<UpcomingInboundGoodsReceipt>> => {
      const response = (await singleRequest<InboundSuccessPayloadResponse<InboundGoodsReceiptApi>>(
        UpcomingInboundAction.submitSupervisorReview(data),
      )(requestAction)) as InboundSuccessPayloadResponse<InboundGoodsReceiptApi>;
      return mapPayloadResponse(response, mapInboundGoodsReceipt);
    },

    markQcBadgeViewed: async (
      data: InboundMarkQcBadgeViewedInput,
    ): Promise<InboundSuccessPayloadResponse<UpcomingInboundGoodsReceipt>> => {
      const response = (await singleRequest<InboundSuccessPayloadResponse<InboundGoodsReceiptApi>>(
        UpcomingInboundAction.markQcBadgeViewed(data),
      )(requestAction)) as InboundSuccessPayloadResponse<InboundGoodsReceiptApi>;
      return mapPayloadResponse(response, mapInboundGoodsReceipt);
    },

    getGrActivities: async (id: number): Promise<any[]> => {
      return (await singleRequest<any>(
        UpcomingInboundAction.getGrActivities(id),
      )(requestAction)) as any[];
    },

    getPoActivities: async (poNumber: string): Promise<any[]> => {
      return (await singleRequest<any>(
        UpcomingInboundAction.getPoActivities(poNumber),
      )(requestAction)) as any[];
    },
  };
};
