/**
 * Set to true to use a static mock user (no Keycloak, no backend auth).
 * Use this for frontend-only development (UI/layout design).
 * Set back to false when you want to integrate with real auth again.
 */
export const USE_STATIC_AUTH = true;

/**
 * Static user used when USE_STATIC_AUTH is true.
 * Full admin and prod authorities so all menus and permission checks pass.
 */
export const STATIC_CURRENT_USER: API.CurrentUser = {
  name: 'Static Dev User',
  login: 'static-dev',
  firstName: 'Static',
  lastName: 'Dev',
  avatar: 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png',
  email: 'static-dev@local.dev',
  authorities: [
    'ROLE_ADMIN',
    'ROLE_PROD_ADMIN',
    'ROLE_PROD_PRO_ADMIN',
    'ROLE_PROD_NVC_ADMIN',
    'ROLE_PROD_OFL_ADMIN',
    'ROLE_PROD_OMM_ADMIN',
    'ROLE_PROD_WARE_ADMIN',
    'ROLE_PROD_WTP_ADMIN',
    'ROLE_PROD_SPF_REQUESTER',
    'ROLE_PROD_SPF_APPROVER',
    'ROLE_PROD_SPF_WAREHOUSE_STAFF',
    'ROLE_INBOUND_ADMIN',
    'ROLE_INBOUND_PROCUREMENT_DEFAULT',
    'ROLE_INBOUND_WAREHOUSE_STAFF_DEFAULT',
    'ROLE_INBOUND_QC_DEFAULT',
    'ROLE_INBOUND_SUPERVISOR_DEFAULT',
  ] as unknown as [],
  groupAttributeMap: {} as API.CurrentUser['groupAttributeMap'],
};
