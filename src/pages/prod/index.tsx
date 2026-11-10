import transferIcon from '@/assets/transfer.png';
import ListMenuComp from '@/components/ListMenu';
import { PageContainer } from '@ant-design/pro-components';
import { useAccess } from '@umijs/max';
export const ProdPaths = {
  prod: '/prod',
  upcomingInbound: '/prod/inventory-inbound',
};

export default () => {
  const access = useAccess();
  const inboundLink =
    access.canAccessInboundProcurement && !access.canAccessUpcomingInboundOperationsMenuItem
      ? `${ProdPaths.upcomingInbound}/procurement/list`
      : `${ProdPaths.upcomingInbound}/list`;

  const itemList = [
    {
      id: 'upcomingInbound',
      name: 'Inventory Inbound',
      description: 'Upcoming Inbound Receipt & PO Tracking',
      icon: transferIcon,
      link: inboundLink,
      visible: access.canAccessUpcomingInboundMenuItem,
    },
  ];

  return (
    <PageContainer title={false}>
      <ListMenuComp items={itemList} />
    </PageContainer>
  );
};
