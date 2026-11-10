import { endpoint, keycloak } from '@/auth';
import { isOffline } from '@/pages/utils';
import { queryCurrent } from '@/services/user';
import { history, useAccess, useModel, useSearchParams } from '@umijs/max';
import { Spin } from 'antd';
import { useEffect } from 'react';

export default () => {
  const { initialState, setInitialState } = useModel('@@initialState');
  const [searchParams] = useSearchParams();
  const access = useAccess();

  const auth = async () => {
    const ck = await keycloak();
    try {
      if (isOffline()) {
        return undefined;
      }
      const currentUser = await queryCurrent();
      if (currentUser)
        setInitialState({
          ...initialState,
          currentUser: currentUser,
          logout: () => {
            ck?.clearToken();
            ck?.logout({
              redirectUri: endpoint().redirectUri,
            });
          },
        });
    } catch (error) {
      return undefined;
    }
  };
  useEffect(() => {
    auth();
  }, []);

  useEffect(() => {
    if (initialState?.currentUser) {
      const redirect = searchParams.get('path');
      const inboundPath =
        access.canAccessInboundProcurement && !access.canAccessUpcomingInboundOperationsMenuItem
          ? '/prod/inventory-inbound/procurement/list'
          : '/prod/inventory-inbound/list';
      const isInboundPath = redirect?.startsWith('/prod/inventory-inbound/');
      history.replace(isInboundPath ? redirect! : inboundPath);
    }
  }, [initialState?.currentUser]);

  return <div>{initialState?.loading && <Spin spinning={true} />}</div>;
};
