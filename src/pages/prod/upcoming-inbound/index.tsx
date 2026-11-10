import React from 'react';
import CrudWrapper from '@/components/DataCrud/CrudWrapper';

import { ProdPaths } from '@/pages/prod';
import InboundListview from './InboundListview';
import { InboundProvider } from './state';

export default () => {
  return (
    <InboundProvider>
      <CrudWrapper baseURL={ProdPaths.upcomingInbound}>
        {(view) => {
          const supportedViews = new Set(['list', 'create', 'receive-without-po']);
          const inboundView =
            typeof view === 'string' && supportedViews.has(view)
              ? (view as 'list' | 'create' | 'receive-without-po')
              : 'list';
          if (inboundView === 'list' || inboundView === 'create' || inboundView === 'receive-without-po') {
            return <InboundListview routeView={inboundView} />;
          }
          return <InboundListview routeView="list" />;
        }}
      </CrudWrapper>
    </InboundProvider>
  );
};

