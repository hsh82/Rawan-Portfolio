import { easyContentMiddleware } from '../server/middleware.mjs';

export function easyContentVitePlugin() {
  return {
    name: 'rawan-easy-content',
    apply: 'serve',
    configureServer(server) {
      if (process.env.EASY_CONTENT_MODE !== 'true') return;
      server.middlewares.use('/__easy-content/api', easyContentMiddleware());
    },
  };
}
