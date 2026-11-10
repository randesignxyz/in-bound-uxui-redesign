import { useMemo, useCallback, useRef } from 'react';
import dayjs from 'dayjs';
import { useInboundContext } from './InboundProvider';
import { upcomingInboundService } from '../api/service';
import type { UpcomingInboundPurchaseOrder as PurchaseOrder } from '../core/type';

export function usePurchaseOrders() {
  const context = useInboundContext();
  const services = upcomingInboundService;

  const {
    activeBusinessUnitFilter,
    poSearchValue,
    setPOSearchValue,
    poVendorFilter,
    setPOVendorFilter,
    poVendorSearch,
    setPoVendorSearch,
    poTypeFilter,
    setPOTypeFilter,
    purchaseOrders,
    setPurchaseOrders,
    poPagination,
    setPoPagination,
    selectedPOs,
    setSelectedPOs,
    selectedWarehousePONumbers,
    setSelectedWarehousePONumbers,
    dashboardSummaryRange,
    dashboardPeriodFilter,
    setSelectedPODetail,
    purchaseOrderRequestIdRef,
    isSyncingPurchaseOrders,
    setIsSyncingPurchaseOrders,
  } = context;

  const { current: poCurrentPage, pageSize: poPageSize } = poPagination;
  const purchaseOrderRequestKeyRef = useRef<string | null>(null);

  const sharedDateRangeFilter = useMemo<[string, string] | null>(() => {
    if (dashboardSummaryRange === 'CUSTOM') {
      return dashboardPeriodFilter;
    }
    if (dashboardSummaryRange === 'DAILY') {
      const today = dayjs().format('YYYY-MM-DD');
      return [today, today];
    }
    if (dashboardSummaryRange === 'WEEKLY') {
      return [
        dayjs().startOf('week').format('YYYY-MM-DD'),
        dayjs().endOf('week').format('YYYY-MM-DD'),
      ];
    }
    return null;
  }, [dashboardPeriodFilter, dashboardSummaryRange]);

  const getPurchaseOrderRowKey = useCallback(
    (purchaseOrder: Pick<PurchaseOrder, 'businessUnit' | 'poNumber'>) =>
      `${purchaseOrder.businessUnit || 'UNSPECIFIED'}::${purchaseOrder.poNumber}`,
    []
  );

  const buildPurchaseOrderAdvanceSearchCriteria = useCallback(() => {
    return {
      businessUnit: activeBusinessUnitFilter || null,
      supplier: poVendorFilter === 'ALL' ? null : poVendorFilter,
      type: poTypeFilter === 'ALL' ? null : poTypeFilter,
      dateFrom: sharedDateRangeFilter?.[0] ?? null,
      dateTo: sharedDateRangeFilter?.[1] ?? null,
      expectedDate: null,
    };
  }, [activeBusinessUnitFilter, poVendorFilter, poTypeFilter, sharedDateRangeFilter]);

  const sortPurchaseOrdersByLatestExpectedDate = useCallback((pos: PurchaseOrder[] = []): PurchaseOrder[] => {
    const list = Array.isArray(pos) ? pos : [];
    return [...list].sort((left, right) => {
      const leftDate = left.expectedDate?.trim() || '';
      const rightDate = right.expectedDate?.trim() || '';

      if (leftDate !== rightDate) {
        if (!leftDate) return 1;
        if (!rightDate) return -1;
        return rightDate.localeCompare(leftDate);
      }

      const leftTime = left.expectedTime?.trim() || '';
      const rightTime = right.expectedTime?.trim() || '';
      if (leftTime !== rightTime) {
        return rightTime.localeCompare(leftTime);
      }

      return (right.poNumber || '').localeCompare(left.poNumber || '');
    });
  }, []);

  const applyPurchaseOrderResult = useCallback(
    (nextPurchaseOrders: PurchaseOrder[]) => {
      setPurchaseOrders(nextPurchaseOrders);
      setSelectedPODetail((prev) => {
        if (!prev) return prev;
        return (
          nextPurchaseOrders.find(
            (po) => po.id === prev.id || getPurchaseOrderRowKey(po) === getPurchaseOrderRowKey(prev)
          ) || null
        );
      });
      setSelectedPOs((prev) =>
        prev
          .map(
            (selected) =>
              nextPurchaseOrders.find(
                (po) =>
                  po.id === selected.id ||
                  getPurchaseOrderRowKey(po) === getPurchaseOrderRowKey(selected)
              ) || null
          )
          .filter((po): po is PurchaseOrder => po !== null)
      );
      setSelectedWarehousePONumbers((prevSelectedKeys) =>
        prevSelectedKeys.filter((poKey) =>
          nextPurchaseOrders.some((purchaseOrder) => getPurchaseOrderRowKey(purchaseOrder) === poKey)
        )
      );
    },
    [setPurchaseOrders, setSelectedPODetail, setSelectedPOs, setSelectedWarehousePONumbers, getPurchaseOrderRowKey]
  );

  const loadPurchaseOrders = useCallback(
    async (current = poCurrentPage, pageSize = poPageSize) => {
      const requestKey = [
        'PO',
        activeBusinessUnitFilter || 'ALL',
        current,
        pageSize,
        poSearchValue.trim() || '',
        poVendorFilter,
        poTypeFilter,
        sharedDateRangeFilter?.join('|') || 'NO_RANGE',
      ].join('::');

      if (purchaseOrderRequestKeyRef.current === requestKey) {
        return;
      }

      purchaseOrderRequestKeyRef.current = requestKey;

      try {
        const requestId = ++purchaseOrderRequestIdRef.current;
        const poResult = await services.pagePurchaseOrders({
          criteria: {
            searchValue: poSearchValue.trim() || undefined,
            advanceSearch: buildPurchaseOrderAdvanceSearchCriteria(),
          },
          pagination: {
            current,
            pageSize,
          },
        });

        if (requestId !== purchaseOrderRequestIdRef.current) {
          return;
        }

        const poItems = Array.isArray(poResult?.items)
          ? poResult.items
          : (Array.isArray(poResult?.list) ? poResult.list : []);
        const nextPurchaseOrders = sortPurchaseOrdersByLatestExpectedDate(poItems);
        applyPurchaseOrderResult(nextPurchaseOrders);
        setPoPagination({
          current,
          pageSize,
          total: poResult?.total || nextPurchaseOrders.length,
        });
      } finally {
        if (purchaseOrderRequestKeyRef.current === requestKey) {
          purchaseOrderRequestKeyRef.current = null;
        }
      }
    },
    [
      poSearchValue,
      poCurrentPage,
      poPageSize,
      purchaseOrderRequestIdRef,
      services,
      buildPurchaseOrderAdvanceSearchCriteria,
      sortPurchaseOrdersByLatestExpectedDate,
      applyPurchaseOrderResult,
      setPoPagination,
    ]
  );

  const syncPurchaseOrdersFromSap = useCallback(async () => {
    setIsSyncingPurchaseOrders(true);
    try {
      const result = await services.syncPurchaseOrdersFromSap();
      return result;
    } finally {
      setIsSyncingPurchaseOrders(false);
    }
  }, [services, setIsSyncingPurchaseOrders]);

  return {
    purchaseOrders,
    poPagination,
    poSearchValue,
    setPOSearchValue,
    poVendorFilter,
    setPOVendorFilter,
    poVendorSearch,
    setPoVendorSearch,
    poTypeFilter,
    setPOTypeFilter,
    selectedPOs,
    setSelectedPOs,
    selectedWarehousePONumbers,
    setSelectedWarehousePONumbers,
    isSyncingPurchaseOrders,
    getPurchaseOrderRowKey,
    loadPurchaseOrders,
    syncPurchaseOrdersFromSap,
    sharedDateRangeFilter,
  };
}
