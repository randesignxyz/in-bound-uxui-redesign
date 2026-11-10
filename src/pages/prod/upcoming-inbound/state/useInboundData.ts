import { useCallback, useRef } from 'react';
import { message } from 'antd';
import { useInboundContext } from './InboundProvider';
import { usePurchaseOrders } from './usePurchaseOrders';
import { useGoodsReceipts } from './useGoodsReceipts';
import { upcomingInboundService } from '../api/service';

export function useInboundData() {
  const context = useInboundContext();
  const { loadPurchaseOrders, sharedDateRangeFilter } = usePurchaseOrders();
  const { loadReceipts, loadWarehouseSupportReceipts } = useGoodsReceipts();
  const services = upcomingInboundService;
  const dashboardSummaryRequestKeyRef = useRef<string | null>(null);

  const {
    isInboundAdmin,
    inboundVisibleBusinessUnits,
    hasInboundWorkspaceAccess,
    activeRole,
    effectiveInboundView,
    activeBusinessUnitFilter,
    supplierMasterOptions,
    setSupplierMasterOptions,
    uomMasterOptions,
    setUomMasterOptions,
    warehouseMasterOptions,
    setWarehouseMasterOptions,
    itemMasterOptions,
    setItemMasterOptions,
    inboundStats,
    setInboundStats,
    dashboardSummaryRange,
    setAwaitingPOLinkReceipts,
    setExceptionQueueReceipts,
    poPagination,
    queuePagination,
    historyPagination,
    dashboardSummaryRequestIdRef,
  } = context;

  const { current: poCurrentPage, pageSize: poPageSize } = poPagination;
  const { current: queueCurrentPage, pageSize: queuePageSize } = queuePagination;
  const { current: historyCurrentPage, pageSize: historyPageSize } = historyPagination;

  const buildDashboardSummaryParams = useCallback(() => ({
    businessUnit: activeBusinessUnitFilter || null,
    range: dashboardSummaryRange === 'CUSTOM' ? null : dashboardSummaryRange,
    dateFrom: sharedDateRangeFilter?.[0] ?? null,
    dateTo: sharedDateRangeFilter?.[1] ?? null,
  }), [activeBusinessUnitFilter, dashboardSummaryRange, sharedDateRangeFilter]);

  const loadDashboardSummary = useCallback(async () => {
    const params = buildDashboardSummaryParams();
    const requestKey = [
      params.businessUnit || 'ALL',
      params.range || 'ALL',
      params.dateFrom || 'NO_FROM',
      params.dateTo || 'NO_TO',
    ].join('::');

    if (dashboardSummaryRequestKeyRef.current === requestKey) {
      return;
    }

    dashboardSummaryRequestKeyRef.current = requestKey;

    try {
      const requestId = ++dashboardSummaryRequestIdRef.current;
      const summaryResult = await services.getDashboardSummary(params);
      if (requestId !== dashboardSummaryRequestIdRef.current) {
        return;
      }
      setInboundStats(summaryResult);
    } finally {
      if (dashboardSummaryRequestKeyRef.current === requestKey) {
        dashboardSummaryRequestKeyRef.current = null;
      }
    }
  }, [dashboardSummaryRequestIdRef, services, buildDashboardSummaryParams, setInboundStats]);

  const loadMasterData = useCallback(async () => {
    const [supplierResult, uomResult, warehouseResult, itemResult] = await Promise.allSettled([
      services.listSuppliers({
        businessUnit: activeBusinessUnitFilter ?? null,
        status: 'Active',
      }),
      services.listUoms({}),
      services.listWarehouses({
        businessUnit: activeBusinessUnitFilter ?? null,
        status: 'Active',
      }),
      services.listItems({
        businessUnit: activeBusinessUnitFilter ?? null,
        activeOnly: true,
      }),
    ]);

    if (supplierResult.status === 'fulfilled') {
      setSupplierMasterOptions(supplierResult.value);
    } else {
      message.warning('Supplier master data did not load. Using PO supplier fallback.');
    }

    if (uomResult.status === 'fulfilled') {
      setUomMasterOptions(uomResult.value);
    } else {
      message.warning('UOM master data did not load. Using PO UOM fallback.');
    }

    if (warehouseResult.status === 'fulfilled') {
      setWarehouseMasterOptions(warehouseResult.value);
    } else {
      setWarehouseMasterOptions([]);
      message.warning('Warehouse master data did not load.');
    }

    if (itemResult.status === 'fulfilled') {
      setItemMasterOptions(itemResult.value);
    } else {
      setItemMasterOptions([]);
      message.warning('Item master data did not load.');
    }
  }, [
    activeBusinessUnitFilter,
    services,
    setSupplierMasterOptions,
    setUomMasterOptions,
    setWarehouseMasterOptions,
    setItemMasterOptions,
  ]);

  const loadInboundData = useCallback(async () => {
    if (!hasInboundWorkspaceAccess) {
      return;
    }

    if (!isInboundAdmin && inboundVisibleBusinessUnits.length > 0 && !activeBusinessUnitFilter) {
      return;
    }

    await loadDashboardSummary();

    if (activeRole === 'WAREHOUSE_STAFF') {
      const promises: Promise<any>[] = [
        loadPurchaseOrders(poCurrentPage, poPageSize),
        loadWarehouseSupportReceipts(),
      ];
      if (effectiveInboundView === 'history') {
        promises.push(loadReceipts('history', historyCurrentPage, historyPageSize));
      } else {
        promises.push(loadReceipts('operations', queueCurrentPage, queuePageSize));
      }
      await Promise.all(promises);
      return;
    }

    setAwaitingPOLinkReceipts([]);
    setExceptionQueueReceipts([]);

    if (effectiveInboundView === 'history') {
      await loadReceipts('history', historyCurrentPage, historyPageSize);
      return;
    }

    await loadReceipts('operations', queueCurrentPage, queuePageSize);
  }, [
    hasInboundWorkspaceAccess,
    isInboundAdmin,
    inboundVisibleBusinessUnits,
    activeBusinessUnitFilter,
    activeRole,
    effectiveInboundView,
    loadDashboardSummary,
    loadPurchaseOrders,
    loadWarehouseSupportReceipts,
    loadReceipts,
    poCurrentPage,
    poPageSize,
    queueCurrentPage,
    queuePageSize,
    historyCurrentPage,
    historyPageSize,
    setAwaitingPOLinkReceipts,
    setExceptionQueueReceipts,
  ]);

  const refreshCurrentTable = useCallback(async () => {
    if (!hasInboundWorkspaceAccess) {
      return;
    }

    if (activeRole === 'WAREHOUSE_STAFF') {
      const promises: Promise<any>[] = [
        loadPurchaseOrders(poCurrentPage, poPageSize),
      ];
      if (effectiveInboundView === 'history') {
        promises.push(loadReceipts('history', historyCurrentPage, historyPageSize));
      } else {
        promises.push(loadReceipts('operations', queueCurrentPage, queuePageSize));
        promises.push(loadWarehouseSupportReceipts());
      }
      await Promise.all(promises);
      return;
    }

    const current = effectiveInboundView === 'history' ? historyCurrentPage : queueCurrentPage;
    const pageSize = effectiveInboundView === 'history' ? historyPageSize : queuePageSize;
    await loadReceipts(effectiveInboundView, current, pageSize);
  }, [
    hasInboundWorkspaceAccess,
    activeRole,
    effectiveInboundView,
    loadPurchaseOrders,
    loadReceipts,
    loadWarehouseSupportReceipts,
    poCurrentPage,
    poPageSize,
    queueCurrentPage,
    queuePageSize,
    historyCurrentPage,
    historyPageSize,
  ]);

  const syncMasterDataFromSap = useCallback(async () => {
    const result = await services.syncMasterDataFromSap();
    return result;
  }, [services]);

  return {
    inboundStats,
    supplierMasterOptions,
    uomMasterOptions,
    warehouseMasterOptions,
    itemMasterOptions,
    loadDashboardSummary,
    loadMasterData,
    loadInboundData,
    refreshCurrentTable,
    syncMasterDataFromSap,
  };
}
