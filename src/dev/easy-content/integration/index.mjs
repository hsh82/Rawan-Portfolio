import { easyContentMiddleware } from '../server/middleware.mjs';

export function easyContentVitePlugin() {
  return {
    name: 'rawan-easy-content',
    apply: 'serve',
    configureServer(server) {
      if (process.env.EASY_CONTENT_MODE !== 'true') return;
      server.middlewares.use('/__easy-content/api', easyContentMiddleware());
      server.middlewares.use('/__easy-content', easyContentMiddleware());
    },
  };
}

export function easyContentAstroIntegration() {
  return {
    name: 'rawan-easy-content-editor-route',
    hooks: {
      'astro:config:setup': ({ command, injectRoute }) => {
        if (command !== 'dev' || process.env.EASY_CONTENT_MODE !== 'true') return;
        injectRoute({ pattern: '/dev/content/[...path]', entrypoint: new URL('../editor/route.mjs', import.meta.url).pathname });
      },
    },
  };
}
