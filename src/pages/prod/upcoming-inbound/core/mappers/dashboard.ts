import type { InboundDashboardSummaryApi } from '../type';
import { readNumber } from './helpers';

export function mapInboundDashboardSummary(summary: InboundDashboardSummaryApi): InboundDashboardSummaryApi {
  return {
    expectedToday: summary.expectedToday,
    qcPending: summary.qcPending,
    supervisorPending: summary.supervisorPending,
    approved: summary.approved,
    completed: summary.completed,
    exceptions: summary.exceptions,
    returnedForCorrection: summary.returnedForCorrection,
    awaitingPOLink: summary.awaitingPOLink,
    agingPoItems: readNumber(summary, 'agingPoItems', 'aging_po_items') ?? 0,
    totalGRs: summary.totalGRs,
    totalIrGrs: summary.totalIrGrs ?? summary.totalGRs,
  };
}
