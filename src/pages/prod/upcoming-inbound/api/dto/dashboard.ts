export type InboundDashboardSummaryRange = 'DAILY' | 'WEEKLY' | 'OVERALL';

export interface InboundDashboardSummaryParams {
  businessUnit?: string | null;
  business_unit?: string | null;
  expectedDate?: string | null;
  range?: InboundDashboardSummaryRange | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}

export type InboundExportReportKey =
  | 'PO_LIST'
  | 'WAREHOUSE_IR_RECEIVING'
  | 'QC_REVIEW'
  | 'SUPERVISOR_APPROVAL'
  | 'RECEIVING_STATUS_SUMMARY';

export type InboundExportPlannedFilter = 'ALL' | 'Planned' | 'Unplanned';

export interface InboundExportReportParams {
  reportKey: InboundExportReportKey;
  businessUnit?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  searchValue?: string | null;
  withoutPoOnly?: boolean | null;
  agingOnly?: boolean | null;
  qcPendingOnly?: boolean | null;
  supervisorPendingOnly?: boolean | null;
  issueOnly?: boolean | null;
  plannedFilter?: InboundExportPlannedFilter | null;
}

export interface InboundReportParamData {
  key: string;
  type?: 'int' | 'double' | 'float' | 'string' | 'boolean' | 'date' | 'dateTime';
  value?: any;
}

export interface InboundGenericReportApi {
  reportName: string;
  reportPath: string;
  fileName: string;
  data: InboundReportParamData[];
}

export interface InboundStatusCountApi {
  status: string;
  count: number;
}

export interface InboundDashboardSummaryApi {
  expectedToday: number;
  qcPending: number;
  supervisorPending: number;
  approved: number;
  completed: number;
  exceptions: number;
  returnedForCorrection: number;
  awaitingPOLink: number;
  agingPoItems: number;
  totalGRs: number;
  totalIrGrs: number;
}

export interface InboundSuccessPayloadResponse<T> {
  message: string;
  data: T;
}
