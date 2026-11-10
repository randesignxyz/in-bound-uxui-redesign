export type InboundProcessState =
  | 'RECEIVED_CHECKING'
  | 'MISMATCH_EXCEPTION'
  | 'RECEIPT_CONFIRMED'
  | 'STORED_ON_HOLD'
  | 'GRPO_DRAFT'
  | 'QC_PENDING'
  | 'QC_PASSED'
  | 'QC_REJECTED'
  | 'QC_ON_HOLD'
  | 'PENDING_SUPERVISOR_REVIEW'
  | 'SUPERVISOR_ADJUSTED'
  | 'SENT_BACK_TO_WH'
  | 'SENT_BACK_TO_QC'
  | 'SUPERVISOR_APPROVED'
  | 'SAP_POSTING'
  | 'SAP_POSTED'
  | 'SAP_POSTING_FAILED'
  | 'CORRECTION_REQUIRED'
  | 'MERGED_TO_SUPERVISOR_REVIEW'
  | 'SAP_SYNCED'
  | 'TRANSFERRED_TO_PM_RM_WH'
  | 'FIN_SUBMITTED'
  | 'DAILY_CLOSED'
  | 'MONTHLY_SUMMARY_READY';

export type InboundDeliveryPlanStatus =
  | 'To Receive'
  | 'In Progress'
  | 'Partially Received'
  | 'Received'
  | 'Waiting for QC'
  | 'QC Completed'
  | 'Pending Supervisor'
  | 'Posted';

export type LegacyGRStatus =
  | 'Draft'
  | 'Pending Approval'
  | 'Approved'
  | 'Ready To Post SAP'
  | 'Posted'
  | 'Correction Required';

export type InboundHistoryStatus =
  | 'Draft'
  | 'Pending'
  | 'Ready to Post SAP'
  | 'Complete'
  | 'Correction Required'
  | 'Rejected';

export type QcQueueStatus =
  | 'Pending'
  | 'Submitted'
  | 'Correction Required'
  | 'Rejected'
  | 'Complete'
  | 'All';

export type QCResultStatus = 'Pass' | 'Partial Reject' | 'Reject' | 'Fail' | 'On Hold' | 'Conditional Pass' | 'Pending';

export type SupervisorDecision =
  | 'Approve'
  | 'Send Back to Warehouse'
  | 'Send Back to QC';

export type SapPostingStatus =
  | 'Ready to Post'
  | 'Posting'
  | 'Posted'
  | 'Posting Failed';

export type SyncStatus =
  | 'SAVED_ON_DEVICE'
  | 'PENDING_SYNC'
  | 'SYNCING'
  | 'SYNCED'
  | 'SYNC_FAILED';

export type GRScenarioPath =
  | 'NORMAL'
  | 'MISMATCH_CORRECTION'
  | 'UNPLANNED_ARRIVAL'
  | 'QC_REJECTED'
  | 'QC_PASS_TRANSFER'
  | 'CORRECTION_LOOP'
  | 'DAILY_CLOSE'
  | 'MONTHLY_SUMMARY';

export interface GRScenarioMeta {
  scenarioId: string;
  scenarioName: string;
  scenarioPath: GRScenarioPath;
  stepNumber: number;
  totalSteps: number;
  stepTitle: string;
}

export type QcDecision = 'Pass' | 'Reject';

export type SupportingDocSource = 'WAREHOUSE' | 'QC' | 'SUPERVISOR';

export interface SupportingDocReference {
  fileId?: string | null;
  fileName: string;
  source?: SupportingDocSource | null;
  poNumber?: string | null;
}

export interface GRDocumentChecklist {
  vendorDN: boolean;
  goodsReceiptPOForm: boolean;
  pmrmStockCardForm: boolean;
  supportingDocs: SupportingDocReference[];
}

export interface GRActivity {
  id?: string;
  title: string;
  description: string;
  performedBy?: string;
  secondaryText?: string;
  timestamp: string;
  state: 'done' | 'active' | 'locked' | 'error';
  processState?: InboundProcessState;
}
