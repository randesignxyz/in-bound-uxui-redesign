import React, { createContext, useContext, useState, useMemo, useEffect, useRef } from 'react';
import { useAccess } from '@umijs/max';
import { USE_STATIC_AUTH } from '@/staticAuthConfig';
import type {
  UpcomingInboundGoodsReceipt as GoodsReceipt,
  UpcomingInboundPurchaseOrder as PurchaseOrder,
  InboundDashboardSummaryApi,
  InboundSupplierMasterApi,
  InboundUomMasterApi,
  InboundWarehouseMasterApi,
  InboundItemMasterApi,
} from '../core/type';

export type InboundWorkspaceRole = 'WAREHOUSE_STAFF' | 'QC' | 'WAREHOUSE_SUPERVISOR';
export type InboundViewMode = 'operations' | 'history';
export type InboundRouteView = 'list' | 'create' | 'receive-without-po';
export type HistoryStatusFilter = 'ALL' | string;
export type QcQueueStatusFilter = 'Pending' | 'Submitted' | 'Correction Required' | 'Rejected' | 'Complete' | 'All';
export type DashboardSummaryViewMode = 'DAILY' | 'WEEKLY' | 'OVERALL' | 'CUSTOM';
export type SupervisorApprovalSuccessData = any;

export interface InboundContextType {
  // Roles & Permissions
  isInboundAdmin: boolean;
  hasInboundSyncAdminRole: boolean;
  inboundVisibleBusinessUnits: string[];
  inboundWarehouseBusinessUnits: string[];
  inboundQcBusinessUnits: string[];
  inboundSupervisorBusinessUnits: string[];
  inboundRoleOptions: InboundWorkspaceRole[];
  hasInboundWorkspaceAccess: boolean;
  activeRole: InboundWorkspaceRole;
  simulationRole: InboundWorkspaceRole;
  setSimulationRole: React.Dispatch<React.SetStateAction<InboundWorkspaceRole>>;
  
  // Views
  inboundView: InboundViewMode;
  setInboundView: React.Dispatch<React.SetStateAction<InboundViewMode>>;
  effectiveInboundView: InboundViewMode;
  activeBusinessUnit: string | undefined;
  setActiveBusinessUnit: React.Dispatch<React.SetStateAction<string | undefined>>;
  activeBusinessUnitFilter: string | undefined;
  hasActiveBusinessUnit: boolean;
  
  // Master Data Options
  supplierMasterOptions: InboundSupplierMasterApi[];
  setSupplierMasterOptions: React.Dispatch<React.SetStateAction<InboundSupplierMasterApi[]>>;
  uomMasterOptions: InboundUomMasterApi[];
  setUomMasterOptions: React.Dispatch<React.SetStateAction<InboundUomMasterApi[]>>;
  warehouseMasterOptions: InboundWarehouseMasterApi[];
  setWarehouseMasterOptions: React.Dispatch<React.SetStateAction<InboundWarehouseMasterApi[]>>;
  itemMasterOptions: InboundItemMasterApi[];
  setItemMasterOptions: React.Dispatch<React.SetStateAction<InboundItemMasterApi[]>>;

  // PO States & Filters
  purchaseOrders: PurchaseOrder[];
  setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  poPagination: { current: number; pageSize: number; total: number };
  setPoPagination: React.Dispatch<React.SetStateAction<{ current: number; pageSize: number; total: number }>>;
  poSearchValue: string;
  setPOSearchValue: (val: string) => void;
  poVendorFilter: string;
  setPOVendorFilter: (val: string) => void;
  poVendorSearch: string;
  setPoVendorSearch: (val: string) => void;
  poTypeFilter: string;
  setPOTypeFilter: (val: string) => void;
  selectedPOs: PurchaseOrder[];
  setSelectedPOs: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  selectedWarehousePONumbers: string[];
  setSelectedWarehousePONumbers: React.Dispatch<React.SetStateAction<string[]>>;

