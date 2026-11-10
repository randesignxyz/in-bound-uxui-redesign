/**
 * @see https://umijs.org/docs/max/access#access
 * */
export default function access(initialState: { currentUser?: API.CurrentUser } | undefined) {
  const { currentUser } = initialState ?? {};

  // ============ REACH CUSOMER PERMISSION ===============
  const groupMap = currentUser?.groupAttributeMap || {};
  const roles: string[] = (currentUser?.authorities as string[] | undefined) || [];

  // Define global admin roles
  const SUPER_ROLES = [
    'ROLE_ADMIN',
    // "ROLE_CRM_ADMIN",
    // "ROLE_SALE_ADMIN",
    // "ROLE_SFA_ADMIN",
    // "ROLE_DSD_ADMIN"
  ];

  const buildInboundBusinessUnits = (prefix: string) =>
    Array.from(
      new Set(
        roles
          .filter((role) => role.startsWith(prefix) && role.length > prefix.length)
          .map((role) => role.slice(prefix.length).trim().toUpperCase())
          .filter(Boolean),
      ),
    ).sort();

  const hasInboundSyncAdminRole = roles.some((role) => role === 'ROLE_INBOUND_ADMIN');
  const inboundWarehouseBusinessUnits = buildInboundBusinessUnits('ROLE_INBOUND_WAREHOUSE_STAFF_');
  const inboundProcurementBusinessUnits = buildInboundBusinessUnits('ROLE_INBOUND_PROCUREMENT_');
  const inboundQcBusinessUnits = buildInboundBusinessUnits('ROLE_INBOUND_QC_');
  const inboundSupervisorBusinessUnits = buildInboundBusinessUnits('ROLE_INBOUND_SUPERVISOR_');
  const inboundVisibleBusinessUnits = Array.from(
    new Set([
      ...inboundWarehouseBusinessUnits,
      ...inboundProcurementBusinessUnits,
      ...inboundQcBusinessUnits,
      ...inboundSupervisorBusinessUnits,
    ]),
  ).sort();

  const LEGACY_INBOUND_ROLES = [
    'ROLE_ADMIN',
    'ROLE_PROD_ADMIN',
    'ROLE_PROD_PRO_ADMIN',
    'ROLE_PROD_NVC_ADMIN',
    'ROLE_PROD_OFL_ADMIN',
    'ROLE_PROD_OMM_ADMIN',
    'ROLE_PROD_WARE_ADMIN',
  ];

  const hasInboundWarehouseRole = inboundWarehouseBusinessUnits.length > 0;
  const hasInboundProcurementRole = inboundProcurementBusinessUnits.length > 0;
  const hasInboundQcRole = inboundQcBusinessUnits.length > 0;
  const hasInboundSupervisorRole = inboundSupervisorBusinessUnits.length > 0;
  const hasInboundRole =
    hasInboundWarehouseRole ||
    hasInboundProcurementRole ||
    hasInboundQcRole ||
    hasInboundSupervisorRole;

  // Check if user has ANY super role (auto allow all)
  const isSuperAdmin = roles.some((r) => SUPER_ROLES.includes(r));

  // Module access check
  const canAccess = (module: string) => {
    if (isSuperAdmin) return true; // <-- bypass check
    return Object.keys(groupMap).includes(module.toUpperCase());
  };

  // Action access check
  const can = (module: string, action: string) => {
    if (isSuperAdmin) return true; // <-- bypass check

    const mod = module.toUpperCase();
    const actionUpper = action.toUpperCase();

    const permissions = groupMap[mod];
    if (!permissions) return false;

    const list = permissions.split(',').map((s: string) => s.trim().toUpperCase());
    return list.includes(actionUpper);
  };

  return {
    isRequesterRole:
      currentUser?.authorities.some((item) =>
        ['ROLE_PRO_PR_USER', 'ROLE_TICKET_INCIDENT_USER'].some((it) => it === item),
      ) || false,
    canAccessInboundWarehouseStaff: hasInboundWarehouseRole || isSuperAdmin,
    canAccessInboundProcurement: hasInboundProcurementRole || isSuperAdmin,
    canSyncInboundPurchaseOrders:
      hasInboundSyncAdminRole || hasInboundSupervisorRole || isSuperAdmin,
    canSyncInboundMasterData: hasInboundSyncAdminRole || hasInboundSupervisorRole || isSuperAdmin,
    canAccessInboundQc: hasInboundQcRole || isSuperAdmin,
    canAccessInboundSupervisor: hasInboundSupervisorRole || isSuperAdmin,
    inboundVisibleBusinessUnits: isSuperAdmin ? ['*'] : inboundVisibleBusinessUnits,
    inboundWarehouseBusinessUnits: isSuperAdmin ? ['*'] : inboundWarehouseBusinessUnits,
    inboundProcurementBusinessUnits: isSuperAdmin ? ['*'] : inboundProcurementBusinessUnits,
    inboundQcBusinessUnits: isSuperAdmin ? ['*'] : inboundQcBusinessUnits,
    inboundSupervisorBusinessUnits: isSuperAdmin ? ['*'] : inboundSupervisorBusinessUnits,
    hasInboundSyncAdminRole: hasInboundSyncAdminRole || false,
    canAccessProdMenu:
      isSuperAdmin ||
      hasInboundRole ||
      roles.some((role) => LEGACY_INBOUND_ROLES.includes(role)),
    canAccessUpcomingInboundMenuItem:
      currentUser?.authorities.some((item) => LEGACY_INBOUND_ROLES.some((it) => it === item)) ||
      hasInboundRole ||
      false,
    canAccessUpcomingInboundOperationsMenuItem:
      currentUser?.authorities.some((item) => LEGACY_INBOUND_ROLES.some((it) => it === item)) ||
      hasInboundWarehouseRole ||
      hasInboundQcRole ||
      hasInboundSupervisorRole ||
      false,
    currentUser,
    can,
  };
}
