import { useAccess } from '@umijs/max';
import { upcomingInboundService } from '../api/service';
import { useInboundContext } from './InboundProvider';

export function useInboundWorkspace() {
  const context = useInboundContext();
  const access = useAccess();
  const services = upcomingInboundService;

  const {
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
    isExportingReport,
    setIsExportingReport,
  } = context;

  const canUseWarehouseRole =
    isInboundAdmin ||
    (activeBusinessUnitFilter
      ? inboundWarehouseBusinessUnits.includes(activeBusinessUnitFilter)
      : inboundWarehouseBusinessUnits.length > 0);

  const canUseQcRole =
    isInboundAdmin ||
    (activeBusinessUnitFilter
      ? inboundQcBusinessUnits.includes(activeBusinessUnitFilter)
      : inboundQcBusinessUnits.length > 0);

  const canUseSupervisorRole =
    isInboundAdmin ||
    (activeBusinessUnitFilter
      ? inboundSupervisorBusinessUnits.includes(activeBusinessUnitFilter)
      : inboundSupervisorBusinessUnits.length > 0);

  const canSyncPurchaseOrdersFromSap =
    Boolean(access?.canSyncInboundPurchaseOrders) &&
    (hasInboundSyncAdminRole ||
      isInboundAdmin ||
      (activeBusinessUnitFilter
        ? inboundSupervisorBusinessUnits.includes(activeBusinessUnitFilter)
        : inboundSupervisorBusinessUnits.length > 0));

  return {
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
    isExportingReport,
    setIsExportingReport,
    canUseWarehouseRole,
    canUseQcRole,
    canUseSupervisorRole,
    canSyncPurchaseOrdersFromSap,
    services,
  };
}
