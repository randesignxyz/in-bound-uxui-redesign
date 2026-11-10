// https://umijs.org/config/
import { defineConfig } from '@umijs/max';
import defaultSettings from './defaultSettings';
import proxy from './proxy';
import routes from './routes';

const { REACT_APP_ENV = 'dev' } = process.env;


export default defineConfig({
  /**
   * @name
   * @description
   * @doc https://umijs.org/docs/api/config#hash
   */
  hash: true,

  /**
   * @name
   * @description
   * @doc https://umijs.org/docs/api/config#targets
   */
  // targets: {
  //   ie: 11,
  // },
  /**
   * @name
   * @description  path，component，routes，redirect，wrappers，title
   * @doc https://umijs.org/docs/guides/routes
   */
  // umi routes: https://umijs.org/docs/routing
  routes,
  /**
   * @name
   * @description
   * @doc  https://ant.design/docs/react/customize-theme-cn
   * @doc umi theme  https://umijs.org/docs/api/config#theme
   */
  theme: {
    'root-entry-name': 'variable',
  },
  /**
   * @name moment
   * @description
   * @doc https://umijs.org/docs/api/config#ignoremomentlocale
   */
  ignoreMomentLocale: true,
  /**
   * @doc  https://umijs.org/docs/guides/proxy
   * @doc  https://umijs.org/docs/api/config#proxy
   */
  proxy: proxy[REACT_APP_ENV as keyof typeof proxy],
  /**
   */
  fastRefresh: true,
  /**
   * @@doc https://umijs.org/docs/max/data-flow
   */
  model: {},
  /**
   * @doc https://umijs.org/docs/max/data-flow#%E5%85%A8%E5%B1%80%E5%88%9D%E5%A7%8B%E7%8A%B6%E6%80%81
   */
  initialState: {},
  /**
   * @doc https://umijs.org/docs/max/layout-menu
   */
  title: 'Inventory Inbound',
  layout: {
    locale: true,
    ...defaultSettings,
  },
  /**
   * @doc https://umijs.org/docs/max/moment2dayjs
   */
  moment2dayjs: {
    preset: 'antd',
    plugins: ['duration'],
  },
  /**
   * @doc https://umijs.org/docs/max/i18n
   */
  locale: {
    default: 'en-US',
    antd: true,
    // default true, when it is true, will use `navigator.language` overwrite default
    baseNavigator: true,
  },
  /**
   * @doc https://umijs.org/docs/max/antd#antd
   */
  antd: {},
  /**
   * @doc https://umijs.org/docs/max/request
   */
  request: {},
  /**
   * @doc https://umijs.org/docs/max/access
   */
  access: {

  },

  headScripts: [
    { src: '/scripts/loading.js', async: true },
  ],
  //================ pro =================
  presets: ['umi-presets-pro'],
  /**
   * @doc https://pro.ant.design/zh-cn/docs/openapi/
   */
  // Keep OpenAPI generation disabled here. An empty `openAPI` config still
  // causes Umi to generate the `/umi/plugin/openapi` route under `.umi`,
  // which is currently breaking the local generated bundle on this workspace.
  mfsu: {
    strategy: 'normal',
  },
  plugins: [],
  reactQuery: {
    devtool: {
      initialIsOpen: true,
    },
    queryClient: {
      defaultOptions: {
        queries: {

        }
      }
    }
  },
  esbuildMinifyIIFE: true,
  /*
  qiankun: {
    master: {
      apps: [
        {
          name: 'delivery',
          entry: '//localhost:8001'
        }
      ]
    }
  }*/
});
