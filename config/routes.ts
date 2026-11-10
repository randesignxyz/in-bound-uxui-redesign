export default [
  {
    path: '/user',
    layout: false,
    routes: [
      {
        name: 'login',
        path: '/user/login',
        component: './User/Login',
      },
      {
        name: 'auth',
        path: '/user/auth',
        component: './User/Auth',
      },
    ],
  },
  {
    path: '/prod',
    name: 'prod',
    icon: 'ReconciliationOutlined',
    access: 'canAccessProdMenu',
    component: './prod',
  },
  {
    path: '/prod/inventory-inbound/procurement/:view/*',
    name: 'upcomingInboundProcurement',
    hideInMenu: true,
    access: 'canAccessInboundProcurement',
    component: './prod/upcoming-inbound/procurement',
  },
  {
    path: '/prod/inventory-inbound',
    redirect: '/prod/inventory-inbound/list',
  },
  {
    path: '/prod/inventory-inbound/:view/*',
    name: 'upcomingInbound',
    hideInMenu: true,
    access: 'canAccessUpcomingInboundOperationsMenuItem',
    component: './prod/upcoming-inbound',
  },
  {
    path: '/',
    redirect: '/prod',
  },
  {
    path: '*',
    layout: false,
    component: './404',
  },
];