  // GR States & Filters
  receipts: GoodsReceipt[];
  setReceipts: React.Dispatch<React.SetStateAction<GoodsReceipt[]>>;
  awaitingPOLinkReceipts: GoodsReceipt[];
  setAwaitingPOLinkReceipts: React.Dispatch<React.SetStateAction<GoodsReceipt[]>>;
  exceptionQueueReceipts: GoodsReceipt[];
  setExceptionQueueReceipts: React.Dispatch<React.SetStateAction<GoodsReceipt[]>>;
  queuePagination: { current: number; pageSize: number; total: number };
  setQueuePagination: React.Dispatch<React.SetStateAction<{ current: number; pageSize: number; total: number }>>;
  historyPagination: { current: number; pageSize: number; total: number };
  setHistoryPagination: React.Dispatch<React.SetStateAction<{ current: number; pageSize: number; total: number }>>;
  queueSearchValue: string;
  setQueueSearchValue: (val: string) => void;
  queueTypeFilter: string;
  setQueueTypeFilter: (val: string) => void;
  queueSourceFilter: string;
  setQueueSourceFilter: (val: string) => void;
  qcStatusFilter: QcQueueStatusFilter;
  setQcStatusFilter: (val: QcQueueStatusFilter) => void;
  historyTypeFilter: string;
  setHistoryTypeFilter: (val: string) => void;
  historyStatusFilter: HistoryStatusFilter;
  setHistoryStatusFilter: (val: HistoryStatusFilter) => void;

  // Dashboard Stats & Filters
  inboundStats: InboundDashboardSummaryApi;
  setInboundStats: React.Dispatch<React.SetStateAction<InboundDashboardSummaryApi>>;
  dashboardSummaryRange: DashboardSummaryViewMode;
  setDashboardSummaryRange: React.Dispatch<React.SetStateAction<DashboardSummaryViewMode>>;
  dashboardPeriodFilter: [string, string] | null;
  setDashboardPeriodFilter: React.Dispatch<React.SetStateAction<[string, string] | null>>;

  // Modals & Sidebars Visibility
  isGRCreationOpen: boolean;
  setIsGRCreationOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isTempGRCreationOpen: boolean;
  setIsTempGRCreationOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedPODetail: PurchaseOrder | null;
  setSelectedPODetail: React.Dispatch<React.SetStateAction<PurchaseOrder | null>>;
  selectedGR: GoodsReceipt | null;
  setSelectedGR: React.Dispatch<React.SetStateAction<GoodsReceipt | null>>;
  warehouseCorrectionReceipt: GoodsReceipt | null;
  setWarehouseCorrectionReceipt: React.Dispatch<React.SetStateAction<GoodsReceipt | null>>;
  linkPOReceipt: GoodsReceipt | null;
  setLinkPOReceipt: React.Dispatch<React.SetStateAction<GoodsReceipt | null>>;
  supervisorApprovalSuccess: SupervisorApprovalSuccessData | null;
  setSupervisorApprovalSuccess: React.Dispatch<React.SetStateAction<SupervisorApprovalSuccessData | null>>;
  isExportReportModalOpen: boolean;
  setIsExportReportModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isSyncingPurchaseOrders: boolean;
  setIsSyncingPurchaseOrders: React.Dispatch<React.SetStateAction<boolean>>;
  isExportingReport: boolean;
  setIsExportingReport: React.Dispatch<React.SetStateAction<boolean>>;

  // Refs for tracking async cancellation
  purchaseOrderRequestIdRef: React.MutableRefObject<number>;
  receiptRequestIdRef: React.MutableRefObject<number>;
  warehouseSupportRequestIdRef: React.MutableRefObject<number>;
  dashboardSummaryRequestIdRef: React.MutableRefObject<number>;
}

const InboundContext = createContext<InboundContextType | undefined>(undefined);

