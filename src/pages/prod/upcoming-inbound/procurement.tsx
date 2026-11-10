import React, { useState } from 'react';
import CrudWrapper from '@/components/DataCrud/CrudWrapper';
import { message } from 'antd';

import { ProdPaths } from '@/pages/prod';
import { ProcurementWorkspace } from './workspaces/ProcurementWorkspace';
import { InboundProvider } from './state';
import { SAMPLE_IR_PLANS, SAMPLE_PURCHASE_ORDERS } from './data/inboundMockStore';
import type { IRPlan, PurchaseOrder } from './core/type';

export default () => {
  const [irPlans, setIrPlans] = useState<IRPlan[]>(SAMPLE_IR_PLANS);
  const [purchaseOrders] = useState<PurchaseOrder[]>(SAMPLE_PURCHASE_ORDERS);

  const handleCreateIRPlan = (newPlan: IRPlan) => {
    setIrPlans((prev) => [newPlan, ...prev]);
  };

  const handleRefresh = () => {
    message.success('Procurement data refreshed.');
  };

  return (
    <InboundProvider>
      <CrudWrapper baseURL={`${ProdPaths.upcomingInbound}/procurement`}>
        {() => (
          <div style={{ padding: '0 8px 24px' }}>
            <ProcurementWorkspace
              purchaseOrders={purchaseOrders}
              irPlans={irPlans}
              onCreateIRPlan={handleCreateIRPlan}
              onRefresh={handleRefresh}
            />
          </div>
        )}
      </CrudWrapper>
    </InboundProvider>
  );
};
