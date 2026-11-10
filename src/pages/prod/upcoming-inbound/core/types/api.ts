import type { PurchaseOrder } from './purchase-order';
import type { GoodsReceipt, GRItem, POLinkStatus } from './goods-receipt';
import type { GRActivity, InboundProcessState, GRDocumentChecklist } from './workflow';

export * from '../../api/dto';

export type UpcomingInboundPurchaseOrder = PurchaseOrder & {
  id?: number | null;
};

export type UpcomingInboundGoodsReceipt = GoodsReceipt & {
  id?: number | null;
  receivingNumber?: string;
  approvedGrNumber?: string | null;
  previousReceivingNumber?: string | null;
  previousApprovedGrNumber?: string | null;
  workflowLabel?: string;
  recordTypeLabel?: string;
  isAppendable?: boolean;
};

export type UpcomingInboundGoodsReceiptItem = GRItem;
export type UpcomingInboundActivity = GRActivity;
export type UpcomingInboundDocumentChecklist = GRDocumentChecklist;
export type UpcomingInboundProcessState = InboundProcessState;
export type UpcomingInboundPoLinkStatus = POLinkStatus;