export const InboundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const access = useAccess();
  const isInboundAdmin = Boolean(access?.inboundVisibleBusinessUnits?.includes?.('*'));
  const hasInboundSyncAdminRole = Boolean(access?.hasInboundSyncAdminRole);
  const inboundVisibleBusinessUnits = useMemo<string[]>(
    () => (isInboundAdmin ? [] : (access?.inboundVisibleBusinessUnits as string[] | undefined) || []),
    [access, isInboundAdmin]
  );
  const inboundWarehouseBusinessUnits = useMemo<string[]>(
    () => (isInboundAdmin ? [] : (access?.inboundWarehouseBusinessUnits as string[] | undefined) || []),
    [access, isInboundAdmin]
  );
  const inboundQcBusinessUnits = useMemo<string[]>(
    () => (isInboundAdmin ? [] : (access?.inboundQcBusinessUnits as string[] | undefined) || []),
    [access, isInboundAdmin]
  );
  const inboundSupervisorBusinessUnits = useMemo<string[]>(
    () => (isInboundAdmin ? [] : (access?.inboundSupervisorBusinessUnits as string[] | undefined) || []),
    [access, isInboundAdmin]
  );

  // Active Role and Views
  const [simulationRole, setSimulationRole] = useState<InboundWorkspaceRole>('WAREHOUSE_STAFF');
  const [inboundView, setInboundView] = useState<InboundViewMode>('operations');
  const [activeBusinessUnit, setActiveBusinessUnit] = useState<string | undefined>(
    inboundVisibleBusinessUnits[0]
  );

  // Master Data State
  const [supplierMasterOptions, setSupplierMasterOptions] = useState<InboundSupplierMasterApi[]>([]);
  const [uomMasterOptions, setUomMasterOptions] = useState<InboundUomMasterApi[]>([]);
  const [warehouseMasterOptions, setWarehouseMasterOptions] = useState<InboundWarehouseMasterApi[]>([]);
  const [itemMasterOptions, setItemMasterOptions] = useState<InboundItemMasterApi[]>([]);

  // PO States & Filters
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [poPagination, setPoPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [poSearchValue, setPOSearchValue] = useState('');
  const [poVendorFilter, setPOVendorFilter] = useState('ALL');
  const [poVendorSearch, setPoVendorSearch] = useState('');
  const [poTypeFilter, setPOTypeFilter] = useState('ALL');
  const [selectedPOs, setSelectedPOs] = useState<PurchaseOrder[]>([]);
  const [selectedWarehousePONumbers, setSelectedWarehousePONumbers] = useState<string[]>([]);

  // GR States & Filters
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [awaitingPOLinkReceipts, setAwaitingPOLinkReceipts] = useState<GoodsReceipt[]>([]);
  const [exceptionQueueReceipts, setExceptionQueueReceipts] = useState<GoodsReceipt[]>([]);
  const [queuePagination, setQueuePagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [historyPagination, setHistoryPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  
  const [queueSearchValue, setQueueSearchValue] = useState('');
  const [queueTypeFilter, setQueueTypeFilter] = useState('ALL');
  const [queueSourceFilter, setQueueSourceFilter] = useState('ALL');
  const [qcStatusFilter, setQcStatusFilter] = useState<QcQueueStatusFilter>('Pending');
  const [historyTypeFilter, setHistoryTypeFilter] = useState('ALL');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<HistoryStatusFilter>('ALL');

  // Dashboard Stats & Filters
  const [inboundStats, setInboundStats] = useState<InboundDashboardSummaryApi>({
    expectedToday: 0,
    qcPending: 0,
    supervisorPending: 0,
    approved: 0,
    completed: 0,
    exceptions: 0,
    returnedForCorrection: 0,
    awaitingPOLink: 0,
    agingPoItems: 0,
    totalGRs: 0,
    totalIrGrs: 0,
  });
  const [dashboardSummaryRange, setDashboardSummaryRange] = useState<DashboardSummaryViewMode>('OVERALL');
  const [dashboardPeriodFilter, setDashboardPeriodFilter] = useState<[string, string] | null>(null);

  // Modals & Sidebars Visibility
  const [isGRCreationOpen, setIsGRCreationOpen] = useState(false);
  const [isTempGRCreationOpen, setIsTempGRCreationOpen] = useState(false);
  const [selectedPODetail, setSelectedPODetail] = useState<PurchaseOrder | null>(null);
  const [selectedGR, setSelectedGR] = useState<GoodsReceipt | null>(null);
  const [warehouseCorrectionReceipt, setWarehouseCorrectionReceipt] = useState<GoodsReceipt | null>(null);
  const [linkPOReceipt, setLinkPOReceipt] = useState<GoodsReceipt | null>(null);
  const [supervisorApprovalSuccess, setSupervisorApprovalSuccess] = useState<SupervisorApprovalSuccessData | null>(null);
  const [isExportReportModalOpen, setIsExportReportModalOpen] = useState(false);
  const [isSyncingPurchaseOrders, setIsSyncingPurchaseOrders] = useState(false);
  const [isExportingReport, setIsExportingReport] = useState(false);

  // Async refs
  const purchaseOrderRequestIdRef = useRef(0);
  const receiptRequestIdRef = useRef(0);
  const warehouseSupportRequestIdRef = useRef(0);
  const dashboardSummaryRequestIdRef = useRef(0);

  const activeBusinessUnitFilter = isInboundAdmin ? undefined : activeBusinessUnit;
  const hasActiveBusinessUnit = Boolean(activeBusinessUnitFilter);

  useEffect(() => {
    if (isInboundAdmin || inboundVisibleBusinessUnits.length === 0) {
      return;
    }

    setActiveBusinessUnit((current) => {
      if (current && inboundVisibleBusinessUnits.includes(current)) {
        return current;
      }
      return inboundVisibleBusinessUnits[0];
    });
  }, [inboundVisibleBusinessUnits, isInboundAdmin]);

  const canUseWarehouseRole = useMemo(
    () =>
      isInboundAdmin ||
      (hasActiveBusinessUnit
        ? inboundWarehouseBusinessUnits.includes(activeBusinessUnitFilter!)
        : inboundWarehouseBusinessUnits.length > 0),
    [isInboundAdmin, hasActiveBusinessUnit, inboundWarehouseBusinessUnits, activeBusinessUnitFilter]
  );

  const canUseQcRole = useMemo(
    () =>
      isInboundAdmin ||
      (hasActiveBusinessUnit
        ? inboundQcBusinessUnits.includes(activeBusinessUnitFilter!)
        : inboundQcBusinessUnits.length > 0),
    [isInboundAdmin, hasActiveBusinessUnit, inboundQcBusinessUnits, activeBusinessUnitFilter]
  );

  const canUseSupervisorRole = useMemo(
    () =>
      isInboundAdmin ||
      (hasActiveBusinessUnit
        ? inboundSupervisorBusinessUnits.includes(activeBusinessUnitFilter!)
        : inboundSupervisorBusinessUnits.length > 0),
    [isInboundAdmin, hasActiveBusinessUnit, inboundSupervisorBusinessUnits, activeBusinessUnitFilter]
  );

  const inboundRoleOptions = useMemo(() => {
    if (USE_STATIC_AUTH || isInboundAdmin) {
      return ['WAREHOUSE_STAFF', 'QC', 'WAREHOUSE_SUPERVISOR'] as InboundWorkspaceRole[];
    }
    const roles: InboundWorkspaceRole[] = [];
    if (canUseWarehouseRole) roles.push('WAREHOUSE_STAFF');
    if (canUseQcRole) roles.push('QC');
    if (canUseSupervisorRole) roles.push('WAREHOUSE_SUPERVISOR');
    return roles;
  }, [canUseWarehouseRole, canUseQcRole, canUseSupervisorRole, isInboundAdmin]);

  const hasInboundWorkspaceAccess = useMemo(
    () => isInboundAdmin || inboundVisibleBusinessUnits.length > 0 || inboundRoleOptions.length > 0,
    [isInboundAdmin, inboundVisibleBusinessUnits, inboundRoleOptions]
  );

  const activeRole = useMemo<InboundWorkspaceRole>(() => {
    if (inboundRoleOptions.includes(simulationRole)) {
      return simulationRole;
    }
    return inboundRoleOptions[0] || 'WAREHOUSE_STAFF';
  }, [inboundRoleOptions, simulationRole]);

  const effectiveInboundView = useMemo<InboundViewMode>(() => {
    return activeRole === 'WAREHOUSE_STAFF' ? inboundView : 'operations';
  }, [activeRole, inboundView]);

  const value = useMemo<InboundContextType>(
    () => ({
      isInboundAdmin,
      hasInboundSyncAdminRole,
      inboundVisibleBusinessUnits,
      inboundWarehouseBusinessUnits,
      inboundQcBusinessUnits,
      inboundSupervisorBusinessUnits,
      inboundRoleOptions,
      hasInboundWorkspaceAccess,
      activeRole,
      simulationRole,
      setSimulationRole,
      inboundView,
      setInboundView,
      effectiveInboundView,
      activeBusinessUnit,
      setActiveBusinessUnit,
      activeBusinessUnitFilter,
      hasActiveBusinessUnit,
      supplierMasterOptions,
      setSupplierMasterOptions,
      uomMasterOptions,
      setUomMasterOptions,
      warehouseMasterOptions,
      setWarehouseMasterOptions,
      itemMasterOptions,
      setItemMasterOptions,
      purchaseOrders,
      setPurchaseOrders,
      poPagination,
      setPoPagination,
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
      inboundStats,
      setInboundStats,
      dashboardSummaryRange,
      setDashboardSummaryRange,
      dashboardPeriodFilter,
      setDashboardPeriodFilter,
      isGRCreationOpen,
      setIsGRCreationOpen,
      isTempGRCreationOpen,
      setIsTempGRCreationOpen,
      selectedPODetail,
      setSelectedPODetail,
      selectedGR,
      setSelectedGR,
      warehouseCorrectionReceipt,
      setWarehouseCorrectionReceipt,
      linkPOReceipt,
      setLinkPOReceipt,
      supervisorApprovalSuccess,
      setSupervisorApprovalSuccess,
      isExportReportModalOpen,
      setIsExportReportModalOpen,
      isSyncingPurchaseOrders,
      setIsSyncingPurchaseOrders,
      isExportingReport,
      setIsExportingReport,
      purchaseOrderRequestIdRef,
      receiptRequestIdRef,
      warehouseSupportRequestIdRef,
      dashboardSummaryRequestIdRef,
    }),
    [
      isInboundAdmin,
      hasInboundSyncAdminRole,
      inboundVisibleBusinessUnits,
      inboundWarehouseBusinessUnits,
      inboundQcBusinessUnits,
      inboundSupervisorBusinessUnits,
      inboundRoleOptions,
      hasInboundWorkspaceAccess,
      activeRole,
      simulationRole,
      inboundView,
      effectiveInboundView,
      activeBusinessUnit,
      activeBusinessUnitFilter,
      hasActiveBusinessUnit,
      supplierMasterOptions,
      uomMasterOptions,
      warehouseMasterOptions,
      itemMasterOptions,
      purchaseOrders,
      poPagination,
      poSearchValue,
      poVendorFilter,
      poVendorSearch,
      poTypeFilter,
      selectedPOs,
      selectedWarehousePONumbers,
      receipts,
      awaitingPOLinkReceipts,
      exceptionQueueReceipts,
      queuePagination,
      historyPagination,
      queueSearchValue,
      queueTypeFilter,
      queueSourceFilter,
      qcStatusFilter,
      historyTypeFilter,
      historyStatusFilter,
      inboundStats,
      dashboardSummaryRange,
      dashboardPeriodFilter,
      isGRCreationOpen,
      isTempGRCreationOpen,
      selectedPODetail,
      selectedGR,
      warehouseCorrectionReceipt,
      linkPOReceipt,
      supervisorApprovalSuccess,
      isExportReportModalOpen,
      isSyncingPurchaseOrders,
      isExportingReport,
    ]
  );

  return <InboundContext.Provider value={value}>{children}</InboundContext.Provider>;
};

export const useInboundContext = () => {
  const context = useContext(InboundContext);
  if (!context) {
    throw new Error('useInboundContext must be used within an InboundProvider');
  }
  return context;
};
