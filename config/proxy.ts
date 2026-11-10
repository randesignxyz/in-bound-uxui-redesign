/**
 * -------------------------------
 * The agent cannot take effect in the production environment
 * so there is no configuration of the production environment
 * For details, please see
 * https://pro.ant.design/docs/deploy
 *
 * @doc https://umijs.org/docs/guides/proxy
 */
export default {
  dev: {
    '/services/prod': {
      target: 'http://[::1]:8480',
      changeOrigin: true,
      pathRewrite: { '^/services/prod': '' },
    },
    '/api/': {
      target: 'http://[::1]:8080',
      // target: 'http://10.0.12.247:85',
      // target: 'http://10.0.8.215:80',
      changeOrigin: true,
      pathRewrite: { '^': '' },
    },
    '/services': {
      target: 'http://[::1]:8080',
      // target: 'http://10.0.12.247:85',
      // target: 'http://10.0.8.215:80',
      changeOrigin: true,
      pathRewrite: { '^': '' },
    },
    '/event-emitter': {
      target: 'ws://localhost:8080',
      // target: 'http://10.0.12.247:85',
      changeOrigin: true,
      pathRewrite: { '^': '' },
    },
  },
  test: {},
  pre: {},
};
