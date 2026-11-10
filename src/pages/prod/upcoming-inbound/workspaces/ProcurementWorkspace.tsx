import React from 'react';
import type { PurchaseOrder, IRPlan, GoodsReceipt } from '../core/type';
import { ProcurementWorkspaceV2 } from './ProcurementWorkspaceV2';
import './ProcurementWorkspace.less';

export interface ProcurementWorkspaceProps {
  purchaseOrders: PurchaseOrder[];
  irPlans: IRPlan[];
  receipts?: GoodsReceipt[];
  onCreateIRPlan: (newPlan: IRPlan) => void;
  onRefresh: () => void;
  onResetDemo?: () => void;
  onNavigateToRole?: (role: 'PROCUREMENT' | 'WAREHOUSE' | 'QC' | 'SUPERVISOR' | 'AUDIT_TIMELINE') => void;
}

export const ProcurementWorkspace: React.FC<ProcurementWorkspaceProps> = ({
  purchaseOrders,
  irPlans,
  receipts,
  onCreateIRPlan,
  onRefresh,
  onResetDemo,
  onNavigateToRole,
}) => {
  return (
    <ProcurementWorkspaceV2
      purchaseOrders={purchaseOrders}
      irPlans={irPlans}
      receipts={receipts}
      onCreateIRPlan={onCreateIRPlan}
      onRefresh={onRefresh}
      onResetDemo={onResetDemo}
    />
  );
};
