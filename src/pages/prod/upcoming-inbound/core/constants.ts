import type { InboundProcessState, GRScenarioPath } from './type';

export const BLOCKING_PO_RECEIPT_STATES = new Set<InboundProcessState>([
  'GRPO_DRAFT',
  'CORRECTION_REQUIRED',
  'MISMATCH_EXCEPTION',
]);

export const workflowPath: InboundProcessState[] = [
  'RECEIVED_CHECKING',
  'RECEIPT_CONFIRMED',
  'STORED_ON_HOLD',
  'GRPO_DRAFT',
  'QC_PENDING',
  'QC_PASSED',
  'PENDING_SUPERVISOR_REVIEW',
  'SUPERVISOR_APPROVED',
];

export const officialStateLabel: Record<InboundProcessState, string> = {
  RECEIVED_CHECKING: 'Received Checking',
  MISMATCH_EXCEPTION: 'Mismatch Exception',
  RECEIPT_CONFIRMED: 'Receipt Confirmed',
  STORED_ON_HOLD: 'Stored On-Hold',
  GRPO_DRAFT: 'GRPO Draft',
  QC_PENDING: 'QC Pending',
  QC_PASSED: 'QC Passed',
  QC_REJECTED: 'QC Rejected',
  QC_ON_HOLD: 'QC On Hold',
  PENDING_SUPERVISOR_REVIEW: 'Pending Supervisor Review',
  SUPERVISOR_ADJUSTED: 'Supervisor Adjusted',
  SENT_BACK_TO_WH: 'Sent Back to Warehouse',
  SENT_BACK_TO_QC: 'Sent Back to QC',
  SUPERVISOR_APPROVED: 'Ready to Post SAP',
  SAP_POSTING: 'Posting to SAP',
  SAP_POSTED: 'SAP Posted / GR Completed',
  SAP_POSTING_FAILED: 'SAP Posting Failed',
  CORRECTION_REQUIRED: 'Correction Required',
  MERGED_TO_SUPERVISOR_REVIEW: 'Pending Supervisor Review',
  SAP_SYNCED: 'SAP Synced',
  TRANSFERRED_TO_PM_RM_WH: 'Supervisor Approved',
  FIN_SUBMITTED: 'Supervisor Approved',
  DAILY_CLOSED: 'Supervisor Approved',
  MONTHLY_SUMMARY_READY: 'Supervisor Approved',
};

export const scenarioPathLabel: Record<GRScenarioPath, string> = {
  NORMAL: 'Normal',
  MISMATCH_CORRECTION: 'Mismatch + Correction',
  UNPLANNED_ARRIVAL: 'Unplanned Arrival',
  QC_REJECTED: 'QC Rejected',
  QC_PASS_TRANSFER: 'QC Pass + Transfer',
  CORRECTION_LOOP: 'Correction Loop',
  DAILY_CLOSE: 'Daily Closing',
  MONTHLY_SUMMARY: 'Monthly Summary',
};

export const grScenarioOptions: Array<{ value: 'All' | GRScenarioPath; label: string }> = [
  { value: 'All', label: 'All' },
  { value: 'NORMAL', label: scenarioPathLabel.NORMAL },
  { value: 'MISMATCH_CORRECTION', label: scenarioPathLabel.MISMATCH_CORRECTION },
  { value: 'UNPLANNED_ARRIVAL', label: scenarioPathLabel.UNPLANNED_ARRIVAL },
  { value: 'QC_REJECTED', label: scenarioPathLabel.QC_REJECTED },
  { value: 'QC_PASS_TRANSFER', label: scenarioPathLabel.QC_PASS_TRANSFER },
  { value: 'CORRECTION_LOOP', label: scenarioPathLabel.CORRECTION_LOOP },
  { value: 'DAILY_CLOSE', label: scenarioPathLabel.DAILY_CLOSE },
  { value: 'MONTHLY_SUMMARY', label: scenarioPathLabel.MONTHLY_SUMMARY },
];
