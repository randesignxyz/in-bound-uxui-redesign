import { ProLayoutProps } from '@ant-design/pro-components';

/**
 * @name
 */
const Settings: ProLayoutProps & {
  pwa?: boolean;
  logo?: string;
} = {
  navTheme: 'light',
  layout: 'top',
  contentWidth: 'Fluid',
  fixedHeader: true,
  fixSiderbar: true,
  colorWeak: false,
  footerRender: undefined,
  title: 'Inventory Inbound',
  pwa: true,
  waterMarkProps: {

  },
  siderMenuType: "group",
  splitMenus: false,
  logo: '/icons/logo-ofl.png',
  iconfontUrl: '',
  colorPrimary: '#b49900',
  token: {
    colorPrimary: '#b49900',
    header: {
      colorBgHeader: '#e1d3559c',
      colorHeaderTitle: '#b49900',
      colorTextMenuSelected: '#cf7303',
      colorBgMenuItemHover: '#cf7303',
      heightLayoutHeader: 35
    },
  },
};

export default Settings;



