import type { RequestActions, ServiceApiType } from '@/services/apiGateway';
import { singleRequest } from '@/services/apiGateway';
import type {
  InboundDashboardSummaryParams,
  InboundDashboardSummaryApi,
  InboundExportReportParams,
  InboundGenericReportApi,
} from '../dto';
import { mapInboundDashboardSummary } from '../../core/mappers';

const UpcomingInboundAction = {
  getDashboardSummary: (
    params: InboundDashboardSummaryParams,
  ): ServiceApiType<InboundDashboardSummaryParams> => ({
    type: 'FETCH_QUERY',
    endpoint: 'PROD',
    actionName: 'inbound-dashboard-summary',
    payload: params,
  }),

  buildExportReport: (
    params: InboundExportReportParams,
  ): ServiceApiType<InboundExportReportParams> => ({
    type: 'FETCH_QUERY',
    endpoint: 'PROD',
    actionName: 'inbound-build-export-report',
    payload: params,
  }),
};

export const dashboardServiceAPI = (requestAction: RequestActions) => {
  return {
    getDashboardSummary: async (
      params: InboundDashboardSummaryParams = {},
    ): Promise<InboundDashboardSummaryApi> => {
      const response = (await singleRequest<InboundDashboardSummaryApi>(
        UpcomingInboundAction.getDashboardSummary(params),
      )(requestAction)) as InboundDashboardSummaryApi;
      return mapInboundDashboardSummary(response);
    },

    buildExportReport: async (
      params: InboundExportReportParams,
    ): Promise<InboundGenericReportApi> => {
      return (await singleRequest<InboundGenericReportApi>(
        UpcomingInboundAction.buildExportReport(params),
      )(requestAction)) as InboundGenericReportApi;
    },
  };
};
