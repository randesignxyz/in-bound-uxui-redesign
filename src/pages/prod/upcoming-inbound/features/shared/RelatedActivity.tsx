import React from 'react';
import type { GoodsReceipt, IRPlan } from '../../core/type';
import { AuditTrailTimeline } from './AuditTrailTimeline';

export function RelatedActivity({ receipts, plans = [] }: { receipts: GoodsReceipt[]; plans?: IRPlan[] }) {
  const unreceivedPlans = plans.filter(plan => !receipts.some(receipt => receipt.irPlanNumber === plan.irPlanNumber));
  return <div className="inbound-related-activity">
    {receipts.map(receipt => <AuditTrailTimeline key={receipt.grNumber} receipt={receipt}
      activities={receipt.activities} adjustments={receipt.supervisorAdjustments} />)}
    {(unreceivedPlans.length > 0 || receipts.length === 0) && <AuditTrailTimeline activities={unreceivedPlans.map(plan => ({
      id: `plan-${plan.irPlanNumber}`, title: `IR Schedule Created: ${plan.irPlanNumber}`,
      description: `PO: ${plan.poNumbers.join(', ')}. Scheduled for ${plan.deliveryDate || 'date not recorded'}.`,
      performedBy: plan.createdBy, timestamp: plan.createdAt, state: 'done' as const,
    }))} />}
  </div>;
}
