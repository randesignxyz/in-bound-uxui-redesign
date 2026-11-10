import { useCallback, useMemo, useRef } from 'react';
import dayjs from 'dayjs';
import { useInboundContext, HistoryStatusFilter, QcQueueStatusFilter, InboundWorkspaceRole } from './InboundProvider';
import { upcomingInboundService } from '../api/service';
import type {
  UpcomingInboundGoodsReceipt as GoodsReceipt,
  InboundSaveGoodsReceiptInput,
  InboundGoodsReceiptStatusChangeInput,
  InboundLinkPoInput,
  InboundSubmitQcReviewInput,
  InboundSubmitSupervisorReviewInput,
  InboundMarkQcBadgeViewedInput,
} from '../core/type';
import { getReceiptPOReferences } from '../core/workflow';

export function useGoodsReceipts() {
  const context = useInboundContext();
  const services = upcomingInboundService;
  const receiptRequestKeyRef = useRef<string | null>(null);
  const warehouseSupportRequestKeyRef = useRef<string | null>(null);

  const {
    activeBusinessUnitFilter,
    dashboardSummaryRange,
    dashboardPeriodFilter,
    activeRole,
    queueSearchValue,
    setQueueSearchValue,
    queueTypeFilter,
    setQueueTypeFilter,
    queueSourceFilter,
    setQueueSourceFilter,
    qcStatusFilter,
    setQcStatusFilter,
    historyTypeFilter,
    setHistoryTypeFilter,
    historyStatusFilter,
    setHistoryStatusFilter,
    receipts,
    setReceipts,
    awaitingPOLinkReceipts,
    setAwaitingPOLinkReceipts,
    exceptionQueueReceipts,
    setExceptionQueueReceipts,
    queuePagination,
    setQueuePagination,
    historyPagination,
    setHistoryPagination,
    selectedGR,
    setSelectedGR,
    receiptRequestIdRef,
    warehouseSupportRequestIdRef,
  } = context;

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

  const normalizeReceiptForUI = useCallback((receipt: GoodsReceipt): GoodsReceipt => {
    const poReferences = getReceiptPOReferences(receipt);
    const supplierNames = receipt.supplierNames?.length
      ? receipt.supplierNames
      : Array.from(
          new Set(
            [...poReferences.map((reference) => reference.supplier), receipt.supplier].filter(
              Boolean
            )
          )
        );

    return {
      ...receipt,
      poReferences,
      supplierNames,
    };
  }, []);

  const isVisibleOperationalReceipt = useCallback((receipt: GoodsReceipt) => {
    return receipt.processState !== 'MERGED_TO_SUPERVISOR_REVIEW';
  }, []);

  const getQcStatusFilterVal = useCallback((filter: QcQueueStatusFilter): string | null => {
    switch (filter) {
      case 'All':
        return null;
      case 'Correction Required':
        return 'Rejected';
      default:
        return filter;
    }
  }, []);

  const getSupervisorQueueStatusFilter = useCallback((filter: HistoryStatusFilter): string | null => {
    switch (filter) {
      case 'SUPERVISOR_PENDING':
        return 'Submitted';
      case 'QC_PENDING':
        return 'QC_PENDING';
      case 'QC_REJECTED':
      case 'Rejected':
        return 'Rejected';
      case 'Ready to Post SAP':
        return 'Ready to Post SAP';
      case 'Complete':
        return 'Complete';
      default:
        return null;
    }
  }, []);

  const getHistoryStatusFilter = useCallback(
    (filter: HistoryStatusFilter, role: InboundWorkspaceRole): string | null => {
      switch (filter) {
        case 'Draft':
          return 'Draft';
        case 'Pending':
          return 'Pending';
        case 'Ready to Post SAP':
          return 'Ready to Post SAP';
        case 'Complete':
          return 'Complete';
        case 'Correction Required':
        case 'Rejected':
        case 'QC_REJECTED':
          return 'Rejected';
        case 'SUPERVISOR_PENDING':
          return 'Submitted';
        case 'QC_PENDING':
          return 'QC_PENDING';
        default:
          return role === 'WAREHOUSE_SUPERVISOR' ? 'SUPERVISOR_QUEUE_ALL' : null;
      }
    },
    []
  );

  const buildBusinessUnitCriteria = useCallback(() => ({
    businessUnit: activeBusinessUnitFilter || null,
  }), [activeBusinessUnitFilter]);

  const buildGoodsReceiptCriteria = useCallback(
    (mode: 'operations' | 'history') => {
      const criteria: {
        businessUnit?: string | null;
        business_unit?: string | null;
        dateFrom?: string | null;
        dateTo?: string | null;
        searchValue?: string;
        receiptType?: string | null;
        receiptSourceGroup?: 'STANDARD' | 'TEMP' | null;
        qcQueueStatus?: string | null;
        status?: string | null;
        processStates?: string[] | null;
      } = {
        ...buildBusinessUnitCriteria(),
        dateFrom: sharedDateRangeFilter?.[0] ?? null,
        dateTo: sharedDateRangeFilter?.[1] ?? null,
      };

      if (mode === 'operations') {
        if (activeRole === 'QC' || activeRole === 'WAREHOUSE_SUPERVISOR') {
          criteria.searchValue = queueSearchValue.trim() || undefined;
          criteria.receiptType = queueTypeFilter === 'ALL' ? null : queueTypeFilter;
        }

        if (activeRole === 'QC') {
          criteria.qcQueueStatus = getQcStatusFilterVal(qcStatusFilter);
        } else if (activeRole === 'WAREHOUSE_SUPERVISOR') {
          criteria.receiptSourceGroup = (queueSourceFilter === 'ALL' ? null : queueSourceFilter) as 'STANDARD' | 'TEMP' | null;
          criteria.status = getSupervisorQueueStatusFilter(historyStatusFilter);
        }

        if (!criteria.status && !criteria.processStates && !criteria.qcQueueStatus) {
          criteria.processStates = [
            'GRPO_DRAFT',
            'CORRECTION_REQUIRED',
            'PENDING_SUPERVISOR_REVIEW',
            'MISMATCH_EXCEPTION',
            'QC_PENDING',
            'SUPERVISOR_APPROVED',
          ];
        }

        return criteria;
      }

      criteria.receiptType = historyTypeFilter === 'ALL' ? null : historyTypeFilter;
      criteria.status = getHistoryStatusFilter(historyStatusFilter, activeRole);
      criteria.searchValue = queueSearchValue.trim() || undefined;
      return criteria;
    },
    [
      buildBusinessUnitCriteria,
      sharedDateRangeFilter,
      activeRole,
      queueSearchValue,
      queueTypeFilter,
      qcStatusFilter,
      queueSourceFilter,
      historyStatusFilter,
      historyTypeFilter,
      getQcStatusFilterVal,
      getSupervisorQueueStatusFilter,
      getHistoryStatusFilter,
    ]
  );

  const loadReceipts = useCallback(
    async (mode: 'operations' | 'history', current: number, pageSize: number) => {
      const requestKey = [
        mode,
        activeBusinessUnitFilter || 'ALL',
        activeRole,
        current,
        pageSize,
        dashboardSummaryRange,
        dashboardPeriodFilter?.join('|') || 'NO_RANGE',
        queueSearchValue.trim() || '',
        queueTypeFilter,
        queueSourceFilter,
        qcStatusFilter,
        historyTypeFilter,
        historyStatusFilter,
      ].join('::');

      if (receiptRequestKeyRef.current === requestKey) {
        return;
      }

      receiptRequestKeyRef.current = requestKey;

      try {
        const requestId = ++receiptRequestIdRef.current;
        const receiptResult = await services.pageGoodsReceipts({
          criteria: buildGoodsReceiptCriteria(mode),
          pagination: {
            current,
            pageSize,
          },
        });

        if (requestId !== receiptRequestIdRef.current) {
          return;
        }

        const receiptItems = Array.isArray(receiptResult?.items)
          ? receiptResult.items
          : (Array.isArray(receiptResult?.list) ? receiptResult.list : []);
        const nextReceipts = receiptItems
          .map(normalizeReceiptForUI)
          .filter(isVisibleOperationalReceipt);
        setReceipts(nextReceipts);

        const nextPagination = {
          current,
          pageSize,
          total: receiptResult?.total || nextReceipts.length,
        };

        if (mode === 'history') {
          setHistoryPagination(nextPagination);
        } else {
          setQueuePagination(nextPagination);
        }
      } finally {
        if (receiptRequestKeyRef.current === requestKey) {
          receiptRequestKeyRef.current = null;
        }
      }
    },
    [
      receiptRequestIdRef,
      services,
      buildGoodsReceiptCriteria,
      normalizeReceiptForUI,
      isVisibleOperationalReceipt,
      setReceipts,
      setHistoryPagination,
      setQueuePagination,
    ]
  );

  const loadWarehouseSupportReceipts = useCallback(async () => {
    const requestKey = [activeBusinessUnitFilter || 'ALL', 'WAREHOUSE_SUPPORT'].join('::');
    if (warehouseSupportRequestKeyRef.current === requestKey) {
      return;
    }

    warehouseSupportRequestKeyRef.current = requestKey;

    try {
      const requestId = ++warehouseSupportRequestIdRef.current;
      const [awaitingPoResult, exceptionResult] = await Promise.all([
        services.pageGoodsReceipts({
          criteria: {
            ...buildBusinessUnitCriteria(),
            dateFrom: null,
            dateTo: null,
            receiptSourceType: 'TEMP_NO_PO',
            poLinkStatus: 'WAITING_PO',
          },
          pagination: {
            current: 1,
            pageSize: 10,
          },
        }),
        services.pageGoodsReceipts({
          criteria: {
            ...buildBusinessUnitCriteria(),
            dateFrom: null,
            dateTo: null,
            processStates: ['MISMATCH_EXCEPTION', 'CORRECTION_REQUIRED'],
          },
          pagination: {
            current: 1,
            pageSize: 10,
          },
        }),
      ]);

      if (requestId !== warehouseSupportRequestIdRef.current) {
        return;
      }

      const awaitingItems = Array.isArray(awaitingPoResult?.items)
        ? awaitingPoResult.items
        : (Array.isArray(awaitingPoResult?.list) ? awaitingPoResult.list : []);
      const exceptionItems = Array.isArray(exceptionResult?.items)
        ? exceptionResult.items
        : (Array.isArray(exceptionResult?.list) ? exceptionResult.list : []);

      setAwaitingPOLinkReceipts(awaitingItems.map(normalizeReceiptForUI));
      setExceptionQueueReceipts(exceptionItems.map(normalizeReceiptForUI));
    } finally {
      if (warehouseSupportRequestKeyRef.current === requestKey) {
        warehouseSupportRequestKeyRef.current = null;
      }
    }
  }, [
    warehouseSupportRequestIdRef,
    services,
    buildBusinessUnitCriteria,
    normalizeReceiptForUI,
    setAwaitingPOLinkReceipts,
    setExceptionQueueReceipts,
  ]);

  const saveGoodsReceipt = useCallback(
    async (data: InboundSaveGoodsReceiptInput) => {
      return await services.saveGoodsReceipt(data);
    },
    [services]
  );

  const changeGoodsReceiptStatus = useCallback(
    async (data: InboundGoodsReceiptStatusChangeInput) => {
      return await services.changeGoodsReceiptStatus(data);
    },
    [services]
  );

  const linkPoToTempReceipt = useCallback(
    async (data: InboundLinkPoInput) => {
      return await services.linkPoToTempReceipt(data);
    },
    [services]
  );

  const submitQcReview = useCallback(
    async (data: InboundSubmitQcReviewInput) => {
      return await services.submitQcReview(data);
    },
    [services]
  );

  const submitSupervisorReview = useCallback(
    async (data: InboundSubmitSupervisorReviewInput) => {
      return await services.submitSupervisorReview(data);
    },
    [services]
  );

  const markQcBadgeViewed = useCallback(
    async (data: InboundMarkQcBadgeViewedInput) => {
      return await services.markQcBadgeViewed(data);
    },
    [services]
  );

  const getGrActivities = useCallback(
    async (id: number) => {
      return await services.getGrActivities(id);
    },
    [services]
  );

  const getPoActivities = useCallback(
    async (poNumber: string) => {
      return await services.getPoActivities(poNumber);
    },
    [services]
  );

  return {
    receipts,
    awaitingPOLinkReceipts,
    exceptionQueueReceipts,
    queuePagination,
    historyPagination,
    queueSearchValue,
    setQueueSearchValue,
    queueTypeFilter,
    setQueueTypeFilter,
    queueSourceFilter,
    setQueueSourceFilter,
    qcStatusFilter,
    setQcStatusFilter,
    historyTypeFilter,
    setHistoryTypeFilter,
    historyStatusFilter,
    setHistoryStatusFilter,
    selectedGR,
    setSelectedGR,
    loadReceipts,
    loadWarehouseSupportReceipts,
    saveGoodsReceipt,
    changeGoodsReceiptStatus,
    linkPoToTempReceipt,
    submitQcReview,
    submitSupervisorReview,
    markQcBadgeViewed,
    getGrActivities,
    getPoActivities,
  };
}
